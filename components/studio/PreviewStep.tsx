"use client";

import { useEffect, useState } from "react";
import { Check, Download, Images, LoaderCircle, Share2 } from "lucide-react";
import { downloadBlob, renderWatermarkedPhoto } from "@/lib/image";
import type { PhotoAsset, WatermarkSettings } from "@/types/studio";

type Rendered = Awaited<ReturnType<typeof renderWatermarkedPhoto>>;
type Props = { photos: PhotoAsset[]; active: number; settings: WatermarkSettings; onActive: (index: number) => void; onBack: () => void; onRestart: () => void };

export function PreviewStep({ photos, active, settings, onActive, onBack, onRestart }: Props) {
  const [result, setResult] = useState<Rendered | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("Preparing your image…");
  const photo = photos[active];

  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      setBusy(true);
      setResult(null);
      setMessage("Preparing your image…");
      renderWatermarkedPhoto(photo, settings).then((value) => { if (current) { setResult(value); setMessage("Ready to save"); } }).catch(() => current && setMessage("This image could not be prepared. Go back and try again.")).finally(() => current && setBusy(false));
    }, 0);
    return () => { current = false; window.clearTimeout(timer); };
  }, [photo, settings]);

  async function saveCurrent(preferShare = false) {
    if (!result) return;
    if (preferShare && navigator.share && typeof File !== "undefined") {
      const file = new File([result.blob], result.fileName, { type: result.blob.type });
      try { if (!navigator.canShare || navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Rudra House photo" }); setMessage("Shared successfully"); return; } } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    downloadBlob(result.blob, result.fileName);
    setMessage("Download started");
  }

  async function downloadAll() {
    setBusy(true);
    setMessage(`Preparing ${photos.length} photos…`);
    try {
      if (photos.length === 1) { await saveCurrent(); return; }
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let index = 0; index < photos.length; index += 1) {
        setMessage(`Preparing photo ${index + 1} of ${photos.length}…`);
        const rendered = await renderWatermarkedPhoto(photos[index], settings);
        zip.file(rendered.fileName, rendered.blob);
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), `rudra-house-photos-${new Date().toISOString().slice(0, 10)}.zip`);
      setMessage("Batch download started");
    } finally { setBusy(false); }
  }

  async function shareAll() {
    if (!navigator.share || typeof File === "undefined") return;
    setBusy(true);
    setMessage(`Preparing ${photos.length} photos to save…`);
    try {
      const rendered = await Promise.all(photos.map((item) => renderWatermarkedPhoto(item, settings)));
      const files = rendered.map((item) => new File([item.blob], item.fileName, { type: item.blob.type }));
      if (navigator.canShare && !navigator.canShare({ files })) {
        setMessage("This browser cannot save multiple photos together. Use Download all instead.");
        return;
      }
      await navigator.share({ files, title: "Rudra House photos" });
      setMessage("Photos shared successfully");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Could not open multi-photo sharing. Use Download all instead.");
    } finally { setBusy(false); }
  }

  return (
    <section className="workflow-step preview-step">
      <header className="step-heading"><p>Step 5 of 5</p><h1>Your photo is ready</h1><span>Processed privately in this browser. Nothing was uploaded.</span></header>
      <div className="final-preview">{result ? <img src={result.dataUrl} alt="Finished watermarked photo" /> : <div className="preview-loader"><LoaderCircle className="spin" /><span>Rendering full quality</span></div>}</div>
      {photos.length > 1 && <div className="photo-strip" aria-label="Photo queue">{photos.map((item, index) => <button key={item.id} className={index === active ? "is-active" : ""} onClick={() => onActive(index)}><img src={item.workingUrl} alt="" /><span>{index + 1}</span></button>)}</div>}
      <p className="ready-status" role="status">{busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}{message}</p>
      <div className="download-actions">
        <button className="primary-action" onClick={() => saveCurrent(false)} disabled={!result || busy}><Download size={19} /> Download photo</button>
        {typeof navigator !== "undefined" && "share" in navigator && <button className="secondary-action" onClick={() => saveCurrent(true)} disabled={!result || busy}><Share2 size={18} /> Share / save</button>}
        {photos.length > 1 && typeof navigator !== "undefined" && "share" in navigator && <button className="secondary-action full" onClick={shareAll} disabled={busy}><Share2 size={18} /> Save all to gallery / share</button>}
        {photos.length > 1 && <button className="secondary-action full" onClick={downloadAll} disabled={busy}><Images size={18} /> Download all {photos.length}</button>}
      </div>
      <div className="export-settings"><label>Format<select value={settings.format} disabled><option value="image/png">PNG</option><option value="image/jpeg">JPG</option></select></label><span>{settings.format === "image/png" ? "Best quality" : `${settings.quality}% quality`}</span></div>
      <div className="step-actions"><button className="secondary-action" onClick={onBack}>Keep editing</button><button className="quiet-action" onClick={onRestart}>Start new</button></div>
    </section>
  );
}
