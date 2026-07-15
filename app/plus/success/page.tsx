import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PlusSuccessPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center">
        <Image
          src="/logo.png"
          alt="SkinChecker"
          width={240}
          height={59}
          priority
          className="mx-auto mb-10"
        />

        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
          <h1 className="mt-5 text-3xl font-bold text-slate-950">
            SkinChecker Plus is active
          </h1>
          <p className="mt-4 leading-8 text-slate-700">
            Your subscription is being confirmed. The next step is to save this
            lesion to your private body map and timeline.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/details"
            className="block rounded-2xl bg-sky-600 px-6 py-4 text-center font-semibold text-white shadow-lg hover:bg-sky-700"
          >
            Continue with my report
          </Link>
          <Link
            href="/result"
            className="block rounded-2xl border border-slate-300 px-6 py-4 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to result
          </Link>
        </div>
      </div>
    </main>
  );
}
