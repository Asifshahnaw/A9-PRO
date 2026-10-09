# A9 Downloader

> A high-performance, mobile-first TikTok video downloader and media resolution web application built with Node.js, Express, React, and Vite.

A9 Downloader enables users to resolve genuine TikTok video streams without watermarks, choose available resolutions (including 1080p HD and extracted audio), and stream video files directly to their devices with specific optimization for Android Chrome and Gallery indexing.

---

## Architecture & Security Highlights

- **Server-Side URL & SSRF Validation**: Validates all incoming TikTok URLs strictly against authorized domains (`tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`, etc.).
- **Private IP & Internal Host Shield**: Blocks loopback (`127.0.0.1`), private RFC1918 ranges, and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`) during short-link expansion and media streaming.
- **CDN Domain Allowlisting**: Upstream media proxy strictly checks target hosts against verified video CDNs before streaming.
- **Direct Stream Piping**: Streams media chunks directly from upstream to the client without loading large multi-megabyte videos into server RAM.
- **Safe Filename Sanitization**: Strips path traversal sequences, control characters, and dangerous characters.
- **Rate Limiting**: Sliding-window rate limiter per client IP to prevent abuse.
- **PWA Ready**: Offline fallback banner, install prompts, standalone display mode, and mobile touch ergonomics.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **bun**: Package manager

---

## 2. Installation

Clone or open the repository, then install project dependencies:

```bash
npm install
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` (or configure in your hosting platform's secrets manager):

```bash
cp .env.example .env
```

Configuration parameters:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for the Express server |
| `TIKTOK_PROVIDER` | `auto` | Provider mode: `auto`, `tikwm`, or `rapidapi` |
| `RAPIDAPI_KEY` | *(empty)* | Optional RapidAPI key if using RapidAPI TikTok endpoints |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Sliding window duration in milliseconds (1 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Max requests per IP per window |
| `MAX_DOWNLOAD_SIZE_BYTES` | `104857600` | Maximum allowed media file size (100MB) |
| `DOWNLOAD_TIMEOUT_MS` | `30000` | Maximum media fetch timeout (30s) |

---

## 4. Video Provider Setup

A9 Downloader supports two documented resolver pipelines:

1. **Direct Public Integration (TikWM)**:
   - Out-of-the-box mode requiring no external API keys.
   - Automatically extracts watermark-free 720p, 1080p HD (when available), and audio MP3.
2. **RapidAPI Provider Adapter**:
   - Set `RAPIDAPI_KEY="your_api_key"` in `.env`.
   - Set `TIKTOK_PROVIDER="rapidapi"`.
3. **TikTok Official oEmbed**:
   - Used for fallback verification of public author metadata and titles.

---

## 5. Running the Development Server

To launch the unified full-stack server (Express backend + Vite development middleware):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Running Automated Tests

Run the backend security, SSRF protection, URL validation, and filename sanitization test suite:

```bash
npm test
```

---

## 7. Production Build & Deployment

### Build Frontend Assets:
```bash
npm run build
```

### Run Production Server:
```bash
npm start
```

### Deploying to HTTPS Hosts (Cloud Run, Render, VPS):
1. Ensure your host exposes HTTPS (e.g. automatic TLS via Cloud Run or Let's Encrypt).
2. Set environment variable `NODE_ENV=production`.
3. Set `PORT` to the port assigned by your host (or `3000`).
4. Ensure outbound HTTPS internet requests are permitted so the server can communicate with video CDNs.

---

## 8. Android & Mobile Usage Guide

1. Open A9 Downloader in **Android Chrome** or **Samsung Internet**.
2. Paste a TikTok video URL and click **Download Video**.
3. Select your desired quality (1080p HD, Original 720p, or Audio MP3).
4. Tap **Download to Device**.
5. The video file will download to your device's `Downloads` directory.
6. Open **Google Photos** (Library → Photos on device → Download) or **Samsung Gallery** (Albums → Download) to access your video.
7. To pin to your camera roll, use the device's Files app to move the video from `Download` to `DCIM/Camera`.

---

## 9. Troubleshooting Common Issues

- **Video resolution unavailable**: Ensure the TikTok video is set to Public by the author. Private, deleted, or regional copyright-restricted videos cannot be resolved.
- **Short links taking longer**: Short links (`vm.tiktok.com`) require a safe redirect lookup before resolution.
- **Rate limit reached**: If you exceed 30 requests per minute, wait 60 seconds for your rate window to reset.

---

## 10. Legal & Ethicalarchiving Disclaimer

A9 Downloader is designed for users archiving their own created content or publicly authorized media for personal offline use. It does not bypass digital rights management (DRM) or private account boundaries. A9 Downloader is not affiliated with TikTok or ByteDance.
