import Link from "next/link";
import { Award, BarChart3, CheckCircle2, Globe, MapPin } from "lucide-react";
import { clinicConfig } from "@/lib/clinics/config";

export default function ClinicPartnerPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          SkinChecker.app clinic directory
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          Preferred Partner listings
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Help people who have completed a SkinChecker.app assessment find a
          practical nearby clinic for an in-person skin check. Preferred Partner
          status is a paid directory and advertising arrangement, not a clinical
          endorsement.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-bold text-slate-900">Free Listing</h2>
            <p className="mt-2 text-sm text-slate-600">No charge</p>
            <ul className="mt-6 space-y-3 text-slate-700">
              {[
                "Clinic Name",
                "Postcode",
                "Website",
                "Appears only when an appropriate Preferred Partner is not available nearby",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Award className="h-4 w-4" />
              Preferred Partner
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">
              ${clinicConfig.preferredPartnerPriceMonthly} per month
            </h2>
            <p className="mt-2 text-sm text-slate-600">Including GST if applicable</p>
            <ul className="mt-6 space-y-3 text-slate-800">
              {[
                "Preferred Partner badge",
                "Priority placement in nearby clinic searches",
                "Full clinic profile",
                "Clinic logo",
                "Full address and contact details",
                "Book Online button",
                "Website link",
                "Services displayed",
                "Listing analytics",
                "Ability to update clinic details",
                "Monthly performance summary",
                "Future access to additional partner features",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-amber-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {clinicConfig.foundationPartnerAvailable && (
          <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-6">
            <h2 className="text-2xl font-bold text-slate-950">
              Foundation Partner offer
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              ${clinicConfig.foundationPartnerPriceMonthly} per month, locked in
              while the subscription remains active. Limited to{" "}
              {clinicConfig.foundationPartnerLimit} clinics and subject to
              administrative approval.
            </p>
          </section>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
            <MapPin className="h-5 w-5 text-sky-700" />
            <span className="text-sm font-semibold text-slate-700">
              Nearby searches
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
            <Globe className="h-5 w-5 text-sky-700" />
            <span className="text-sm font-semibold text-slate-700">
              Website and booking links
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
            <BarChart3 className="h-5 w-5 text-sky-700" />
            <span className="text-sm font-semibold text-slate-700">
              Listing analytics
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/clinics/signup"
            className="rounded-2xl bg-sky-600 px-6 py-4 text-center font-semibold text-white shadow-lg hover:bg-sky-700"
          >
            Apply for Preferred Partner
          </Link>
          <Link
            href="/clinics/terms"
            className="rounded-2xl border border-slate-300 px-6 py-4 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Read Clinic Partner Terms
          </Link>
        </div>
      </div>
    </main>
  );
}
