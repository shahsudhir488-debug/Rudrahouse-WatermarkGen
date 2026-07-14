import type { Area } from "react-easy-crop";
import type { PhotoAsset, WatermarkSettings } from "@/types/studio";

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this image."));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load this image."));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

function rotatedSize(width: number, height: number, rotation: number) {
  const radians = rotation * Math.PI / 180;
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  };
}

export async function cropImage(src: string, crop: Area, rotation: number): Promise<string> {
  const image = await loadImage(src);
  const bounds = rotatedSize(image.width, image.height, rotation);
  const source = document.createElement("canvas");
  source.width = Math.round(bounds.width);
  source.height = Math.round(bounds.height);
  const sourceContext = source.getContext("2d");
  if (!sourceContext) throw new Error("Image editing is unavailable in this browser.");

  sourceContext.translate(source.width / 2, source.height / 2);
  sourceContext.rotate(rotation * Math.PI / 180);
  sourceContext.translate(-image.width / 2, -image.height / 2);
  sourceContext.drawImage(image, 0, 0);

  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(crop.width));
  output.height = Math.max(1, Math.round(crop.height));
  const context = output.getContext("2d");
  if (!context) throw new Error("Image editing is unavailable in this browser.");
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, output.width, output.height);
  return output.toDataURL("image/jpeg", 0.96);
}

function safeName(name: string, format: WatermarkSettings["format"]) {
  const base = name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "rudra-photo";
  return `${base}-watermarked.${format === "image/png" ? "png" : "jpg"}`;
}

function positionPoint(position: WatermarkSettings["position"], width: number, height: number, boxWidth: number, boxHeight: number) {
  const pad = Math.max(20, width * 0.035);
  const points = {
    "top-left": { x: pad, y: pad },
    "top-right": { x: width - boxWidth - pad, y: pad },
    center: { x: (width - boxWidth) / 2, y: (height - boxHeight) / 2 },
    "bottom-left": { x: pad, y: height - boxHeight - pad },
    "bottom-right": { x: width - boxWidth - pad, y: height - boxHeight - pad },
  };
  return points[position];
}

async function drawMark(
  context: CanvasRenderingContext2D,
  settings: WatermarkSettings,
  logo: HTMLImageElement | null,
  x: number,
  y: number,
  canvasWidth: number,
  alpha = 1,
) {
  const fontSize = Math.max(12, canvasWidth * settings.textSize / 100);
  const lineHeight = fontSize * 1.25;
  const logoWidth = logo && settings.logoEnabled ? canvasWidth * settings.logoSize / 100 : 0;
  const logoHeight = logoWidth && logo ? logo.height / logo.width * logoWidth : 0;
  const text = settings.textEnabled ? settings.text.trim() : "";
  const date = settings.dateEnabled ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()) : "";

  context.save();
  context.globalAlpha = settings.opacity / 100 * alpha;
  context.translate(x, y);
  context.rotate(settings.rotation * Math.PI / 180);
  context.font = `${settings.fontWeight} ${fontSize}px ${settings.fontFamily}`;
  context.textBaseline = "top";
  context.lineJoin = "round";
  context.shadowColor = `rgba(0,0,0,${settings.shadow / 100})`;
  context.shadowBlur = fontSize * settings.shadow / 130;
  let cursorY = 0;
  if (logoWidth && logo) {
    context.drawImage(logo, -logoWidth / 2, cursorY, logoWidth, logoHeight);
    cursorY += logoHeight + fontSize * 0.35;
  }
  [text, date].filter(Boolean).forEach((line) => {
    const measured = context.measureText(line).width;
    context.lineWidth = Math.max(1.5, fontSize * 0.075);
    context.strokeStyle = settings.strokeColor;
    context.fillStyle = settings.textColor;
    context.strokeText(line, -measured / 2, cursorY);
    context.fillText(line, -measured / 2, cursorY);
    cursorY += lineHeight;
  });
  context.restore();
}

export async function renderWatermarkedPhoto(photo: PhotoAsset, settings: WatermarkSettings) {
  const image = await loadImage(photo.workingUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable in this browser.");

  context.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  context.drawImage(image, 0, 0);
  context.filter = "none";

  let logo: HTMLImageElement | null = null;
  if (settings.logoEnabled) {
    try { logo = await loadImage(settings.logoUrl); } catch { logo = null; }
  }

  if (settings.textEnabled || settings.dateEnabled || (settings.logoEnabled && logo)) {
    if (settings.repeated) {
      const columns = Math.max(1, settings.repeatColumns);
      const rows = Math.max(1, settings.repeatRows);
      const stepX = canvas.width / columns * (1 + settings.gapX / 100);
      const stepY = canvas.height / rows * (1 + settings.gapY / 100);
      for (let row = -1; row <= rows; row += 1) {
        for (let column = -1; column <= columns; column += 1) {
          const x = (column + 0.5) * stepX + (row % 2 ? stepX * settings.shiftX / 100 : 0);
          const y = (row + 0.5) * stepY + (column % 2 ? stepY * settings.shiftY / 100 : 0);
          await drawMark(context, settings, logo, x, y, canvas.width);
        }
      }
    } else {
      const fontSize = canvas.width * settings.textSize / 100;
      const boxWidth = Math.max(canvas.width * settings.logoSize / 100, settings.text.length * fontSize * 0.62, 120);
      const boxHeight = canvas.height * 0.16;
      const point = positionPoint(settings.position, canvas.width, canvas.height, boxWidth, boxHeight);
      await drawMark(context, settings, logo, point.x + boxWidth / 2, point.y, canvas.width);
    }
  }

  const quality = settings.format === "image/jpeg" ? settings.quality / 100 : undefined;
  const dataUrl = canvas.toDataURL(settings.format, quality);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not prepare this download.")), settings.format, quality));
  return { dataUrl, blob, fileName: safeName(photo.name, settings.format) };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
