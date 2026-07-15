import { Bell, MapPinned, ShieldCheck } from "lucide-react";
import {
  PLUS_MONTHLY_PRICE_AUD,
  PLUS_YEARLY_PRICE_AUD,
} from "@/lib/constants";
import { PlusCheckoutButtons } from "./PlusCheckoutButtons";

export function SkinCheckerPlusOffer() {
  return (
    <section className="mt-8 rounded-3xl border border-sky-200 bg-sky-50 p-6">
      <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
        Worth monitoring
      </div>

      <h2 className="mt-4 text-2xl font-bold text-slate-950">
        Track this lesion over time
      </h2>

      <p className="mt-3 leading-7 text-slate-700">
        SkinChecker Plus helps you store this photo and report securely, place
        the lesion on a body map, and compare future photos side by side.
      </p>

      <div className="mt-5 grid gap-3">
        <div className="flex gap-3 rounded-2xl bg-white p-4">
          <MapPinned className="mt-1 h-5 w-5 flex-none text-sky-700" />
          <p className="text-sm leading-6 text-slate-700">
            Map each saved scan to the right lesion, so you do not accidentally
            compare different spots.
          </p>
        </div>
        <div className="flex gap-3 rounded-2xl bg-white p-4">
          <Bell className="mt-1 h-5 w-5 flex-none text-sky-700" />
          <p className="text-sm leading-6 text-slate-700">
            Set reminders to re-check and build a timeline you can review with
            your doctor.
          </p>
        </div>
        <div className="flex gap-3 rounded-2xl bg-white p-4">
          <ShieldCheck className="mt-1 h-5 w-5 flex-none text-sky-700" />
          <p className="text-sm leading-6 text-slate-700">
            Private storage for lesion photos and reports, with simple export
            options planned for medical appointments.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-200 bg-white p-4 text-center">
        <p className="text-sm font-semibold text-slate-600">
          SkinChecker Plus
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-950">
          {PLUS_MONTHLY_PRICE_AUD}/month
          <span className="text-base font-semibold text-slate-500">
            {" "}
            or {PLUS_YEARLY_PRICE_AUD}/year
          </span>
        </p>
      </div>

      <PlusCheckoutButtons compact />

      <p className="mt-4 text-xs leading-5 text-slate-500">
        SkinChecker Plus helps you compare visible changes over time. It is not
        a diagnosis and does not replace medical assessment.
      </p>
    </section>
  );
}
