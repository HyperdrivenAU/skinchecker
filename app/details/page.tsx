"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function normaliseAustralianMobile(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("61") && digits.length === 11) {
    return "0" + digits.slice(2);
  }

  if (digits.startsWith("4") && digits.length === 9) {
    return "0" + digits;
  }

  if (digits.startsWith("04") && digits.length === 10) {
    return digits;
  }

  return digits;
}

export default function DetailsPage() {
  const [givenNames, setGivenNames] = useState("");
  const [surname, setSurname] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [postcode, setPostcode] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const cleanMobile = normaliseAustralianMobile(mobile);

  const canContinue =
    givenNames.trim().length > 1 &&
    surname.trim().length > 1 &&
    dob.length === 10 &&
    /^04\d{8}$/.test(cleanMobile) &&
    /^\d{4}$/.test(postcode) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    !sending;

  async function emailReport() {
    try {
      setSending(true);
      setSendError("");

      const finalMobile = normaliseAustralianMobile(mobile);

      const image = sessionStorage.getItem("skinchecker_photo");
      const result = JSON.parse(
        sessionStorage.getItem("skinchecker_result") || "{}"
      );

      if (!image) throw new Error("Missing photo. Please go back and retake the photo.");
      if (!result || Object.keys(result).length === 0) {
        throw new Error("Missing assessment result. Please go back and analyse the photo again.");
      }

      sessionStorage.setItem("skinchecker_givenNames", givenNames);
      sessionStorage.setItem("skinchecker_surname", surname);
      sessionStorage.setItem("skinchecker_dob", dob);
      sessionStorage.setItem("skinchecker_mobile", finalMobile);
      sessionStorage.setItem("skinchecker_postcode", postcode);
      sessionStorage.setItem("skinchecker_email", email);

const skinScore = JSON.parse(sessionStorage.getItem("skinScore") || "null");

const response = await fetch("/api/email-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    givenNames,
    surname,
    dob,
    mobile: finalMobile,
    postcode,
    email,
    image,
    result,
    skinScore,
  }),
});

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseBody?.error || "Email failed. Please try again.");
      }

      window.location.href = "/share";
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : "Sorry, we could not email your report. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

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
            Step 4 of 5
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-4/5 rounded-full bg-sky-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Your Details
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          Please enter your details. These will appear on your assessment report
          and emailed PDF.
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
              placeholder="0412 345 678 or +61 412 345 678"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Postcode
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={postcode}
              onChange={(e) =>
                setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              placeholder="2150"
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
            onClick={emailReport}
            className={`block w-full rounded-2xl py-5 text-center text-lg font-semibold transition ${
              canContinue
                ? "bg-sky-600 text-white shadow-lg hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            {sending ? "Sending Report..." : "Email My Report"}
          </button>

          {sendError && (
            <p className="mt-4 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-700">
              {sendError}
            </p>
          )}

          <Link
            href="/result"
            className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back
          </Link>
        </div>
      </div>
    </main>
  );
}