"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraState = "idle" | "requesting" | "ready" | "denied" | "unavailable" | "error";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flashAvailable, setFlashAvailable] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setFlashOn(false);
    setFlashAvailable(false);
  }, []);

  const start = useCallback(async (requestedFacing?: "environment" | "user") => {
    const nextFacing = requestedFacing ?? facingMode;
    stop();
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: nextFacing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      });
      streamRef.current = stream;
      setFacingMode(nextFacing);
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setFlashAvailable(Boolean(capabilities?.torch));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("ready");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "unavailable" : "error");
    }
  }, [facingMode, stop]);

  const switchCamera = useCallback(() => start(facingMode === "environment" ? "user" : "environment"), [facingMode, start]);

  const toggleFlash = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !flashAvailable) return;
    const next = !flashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setFlashOn(next);
    } catch {
      setFlashAvailable(false);
    }
  }, [flashAvailable, flashOn]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) throw new Error("The camera is still getting ready.");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Camera capture is unavailable.");
    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.96);
  }, [facingMode]);

  useEffect(() => stop, [stop]);

  return { videoRef, state, facingMode, flashAvailable, flashOn, start, stop, switchCamera, toggleFlash, capture };
}
