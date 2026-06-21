"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [screen, setScreen] = useState<"instructions" | "camera">("instructions");
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [flash, setFlash] = useState(false);

  async function startCamera() {
    if (screen !== "camera") return;

    try {
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
        torch?: boolean;
      };

      setTorchSupported(!!capabilities?.torch);
    } catch {
      setCameraError("Unable to access the camera. Please check camera permissions.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setTorchOn(false);
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 160);

    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    canvas.width = 1200;
    canvas.height = 1200;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, 1200, 1200);

    const image = canvas.toDataURL("image/jpeg", 0.92);
    setPhoto(image);
    sessionStorage.setItem("skinchecker_photo", image);
    stopCamera();
  }

  function retakePhoto() {
    setPhoto(null);
    sessionStorage.removeItem("skinchecker_photo");
    startCamera();
  }

  useEffect(() => {
    if (screen === "camera" && !photo) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [screen]);

  return (
    <main className="min-h-screen bg-white px-5 py-6 text-slate-900">
      {flash && (
        <div className="fixed inset-0 z-[9999] bg-white opacity-90 pointer-events-none" />
      )}

      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-md flex-col">
        <header className="mb-6">
          <div className="text-sm font-semibold text-sky-700">Step 2 of 4</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 rounded-full bg-sky-600" />
          </div>
        </header>

        {screen === "instructions" && (
          <section className="flex flex-1 flex-col">
            <h1 className="text-4xl font-bold tracking-tight">
              Take a clear photo
            </h1>

            <p className="mt-4 text-lg leading-7 text-slate-600">
              A clear, well-lit image helps SkinChecker.app provide a better AI-assisted assessment.
            </p>

            <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-base leading-7 text-slate-700">
              <p>Clean your camera lens before taking the photo.</p>
              <p>Use bright, even lighting whenever possible.</p>
              <p>Move hair, clothing or jewellery away from the lesion.</p>
              <p>Hold the camera as steady as possible.</p>
              <p>Fill most of the frame with the lesion, but do not crop it.</p>
              <p>
                If the camera struggles to focus, move it further away until the image becomes sharp,
                then slowly move closer while keeping it in focus.
              </p>
              <p>Avoid digital zoom - move the camera closer instead.</p>
            </div>

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => setScreen("camera")}
                className="w-full rounded-2xl bg-sky-600 py-5 text-lg font-semibold text-white shadow-lg hover:bg-sky-700"
              >
                Got it
              </button>

              <Link
                href="/details"
                className="mt-5 block text-center text-sm text-slate-500"
              >
                Back
              </Link>
            </div>
          </section>
        )}

        {screen === "camera" && (
          <section className="flex flex-1 flex-col">
            <h1 className="text-3xl font-bold tracking-tight">
              Photograph the lesion
            </h1>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-black shadow-lg">
              {photo ? (
                <img
                  src={photo}
                  alt="Captured skin lesion"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="aspect-square w-full object-cover"
                />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {cameraError && (
              <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {cameraError}
              </p>
            )}

            {!photo && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {torchSupported && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className="rounded-2xl border border-slate-300 py-4 font-semibold"
                  >
                    {torchOn ? "Flash Off" : "Flash On"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={capturePhoto}
                  className={`rounded-2xl bg-sky-600 py-4 font-semibold text-white shadow-lg hover:bg-sky-700 ${
                    torchSupported ? "" : "col-span-2"
                  }`}
                >
                  Capture Photo
                </button>
              </div>
            )}

            {photo && (
              <div className="mt-5 space-y-3">
                <Link
                  href="/results"
                  className="block w-full rounded-2xl bg-sky-600 py-5 text-center text-lg font-semibold text-white shadow-lg hover:bg-sky-700"
                >
                  Use this photo
                </Link>

                <button
                  type="button"
                  onClick={retakePhoto}
                  className="w-full rounded-2xl border border-slate-300 py-4 font-semibold"
                >
                  Retake photo
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setScreen("instructions");
              }}
              className="mt-auto pt-6 text-center text-sm text-slate-500"
            >
              Back to instructions
            </button>
          </section>
        )}
      </div>
    </main>
  );
}