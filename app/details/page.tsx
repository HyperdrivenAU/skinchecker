"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function DetailsPage() {
const [givenNames, setGivenNames] = useState("");
const [surname, setSurname] = useState("");
const [dob, setDob] = useState("");
const [mobile, setMobile] = useState("");
const [email, setEmail] = useState("");

const canContinue =
  givenNames.trim().length > 1 &&
  surname.trim().length > 1 &&
  dob.length === 10 &&
  mobile.replace(/\D/g, "").length >= 10 &&
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
  Patient Details
</h1>

<p className="mt-4 text-lg leading-8 text-slate-600">
  Please enter the patient's details. These will appear on the assessment
  report and emailed results.
</p>

<div className="mt-10 space-y-6">

  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Given Name(s)
    </label>

    <input
      value={givenNames}
      onChange={(e) => setGivenNames(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
      placeholder="John Arthur"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Surname
    </label>

    <input
      value={surname}
      onChange={(e) => setSurname(e.target.value.toUpperCase())}
      className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
      placeholder="SMITH"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Date of Birth
    </label>

    <input
      type="date"
      value={dob}
      onChange={(e) => setDob(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Mobile Phone
    </label>

    <input
      type="tel"
      value={mobile}
      onChange={(e) => setMobile(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
      placeholder="0412 345 678"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Email Address
    </label>

    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
      placeholder="john@example.com"
    />
  </div>

</div>
        <div className="mt-auto pt-12">
<button
  type="button"
  disabled={!canContinue}
onClick={() => {
  sessionStorage.setItem("skinchecker_givenNames", givenNames);
  sessionStorage.setItem("skinchecker_surname", surname);
  sessionStorage.setItem("skinchecker_dob", dob);
  sessionStorage.setItem("skinchecker_mobile", mobile);
  sessionStorage.setItem("skinchecker_email", email);

  window.location.href = "/scan";
}}
            className={`block w-full rounded-2xl py-5 text-center text-lg font-semibold transition ${
              canContinue
                ? "bg-sky-600 text-white shadow-lg hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            Continue
          </button>

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