import { calculateUpgradeScore } from "@/lib/clinics/search";
import { listClinicSearchImpressions } from "@/lib/clinics/store";

export const dynamic = "force-dynamic";

export default async function ClinicAdminPage() {
  const impressions = await listClinicSearchImpressions();
  const byClinic = new Map<string, typeof impressions>();

  for (const impression of impressions) {
    const key =
      impression.clinicUuid || impression.clinicId || "unknown-clinic";
    byClinic.set(key, [...(byClinic.get(key) ?? []), impression]);
  }

  const rows = Array.from(byClinic.entries())
    .map(([clinicKey, clinicImpressions]) => ({
      clinicKey,
      impressions: clinicImpressions.length,
      websiteClicks: clinicImpressions.filter((item) => item.websiteClicked)
        .length,
      bookingClicks: clinicImpressions.filter((item) => item.bookingLinkClicked)
        .length,
      phoneClicks: clinicImpressions.filter((item) => item.phoneClicked).length,
      score: calculateUpgradeScore(clinicImpressions),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">
          Clinic administration
        </h1>
        <p className="mt-4 max-w-3xl text-slate-700">
          Internal workflow view for clinic search impressions, click statistics
          and upgrade potential. Keep this route behind deployment-level access
          controls before production use.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Clinic</th>
                <th className="px-4 py-3">Search appearances</th>
                <th className="px-4 py-3">Website clicks</th>
                <th className="px-4 py-3">Booking clicks</th>
                <th className="px-4 py-3">Phone clicks</th>
                <th className="px-4 py-3">Upgrade Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.clinicKey} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {row.clinicKey}
                  </td>
                  <td className="px-4 py-3">{row.impressions}</td>
                  <td className="px-4 py-3">{row.websiteClicks}</td>
                  <td className="px-4 py-3">{row.bookingClicks}</td>
                  <td className="px-4 py-3">{row.phoneClicks}</td>
                  <td className="px-4 py-3 font-bold">{row.score}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No clinic impressions have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          Documented workflow: review clinic applications, verify authority,
          confirm payment, update Relationship Status to Preferred Partner in
          Supabase, confirm Display In App, enable booking where applicable,
          suspend inaccurate listings, mark Do Not Contact where required, and
          resend partnership invitations through the clinic sales process.
        </div>
      </div>
    </main>
  );
}
