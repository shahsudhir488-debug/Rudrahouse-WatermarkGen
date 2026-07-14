export type StudioStep = "capture" | "crop" | "details" | "enhance" | "preview";

export type PhotoAsset = {
  id: string;
  name: string;
  originalUrl: string;
  workingUrl: string;
};

export type WatermarkSettings = {
  textEnabled: boolean;
  text: string;
  dateEnabled: boolean;
  logoEnabled: boolean;
  logoUrl: string;
  logoName: string;
  fontFamily: string;
  fontWeight: number;
  textColor: string;
  strokeColor: string;
  shadow: number;
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
  repeated: boolean;
  repeatColumns: number;
  repeatRows: number;
  gapX: number;
  gapY: number;
  shiftX: number;
  shiftY: number;
  opacity: number;
  textSize: number;
  logoSize: number;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  format: "image/png" | "image/jpeg";
  quality: number;
};

export const defaultSettings: WatermarkSettings = {
  textEnabled: true,
  text: "©rudrahouse.com",
  dateEnabled: false,
  logoEnabled: false,
  logoUrl: "/rudra-house-logo.png",
  logoName: "Rudra House logo",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontWeight: 800,
  textColor: "#ffffff",
  strokeColor: "#000000",
  shadow: 0,
  position: "bottom-right",
  repeated: true,
  repeatColumns: 6,
  repeatRows: 4,
  gapX: 13.5,
  gapY: 22.5,
  shiftX: 45,
  shiftY: 5,
  opacity: 14,
  textSize: 2.3,
  logoSize: 13,
  rotation: -24,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  format: "image/png",
  quality: 92,
};
