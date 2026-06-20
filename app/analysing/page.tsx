"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const steps = [
  "Image received",
  "Photo quality checked",
  "Lesion area reviewed",
  "Border analysed",
  "Colour pattern assessed",
  "Symmetry reviewed",
  "Preparing traffic light result",
];

export default function AnalysingPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function analysePhoto() {
      const image = sessionStorage.getItem("skinchecker_photo");

      if (!image) {
        setError("No photo was found. Please go back and take another photo.");
        return;
      }

      const stepTimer = window.setInterval(() => {
        setCompletedSteps((current) =>
          current < steps.length ? current + 1 : current
        );
      }, 450);

      try {
        const response = await fetch("/api/analyse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Analysis failed.");
        }

        sessionStorage.setItem(
          "skinchecker_result",
          JSON.stringify(result)
        );

        window.clearInterval(stepTimer);
        setCompletedSteps(steps.length);

        setTimeout(() => {
          router.replace("/result");
        }, 700);
      } catch {
        window.clearInterval(stepTimer);
        setError("We could not analyse the photo. Please try again.");
      }
    }

    analysePhoto();
  }, [router]);

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
          Analysing your photo
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          SkinChecker is reviewing the visible features of the lesion and
          preparing your traffic light assessment.
        </p>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            {steps.map((step, index) => {
              const done = index < completedSteps;

              return (
                <div key={step} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
                  ) : index === completedSteps ? (
                    <Loader2 className="h-6 w-6 shrink-0 animate-spin text-sky-600" />
                  ) : (
                    <div className="h-6 w-6 shrink-0 rounded-full border border-slate-300" />
                  )}

                  <span
                    className={
                      done
                        ? "font-medium text-slate-900"
                        : "text-slate-500"
                    }
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            {error}
          </div>
        )}

        <p className="mt-auto pt-10 text-center text-sm leading-6 text-slate-500">
          This assessment is AI-assisted only and is not a medical diagnosis.
        </p>
      </div>
    </main>
  );
}