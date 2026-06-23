import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>

        <div className="mt-8 space-y-6 text-slate-700 leading-8">
          <p>
            SkinChecker.app collects the information you provide so we can
            generate and email your skin assessment report.
          </p>

          <p>
            This may include your name, date of birth, mobile number, postcode,
            email address, uploaded image and assessment result.
          </p>

          <p>
            Your information is used to prepare your report, email it to you,
            improve the service, and help connect you with a suitable skin cancer
            clinic if required.
          </p>

          <p>
            SkinChecker.app is not a medical diagnosis service and does not
            replace a consultation with a qualified health professional.
          </p>

          <p>
            We take reasonable steps to protect your information and only share
            it where needed to provide the service, comply with the law, or with
            your consent.
          </p>

          <p>
            You can contact us about privacy at{" "}
            <a
              href="mailto:info@skinchecker.app"
              className="font-semibold text-sky-600"
            >
              info@skinchecker.app
            </a>
            .
          </p>
        </div>

        <Link
          href="/consent"
          className="mt-10 block rounded-2xl bg-sky-600 py-5 text-center text-lg font-semibold text-white"
        >
          ← Back to Consent
        </Link>
      </div>
    </main>
  );
}