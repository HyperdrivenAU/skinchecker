export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">

        <img
          src="/logo.png"
          alt="SkinChecker"
          className="mx-auto w-40 mb-8"
        />

        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          AI Skin Checks
          <br />
          <span className="text-blue-600">in under a minute.</span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 leading-relaxed">
          Concerned about a mole or skin lesion?
          <br />
          Take a clear photo and receive an AI-powered assessment in under a minute.
        </p>

        <button
          className="mt-10 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition"
        >
          Start Skin Check
        </button>

        <div className="grid grid-cols-2 gap-4 mt-12 text-left">

          <div className="rounded-xl border p-4">
            <div className="text-2xl">📷</div>
            <div className="font-semibold mt-2">No app required</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-2xl">🤖</div>
            <div className="font-semibold mt-2">AI-powered</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-2xl">⏱</div>
            <div className="font-semibold mt-2">Under a minute</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-2xl">🔒</div>
            <div className="font-semibold mt-2">Privacy first</div>
          </div>

        </div>

        <p className="mt-10 text-sm text-slate-500 leading-relaxed">
          SkinChecker provides an AI-assisted assessment only and is not a
          medical diagnosis. Always seek professional medical advice if you are
          concerned about any skin lesion.
        </p>

      </div>
    </main>
  );
}