"use client";

import { useEffect, useRef } from "react";
import { Camera, CameraOff, ImagePlus, RefreshCw, SwitchCamera, Zap, ZapOff } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { IconButton } from "@/components/ui/IconButton";

type Props = {
  mobile: boolean;
  onCapture: (dataUrl: string) => void;
  onFiles: (files: FileList) => void;
};

export function CameraScreen({ mobile, onCapture, onFiles }: Props) {
  const { videoRef, state, flashOn, flashAvailable, start, switchCamera, toggleFlash, capture } = useCamera();
  const galleryRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (mobile && !started.current) {
      started.current = true;
      void start();
    }
  }, [mobile, start]);

  const message = {
    idle: "Open the live camera or choose a photo.",
    requesting: "Allow camera access to take a photo.",
    ready: "Camera ready",
    denied: "Camera access is blocked. Allow it in your browser settings, or choose a photo instead.",
    unavailable: "No compatible camera was found. You can still choose a photo from your gallery.",
    error: "The camera could not start. Check that this page is using HTTPS, then try again.",
  }[state];

  return (
    <section className={`camera-screen ${state === "ready" ? "is-live" : ""}`} aria-label="Take or choose a photo">
      <div className="camera-viewport">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" />
        {state !== "ready" && (
          <div className="camera-fallback">
            <span className="fallback-icon">{state === "denied" || state === "unavailable" ? <CameraOff /> : <Camera />}</span>
            <p>{message}</p>
            {state !== "requesting" && <button className="text-action" onClick={() => start()}><RefreshCw size={16} /> Try camera again</button>}
            <button className="gallery-fallback" onClick={() => galleryRef.current?.click()}><ImagePlus size={19} /> Choose from gallery</button>
          </div>
        )}

        <div className="camera-topbar">
          <img src="/rudra-house-logo.png" alt="Rudra House Nepal" />
          <span className="privacy-pill">On-device</span>
        </div>

        <div className="camera-utility">
          <IconButton label={flashOn ? "Turn flash off" : "Turn flash on"} onClick={toggleFlash} disabled={!flashAvailable}>
            {flashOn ? <Zap size={21} fill="currentColor" /> : <ZapOff size={21} />}
          </IconButton>
          <IconButton label="Switch front or rear camera" onClick={switchCamera} disabled={state !== "ready"}>
            <SwitchCamera size={23} />
          </IconButton>
        </div>
      </div>

      <div className="capture-dock">
        <button className="gallery-button" onClick={() => galleryRef.current?.click()} aria-label="Choose a photo from gallery">
          <ImagePlus size={25} /><span>Gallery</span>
        </button>
        <button className="shutter-button" onClick={() => onCapture(capture())} disabled={state !== "ready"} aria-label="Take photo"><span /></button>
        <span className="dock-balance" aria-hidden="true" />
      </div>
      <input ref={galleryRef} className="visually-hidden" type="file" accept="image/*" multiple={!mobile} onChange={(event) => event.target.files && onFiles(event.target.files)} />
    </section>
  );
}
