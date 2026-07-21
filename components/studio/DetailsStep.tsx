"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, ImagePlus, Type } from "lucide-react";
import { readImageFile } from "@/lib/image";
import type { WatermarkSettings } from "@/types/studio";

type Props = {
  image: string;
  settings: WatermarkSettings;
  onChange: (patch: Partial<WatermarkSettings>) => void;
  onBack: () => void;
  onDone: () => void;
};

type DetailTool = "text" | "date" | "logo";

const detailTools: { id: DetailTool; label: string; hint: string; icon: ReactNode }[] = [
  { id: "text", label: "Text", hint: "Brand or copyright", icon: <Type size={23} /> },
  { id: "date", label: "Date", hint: "Today’s date", icon: <CalendarDays size={23} /> },
  { id: "logo", label: "Logo", hint: "Your brand mark", icon: <ImagePlus size={23} /> },
];

export function DetailsStep({ image, settings, onChange, onBack, onDone }: Props) {
  const [activeTool, setActiveTool] = useState<DetailTool>("text");

  async function setLogo(file?: File) {
    if (!file) return;
    onChange({ logoUrl: await readImageFile(file), logoName: file.name, logoEnabled: true });
  }

  const dateLabel = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

  return (
    <section className="workflow-step form-step detail-editor">
      <header className="step-heading"><p>Step 3 of 5</p><h1>Add the details</h1><span>Choose a detail below, then set exactly how it should appear.</span></header>

      <div className="form-preview detail-preview">
        <img src={image} alt="Cropped product" />
        <div className="detail-preview-mark" aria-hidden="true">
          {settings.logoEnabled && <img src={settings.logoUrl} alt="" />}
          {settings.textEnabled && settings.text.trim() && <b>{settings.text}</b>}
          {settings.dateEnabled && <span>{dateLabel}</span>}
        </div>
      </div>

      <div className="iphone-tool-dock detail-tool-dock" role="toolbar" aria-label="Watermark detail tools">
        {detailTools.map((tool) => {
          const enabled = tool.id === "text" ? settings.textEnabled : tool.id === "date" ? settings.dateEnabled : settings.logoEnabled;
          return <button key={tool.id} className={activeTool === tool.id ? "is-active" : ""} onClick={() => setActiveTool(tool.id)} aria-pressed={activeTool === tool.id}>
            <span className="tool-orb">{tool.icon}{enabled && <i />}</span>
            <b>{tool.label}</b><small>{tool.hint}</small>
          </button>;
        })}
      </div>

      <div className="focused-detail-panel">
        {activeTool === "text" && <>
          <div className="focused-panel-title"><div><b>Text watermark</b><span>Brand name, copyright, or website</span></div><label className="switch"><input type="checkbox" checked={settings.textEnabled} onChange={(event) => onChange({ textEnabled: event.target.checked })} aria-label="Enable text watermark" /><span /></label></div>
          <input className="text-input" value={settings.text} onChange={(event) => onChange({ text: event.target.value })} placeholder="©rudrahouse.com" aria-label="Watermark text" disabled={!settings.textEnabled} />
        </>}
        {activeTool === "date" && <>
          <div className="focused-panel-title"><div><b>Date stamp</b><span>Add today’s date beneath the mark</span></div><label className="switch"><input type="checkbox" checked={settings.dateEnabled} onChange={(event) => onChange({ dateEnabled: event.target.checked })} aria-label="Enable date stamp" /><span /></label></div>
          <div className="detail-example"><CalendarDays size={18} /><span>{dateLabel}</span></div>
        </>}
        {activeTool === "logo" && <>
          <div className="focused-panel-title"><div><b>Logo watermark</b><span>{settings.logoName}</span></div><label className="switch"><input type="checkbox" checked={settings.logoEnabled} onChange={(event) => onChange({ logoEnabled: event.target.checked })} aria-label="Enable logo watermark" /><span /></label></div>
          <div className="logo-actions">
            <label className="small-upload">Choose logo<input type="file" accept="image/*,.svg" onChange={(event) => void setLogo(event.target.files?.[0])} /></label>
            <button onClick={() => onChange({ logoUrl: "/rudra-house-logo.png", logoName: "Rudra House logo", logoEnabled: true })}>Use house logo</button>
          </div>
        </>}
      </div>

      {!settings.textEnabled && !settings.dateEnabled && !settings.logoEnabled && <p className="inline-warning">Turn on at least one detail to create a watermark.</p>}
      <div className="step-actions"><button className="secondary-action" onClick={onBack}>Back</button><button className="primary-action" onClick={onDone}>Adjust look</button></div>
    </section>
  );
}
