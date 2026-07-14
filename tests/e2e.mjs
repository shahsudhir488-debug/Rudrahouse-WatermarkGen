import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const port = 3011;
const baseUrl = `http://127.0.0.1:${port}`;
const chromePaths = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = chromePaths.find((path) => existsSync(path));
if (!executablePath) throw new Error("Set CHROME_PATH to a Chromium-based browser before running the E2E test.");

const server = spawn("npm", ["run", "start", "--", "-p", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) return; } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(`Next.js did not start.\n${serverOutput}`);
}

const browser = await chromium.launch({ executablePath, headless: true });
let cameraBrowser;
const errors = [];

try {
  await waitForServer();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await mobile.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Choose a photo from gallery" }).waitFor();
  const galleryInput = page.locator('.camera-screen input[type="file"]');
  if (await galleryInput.getAttribute("capture") !== null) throw new Error("Gallery input must not force camera capture.");
  await page.screenshot({ path: "/tmp/rudra-mobile-camera.png", fullPage: true });

  await galleryInput.setInputFiles(resolve("public/rudra-house-logo.png"));
  await page.getByRole("heading", { name: "Frame the product" }).waitFor();
  await page.getByRole("button", { name: "Use this crop" }).click();
  await page.getByRole("heading", { name: "Add the details" }).waitFor();
  await page.getByRole("button", { name: "Adjust look" }).click();
  await page.getByRole("heading", { name: "Finish the image" }).waitFor();
  await page.getByRole("button", { name: "Review photo" }).click();
  await page.getByRole("heading", { name: "Your photo is ready" }).waitFor();
  await page.getByText("Ready to save").waitFor({ timeout: 15000 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download photo" }).click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith("-watermarked.png")) throw new Error("Unexpected export file name.");
  await page.screenshot({ path: "/tmp/rudra-mobile-preview.png", fullPage: true });
  await mobile.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const desktopPage = await desktop.newPage();
  desktopPage.on("pageerror", (error) => errors.push(error.message));
  await desktopPage.goto(baseUrl, { waitUntil: "networkidle" });
  await desktopPage.getByText("Drop product photos here").waitFor();
  await desktopPage.getByRole("button", { name: "Choose photos" }).waitFor();
  await desktopPage.screenshot({ path: "/tmp/rudra-desktop-start.png", fullPage: true });
  await desktopPage.locator('.desktop-upload input[type="file"]').setInputFiles(resolve("public/rudra-house-logo.png"));
  await desktopPage.getByRole("heading", { name: "Frame the product" }).waitFor();
  await desktop.close();

  cameraBrowser = await chromium.launch({ executablePath, headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const cameraContext = await cameraBrowser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await cameraContext.grantPermissions(["camera"], { origin: baseUrl });
  const cameraPage = await cameraContext.newPage();
  cameraPage.on("pageerror", (error) => errors.push(error.message));
  await cameraPage.goto(baseUrl, { waitUntil: "networkidle" });
  const shutter = cameraPage.getByRole("button", { name: "Take photo" });
  await shutter.waitFor();
  await shutter.click({ timeout: 15000 });
  await cameraPage.getByRole("heading", { name: "Frame the product" }).waitFor();
  await cameraContext.close();
  await cameraBrowser.close();
  cameraBrowser = undefined;

  if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
  console.log("E2E passed: mobile live-camera shutter → crop; mobile gallery → crop → details → enhance → preview → PNG download; desktop upload → crop.");
  console.log("Screenshots: /tmp/rudra-mobile-camera.png, /tmp/rudra-mobile-preview.png, /tmp/rudra-desktop-start.png");
} finally {
  if (cameraBrowser) await cameraBrowser.close();
  await browser.close();
  server.kill("SIGTERM");
}
