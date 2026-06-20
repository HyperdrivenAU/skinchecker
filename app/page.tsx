import Image from "next/image";
import Link from "next/link";
import { Camera, Brain, ShieldCheck, Clock3 } from "lucide-react";

function Feature({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {icon}
      <p className="mt-3 font-medium text-slate-800">{title}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-10">

        <Image
          src="/logo.png"
          alt="SkinChecker"
          width={650}
          height={160}
          priority
          className="mb-10 w-full max-w-md"
        />

        <h1 className="text-center text-5xl font-bold tracking-tight text-slate-900">
          Check a suspicious mole
          <span className="block text-sky-600">
            in under a minute.
          </span>
        </h1>

        <p className="mt-6 max-w-lg text-center text-lg leading-8 text-slate-600">
          Take a clear photo of a mole or skin lesion and receive an
          AI-powered assessment in under a minute.
        </p>

        <Link
          href="/consent"
          className="mt-10 w-full rounded-2xl bg-sky-600 px-8 py-5 text-center text-lg font-semibold text-white shadow-lg transition hover:bg-sky-700 hover:shadow-xl"
        >
          Check My Skin
        </Link>

        <div className="mt-14 grid w-full grid-cols-2 gap-4">

          <Feature
            icon={<Camera className="h-7 w-7 text-sky-600" />}
            title="No app required"
          />

          <Feature
            icon={<Brain className="h-7 w-7 text-sky-600" />}
            title="AI-powered"
          />

          <Feature
            icon={<Clock3 className="h-7 w-7 text-sky-600" />}
            title="Under a minute"
          />

          <Feature
            icon={<ShieldCheck className="h-7 w-7 text-sky-600" />}
            title="Privacy first"
          />

        </div>

        <p className="mt-12 max-w-md text-center text-sm leading-6 text-slate-500">
          SkinChecker provides an AI-assisted assessment only. It is not a
          medical diagnosis and should never replace advice from a qualified
          healthcare professional.
        </p>

      </div>
    </main>
  );
}