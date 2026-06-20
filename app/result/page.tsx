"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from "lucide-react";

type Result = {
  trafficLight: "green" | "yellow" | "red" | "blue";
  headline: string;
  summary: string;
  observations: string[];
  recommendation: string;
  disclaimer: string;
};

export default function ResultPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [showCircle, setShowCircle] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("skinchecker_result");

    if (stored) {
      setResult(JSON.parse(stored));
      setTimeout(() => setShowCircle(true), 250);
    }
  }, []);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-slate-500">Loading result...</p>
      </main>
    );
  }

  const colours = {
    green: {
      bg: "bg-green-500",
      panel: "bg-green-50 border-green-200",
      text: "text-green-700",
      icon: <CheckCircle2 className="h-10 w-10 text-white" />,
    },
    yellow: {
      bg: "bg-amber-400",
      panel: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: <AlertTriangle className="h-10 w-10 text-white" />,
    },
    red: {
      bg: "bg-red-600",
      panel: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <AlertTriangle className="h-10 w-10 text-white" />,
    },
    blue: {
      bg: "bg-sky-600",
      panel: "bg-sky-50 border-sky-200",
      text: "text-sky-700",
      icon: <ShieldAlert className="h-10 w-10 text-white" />,
    },
  };

  const colour = colours[result.trafficLight];

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
            Step 5 of 5
          </div>

          <div className="h-2 w-full rounded-full bg-slate-200">
            <div className="h-full w-full rounded-full bg-sky-600" />
          </div>
        </div>

        <div className="flex justify-center">

          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full ${colour.bg}
            transition-all duration-700
            ${showCircle ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          >
            {colour.icon}
          </div>

        </div>

        <h1 className="mt-8 text-center text-4xl font-bold text-slate-900">
          {result.headline}
        </h1>

        <p className="mt-5 text-center text-lg leading-8 text-slate-600">
          {result.summary}
        </p>

        <div
          className={`mt-10 rounded-3xl border p-6 ${colour.panel}`}
        >
          <h2 className={`text-xl font-bold ${colour.text}`}>
            What we observed
          </h2>

          <ul className="mt-5 space-y-3">
            {result.observations.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-slate-700"
              >
                <CheckCircle2 className="mt-1 h-5 w-5 text-green-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Recommendation
          </h2>

          <p className="mt-4 leading-8 text-slate-700">
            {result.recommendation}
          </p>
        </div>

        {result.trafficLight === "yellow" && (

          <div className="mt-8 rounded-3xl border border-sky-200 bg-sky-50 p-6">

            <h2 className="text-xl font-bold text-sky-700">
              Track this mole over time
            </h2>

            <p className="mt-3 leading-7 text-slate-700">
              SkinChecker Plus stores your photos securely, reminds you when
              it's time to check again and compares changes over time.
            </p>

            <button className="mt-5 w-full rounded-2xl bg-sky-600 py-4 text-lg font-semibold text-white">
              Start Free Trial
            </button>

          </div>

        )}

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">

          <Info className="mt-1 h-5 w-5 text-slate-500" />

          <p className="text-sm leading-6 text-slate-600">
            {result.disclaimer}
          </p>

        </div>
<div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5">
  <p className="font-semibold text-green-800">
    ✓ A copy of this report has been emailed to you.
  </p>
</div>
        <div className="mt-10 space-y-4">

          <button className="w-full rounded-2xl bg-sky-600 py-5 text-lg font-semibold text-white shadow-lg">
            Save PDF Report
          </button>

          <Link
            href="/"
            className="block w-full rounded-2xl border border-slate-300 bg-white py-5 text-center text-lg font-semibold text-slate-700"
          >
            Check Another Mole
          </Link>

        </div>

      </div>
    </main>
  );
}