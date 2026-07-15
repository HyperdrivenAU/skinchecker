import Link from "next/link";

export default function ClinicPartnerTermsPage() {
  const terms = [
    "Preferred Partner status is a paid advertising and directory listing arrangement. It is not a clinical endorsement, medical recommendation or statement that a clinic is clinically superior.",
    "SkinChecker.app does not guarantee patient enquiries, appointments, revenue, referrals or bookings.",
    "Clinics are responsible for the accuracy of their listing information, including services, fees, contact details, booking links and availability.",
    "Clinics remain solely responsible for their services, qualifications, billing, availability and patient care.",
    "SkinChecker.app may suspend inaccurate, misleading, inappropriate or unsafe listings.",
    "Subscription fees are charged monthly according to the selected plan. Failed payments may result in suspension or removal of enhanced listing features.",
    "A clinic may cancel according to the billing terms provided during subscription set-up. Cancellation does not create an entitlement to claim patient leads or identifiable patient information.",
    "Clinics may not use the SkinChecker.app name, logo or branding in a way that suggests clinical endorsement or approval.",
    "Clinic contact information is handled for listing administration, billing, support, sales follow-up and directory operation.",
    "Preferred Partners do not receive identifiable patient health information merely because they appeared in a nearby clinic search.",
    "Search ranking may consider distance, service relevance, availability, listing status, active subscription, priority settings and other practical factors.",
    "Patient welfare and practical proximity take precedence over commercial ranking.",
    "SkinChecker.app may change directory features, ranking logic, pricing and listing presentation over time.",
  ];

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">
          Clinic Partner Terms
        </h1>
        <div className="mt-8 space-y-5 text-slate-700">
          {terms.map((term) => (
            <p key={term} className="leading-8">
              {term}
            </p>
          ))}
        </div>
        <Link
          href="/clinics/partner"
          className="mt-10 inline-block rounded-2xl bg-sky-600 px-6 py-4 font-semibold text-white"
        >
          Back to clinic partnerships
        </Link>
      </div>
    </main>
  );
}
