"use client";

import { useEffect, useState } from "react";
import {
  Award,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Send,
} from "lucide-react";

type Clinic = {
  id?: string;
  clinicId?: string;
  clinicUuid?: string;
  name: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  contactEmail?: string;
  website?: string;
  bookingUrl?: string;
  servicesOffered?: string[];
  billingType?: string;
  publicNotes?: string;
  logoOrImage?: string;
  displayBookingButton?: boolean;
  bookingEnabled?: boolean;
};

type ClinicResult = {
  clinic: Clinic;
  distanceKm: number | null;
  listingType: "preferred" | "free";
  position: number;
  impressionId?: string;
};

type ClinicResponse = {
  results: ClinicResult[];
  usedFallback: boolean;
  message?: string;
};

function trackClick(impressionId: string | undefined, action: string) {
  if (!impressionId) return;

  const body = JSON.stringify({ impressionId, action });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/clinics/click",
      new Blob([body], { type: "application/json" })
    );
    return;
  }

  fetch("/api/clinics/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function NearbyClinics() {
  const [postcode, setPostcode] = useState("");
  const [manualPostcode, setManualPostcode] = useState("");
  const [clinics, setClinics] = useState<ClinicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [referralConsent, setReferralConsent] = useState<Record<string, boolean>>({});
  const [referralSending, setReferralSending] = useState<Record<string, boolean>>({});
  const [referralMessage, setReferralMessage] = useState<Record<string, string>>({});
  const [referralError, setReferralError] = useState<Record<string, string>>({});

  async function loadClinics(position?: GeolocationPosition, fallbackPostcode = postcode) {
    try {
      setLoading(true);
      setError("");

      const skinScore = JSON.parse(sessionStorage.getItem("skinScore") || "null");
      const result = JSON.parse(
        sessionStorage.getItem("skinchecker_result") || "{}"
      );

      const response = await fetch("/api/clinics/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: fallbackPostcode,
          latitude: position?.coords.latitude,
          longitude: position?.coords.longitude,
          skinScoreCategory: skinScore?.grade || result?.trafficLight,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Clinic search failed.");
      setClinics(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "We could not load nearby clinics at this time. You can still download or email your SkinChecker report."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedPostcode = sessionStorage.getItem("skinchecker_postcode") || "";
    queueMicrotask(() => {
      setPostcode(storedPostcode);
      setManualPostcode(storedPostcode);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => loadClinics(position, storedPostcode),
        () => loadClinics(undefined, storedPostcode),
        { enableHighAccuracy: false, timeout: 3500, maximumAge: 15 * 60 * 1000 }
      );
      return;
    }

    queueMicrotask(() => loadClinics(undefined, storedPostcode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = clinics?.results ?? [];

  function clinicKey(result: ClinicResult) {
    return result.clinic.id || result.clinic.clinicUuid || result.clinic.name;
  }

  async function sendPhotoReferral(result: ClinicResult) {
    const key = clinicKey(result);

    try {
      setReferralSending((current) => ({ ...current, [key]: true }));
      setReferralError((current) => ({ ...current, [key]: "" }));
      setReferralMessage((current) => ({ ...current, [key]: "" }));

      if (!referralConsent[key]) {
        throw new Error("Please tick the consent box first.");
      }

      const image = sessionStorage.getItem("skinchecker_photo");
      const assessment = JSON.parse(
        sessionStorage.getItem("skinchecker_result") || "{}"
      );

      if (!image) {
        throw new Error("We could not find the photo. Please retake it and try again.");
      }

      const response = await fetch("/api/clinics/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: result.clinic.id,
          clinicUuid: result.clinic.clinicUuid,
          consentToSendPhoto: true,
          image,
          result: assessment,
          postcode: postcode || sessionStorage.getItem("skinchecker_postcode"),
          givenNames: sessionStorage.getItem("skinchecker_givenNames"),
          surname: sessionStorage.getItem("skinchecker_surname"),
          patientEmail: sessionStorage.getItem("skinchecker_email"),
          patientMobile: sessionStorage.getItem("skinchecker_mobile"),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "We could not send your photo to the clinic.");
      }

      setReferralMessage((current) => ({
        ...current,
        [key]: "Your photo has been sent to the clinic.",
      }));
    } catch (sendError) {
      setReferralError((current) => ({
        ...current,
        [key]:
          sendError instanceof Error
            ? sendError.message
            : "We could not send your photo to the clinic.",
      }));
    } finally {
      setReferralSending((current) => ({ ...current, [key]: false }));
    }
  }

  function referralPanel(result: ClinicResult) {
    const key = clinicKey(result);
    const canEmailClinic = Boolean(result.clinic.email || result.clinic.contactEmail);

    return (
      <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-4">
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(referralConsent[key])}
            onChange={(event) =>
              setReferralConsent((current) => ({
                ...current,
                [key]: event.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600"
          />
          <span>
            I consent to SkinChecker.app sending my lesion photo and assessment
            summary to this clinic for review.
          </span>
        </label>
        <button
          type="button"
          disabled={!canEmailClinic || !referralConsent[key] || referralSending[key]}
          onClick={() => sendPhotoReferral(result)}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {referralSending[key] ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send my photo to this clinic
        </button>
        {!canEmailClinic && (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            We do not have a clinic email address for this listing yet.
          </p>
        )}
        {referralMessage[key] && (
          <p className="mt-2 text-sm font-medium text-green-700">
            {referralMessage[key]}
          </p>
        )}
        {referralError[key] && (
          <p className="mt-2 text-sm font-medium text-red-700">
            {referralError[key]}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nearby clinics</h2>
          {clinics?.usedFallback && (
            <p className="mt-2 text-sm text-slate-600">
              No nearby Preferred Partners were found. Here are other clinics in your area.
            </p>
          )}
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-sky-600" />}
      </div>

      {loading && (
        <p className="mt-5 text-sm text-slate-600">Looking for nearby clinics...</p>
      )}

      {!loading && error && (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {error}
        </p>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-slate-600">
            {clinics?.message || "No nearby clinics were found."}
          </p>
          <div className="flex gap-3">
            <input
              value={manualPostcode}
              onChange={(event) =>
                setManualPostcode(
                  event.target.value.replace(/\D/g, "").slice(0, 4)
                )
              }
              inputMode="numeric"
              placeholder="Enter postcode"
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={() => loadClinics(undefined, manualPostcode)}
              className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white"
            >
              Search
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {results.map((result) =>
          result.listingType === "preferred" ? (
            <article
              key={result.impressionId || result.clinic.clinicUuid || result.clinic.name}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
            >
              <div className="flex items-start gap-4">
                {result.clinic.logoOrImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.clinic.logoOrImage}
                    alt=""
                    className="h-14 w-14 rounded-xl border border-amber-200 bg-white object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <Award className="h-4 w-4" />
                    Preferred Partner
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-950">
                    {result.clinic.name}
                  </h3>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4 flex-none text-slate-500" />
                    <span>
                      {result.clinic.address}
                      {result.distanceKm !== null && (
                        <> · {result.distanceKm} km away</>
                      )}
                    </span>
                  </p>
                  {Boolean(result.clinic.servicesOffered?.length) && (
                    <p className="mt-2 text-sm text-slate-700">
                      {result.clinic.servicesOffered?.join(", ")}
                    </p>
                  )}
                  {result.clinic.billingType && (
                    <p className="mt-2 text-sm text-slate-600">
                      Billing: {result.clinic.billingType}
                    </p>
                  )}
                  {result.clinic.publicNotes && (
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {result.clinic.publicNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {result.clinic.phone && (
                  <a
                    href={`tel:${result.clinic.phone}`}
                    onClick={() => trackClick(result.impressionId, "phone")}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}
                {result.clinic.website && (
                  <a
                    href={result.clinic.website}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackClick(result.impressionId, "website")}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {result.clinic.bookingUrl &&
                  (result.clinic.bookingEnabled ||
                    result.clinic.displayBookingButton) && (
                    <a
                      href={result.clinic.bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackClick(result.impressionId, "booking")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Book Online
                    </a>
                  )}
              </div>
              {referralPanel(result)}
            </article>
          ) : (
            <article
              key={result.impressionId || result.clinic.clinicUuid || result.clinic.name}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="text-lg font-bold text-slate-900">
                {result.clinic.name}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {result.clinic.postcode || postcode}
              </p>
              {result.clinic.website && (
                <a
                  href={result.clinic.website}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackClick(result.impressionId, "website")}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700"
                >
                  Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {referralPanel(result)}
            </article>
          )
        )}
      </div>

      {results.length > 0 && (
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Clinic information is provided for convenience only. Please confirm services,
          fees and availability directly with the clinic. Preferred Partner status is a
          commercial listing arrangement and does not represent a clinical endorsement.
        </p>
      )}
    </section>
  );
}
