# Rudra House Photo Studio

A production Next.js image workflow for capturing, cropping, enhancing, watermarking, previewing, and exporting Rudra House product photos. Image processing stays in the browser; the app does not upload source photos.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Camera access works on localhost. A deployed build must use HTTPS for browser camera access.

## Production

```bash
npm run build
npm run start
```

## Verification

```bash
npm run typecheck
npm run lint
npm run test:e2e
```

The E2E test uses an installed Chromium-based browser (or `CHROME_PATH`) and checks the live-camera shutter path, the complete mobile gallery-to-download workflow, and the desktop upload path.

## Privacy and credentials

All photo and watermark rendering uses the browser Canvas API. There are no client-side API keys. If server integrations are added later, keep secrets in `.env.local` without a `NEXT_PUBLIC_` prefix and access them only from server components or route handlers.
