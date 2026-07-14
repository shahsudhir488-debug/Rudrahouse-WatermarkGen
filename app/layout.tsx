import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rudra House Photo Studio",
  description: "Capture, prepare and watermark Rudra House product photography privately in your browser.",
  applicationName: "Rudra House Photo Studio",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Rudra Studio" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#090a0c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
