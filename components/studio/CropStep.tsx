"use client";

import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { RotateCcw } from "lucide-react";
import { cropImage } from "@/lib/image";

export function CropStep({ image, onBack, onDone }: { image: string; onBack: () => void; onDone: (image: string) => void }) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish() {
    if (!pixels) return;
    setBusy(true);
    try { onDone(await cropImage(image, pixels, rotation)); } finally { setBusy(false); }
  }

  return (
    <section className="workflow-step crop-step">
      <header className="step-heading"><p>Step 2 of 5</p><h1>Frame the product</h1><span>Pinch or drag to keep the item centered.</span></header>
      <div className="crop-stage">
        <Cropper image={image} crop={crop} zoom={zoom} rotation={rotation} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={(_, area) => setPixels(area)} showGrid />
      </div>
      <div className="edit-controls">
        <label><span>Zoom</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <label><span>Rotate</span><input type="range" min="-180" max="180" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} /></label>
        <button className="reset-control" onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }}><RotateCcw size={17} /> Reset</button>
      </div>
      <div className="step-actions"><button className="secondary-action" onClick={onBack}>Back</button><button className="primary-action" onClick={finish} disabled={busy}>{busy ? "Applying…" : "Use this crop"}</button></div>
    </section>
  );
}
