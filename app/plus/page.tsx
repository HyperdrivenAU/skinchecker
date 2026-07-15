import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Camera,
  FileText,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import {
  PLUS_MONTHLY_PRICE_AUD,
  PLUS_YEARLY_PRICE_AUD,
} from "@/lib/constants";
import { PlusCheckoutButtons } from "@/components/PlusCheckoutButtons";

const features = [
  {
    icon: MapPinned,
    title: "Body map for each lesion",
    copy: "Save each mole or spot to a body location, so future photos and reports stay attached to the right lesion.",
  },
  {
    icon: Camera,
    title: "Photo timeline",
    copy: "Keep a dated series of photos for each lesion and compare the first and latest images side by side.",
  },
  {
    icon: FileText,
    title: "Report history",
    copy: "Store SkinChecker reports with the relevant lesion so you can review previous recommendations.",
  },
  {
    icon: Bell,
    title: "Re-check reminders",
    copy: "Set sensible reminders to take another photo and keep your monitoring routine on track.",
  },
  {
    icon: ShieldCheck,
    title: "Private storage",
    copy: "Photos and reports are intended to be stored privately with access controls and secure file links.",
  },
];

export default function PlusPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Image
          src="/logo.png"
          alt="SkinChecker"
          width={240}
          height={59}
          priority
          className="mb-10"
        />

        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          SkinChecker Plus
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          Track lesions over time
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-700">
          Save monitor-worthy lesions to a private body map, store each photo
          and report in the right timeline, and compare visible changes at your
          next check.
        </p>

        <div className="mt-8 rounded-3xl border border-sky-200 bg-sky-50 p-6">
          <p className="text-sm font-semibold text-slate-600">
            Simple subscription
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {PLUS_MONTHLY_PRICE_AUD}/month
          </p>
          <p className="mt-1 text-lg font-semibold text-sky-800">
            or {PLUS_YEARLY_PRICE_AUD}/year
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            The annual plan is designed for people monitoring one or more
            lesions across the year.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <section
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex gap-4">
                  <Icon className="mt-1 h-6 w-6 flex-none text-sky-700" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      {feature.title}
                    </h2>
                    <p className="mt-2 leading-7 text-slate-700">
                      {feature.copy}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            Medical safety note
          </h2>
          <p className="mt-2 leading-7 text-slate-700">
            SkinChecker Plus helps you organise and compare lesion records. It
            does not diagnose skin cancer or replace an in-person skin
            examination. If your report recommends medical review, arrange that
            review even if you also save the lesion for monitoring.
          </p>
        </div>

        <PlusCheckoutButtons />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/result"
            className="rounded-2xl border border-slate-300 px-6 py-4 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to result
          </Link>
          <Link
            href="/details"
            className="rounded-2xl border border-slate-300 px-6 py-4 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continue without Plus
          </Link>
        </div>
      </div>
    </main>
  );
}
