"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function DetailsPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  const canContinue =
    firstName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
            Step 2 of 5
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-2/5 rounded-full bg-sky-600"></div>
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Where should we send your result?
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          We’ll email your SkinChecker assessment so you have a copy for your records.
        </p>

        <div className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              placeholder="Your first name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="mt-auto pt-12">
          <Link
            href={canContinue ? "/scan" : "#"}
            className={`block w-full rounded-2xl py-5 text-center text-lg font-semibold transition ${
              canContinue
                ? "bg-sky-600 text-white shadow-lg hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            Continue
          </Link>

          <Link
            href="/consent"
            className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back
          </Link>
        </div>
      </div>
    </main>
  );
}