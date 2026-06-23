"use client";

const shareText =
  "I just checked something on my skin with https://skinchecker.app - it's fast, FREE and I didn't have to download an app to do it! Try it now! #skincheck #skincancer #skincheckerapp";

const shareUrl = "https://skinchecker.app";

export default function SharePage() {
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-950 text-white">
      <div className="max-w-xl w-full text-center bg-white/10 rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-4">Thank you!</h1>

        <p className="text-lg mb-6">
          If you like our service, PLEASE share it on social media.
        </p>

        <p className="text-2xl font-semibold mb-8">
          It could save a life!
        </p>

        <div className="grid grid-cols-1 gap-4">
<a
  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
  target="_blank"
  rel="noopener noreferrer"
  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold"
>
  Share on Facebook
</a>

          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold"
          >
            Share on LinkedIn
          </a>

          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-pink-600 px-5 py-3 font-semibold"
          >
            Share on Instagram
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-black border border-white/30 px-5 py-3 font-semibold"
          >
            Share on X
          </a>
        </div>

        <p className="text-sm text-white/60 mt-6">
          Instagram does not support direct web sharing, so this opens Instagram.
        </p>
      </div>
    </main>
  );
}