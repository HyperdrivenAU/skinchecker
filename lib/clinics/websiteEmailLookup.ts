import type { Clinic } from "./types";

export type WebsiteEmailLookupResult = {
  email?: string;
  sourceUrl?: string;
  candidates: string[];
  checkedUrls: string[];
};

const contactPathTerms = [
  "contact",
  "appointment",
  "book",
  "location",
  "clinic",
  "about",
];

const genericLocalParts = [
  "admin",
  "appointments",
  "bookings",
  "contact",
  "enquiries",
  "info",
  "reception",
  "support",
];

function normaliseWebsiteUrl(value?: string) {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    return new URL(raw);
  } catch {
    try {
      return new URL(`https://${raw}`);
    } catch {
      return null;
    }
  }
}

function decodeEmailText(value: string) {
  return value
    .replace(/&#64;|&commat;/gi, "@")
    .replace(/&period;|&#46;/gi, ".")
    .replace(/\s*(?:\[at\]|\(at\)|\sat\s)\s*/gi, "@")
    .replace(/\s*(?:\[dot\]|\(dot\)|\sdot\s)\s*/gi, ".")
    .replace(/mailto:/gi, "");
}

function htmlForEmailExtraction(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function isUsefulEmail(email: string) {
  const lower = email.toLowerCase();
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(lower)) return false;
  if (/\.(png|jpe?g|gif|webp|svg|css|js|pdf)$/i.test(lower)) return false;
  if (lower.includes("example.") || lower.includes("sentry.")) return false;
  return true;
}

export function extractEmailsFromHtml(html: string) {
  const decoded = decodeEmailText(htmlForEmailExtraction(html));
  const matches = decoded.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];

  return unique(
    matches
      .map((email) => email.toLowerCase().replace(/[),.;:]+$/g, ""))
      .filter(isUsefulEmail)
  );
}

function sameHostname(url: URL, origin: URL) {
  return url.hostname.replace(/^www\./, "") === origin.hostname.replace(/^www\./, "");
}

function extractCandidateLinks(html: string, origin: URL) {
  const links: string[] = [];
  const linkPattern = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html))) {
    try {
      const url = new URL(match[1], origin);
      const path = `${url.pathname} ${url.search}`.toLowerCase();
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      if (!sameHostname(url, origin)) continue;
      if (/\.(css|js|png|jpe?g|gif|webp|svg|pdf|zip)(\?|$)/i.test(url.pathname)) {
        continue;
      }
      if (!contactPathTerms.some((term) => path.includes(term))) continue;
      links.push(url.href);
    } catch {
      // Ignore malformed links from clinic websites.
    }
  }

  return unique(links).slice(0, 4);
}

function scoreEmail(email: string, sourceUrl: string, website: URL) {
  const [localPart, domain] = email.split("@");
  let score = 0;

  if (domain && website.hostname.includes(domain.replace(/^www\./, ""))) score += 5;
  if (genericLocalParts.includes(localPart)) score += 4;
  if (/reception|appointment|booking|admin|info|contact/.test(localPart)) score += 2;
  if (/contact|appointment|booking/.test(sourceUrl.toLowerCase())) score += 2;
  if (/noreply|no-reply|donotreply/.test(localPart)) score -= 20;

  return score;
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "SkinChecker.app clinic directory contact lookup (+https://app.skinchecker.app)",
      },
      redirect: "follow",
    });

    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.includes("text/html")) return "";

    const text = await response.text();
    return text.slice(0, 350_000);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupClinicWebsiteEmail(
  website?: string
): Promise<WebsiteEmailLookupResult> {
  const origin = normaliseWebsiteUrl(website);
  if (!origin) return { candidates: [], checkedUrls: [] };

  const checkedUrls: string[] = [];
  const findings: Array<{ email: string; sourceUrl: string; score: number }> = [];

  const homeHtml = await fetchHtml(origin.href);
  checkedUrls.push(origin.href);

  for (const email of extractEmailsFromHtml(homeHtml)) {
    findings.push({
      email,
      sourceUrl: origin.href,
      score: scoreEmail(email, origin.href, origin),
    });
  }

  const contactUrls = extractCandidateLinks(homeHtml, origin);
  for (const url of contactUrls) {
    const html = await fetchHtml(url);
    checkedUrls.push(url);
    for (const email of extractEmailsFromHtml(html)) {
      findings.push({
        email,
        sourceUrl: url,
        score: scoreEmail(email, url, origin),
      });
    }
  }

  const ranked = unique(findings.map((item) => item.email))
    .map((email) => {
      const best = findings
        .filter((item) => item.email === email)
        .sort((a, b) => b.score - a.score)[0];
      return best;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return {
    email: ranked[0]?.email,
    sourceUrl: ranked[0]?.sourceUrl,
    candidates: ranked.map((item) => item.email),
    checkedUrls,
  };
}

export async function enrichClinicWithWebsiteEmail(clinic: Clinic) {
  if (clinic.email || clinic.contactEmail || !clinic.website) return clinic;

  const lookup = await lookupClinicWebsiteEmail(clinic.website);
  if (!lookup.email) return clinic;

  return {
    ...clinic,
    email: lookup.email,
    contactEmail: lookup.email,
    emailSource: "clinic_website",
    emailStatus: "unverified",
    emailLastCheckedAt: new Date().toISOString(),
    emailLookupUrl: lookup.sourceUrl,
  };
}

export async function enrichClinicsWithWebsiteEmails(clinics: Clinic[]) {
  return Promise.all(clinics.map(enrichClinicWithWebsiteEmail));
}
