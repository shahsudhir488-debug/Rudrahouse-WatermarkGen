"use client";

import { ImagePlus, Type, CalendarDays } from "lucide-react";
import { readImageFile } from "@/lib/image";
import type { WatermarkSettings } from "@/types/studio";

type Props = {
  image: string;
  settings: WatermarkSettings;
  onChange: (patch: Partial<WatermarkSettings>) => void;
  onBack: () => void;
  onDone: () => void;
};

export function DetailsStep({ image, settings, onChange, onBack, onDone }: Props) {
  async function setLogo(file?: File) {
    if (!file) return;
    onChange({ logoUrl: await readImageFile(file), logoName: file.name, logoEnabled: true });
  }

  return (
    <section className="workflow-step form-step">
      <header className="step-heading"><p>Step 3 of 5</p><h1>Add the details</h1><span>Choose what should identify and protect this photo.</span></header>
      <div className="form-preview"><img src={image} alt="Cropped product" /></div>
      <div className="settings-list">
        <div className="setting-card">
          <div className="setting-title"><span className="setting-symbol"><Type size={20} /></span><div><strong>Text watermark</strong><small>Brand name, copyright, or website</small></div><label className="switch"><input type="checkbox" checked={settings.textEnabled} onChange={(event) => onChange({ textEnabled: event.target.checked })} /><span /></label></div>
          {settings.textEnabled && <input className="text-input" value={settings.text} onChange={(event) => onChange({ text: event.target.value })} placeholder="©rudrahouse.com" aria-label="Watermark text" />}
        </div>
        <div className="setting-card">
          <div className="setting-title"><span className="setting-symbol"><CalendarDays size={20} /></span><div><strong>Date stamp</strong><small>Add today&apos;s date under the mark</small></div><label className="switch"><input type="checkbox" checked={settings.dateEnabled} onChange={(event) => onChange({ dateEnabled: event.target.checked })} /><span /></label></div>
        </div>
        <div className="setting-card">
          <div className="setting-title"><span className="setting-symbol"><ImagePlus size={20} /></span><div><strong>Logo watermark</strong><small>{settings.logoName}</small></div><label className="switch"><input type="checkbox" checked={settings.logoEnabled} onChange={(event) => onChange({ logoEnabled: event.target.checked })} /><span /></label></div>
          <div className="logo-actions">
            <label className="small-upload">Choose logo<input type="file" accept="image/*,.svg" onChange={(event) => void setLogo(event.target.files?.[0])} /></label>
            <button onClick={() => onChange({ logoUrl: "/rudra-house-logo.png", logoName: "Rudra House logo", logoEnabled: true })}>Use house logo</button>
          </div>
        </div>
      </div>
      {!settings.textEnabled && !settings.dateEnabled && !settings.logoEnabled && <p className="inline-warning">Turn on at least one detail to create a watermark.</p>}
      <div className="step-actions"><button className="secondary-action" onClick={onBack}>Back</button><button className="primary-action" onClick={onDone}>Adjust look</button></div>
    </section>
  );
}
