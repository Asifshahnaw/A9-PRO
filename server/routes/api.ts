/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import {
  validateTikTokUrl,
  validateSocialMediaUrl,
  validateMediaUrl,
  sanitizeFilename,
} from '../services/security.js';
import { resolveTikTokVideo, ResolvedVideoData } from '../services/tiktokResolver.js';
import { resolveMultiPlatformVideo } from '../services/multiPlatformResolver.js';
import { rateLimiter } from '../services/rateLimiter.js';
import { Readable } from 'stream';

const router = Router();

// Apply sliding-window rate limiting to API routes
router.use(rateLimiter());

/**
 * GET /api/status
 * Returns system health, provider information, and configuration flags
 */
router.get('/status', (req: Request, res: Response) => {
  const rapidConfigured = Boolean(process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY.trim().length > 0);
  const activeProvider = rapidConfigured ? 'RapidAPI TikTok' : 'TikWM Direct Integration';

  res.json({
    status: 'online',
    appName: 'A9 PRO',
    version: '1.0.0',
    activeProvider,
    features: {
      singleResolution: true,
      batchResolution: true,
      streamingDownload: true,
      androidOptimized: true,
      pwaReady: true,
    },
    limits: {
      maxBatchUrls: 5,
      maxDownloadSizeBytes: parseInt(process.env.MAX_DOWNLOAD_SIZE_BYTES || '524288000', 10), // 500MB
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    },
  });
});

/**
 * POST /api/resolve
 * Resolves video URL across all supported social media platforms (TikTok, YouTube up to 4K, Instagram, Facebook, X, etc.)
 */
router.post('/resolve', async (req: Request, res: Response) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: 'Please enter a video URL.',
      code: 'MISSING_URL',
    });
  }

  // 1. Validate URL against social media allowlist
  const validation = validateSocialMediaUrl(url);
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error || 'Invalid video URL.',
      code: 'INVALID_URL',
    });
  }

  try {
    // 2. Resolve video via multi-platform 4K pipeline
    const resolvedData = await resolveMultiPlatformVideo(validation.normalizedUrl!);

    return res.json({
      success: true,
      data: resolvedData,
    });
  } catch (err: any) {
    console.error('Error resolving video:', err.message);

    const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
    const isRateLimit = err.message?.includes('rate') || err.message?.includes('429');
    const isPrivate = err.message?.includes('private') || err.message?.includes('restricted');

    // Note: Do NOT return 502, 503, 504, or 403 because upstream reverse proxies (e.g. Nginx/Cloud Run)
    // intercept those status codes with warmup.html or forbidden.html instead of forwarding the JSON payload.
    // Standard 422 (Unprocessable Entity) or 400 (Bad Request) ensures the client receives structured JSON.
    let statusCode = 422;
    let code = 'RESOLUTION_FAILED';

    if (isTimeout) {
      statusCode = 408; // Request Timeout
      code = 'TIMEOUT';
    } else if (isRateLimit) {
      statusCode = 429;
      code = 'PROVIDER_RATE_LIMIT';
    } else if (isPrivate) {
      statusCode = 422;
      code = 'CONTENT_RESTRICTED';
    }

    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Unable to resolve video at this time. Please check the URL and try again.',
      code,
    });
  }
});

/**
 * POST /api/batch
 * Resolves up to 5 URLs in batch mode
 */
router.post('/batch', async (req: Request, res: Response) => {
  const { urls } = req.body || {};

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      error: 'Urls array is required.',
      code: 'INVALID_BATCH_PAYLOAD',
    });
  }

  const maxBatch = 5;
  if (urls.length > maxBatch) {
    return res.status(400).json({
      error: `Batch processing is limited to ${maxBatch} URLs per request to ensure service stability.`,
      code: 'BATCH_SIZE_EXCEEDED',
    });
  }

  const results = await Promise.all(
    urls.map(async (rawUrl: string, index: number) => {
      const trimmed = String(rawUrl || '').trim();
      if (!trimmed) {
        return {
          index,
          url: '',
          success: false,
          error: 'Empty URL',
        };
      }

      const validation = validateSocialMediaUrl(trimmed);
      if (!validation.valid) {
        return {
          index,
          url: trimmed,
          success: false,
          error: validation.error || 'Invalid URL',
        };
      }

      try {
        const resolved = await resolveMultiPlatformVideo(validation.normalizedUrl!);
        return {
          index,
          url: trimmed,
          success: true,
          data: resolved,
        };
      } catch (err: any) {
        return {
          index,
          url: trimmed,
          success: false,
          error: err.message || 'Resolution failed',
        };
      }
    })
  );

  return res.json({
    success: true,
    total: urls.length,
    results,
  });
});

/**
 * GET /api/download and GET /api/stream
 * Streaming media proxy with strict SSRF protection and safe headers
 */
router.get(['/download', '/stream'], async (req: Request, res: Response) => {
  const mediaUrl = req.query.url as string;
  const rawTitle = (req.query.title as string) || 'video';
  const format = (req.query.format as string) === 'mp3' ? 'mp3' : 'mp4';
  const videoId = (req.query.id as string) || String(Date.now());
  const quality = (req.query.quality as string) || 'hd';

  if (!mediaUrl) {
    return res.status(400).send('Media URL is required');
  }

  // 1. SSRF and Domain allowlist validation
  const validation = validateMediaUrl(mediaUrl);
  if (!validation.valid) {
    return res.status(403).send(`Forbidden: ${validation.error}`);
  }

  const controller = new AbortController();
  const timeoutMs = parseInt(process.env.DOWNLOAD_TIMEOUT_MS || '40000', 10);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // If the client disconnects or cancels download, abort upstream
  req.on('close', () => {
    controller.abort();
    clearTimeout(timeout);
  });

  try {
    let parsedHost = '';
    try {
      parsedHost = new URL(mediaUrl).hostname.toLowerCase();
    } catch {
      // ignore
    }

    const fetchHeaders: Record<string, string> = {
      Accept: '*/*',
    };

    if (!parsedHost.includes('w3.org')) {
      fetchHeaders['User-Agent'] =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    }

    // Forward authentic Referer header based on media domain to avoid CDN stream truncation
    try {
      if (parsedHost.includes('tiktok') || parsedHost.includes('byteoversea') || parsedHost.includes('ibytedtos')) {
        fetchHeaders['Referer'] = 'https://www.tiktok.com/';
      } else if (parsedHost.includes('tikwm')) {
        fetchHeaders['Referer'] = 'https://www.tikwm.com/';
      } else if (parsedHost.includes('instagram') || parsedHost.includes('cdninstagram')) {
        fetchHeaders['Referer'] = 'https://www.instagram.com/';
      } else if (parsedHost.includes('facebook') || parsedHost.includes('fbcdn')) {
        fetchHeaders['Referer'] = 'https://www.facebook.com/';
      } else if (parsedHost.includes('youtube') || parsedHost.includes('googlevideo')) {
        fetchHeaders['Referer'] = 'https://www.youtube.com/';
      }
    } catch {
      // ignore
    }

    // Only forward Range header if it exists and is not empty
    if (req.headers.range && typeof req.headers.range === 'string' && req.headers.range.trim().length > 0) {
      fetchHeaders['Range'] = req.headers.range.trim();
    }

    let upstreamRes = await fetch(mediaUrl, {
      method: 'GET',
      headers: fetchHeaders,
      signal: controller.signal,
    });

    // If upstream returns 403 or 416, retry with clean fallback headers without restrictive User-Agent
    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      try {
        const cleanRes = await fetch(mediaUrl, {
          method: 'GET',
          headers: { Accept: '*/*' },
          signal: controller.signal,
        });
        if (cleanRes.ok || cleanRes.status === 206) {
          upstreamRes = cleanRes;
        }
      } catch {
        // use original upstreamRes
      }
    }

    clearTimeout(timeout);

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return res.status(upstreamRes.status).send(`Upstream media server returned error: ${upstreamRes.status}`);
    }

    // Ensure upstream didn't send an HTML error/warmup page instead of binary media
    const upstreamContentType = (upstreamRes.headers.get('content-type') || '').toLowerCase();
    if (upstreamContentType.includes('text/html')) {
      return res.status(422).send('Upstream server returned webpage instead of video stream.');
    }

    // Prepare safe filename
    const cleanTitle = rawTitle.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = sanitizeFilename(
      `a9_${cleanTitle}_${videoId}_${quality}.${format}`,
      `a9_tiktok_${videoId}.${format}`
    );

    const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
    const contentLength = upstreamRes.headers.get('content-length');

    // Check maximum file size (up to 500MB for 4K UHD video streams)
    const maxSizeBytes = parseInt(process.env.MAX_DOWNLOAD_SIZE_BYTES || '524288000', 10);
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      return res.status(413).send('Media file exceeds maximum allowed download size (500MB).');
    }

    // Set standard download headers for all modern browsers and mobile devices
    res.setHeader('Content-Type', contentType);
    const isInline = req.query.inline === 'true' || req.query.inline === '1' || req.path === '/stream';
    if (isInline) {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const contentEncoding = upstreamRes.headers.get('content-encoding');
    if (contentLength && !contentEncoding) {
      res.setHeader('Content-Length', contentLength);
    }

    if (upstreamRes.status === 206) {
      res.status(206);
      const contentRange = upstreamRes.headers.get('content-range');
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }
    }

    // Stream the media directly to client using Node.js stream pipeline
    if (upstreamRes.body) {
      const nodeStream = Readable.fromWeb(upstreamRes.body as any);
      nodeStream.pipe(res);

      nodeStream.on('error', (err) => {
        console.error('Error during media stream piping:', err.message);
        if (!res.headersSent) {
          res.status(500).send('Stream transfer error');
        }
      });
    } else {
      res.status(500).send('No readable body received from media server.');
    }
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      // Client closed or timeout
      return;
    }
    console.error('Download proxy failure:', err.message);
    if (!res.headersSent) {
      res.status(502).send(`Download failed: ${err.message}`);
    }
  }
});

export default router;
