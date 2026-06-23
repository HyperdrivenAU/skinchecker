import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-900">Terms of Use</h1>

        <div className="mt-8 space-y-6 text-slate-700 leading-8">
          <p>
            By using SkinChecker.app, you agree to these terms.
          </p>

          <p>
            SkinChecker.app provides an educational visual assessment only. It
            does not provide a diagnosis and must not be relied on as a substitute
            for medical advice.
          </p>

          <p>
            If you are concerned about a spot, mole, lesion or skin change, you
            should seek advice from a qualified doctor or skin cancer clinic.
          </p>

          <p>
            If you have bleeding, rapid change, pain, ulceration or any other
            concerning symptoms, seek medical attention promptly.
          </p>

          <p>
            You are responsible for ensuring the image you upload is clear,
            relevant and your own, or that you have permission to upload it.
          </p>

          <p>
            SkinChecker.app may provide recommendations or referral options, but
            you remain responsible for choosing whether to seek medical care.
          </p>

          <p>
            We may update these terms from time to time.
          </p>

          <p>
            Contact us at{" "}
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