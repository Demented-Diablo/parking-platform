"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadSignSubmission } from "@/lib/submissions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "camera" | "locating" | "ready" | "submitting" | "success";

interface Photo {
  blob: Blob;
  previewUrl: string;
}

interface Location {
  lat: number;
  lng: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stop stream on unmount to release the camera indicator light
  useEffect(() => {
    return () => stopStream();
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // ── Step 1: open rear camera ───────────────────────────────────────────────

  const openCamera = useCallback(async () => {
    setError(null);
    setStatus("camera");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      setStatus("idle");
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Camera permission denied. Tap Allow in your browser's permission prompt, then try again."
          : "Could not start camera. Make sure no other app is using it, then try again.",
      );
    }
  }, []);

  // ── Step 2: snapshot + geolocation (happen together at capture time) ───────

  const captureAndLocate = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // Draw current frame to an off-screen canvas
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    stopStream();

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.85),
    );
    if (!blob) {
      setError("Failed to capture photo. Please try again.");
      setStatus("idle");
      return;
    }

    const previewUrl = URL.createObjectURL(blob);
    setPhoto({ blob, previewUrl });
    setStatus("locating");
    setError(null);

    // Request location immediately after capture so coords are as fresh as possible
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 0,
        }),
      );
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus("ready");
    } catch (e) {
      // Location failed — discard the photo and let the user try again
      URL.revokeObjectURL(previewUrl);
      setPhoto(null);
      setStatus("idle");
      setError(
        e instanceof GeolocationPositionError && e.code === 1
          ? "Location permission denied. We need your position to pin the sign on the map. Allow location access and try again."
          : "Could not get your location. Make sure location services are enabled, then try again.",
      );
    }
  }, []);

  // ── Step 3: retake ─────────────────────────────────────────────────────────

  const retake = useCallback(() => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);
    setLocation(null);
    setError(null);
    openCamera();
  }, [photo, openCamera]);

  // ── Step 4: submit ─────────────────────────────────────────────────────────

  const submit = useCallback(async () => {
    if (!photo || !location) return;
    setError(null);
    setStatus("submitting");

    try {
      await uploadSignSubmission({
        imageBlob: photo.blob,
        latitude: location.lat,
        longitude: location.lng,
        deviceMetadata: {
          userAgent: navigator.userAgent,
          capturedAt: new Date().toISOString(),
        },
      });
      URL.revokeObjectURL(photo.previewUrl);
      setPhoto(null);
      setLocation(null);
      setStatus("success");
    } catch {
      setStatus("ready");
      setError("Upload failed. Check your connection and try again.");
    }
  }, [photo, location]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);
    setLocation(null);
    setError(null);
    setStatus("idle");
  }, [photo]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-10 text-center">
        <span className="text-4xl">✅</span>
        <h2 className="text-lg font-bold text-gray-900">Submission received</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Thanks! Your photo is under review and will appear on the map once
          approved.
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Submit another
        </button>
      </div>
    );
  }

  const showPreview =
    photo && (status === "locating" || status === "ready" || status === "submitting");

  return (
    <div className="flex flex-col gap-5">
      {/* ── Viewport ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-950"
        style={{ aspectRatio: "4/3" }}
      >
        {/* Live camera feed — always mounted so the ref is stable */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${status === "camera" ? "" : "hidden"}`}
        />

        {/* Captured photo preview */}
        {showPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.previewUrl}
            alt="Captured parking sign"
            className="h-full w-full object-cover"
          />
        )}

        {/* Idle placeholder */}
        {status === "idle" && (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-5xl">📷</div>
              <p className="mt-3 text-sm">Camera preview will appear here</p>
            </div>
          </div>
        )}

        {/* Location overlay */}
        {status === "locating" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-800 shadow-lg">
              Getting your location…
            </div>
          </div>
        )}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Location confirmation ─────────────────────────────────────────── */}
      {status === "ready" && location && (
        <p className="text-center text-xs text-green-700">
          Location captured — {location.lat.toFixed(5)},{" "}
          {location.lng.toFixed(5)}
        </p>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      {status === "idle" && (
        <button
          onClick={openCamera}
          className="w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Open Camera
        </button>
      )}

      {status === "camera" && (
        <button
          onClick={captureAndLocate}
          className="w-full rounded-full bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          Capture Sign
        </button>
      )}

      {status === "ready" && (
        <div className="flex gap-3">
          <button
            onClick={retake}
            className="flex-1 rounded-full border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Retake
          </button>
          <button
            onClick={submit}
            className="flex-1 rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Submit
          </button>
        </div>
      )}

      {(status === "locating" || status === "submitting") && (
        <button
          disabled
          className="w-full cursor-not-allowed rounded-full bg-indigo-400 py-3 text-sm font-semibold text-white"
        >
          {status === "locating" ? "Getting location…" : "Uploading…"}
        </button>
      )}
    </div>
  );
}
