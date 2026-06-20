"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ConsentPage() {
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);

  const canContinue = consent1 && consent2 && consent3;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">

        <Image
          src="/logo.png"
          alt="SkinChecker"
          width={260}
          height={64}
          priority
          className="mx-auto mb-10"
        />

        <div className="mb-8">
          <div className="mb-2 text-sm font-medium text-sky-600">
            Step 1 of 5
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/5 rounded-full bg-sky-600"></div>
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Before we begin...
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          SkinChecker uses artificial intelligence (AI) to analyse photographs
          of skin lesions. Before continuing, please confirm that you understand
          and agree to the following.
        </p>

        <div className="mt-10 space-y-6">

          <label className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
            <input
              type="checkbox"
              checked={consent1}
              onChange={(e) => setConsent1(e.target.checked)}
              className="mt-1 h-5 w-5 accent-sky-600"
            />
            <span className="text-slate-700">
              I consent to SkinChecker analysing my uploaded image using
              artificial intelligence (AI).
            </span>
          </label>

          <label className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
            <input
              type="checkbox"
              checked={consent2}
              onChange={(e) => setConsent2(e.target.checked)}
              className="mt-1 h-5 w-5 accent-sky-600"
            />
            <span className="text-slate-700">
              I understand this assessment is not a medical diagnosis and does
              not replace advice from a qualified healthcare professional.
            </span>
          </label>

          <label className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
            <input
              type="checkbox"
              checked={consent3}
              onChange={(e) => setConsent3(e.target.checked)}
              className="mt-1 h-5 w-5 accent-sky-600"
            />
            <span className="text-slate-700">
              I have read and agree to the{" "}
              <Link
                href="/privacy"
                className="font-medium text-sky-600 hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="font-medium text-sky-600 hover:underline"
              >
                Terms of Use
              </Link>.
            </span>
          </label>

        </div>

        <div className="mt-auto pt-12">

          <Link
            href={canContinue ? "/details" : "#"}
            className={`block w-full rounded-2xl py-5 text-center text-lg font-semibold transition ${
              canContinue
                ? "bg-sky-600 text-white shadow-lg hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            Continue
          </Link>

          <Link
            href="/"
            className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back
          </Link>

        </div>

      </div>
    </main>
  );
}