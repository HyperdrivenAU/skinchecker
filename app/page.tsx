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
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:shadow-md">
      {icon}
      <p className="text-sm font-medium text-slate-800">{title}</p>
    </div>
  );
}
export const metadata = {
  title: "SkinChecker.app - Free Online Skin Check",
  description:
    "I just checked something on my skin with SkinChecker.app - it's fast, FREE and I didn't have to download an app to do it!",
  openGraph: {
    title: "SkinChecker.app - Free Online Skin Check",
    description:
      "I just checked something on my skin with SkinChecker.app - it's fast, FREE and I didn't have to download an app to do it!",
    url: "https://skinchecker.app",
    siteName: "SkinChecker.app",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 py-6">

        <Image
          src="/logo.png"
          alt="SkinChecker"
          width={360}
          height={89}
          priority
          className="mb-7 w-full max-w-xs"
        />

        <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Check a suspicious mole
          <span className="block text-sky-600">
            in under a minute.
          </span>
        </h1>

        <p className="mt-4 max-w-lg text-center text-base leading-7 text-slate-600 sm:text-lg">
          Take a clear photo of a mole or skin lesion and receive an
          AI-powered assessment in under a minute.
        </p>

        <Link
          href="/consent"
          className="mt-7 w-full rounded-2xl bg-sky-600 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg transition hover:bg-sky-700 hover:shadow-xl"
        >
          Check My Skin
        </Link>

        <div className="mt-7 grid w-full grid-cols-2 gap-3">

          <Feature
            icon={<Camera className="h-5 w-5 flex-none text-sky-600" />}
            title="No app required"
          />

          <Feature
            icon={<Brain className="h-5 w-5 flex-none text-sky-600" />}
            title="AI-powered"
          />

          <Feature
            icon={<Clock3 className="h-5 w-5 flex-none text-sky-600" />}
            title="Under a minute"
          />

          <Feature
            icon={<ShieldCheck className="h-5 w-5 flex-none text-sky-600" />}
            title="Privacy first"
          />

        </div>

        <p className="mt-6 max-w-md text-center text-xs leading-5 text-slate-500 sm:text-sm">
          SkinChecker provides an AI-assisted assessment only. It is not a
          medical diagnosis and should never replace advice from a qualified
          healthcare professional.
        </p>

      </div>
    </main>
  );
}
