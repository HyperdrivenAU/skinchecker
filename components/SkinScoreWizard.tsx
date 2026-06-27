"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SkinScoreQuestion from "./SkinScoreQuestion";
import WizardProgress from "./WizardProgress";
import RiskGauge from "./RiskGauge";
import { calculateSkinScore, SkinScoreAnswers, AiAssessment } from "@/lib/skinScore";

const blankAnswers: SkinScoreAnswers = {
  age: "",
  hair: "",
  eyes: "",
  burns: "",
  moles: "",
  changing: "",
  outdoorWork: "",
  sunburns: "",
  sunscreen: "",
  solarium: "",
  previousSkinCancer: "",
  previousMelanoma: "",
  familyHistory: "",
};

export default function SkinScoreWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<SkinScoreAnswers>(blankAnswers);
  const [result, setResult] = useState<any>(null);

  const totalSteps = 5;

  function updateAnswer(key: keyof SkinScoreAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function getAiAssessment(): AiAssessment {
    if (typeof window === "undefined") return "Yellow";

    const stored =
      sessionStorage.getItem("assessment") ||
      sessionStorage.getItem("aiAssessment") ||
      sessionStorage.getItem("result");

    if (!stored) return "Yellow";

    if (stored.includes("Green")) return "Green";
    if (stored.includes("Red")) return "Red";
    return "Yellow";
  }

  function finish() {
    const aiAssessment = getAiAssessment();
    const calculated = calculateSkinScore(answers, aiAssessment);

    sessionStorage.setItem("skinScoreAnswers", JSON.stringify(answers));
    sessionStorage.setItem("skinScore", JSON.stringify(calculated));

    setResult(calculated);
  }

  if (result) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow">
          <h1 className="text-center text-3xl font-bold text-slate-900">SkinScore™</h1>
          <p className="mt-2 text-center text-slate-600">
            Your personalised skin cancer risk indicator.
          </p>

          <RiskGauge score={result.total} grade={result.grade} colour={result.colour} />

          <div className="rounded-2xl bg-slate-50 p-4">
            <h2 className="mb-2 font-semibold text-slate-900">Contributing factors</h2>
            {result.factors.length > 0 ? (
              <ul className="list-inside list-disc text-sm text-slate-700">
                {result.factors.map((factor: string) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-700">
                No major additional risk factors were identified from your answers.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            SkinScore™ is not a diagnosis. It combines your AI lesion assessment with personal
            risk factors to help indicate whether professional review should be prioritised.
          </p>

          <button
            onClick={() => router.push("/details")}
            className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold text-slate-900">SkinScore™</h1>
        <p className="mt-2 mb-6 text-slate-600">
          Answer a few quick questions to personalise your report.
        </p>

        <WizardProgress step={step} total={totalSteps} />

        {step === 1 && (
          <>
            <SkinScoreQuestion
              label="How old are you?"
              value={answers.age}
              options={["Under 20", "20-39", "40-59", "60+"]}
              onChange={(v) => updateAnswer("age", v)}
            />
            <SkinScoreQuestion
              label="What is your natural hair colour?"
              value={answers.hair}
              options={["Black", "Brown", "Blonde", "Red", "Grey/White"]}
              onChange={(v) => updateAnswer("hair", v)}
            />
            <SkinScoreQuestion
              label="What colour are your eyes?"
              value={answers.eyes}
              options={["Brown", "Hazel", "Green", "Blue"]}
              onChange={(v) => updateAnswer("eyes", v)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <SkinScoreQuestion
              label="How does your skin usually react to sun exposure?"
              value={answers.burns}
              options={["Rarely burns", "Sometimes", "Usually", "Always"]}
              onChange={(v) => updateAnswer("burns", v)}
            />
            <SkinScoreQuestion
              label="Approximately how many moles do you have?"
              value={answers.moles}
              options={["Under 20", "20-50", "50-100", "100+"]}
              onChange={(v) => updateAnswer("moles", v)}
            />
            <SkinScoreQuestion
              label="Has this mole changed recently?"
              value={answers.changing}
              options={["Yes", "No", "Not sure"]}
              onChange={(v) => updateAnswer("changing", v)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <SkinScoreQuestion
              label="Have you worked outdoors?"
              value={answers.outdoorWork}
              options={["Never", "Sometimes", "Frequently", "Most career"]}
              onChange={(v) => updateAnswer("outdoorWork", v)}
            />
            <SkinScoreQuestion
              label="How many blistering sunburns have you had?"
              value={answers.sunburns}
              options={["None", "1-2", "3-5", "5+"]}
              onChange={(v) => updateAnswer("sunburns", v)}
            />
            <SkinScoreQuestion
              label="How often do you use sunscreen?"
              value={answers.sunscreen}
              options={["Always", "Usually", "Sometimes", "Rarely", "Never"]}
              onChange={(v) => updateAnswer("sunscreen", v)}
            />
          </>
        )}

        {step === 4 && (
          <>
            <SkinScoreQuestion
              label="Have you ever used a solarium?"
              value={answers.solarium}
              options={["Never", "1-5", "5-20", "20+"]}
              onChange={(v) => updateAnswer("solarium", v)}
            />
            <SkinScoreQuestion
              label="Have you ever had skin cancer?"
              value={answers.previousSkinCancer}
              options={["Yes", "No"]}
              onChange={(v) => updateAnswer("previousSkinCancer", v)}
            />
            <SkinScoreQuestion
              label="Have you ever had melanoma?"
              value={answers.previousMelanoma}
              options={["Yes", "No"]}
              onChange={(v) => updateAnswer("previousMelanoma", v)}
            />
            <SkinScoreQuestion
              label="Family history of melanoma?"
              value={answers.familyHistory}
              options={["Yes", "No", "Not sure"]}
              onChange={(v) => updateAnswer("familyHistory", v)}
            />
          </>
        )}

        {step === 5 && (
          <div className="rounded-2xl bg-blue-50 p-5">
            <h2 className="text-xl font-bold text-slate-900">Ready to calculate your SkinScore™</h2>
            <p className="mt-2 text-slate-700">
              We will combine your answers with your AI lesion assessment to generate your
              personalised SkinScore™.
            </p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-1/2 rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-700"
            >
              Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white"
            >
              Next
            </button>
          ) : (
            <button
              onClick={finish}
              className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white"
            >
              Calculate SkinScore™
            </button>
          )}
        </div>

        <button
          onClick={() => router.push("/details")}
          className="mt-4 w-full text-sm font-medium text-slate-500"
        >
          Skip SkinScore™
        </button>
      </div>
    </main>
  );
}