"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { renderWatermarkedPhoto } from "@/lib/image";
import type { PhotoAsset, WatermarkSettings } from "@/types/studio";

function Range({ label, value, min, max, step = 1, suffix = "%", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="range-control"><span><b>{label}</b><output>{value}{suffix}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

type Props = { photo: PhotoAsset; settings: WatermarkSettings; onChange: (patch: Partial<WatermarkSettings>) => void; onBack: () => void; onDone: () => void };

export function EnhanceStep({ photo, settings, onChange, onBack, onDone }: Props) {
  const [preview, setPreview] = useState(photo.workingUrl);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setRendering(true);
      renderWatermarkedPhoto(photo, settings).then((result) => active && setPreview(result.dataUrl)).finally(() => active && setRendering(false));
    }, 140);
    return () => { active = false; window.clearTimeout(timer); };
  }, [photo, settings]);

  return (
    <section className="workflow-step enhance-step">
      <header className="step-heading"><p>Step 4 of 5</p><h1>Finish the image</h1><span>Adjust the photo and watermark while watching the result.</span></header>
      <div className={`live-result ${rendering ? "is-rendering" : ""}`}><img src={preview} alt="Live watermarked preview" /><span>{rendering ? "Updating…" : "Live preview"}</span></div>
      <div className="adjustment-groups">
        <details open><summary>Image tone <ChevronDown size={18} /></summary><div className="range-stack">
          <Range label="Brightness" value={settings.brightness} min={60} max={140} onChange={(brightness) => onChange({ brightness })} />
          <Range label="Contrast" value={settings.contrast} min={60} max={160} onChange={(contrast) => onChange({ contrast })} />
          <Range label="Color" value={settings.saturation} min={0} max={180} onChange={(saturation) => onChange({ saturation })} />
        </div></details>
        <details open><summary>Watermark style <ChevronDown size={18} /></summary><div className="range-stack">
          <Range label="Opacity" value={settings.opacity} min={5} max={100} onChange={(opacity) => onChange({ opacity })} />
          <Range label="Text size" value={settings.textSize} min={1.5} max={10} step={0.1} onChange={(textSize) => onChange({ textSize })} />
          {settings.logoEnabled && <Range label="Logo size" value={settings.logoSize} min={5} max={45} onChange={(logoSize) => onChange({ logoSize })} />}
          <Range label="Rotation" value={settings.rotation} min={-45} max={45} suffix="°" onChange={(rotation) => onChange({ rotation })} />
          <Range label="Shadow" value={settings.shadow} min={0} max={100} onChange={(shadow) => onChange({ shadow })} />
          <div className="color-grid"><label>Text color<input type="color" value={settings.textColor} onChange={(event) => onChange({ textColor: event.target.value })} /></label><label>Outline<input type="color" value={settings.strokeColor} onChange={(event) => onChange({ strokeColor: event.target.value })} /></label></div>
          <div className="select-grid"><label>Font<select value={settings.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value })}><option value="Arial, Helvetica, sans-serif">Clean sans</option><option value="Verdana, Geneva, sans-serif">Wide sans</option><option value="Georgia, 'Times New Roman', serif">Classic serif</option><option value="'Courier New', Courier, monospace">Mono stamp</option></select></label><label>Weight<select value={settings.fontWeight} onChange={(event) => onChange({ fontWeight: Number(event.target.value) })}><option value="600">Semi bold</option><option value="700">Bold</option><option value="800">Extra bold</option><option value="900">Heavy</option></select></label></div>
        </div></details>
        <details><summary>Placement & repeat <ChevronDown size={18} /></summary><div className="range-stack">
          <label className="check-row"><span><b>Repeat diagonally</b><small>Cover the full photo for stronger protection</small></span><span className="switch"><input type="checkbox" checked={settings.repeated} onChange={(event) => onChange({ repeated: event.target.checked })} /><span /></span></label>
          {settings.repeated ? <>
            <Range label="Columns" value={settings.repeatColumns} min={1} max={12} suffix="" onChange={(repeatColumns) => onChange({ repeatColumns })} />
            <Range label="Rows" value={settings.repeatRows} min={1} max={10} suffix="" onChange={(repeatRows) => onChange({ repeatRows })} />
            <Range label="Horizontal gap" value={settings.gapX} min={0} max={100} step={0.5} onChange={(gapX) => onChange({ gapX })} />
            <Range label="Vertical gap" value={settings.gapY} min={0} max={100} step={0.5} onChange={(gapY) => onChange({ gapY })} />
            <Range label="Row shift" value={settings.shiftX} min={-100} max={100} step={0.5} onChange={(shiftX) => onChange({ shiftX })} />
            <Range label="Column shift" value={settings.shiftY} min={-100} max={100} step={0.5} onChange={(shiftY) => onChange({ shiftY })} />
          </> : <label className="select-field">Position<select value={settings.position} onChange={(event) => onChange({ position: event.target.value as WatermarkSettings["position"] })}><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-right">Top right</option><option value="top-left">Top left</option><option value="center">Center</option></select></label>}
        </div></details>
        <details><summary>Export quality <ChevronDown size={18} /></summary><div className="range-stack">
          <label className="select-field">File format<select value={settings.format} onChange={(event) => onChange({ format: event.target.value as WatermarkSettings["format"] })}><option value="image/png">PNG — best quality</option><option value="image/jpeg">JPG — smaller file</option></select></label>
          {settings.format === "image/jpeg" && <Range label="JPG quality" value={settings.quality} min={50} max={100} onChange={(quality) => onChange({ quality })} />}
        </div></details>
      </div>
      <div className="step-actions"><button className="secondary-action" onClick={onBack}>Back</button><button className="primary-action" onClick={onDone}>Review photo</button></div>
    </section>
  );
}
