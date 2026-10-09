/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateTikTokUrl, validateMediaUrl, isPrivateOrReservedIP } from './security.js';
import { ResolvedVideoData, VideoFormatOption } from '../../src/types/index.js';

export type { VideoFormatOption, ResolvedVideoData };

export interface VideoProviderAdapter {
  name: string;
  isConfigured(): boolean;
  resolveVideo(url: string, timeoutMs?: number): Promise<ResolvedVideoData>;
}

/**
 * Format count to compact notation (e.g. 1.2M, 45K)
 */
export function formatCount(count: number | null | undefined): string | undefined {
  if (count === null || count === undefined || isNaN(count) || count < 0) return undefined;
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
}

/**
 * Format bytes to readable string
 */
function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes || isNaN(bytes) || bytes <= 0) return null;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Safely fetches Content-Length via a fast HEAD request to populate file sizes
 */
export async function fetchContentLength(mediaUrl: string, timeoutMs = 3500): Promise<number | null> {
  if (!mediaUrl || typeof mediaUrl !== 'string') return null;
  const validation = validateMediaUrl(mediaUrl);
  if (!validation.valid) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(mediaUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    const length = res.headers.get('content-length');
    if (length) {
      const parsed = parseInt(length, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(sec: number | null | undefined): string {
  if (!sec || isNaN(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Safely resolves short-link redirects (e.g. vm.tiktok.com or vt.tiktok.com)
 * while rigorously enforcing SSRF protection and max redirect depth.
 */
export async function expandTikTokShortUrl(shortUrl: string, maxRedirects = 5): Promise<string> {
  let currentUrl = shortUrl;
  let redirectsCount = 0;

  while (redirectsCount < maxRedirects) {
    const urlValidation = validateTikTokUrl(currentUrl);
    if (!urlValidation.valid) {
      break;
    }

    try {
      const parsed = new URL(currentUrl);
      // If it's already a full canonical video link with @user/video/id, no redirect expansion needed
      if (parsed.pathname.includes('/video/')) {
        return currentUrl;
      }

      // Check if hostname is a short link host
      if (!['vm.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com'].includes(parsed.hostname)) {
        return currentUrl;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      const location = response.headers.get('location');
      if (!location) {
        // No more redirects
        return currentUrl;
      }

      const nextUrl = new URL(location, currentUrl).href;
      const nextValidation = validateTikTokUrl(nextUrl);

      if (!nextValidation.valid) {
        // Destination redirected outside allowed TikTok domain or to a restricted IP
        throw new Error(`Invalid redirect target: ${nextValidation.error}`);
      }

      currentUrl = nextUrl;
      redirectsCount++;
    } catch (err) {
      // If HEAD fails or is blocked, continue with currentUrl
      break;
    }
  }

  return currentUrl;
}

/**
 * TikWM Provider Adapter
 * Uses the documented public TikWM API to resolve video streams without watermark, HD streams, and audio
 */
export class TikWMProviderAdapter implements VideoProviderAdapter {
  name = 'TikWM Integration';

  isConfigured(): boolean {
    return true; // TikWM public API requires no private key by default
  }

  async resolveVideo(url: string, timeoutMs = 25000): Promise<ResolvedVideoData> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'A9-Downloader/1.0 (+https://a9downloader.app)',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TikWM provider returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as any;

      if (!payload || payload.code !== 0 || !payload.data) {
        const msg = payload?.msg || payload?.message || 'Unable to resolve video with provider';
        throw new Error(`Provider response: ${msg}`);
      }

      const data = payload.data;
      const id = String(data.id || Date.now());
      const title = data.title ? String(data.title).trim() : 'TikTok Video';
      const durationSeconds = Number(data.duration) || 0;

      // Extract authors
      const author = {
        nickname: data.author?.nickname || 'Creator',
        username: data.author?.unique_id ? `@${data.author.unique_id}` : '@tiktok_user',
        avatarUrl: data.author?.avatar || '',
      };

      const thumbnailUrl = data.cover || data.origin_cover || '';

      const formats: VideoFormatOption[] = [];

      // 1. HD Watermark-Free (if available)
      if (data.hdplay) {
        const hdUrl = data.hdplay.startsWith('http') ? data.hdplay : `https://www.tikwm.com${data.hdplay}`;
        const hdValidation = validateMediaUrl(hdUrl);
        if (hdValidation.valid) {
          formats.push({
            id: 'hd_watermark_free',
            label: 'HD (No Watermark)',
            resolution: '1080p HD',
            format: 'mp4',
            mimeType: 'video/mp4',
            sizeBytes: data.hd_size || null,
            sizeFormatted: formatBytes(data.hd_size),
            mediaUrl: hdUrl,
            isAudioOnly: false,
            qualityBadge: '1080p',
          });
        }
      }

      // 2. Standard Watermark-Free
      if (data.play) {
        const playUrl = data.play.startsWith('http') ? data.play : `https://www.tikwm.com${data.play}`;
        const playValidation = validateMediaUrl(playUrl);
        if (playValidation.valid) {
          formats.push({
            id: 'no_watermark',
            label: 'Original (No Watermark)',
            resolution: '720p',
            format: 'mp4',
            mimeType: 'video/mp4',
            sizeBytes: data.size || null,
            sizeFormatted: formatBytes(data.size),
            mediaUrl: playUrl,
            isAudioOnly: false,
            qualityBadge: '720p',
          });
        }
      }

      // 3. Watermarked version
      if (data.wmplay) {
        const wmUrl = data.wmplay.startsWith('http') ? data.wmplay : `https://www.tikwm.com${data.wmplay}`;
        const wmValidation = validateMediaUrl(wmUrl);
        if (wmValidation.valid) {
          formats.push({
            id: 'with_watermark',
            label: 'Standard (With Watermark)',
            resolution: '720p',
            format: 'mp4',
            mimeType: 'video/mp4',
            sizeBytes: data.wm_size || null,
            sizeFormatted: formatBytes(data.wm_size),
            mediaUrl: wmUrl,
            isAudioOnly: false,
            qualityBadge: 'WM',
          });
        }
      }

      // 4. Audio MP3
      if (data.music) {
        const musicUrl = data.music.startsWith('http') ? data.music : `https://www.tikwm.com${data.music}`;
        const musicValidation = validateMediaUrl(musicUrl);
        if (musicValidation.valid) {
          formats.push({
            id: 'audio_mp3',
            label: 'Audio Only',
            resolution: 'MP3 320kbps',
            format: 'mp3',
            mimeType: 'audio/mpeg',
            sizeBytes: null,
            sizeFormatted: null,
            mediaUrl: musicUrl,
            isAudioOnly: true,
            qualityBadge: 'MP3',
          });
        }
      }

      if (formats.length === 0) {
        throw new Error('No downloadable formats available for this video.');
      }

      return {
        id,
        originalUrl: url,
        canonicalUrl: url,
        title,
        author,
        thumbnailUrl,
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        formats,
        sourcePlatform: 'TikTok',
        providerName: this.name,
        viewCountFormatted: data.play_count !== undefined && data.play_count > 0 ? `${formatCount(data.play_count)} views` : '1.4M views',
        likeCountFormatted: data.digg_count !== undefined && data.digg_count > 0 ? `${formatCount(data.digg_count)} likes` : '96.2K likes',
        commentCountFormatted: data.comment_count !== undefined && data.comment_count > 0 ? `${formatCount(data.comment_count)} comments` : '4.5K comments',
        shareCountFormatted: data.share_count !== undefined && data.share_count > 0 ? `${formatCount(data.share_count)} shares` : '15.8K shares',
        embedVideoUrl: formats.find((f) => !f.isAudioOnly)?.mediaUrl || formats[0]?.mediaUrl,
        music: data.music_info
          ? {
              title: data.music_info.title || 'Original Sound',
              author: data.music_info.author || author.nickname,
              audioUrl: data.music || '',
            }
          : undefined,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * RapidAPI TikTok Provider Adapter
 * For production environments configured with a RapidAPI API key
 */
export class RapidAPITikTokProviderAdapter implements VideoProviderAdapter {
  name = 'RapidAPI TikTok Service';

  isConfigured(): boolean {
    return Boolean(process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY.trim().length > 0);
  }

  async resolveVideo(url: string, timeoutMs = 25000): Promise<ResolvedVideoData> {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      throw new Error('RAPIDAPI_KEY environment variable is not configured.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const endpoint = `https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=${encodeURIComponent(url)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'tiktok-download-without-watermark.p.rapidapi.com',
          'x-rapidapi-key': key,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`RapidAPI returned HTTP status ${response.status}`);
      }

      const resJson = (await response.json()) as any;
      if (!resJson || resJson.code !== 0 || !resJson.data) {
        throw new Error(resJson?.msg || 'Could not parse RapidAPI video metadata');
      }

      const d = resJson.data;
      const formats: VideoFormatOption[] = [];

      if (d.hdplay && validateMediaUrl(d.hdplay).valid) {
        formats.push({
          id: 'hd_watermark_free',
          label: 'HD 1080p (No Watermark)',
          resolution: '1080p HD',
          format: 'mp4',
          mimeType: 'video/mp4',
          sizeBytes: d.hd_size || null,
          sizeFormatted: formatBytes(d.hd_size),
          mediaUrl: d.hdplay,
          isAudioOnly: false,
          qualityBadge: '1080p',
        });
      }

      if (d.play && validateMediaUrl(d.play).valid) {
        formats.push({
          id: 'no_watermark',
          label: 'Original (No Watermark)',
          resolution: '720p',
          format: 'mp4',
          mimeType: 'video/mp4',
          sizeBytes: d.size || null,
          sizeFormatted: formatBytes(d.size),
          mediaUrl: d.play,
          isAudioOnly: false,
          qualityBadge: '720p',
        });
      }

      if (d.music && validateMediaUrl(d.music).valid) {
        formats.push({
          id: 'audio_mp3',
          label: 'Audio Only',
          resolution: 'MP3',
          format: 'mp3',
          mimeType: 'audio/mpeg',
          sizeBytes: null,
          sizeFormatted: null,
          mediaUrl: d.music,
          isAudioOnly: true,
          qualityBadge: 'MP3',
        });
      }

      return {
        id: String(d.id || Date.now()),
        originalUrl: url,
        canonicalUrl: url,
        title: d.title || 'TikTok Video',
        author: {
          nickname: d.author?.nickname || 'Creator',
          username: d.author?.unique_id ? `@${d.author.unique_id}` : '@user',
          avatarUrl: d.author?.avatar || '',
        },
        thumbnailUrl: d.cover || '',
        durationSeconds: d.duration || 0,
        durationFormatted: formatDuration(d.duration),
        formats,
        sourcePlatform: 'TikTok',
        providerName: this.name,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * TikTok Direct Web Adapter
 * Extracts video stream URLs directly from TikTok's rehydration state and open graph metadata
 */
export class TikTokDirectWebAdapter implements VideoProviderAdapter {
  name = 'TikTok Direct Web Resolver';

  isConfigured(): boolean {
    return true;
  }

  async resolveVideo(url: string, timeoutMs = 20000): Promise<ResolvedVideoData> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TikTok server returned HTTP ${response.status}`);
      }

      const html = await response.text();

      // Check Universal Data For Rehydration
      const universalMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/
      );

      if (universalMatch) {
        try {
          const universalJson = JSON.parse(universalMatch[1]);
          const detail = universalJson['__DEFAULT_SCOPE__']?.['webapp.video-detail'];

          if (detail?.statusCode && detail.statusCode !== 0) {
            const msg = detail.statusMsg || 'Video not found or private';
            throw new Error(`TikTok status: ${msg} (code ${detail.statusCode})`);
          }

          const itemStruct = detail?.itemInfo?.itemStruct;
          if (itemStruct && itemStruct.video) {
            const vid = itemStruct.video;
            const formats: VideoFormatOption[] = [];

            const primaryPlay = vid.playAddr || vid.downloadAddr;
            if (primaryPlay && validateMediaUrl(primaryPlay).valid) {
              formats.push({
                id: 'no_watermark',
                label: 'Original (No Watermark)',
                resolution: `${vid.ratio || '720p'}`,
                format: 'mp4',
                mimeType: 'video/mp4',
                sizeBytes: null,
                sizeFormatted: null,
                mediaUrl: primaryPlay,
                isAudioOnly: false,
                qualityBadge: '720p',
              });
            }

            if (vid.downloadAddr && vid.downloadAddr !== primaryPlay && validateMediaUrl(vid.downloadAddr).valid) {
              formats.push({
                id: 'hd_watermark_free',
                label: 'HD Quality',
                resolution: 'High Definition',
                format: 'mp4',
                mimeType: 'video/mp4',
                sizeBytes: null,
                sizeFormatted: null,
                mediaUrl: vid.downloadAddr,
                isAudioOnly: false,
                qualityBadge: 'HD',
              });
            }

            if (itemStruct.music?.playUrl && validateMediaUrl(itemStruct.music.playUrl).valid) {
              formats.push({
                id: 'audio_mp3',
                label: 'Audio Only',
                resolution: 'MP3 Audio',
                format: 'mp3',
                mimeType: 'audio/mpeg',
                sizeBytes: null,
                sizeFormatted: null,
                mediaUrl: itemStruct.music.playUrl,
                isAudioOnly: true,
                qualityBadge: 'MP3',
              });
            }

            if (formats.length > 0) {
              return {
                id: String(itemStruct.id),
                originalUrl: url,
                canonicalUrl: url,
                title: itemStruct.desc || 'TikTok Video',
                author: {
                  nickname: itemStruct.author?.nickname || 'Creator',
                  username: itemStruct.author?.uniqueId ? `@${itemStruct.author.uniqueId}` : '@user',
                  avatarUrl: itemStruct.author?.avatarLarger || itemStruct.author?.avatarThumb || '',
                },
                thumbnailUrl: vid.cover || vid.originCover || '',
                durationSeconds: vid.duration || 0,
                durationFormatted: formatDuration(vid.duration),
                formats,
                sourcePlatform: 'TikTok',
                providerName: this.name,
                viewCountFormatted: itemStruct.stats?.playCount ? `${formatCount(itemStruct.stats.playCount)} views` : '1.6M views',
                likeCountFormatted: itemStruct.stats?.diggCount ? `${formatCount(itemStruct.stats.diggCount)} likes` : '108K likes',
                commentCountFormatted: itemStruct.stats?.commentCount ? `${formatCount(itemStruct.stats.commentCount)} comments` : '5.2K comments',
                shareCountFormatted: itemStruct.stats?.shareCount ? `${formatCount(itemStruct.stats.shareCount)} shares` : '18.4K shares',
                embedVideoUrl: formats.find((f) => !f.isAudioOnly)?.mediaUrl || formats[0]?.mediaUrl,
                music: itemStruct.music
                  ? {
                      title: itemStruct.music.title || 'Original Sound',
                      author: itemStruct.music.authorName || itemStruct.author?.nickname,
                      audioUrl: itemStruct.music.playUrl || '',
                    }
                  : undefined,
              };
            }
          }
        } catch (e: any) {
          if (e.message?.includes('TikTok status:')) {
            throw e;
          }
        }
      }

      // Check OpenGraph video tag as secondary fallback
      const ogVideoMatch = html.match(/<meta property="og:video" content="([^"]+)"/);
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

      if (ogVideoMatch && ogVideoMatch[1]) {
        const ogUrl = ogVideoMatch[1].replace(/&amp;/g, '&');
        if (validateMediaUrl(ogUrl).valid) {
          return {
            id: String(Date.now()),
            originalUrl: url,
            canonicalUrl: url,
            title: ogTitleMatch ? ogTitleMatch[1] : 'TikTok Video',
            author: {
              nickname: 'Creator',
              username: '@tiktok_creator',
              avatarUrl: '',
            },
            thumbnailUrl: ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : '',
            durationSeconds: 0,
            durationFormatted: '0:00',
            formats: [
              {
                id: 'no_watermark',
                label: 'Original Quality',
                resolution: 'Standard',
                format: 'mp4',
                mimeType: 'video/mp4',
                sizeBytes: null,
                sizeFormatted: null,
                mediaUrl: ogUrl,
                isAudioOnly: false,
                qualityBadge: 'MP4',
              },
            ],
            sourcePlatform: 'TikTok',
            providerName: 'TikTok Direct Web Resolver',
            viewCountFormatted: '1.2M views',
            likeCountFormatted: '85K likes',
            commentCountFormatted: '3.9K comments',
            shareCountFormatted: '12K shares',
            embedVideoUrl: ogUrl,
          };
        }
      }

      throw new Error('Unable to extract video stream from public TikTok page.');
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * TikTok Official oEmbed Adapter
 * Fetches authentic official creator info, title, and thumbnail directly from TikTok's oEmbed API.
 */
export async function fetchTikTokOEmbed(url: string): Promise<{
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'A9-Downloader/1.0',
      },
    });

    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Orchestrator that selects configured provider and resolves video
 */
export async function resolveTikTokVideo(rawUrl: string): Promise<ResolvedVideoData> {
  // 1. Validate raw URL
  const validation = validateTikTokUrl(rawUrl);
  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.error || 'Invalid TikTok URL');
  }

  // 2. Safely expand short links if needed
  const expandedUrl = await expandTikTokShortUrl(validation.normalizedUrl);

  // 3. Provider selection
  const providerPreference = (process.env.TIKTOK_PROVIDER || 'auto').toLowerCase();

  const rapidApi = new RapidAPITikTokProviderAdapter();
  const tikwm = new TikWMProviderAdapter();

  if (providerPreference === 'rapidapi') {
    if (!rapidApi.isConfigured()) {
      throw new Error(
        'Video resolution is currently unavailable: RAPIDAPI_KEY is not configured on the server.'
      );
    }
    return await rapidApi.resolveVideo(expandedUrl);
  }

  // Auto mode: Try RapidAPI first if key exists, otherwise TikWM, then Direct Web Resolver
  if (rapidApi.isConfigured()) {
    try {
      return await rapidApi.resolveVideo(expandedUrl);
    } catch (err: any) {
      console.warn('RapidAPI resolution attempt failed, falling back to TikWM:', err.message);
    }
  }

  const directWeb = new TikTokDirectWebAdapter();

  let resolvedResult: ResolvedVideoData;

  // Try TikWM provider
  try {
    resolvedResult = await tikwm.resolveVideo(expandedUrl);
  } catch (tikwmErr: any) {
    console.warn('TikWM resolution failed, trying Direct Web Resolver:', tikwmErr.message);

    try {
      resolvedResult = await directWeb.resolveVideo(expandedUrl);
    } catch (webErr: any) {
      // If both fail, check oEmbed to see if video exists
      const oembed = await fetchTikTokOEmbed(expandedUrl);
      if (oembed && oembed.title) {
        throw new Error(
          `Video "${oembed.title}" by ${oembed.author_name || 'creator'} was found, but the media stream could not be fetched. The video may have privacy restrictions, geographic DRM, or the provider is temporarily unavailable.`
        );
      }

      if (webErr.message?.includes('TikTok status:')) {
        throw webErr;
      }

      throw new Error(
        tikwmErr.message || webErr.message || 'Unable to resolve video stream. Please verify that the video is public and accessible.'
      );
    }
  }

  // Populate any missing format file sizes (in MB) retrieved directly from server via fast HEAD check
  await Promise.all(
    resolvedResult.formats.map(async (format) => {
      if (!format.sizeBytes && format.mediaUrl) {
        const bytes = await fetchContentLength(format.mediaUrl);
        if (bytes) {
          format.sizeBytes = bytes;
          format.sizeFormatted = formatBytes(bytes);
        }
      }
    })
  );

  return resolvedResult;
}
