"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LockKeyhole, Trash2, UploadCloud } from "lucide-react";
import { CameraScreen } from "./CameraScreen";
import { CropStep } from "./CropStep";
import { DetailsStep } from "./DetailsStep";
import { EnhanceStep } from "./EnhanceStep";
import { PreviewStep } from "./PreviewStep";
import { StepBar } from "./StepBar";
import { readImageFile } from "@/lib/image";
import { defaultSettings, type PhotoAsset, type StudioStep, type WatermarkSettings } from "@/types/studio";

function makePhoto(dataUrl: string, name: string): PhotoAsset {
  return { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, name, originalUrl: dataUrl, workingUrl: dataUrl };
}

export function WatermarkStudio() {
  const [step, setStep] = useState<StudioStep>("capture");
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [active, setActive] = useState(0);
  const [settings, setSettings] = useState<WatermarkSettings>(defaultSettings);
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const desktopInput = useRef<HTMLInputElement>(null);
  const photo = photos[active];

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!files.length) { setNotice("Choose a PNG, JPG, WEBP, HEIC, or another image file."); return; }
    const oversized = files.find((file) => file.size > 40 * 1024 * 1024);
    if (oversized) { setNotice(`${oversized.name} is larger than 40 MB. Choose a smaller image.`); return; }
    try {
      setNotice(`Loading ${files.length === 1 ? files[0].name : `${files.length} photos`}…`);
      const added = await Promise.all(files.map(async (file) => makePhoto(await readImageFile(file), file.name)));
      const nextIndex = photos.length;
      setPhotos((current) => [...current, ...added]);
      setActive(nextIndex);
      setStep("crop");
      setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "These photos could not be opened."); }
  }

  function addCapture(dataUrl: string) {
    const nextIndex = photos.length;
    setPhotos((current) => [...current, makePhoto(dataUrl, `camera-photo-${Date.now()}.jpg`)]);
    setActive(nextIndex);
    setStep("crop");
  }

  function applyCrop(workingUrl: string) {
    setPhotos((current) => current.map((item, index) => index === active ? { ...item, workingUrl } : item));
    setStep("details");
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (photos.length <= 1) { setActive(0); setStep("capture"); }
    else setActive(Math.max(0, Math.min(active, photos.length - 2)));
  }

  function restart() {
    setPhotos([]);
    setActive(0);
    setStep("capture");
    setNotice("");
  }

  function renderPage() {
    if (step === "capture" || !photo) return (
      <div className="capture-layout">
        <div className="desktop-upload" onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); }}>
          <div className={`drop-zone ${dragging ? "is-dragging" : ""}`}>
            <span className="upload-emblem"><UploadCloud size={31} /></span>
            <p>Drop product photos here</p><span>or choose one image or a full batch</span>
            <button onClick={() => desktopInput.current?.click()}><ImagePlus size={18} /> Choose photos</button>
            <input ref={desktopInput} className="visually-hidden" type="file" accept="image/*" multiple onChange={(event) => event.target.files && void addFiles(event.target.files)} />
          </div>
          <div className="desktop-note"><LockKeyhole size={18} /><span><b>Your photos stay private.</b> Cropping, watermarking, and export happen only in this browser.</span></div>
        </div>
        <CameraScreen mobile={Boolean(mobile)} onCapture={addCapture} onFiles={(files) => void addFiles(files)} />
      </div>
    );
    if (step === "crop") return <CropStep image={photo.workingUrl} onBack={() => setStep("capture")} onDone={applyCrop} />;
    if (step === "details") return <DetailsStep image={photo.workingUrl} settings={settings} onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))} onBack={() => setStep("crop")} onDone={() => setStep("enhance")} />;
    if (step === "enhance") return <EnhanceStep photo={photo} settings={settings} onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))} onBack={() => setStep("details")} onDone={() => setStep("preview")} />;
    return <PreviewStep photos={photos} active={active} settings={settings} onActive={setActive} onBack={() => setStep("enhance")} onRestart={restart} />;
  }

  if (mobile === null) return <div className="app-loading" aria-label="Loading Rudra House Photo Studio" />;

  return (
    <main className={`studio-app ${step === "capture" ? "at-camera" : ""}`}>
      <header className="desktop-header">
        <img src="/rudra-house-logo.png" alt="Rudra House Nepal" />
        <div><span>Product photography tools</span><strong>Photo Studio</strong></div>
        <p><LockKeyhole size={16} /> Local processing only</p>
      </header>
      <div className="desktop-intro"><div><span>Rudra House image desk</span><h1>From product to protected photo.</h1></div><p>Capture or upload. Crop, finish, watermark, and export without sending product photos to a server.</p></div>

      {photos.length > 0 && step !== "capture" && <div className="queue-bar"><div><b>{photos.length} photo{photos.length > 1 ? "s" : ""}</b><span>{photos[active]?.name}</span></div><div className="queue-thumbs">{photos.map((item, index) => <button key={item.id} className={index === active ? "is-active" : ""} onClick={() => { setActive(index); setStep("crop"); }} aria-label={`Edit ${item.name}`}><img src={item.workingUrl} alt="" /></button>)}</div><button className="remove-current" onClick={() => removePhoto(active)} aria-label="Remove current photo"><Trash2 size={17} /></button></div>}

      <div className="studio-body">{renderPage()}</div>
      {step !== "capture" && <StepBar current={step} enabled={photos.length > 0} onSelect={setStep} />}
      {notice && <div className="toast" role="alert">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    </main>
  );
}
