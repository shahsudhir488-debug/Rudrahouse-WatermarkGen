"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Contrast, Droplets, Eye, FileDown, Grid3X3, Move, Palette, RotateCcw, Scaling, Settings2, SlidersHorizontal, SunMedium, Type } from "lucide-react";
import { renderWatermarkedPhoto } from "@/lib/image";
import type { PhotoAsset, WatermarkSettings } from "@/types/studio";

type Props = { photo: PhotoAsset; settings: WatermarkSettings; onChange: (patch: Partial<WatermarkSettings>) => void; onBack: () => void; onDone: () => void };
type Group = "tone" | "mark" | "place" | "export";
type ToolId = "brightness" | "contrast" | "saturation" | "opacity" | "textSize" | "logoSize" | "rotation" | "shadow" | "type" | "repeat" | "position" | "format";

const groups: { id: Group; label: string; icon: ReactNode }[] = [
  { id: "tone", label: "Tone", icon: <SlidersHorizontal size={20} /> },
  { id: "mark", label: "Watermark", icon: <Palette size={20} /> },
  { id: "place", label: "Placement", icon: <Move size={20} /> },
  { id: "export", label: "Export", icon: <FileDown size={20} /> },
];

const toolMeta: Record<ToolId, { label: string; icon: ReactNode; group: Group }> = {
  brightness: { label: "Brightness", icon: <SunMedium size={24} />, group: "tone" },
  contrast: { label: "Contrast", icon: <Contrast size={24} />, group: "tone" },
  saturation: { label: "Color", icon: <Droplets size={24} />, group: "tone" },
  opacity: { label: "Opacity", icon: <Eye size={24} />, group: "mark" },
  textSize: { label: "Text size", icon: <Scaling size={24} />, group: "mark" },
  logoSize: { label: "Logo size", icon: <Scaling size={24} />, group: "mark" },
  rotation: { label: "Rotation", icon: <RotateCcw size={24} />, group: "mark" },
  shadow: { label: "Shadow", icon: <Settings2 size={24} />, group: "mark" },
  type: { label: "Type & color", icon: <Type size={24} />, group: "mark" },
  repeat: { label: "Repeat", icon: <Grid3X3 size={24} />, group: "place" },
  position: { label: "Position", icon: <Move size={24} />, group: "place" },
  format: { label: "File quality", icon: <FileDown size={24} />, group: "export" },
};

const groupTools: Record<Group, ToolId[]> = {
  tone: ["brightness", "contrast", "saturation"],
  mark: ["opacity", "textSize", "logoSize", "rotation", "shadow", "type"],
  place: ["repeat", "position"],
  export: ["format"],
};

function AdjustRange({ label, value, min, max, step = 1, suffix = "%", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  const progress = (value - min) / (max - min) * 100;
  const displayValue = (label === "Brightness" || label === "Contrast" || label === "Color") ? value - 100 : value;
  return <label className="iphone-range"><span className="active-adjustment-label">{label}</span><output>{displayValue > 0 ? "+" : ""}{displayValue}{suffix}</output><input style={{ "--range-progress": `${progress}%` } as CSSProperties} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><i aria-hidden="true" /></label>;
}

export function EnhanceStep({ photo, settings, onChange, onBack, onDone }: Props) {
  const [preview, setPreview] = useState(photo.workingUrl);
  const [rendering, setRendering] = useState(true);
  const [group, setGroup] = useState<Group>("tone");
  const [activeTool, setActiveTool] = useState<ToolId>("brightness");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setRendering(true);
      renderWatermarkedPhoto(photo, settings).then((result) => active && setPreview(result.dataUrl)).finally(() => active && setRendering(false));
    }, 140);
    return () => { active = false; window.clearTimeout(timer); };
  }, [photo, settings]);

  function selectGroup(next: Group) {
    setGroup(next);
    setActiveTool(groupTools[next][0]);
  }

  function renderFocusedControl() {
    if (activeTool === "brightness") return <AdjustRange label="Brightness" value={settings.brightness} min={60} max={140} onChange={(brightness) => onChange({ brightness })} />;
    if (activeTool === "contrast") return <AdjustRange label="Contrast" value={settings.contrast} min={60} max={160} onChange={(contrast) => onChange({ contrast })} />;
    if (activeTool === "saturation") return <AdjustRange label="Color" value={settings.saturation} min={0} max={180} onChange={(saturation) => onChange({ saturation })} />;
    if (activeTool === "opacity") return <AdjustRange label="Opacity" value={settings.opacity} min={5} max={100} onChange={(opacity) => onChange({ opacity })} />;
    if (activeTool === "textSize") return <AdjustRange label="Text size" value={settings.textSize} min={1.5} max={10} step={0.1} onChange={(textSize) => onChange({ textSize })} />;
    if (activeTool === "logoSize") return settings.logoEnabled ? <AdjustRange label="Logo size" value={settings.logoSize} min={5} max={45} onChange={(logoSize) => onChange({ logoSize })} /> : <p className="focused-note">Turn on a logo in Details to adjust its size.</p>;
    if (activeTool === "rotation") return <AdjustRange label="Rotation" value={settings.rotation} min={-45} max={45} suffix="°" onChange={(rotation) => onChange({ rotation })} />;
    if (activeTool === "shadow") return <AdjustRange label="Shadow" value={settings.shadow} min={0} max={100} onChange={(shadow) => onChange({ shadow })} />;
    if (activeTool === "type") return <div className="focused-options"><div className="color-grid"><label>Text color<input type="color" value={settings.textColor} onChange={(event) => onChange({ textColor: event.target.value })} /></label><label>Outline<input type="color" value={settings.strokeColor} onChange={(event) => onChange({ strokeColor: event.target.value })} /></label></div><div className="select-grid"><label>Font<select value={settings.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value })}><option value="Arial, Helvetica, sans-serif">Clean sans</option><option value="Verdana, Geneva, sans-serif">Wide sans</option><option value="Georgia, 'Times New Roman', serif">Classic serif</option><option value="'Courier New', Courier, monospace">Mono stamp</option></select></label><label>Weight<select value={settings.fontWeight} onChange={(event) => onChange({ fontWeight: Number(event.target.value) })}><option value="600">Semi bold</option><option value="700">Bold</option><option value="800">Extra bold</option><option value="900">Heavy</option></select></label></div></div>;
    if (activeTool === "repeat") return <div className="focused-options"><label className="check-row"><span><b>Repeat diagonally</b><small>Cover the photo for stronger protection</small></span><span className="switch"><input type="checkbox" checked={settings.repeated} onChange={(event) => onChange({ repeated: event.target.checked })} /><span /></span></label>{settings.repeated && <div className="mini-range-grid"><AdjustRange label="Columns" value={settings.repeatColumns} min={1} max={12} suffix="" onChange={(repeatColumns) => onChange({ repeatColumns })} /><AdjustRange label="Rows" value={settings.repeatRows} min={1} max={10} suffix="" onChange={(repeatRows) => onChange({ repeatRows })} /></div>}</div>;
    if (activeTool === "position") return settings.repeated ? <div className="focused-options mini-range-grid"><AdjustRange label="Horizontal gap" value={settings.gapX} min={0} max={100} step={0.5} onChange={(gapX) => onChange({ gapX })} /><AdjustRange label="Vertical gap" value={settings.gapY} min={0} max={100} step={0.5} onChange={(gapY) => onChange({ gapY })} /><AdjustRange label="Row shift" value={settings.shiftX} min={-100} max={100} step={0.5} onChange={(shiftX) => onChange({ shiftX })} /><AdjustRange label="Column shift" value={settings.shiftY} min={-100} max={100} step={0.5} onChange={(shiftY) => onChange({ shiftY })} /></div> : <label className="select-field focused-options">Position<select value={settings.position} onChange={(event) => onChange({ position: event.target.value as WatermarkSettings["position"] })}><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-right">Top right</option><option value="top-left">Top left</option><option value="center">Center</option></select></label>;
    return <div className="focused-options"><label className="select-field">File format<select value={settings.format} onChange={(event) => onChange({ format: event.target.value as WatermarkSettings["format"] })}><option value="image/png">PNG — best quality</option><option value="image/jpeg">JPG — smaller file</option></select></label>{settings.format === "image/jpeg" && <AdjustRange label="JPG quality" value={settings.quality} min={50} max={100} onChange={(quality) => onChange({ quality })} />}</div>;
  }

  return (
    <section className="workflow-step enhance-step iphone-enhance">
      <header className="step-heading"><p>Step 4 of 5</p><h1>Finish the image</h1><span>Select a tool, then fine-tune it while watching the live result.</span></header>
      <div className={`live-result ${rendering ? "is-rendering" : ""}`}><img src={preview} alt="Live watermarked preview" /><span>{rendering ? "Updating…" : "Live preview"}</span></div>
      <div className="adjustment-console">
        <div className="iphone-tool-dock enhance-tool-dock" role="toolbar" aria-label={`${groups.find((item) => item.id === group)?.label} controls`}>
          {groupTools[group].map((toolId) => <button key={toolId} className={activeTool === toolId ? "is-active" : ""} onClick={() => setActiveTool(toolId)} aria-pressed={activeTool === toolId}><span className="tool-orb">{toolMeta[toolId].icon}</span><b>{toolMeta[toolId].label}</b></button>)}
        </div>
        <div className="focused-adjustment">{renderFocusedControl()}</div>
        <nav className="adjustment-tabs" aria-label="Adjustment groups">{groups.map((item) => <button key={item.id} className={group === item.id ? "is-active" : ""} onClick={() => selectGroup(item.id)} aria-pressed={group === item.id}>{item.icon}<span>{item.label}</span></button>)}</nav>
      </div>
      <div className="step-actions"><button className="secondary-action" onClick={onBack}>Back</button><button className="primary-action" onClick={onDone}>Review photo</button></div>
    </section>
  );
}
