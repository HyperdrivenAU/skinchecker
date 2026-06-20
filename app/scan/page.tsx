"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, RotateCcw } from "lucide-react";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [delay, setDelay] = useState(5);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        setCameraError(
          "We could not access your camera. Please allow camera access or choose a photo from your device."
        );
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close();
    };
  }, [stream]);

  function beep(frequency = 880, duration = 120) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration / 1000
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }

  function shutterSound() {
    beep(1200, 80);
    setTimeout(() => beep(700, 100), 90);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.92);
    setPhoto(imageData);
  }

  function startCountdown() {
    if (delay === 0) {
      shutterSound();
      capturePhoto();
      return;
    }

    setCountdown(delay);
    beep();

    let current = delay;

    const timer = setInterval(() => {
      current -= 1;

      if (current <= 0) {
        clearInterval(timer);
        setCountdown(null);
        shutterSound();
        capturePhoto();
      } else {
        setCountdown(current);
        beep(current === 1 ? 1200 : 880, current === 1 ? 180 : 120);
      }
    }, 1000);
  }

  function retakePhoto() {
    setPhoto(null);
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
            Step 3 of 5
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-3/5 rounded-full bg-sky-600"></div>
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Take a clear photo
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          For best results, clean your camera lens first. Remove any obstructions
          such as hair. Use good lighting, keep the camera steady and try to fill
          the frame with the mole or skin lesion.
        </p>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
          {photo ? (
            <img
              src={photo}
              alt="Captured skin lesion"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full object-cover"
              />

              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-8xl font-bold text-white">
                    {countdown}
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-700">
                  {cameraError}
                </div>
              )}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {!photo && (
          <div className="mt-8">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Capture delay
            </p>

            <div className="grid grid-cols-4 gap-3">
              {[0, 3, 5, 10].map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setDelay(seconds)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    delay === seconds
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {seconds === 0 ? "No delay" : `${seconds}s`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-10">
          {photo ? (
            <div className="space-y-4">
              <Link
                href="/analysing"
                className="block w-full rounded-2xl bg-sky-600 py-5 text-center text-lg font-semibold text-white shadow-lg transition hover:bg-sky-700"
              >
                Use Photo
              </Link>

              <button
                type="button"
                onClick={retakePhoto}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white py-5 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-5 w-5" />
                Retake
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startCountdown}
              disabled={countdown !== null || !!cameraError}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-600 py-5 text-lg font-semibold text-white shadow-lg transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Camera className="h-5 w-5" />
              Take Photo
            </button>
          )}

          <Link
            href="/details"
            className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back
          </Link>
        </div>
      </div>
    </main>
  );
}