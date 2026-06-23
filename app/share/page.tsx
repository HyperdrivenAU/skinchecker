"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaXTwitter,
  FaShareNodes,
  FaRegCopy,
} from "react-icons/fa6";

const shareUrl = "https://skinchecker.app";

const shareText =
  "I just checked something on my skin with https://skinchecker.app - it's fast, FREE and I didn't have to download an app to do it! Try it now! #skincheck #skincancer #skincheckerapp";

export default function SharePage() {
  const [copied, setCopied] = useState(false);

  async function shareSkinChecker() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "SkinChecker.app",
          text: shareText,
          url: shareUrl,
        });
      } else {
        copyMessage();
      }
    } catch {
      // User cancelled sharing
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-10">

        <h1 className="text-center text-4xl font-bold text-slate-900">
          🎉 Thank you for using SkinChecker!
        </h1>
<h1 className="text-center text-4xl font-bold text-slate-900">
  One last favour...
</h1>
        <p className="mt-8 text-center text-xl leading-8 text-slate-700">
          If SkinChecker helped you today,
          <br />
          <strong>PLEASE share it with your friends and family.</strong>
        </p>

        <p className="mt-4 text-center text-2xl font-bold text-sky-700">
          It could save a life.
        </p>

        <div className="mt-8 flex gap-8 text-slate-500">
          <FaFacebook size={40} />
          <FaLinkedin size={40} />
          <FaInstagram size={40} />
          <FaXTwitter size={40} />
        </div>

        <button
          type="button"
          onClick={shareSkinChecker}
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-600 py-5 text-lg font-semibold text-white shadow-lg transition hover:bg-sky-700"
        >
          <FaShareNodes size={24} />
          Share SkinChecker.app
        </button>

        <button
          type="button"
          onClick={copyMessage}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white py-5 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <FaRegCopy size={22} />
          Copy Share Message
        </button>

        {copied && (
          <div className="mt-5 w-full rounded-2xl bg-green-50 p-4 text-center text-green-700">
            ✅ Share message copied to your clipboard.
            <br />
            Simply paste it into Facebook, LinkedIn, Instagram, X or anywhere else.
          </div>
        )}

        <Link
          href="/"
          className="mt-10 block w-full rounded-2xl border border-slate-300 bg-white py-5 text-center text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Check Another Mole
        </Link>

      </div>
    </main>
  );
}