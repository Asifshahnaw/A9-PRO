/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { URL } from 'url';
import net from 'net';

/**
 * Allowed TikTok domains for resolution
 */
export const ALLOWED_TIKTOK_HOSTS = [
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
  'v16-webapp-prime.tiktok.com',
  't.tiktok.com',
];

/**
 * Multi-Platform Supported Social Media Domains
 */
export const ALLOWED_SOCIAL_HOSTS = [
  // TikTok
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
  'v16-webapp-prime.tiktok.com',
  't.tiktok.com',
  // YouTube
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
  // Instagram
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
  'instagr.am',
  // Facebook
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'fb.watch',
  'fb.com',
  'web.facebook.com',
  // Twitter / X
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  't.co',
  // Reddit
  'reddit.com',
  'www.reddit.com',
  'redd.it',
  'v.redd.it',
  // Pinterest
  'pinterest.com',
  'www.pinterest.com',
  'pin.it',
  // Threads
  'threads.net',
  'www.threads.net',
];

/**
 * Allowed media CDN host patterns for downloading media files across all platforms
 */
export const ALLOWED_MEDIA_HOST_PATTERNS = [
  // TikTok CDNs
  /\.tikwm\.com$/i,
  /^tikwm\.com$/i,
  /\.tiktokcdn\.com$/i,
  /^tiktokcdn\.com$/i,
  /\.tiktokcdn-us\.com$/i,
  /\.tiktokcdn-eu\.com$/i,
  /\.musical\.ly$/i,
  /\.byteoversea\.com$/i,
  /\.ibytedtos\.com$/i,
  /\.tiktok\.com$/i,
  /^tiktok\.com$/i,
  // YouTube CDNs
  /\.googlevideo\.com$/i,
  /\.ytimg\.com$/i,
  /\.youtube\.com$/i,
  /\.ggpht\.com$/i,
  // Instagram & Facebook CDNs
  /\.cdninstagram\.com$/i,
  /\.fbcdn\.net$/i,
  /\.facebook\.com$/i,
  /\.fbsbx\.com$/i,
  /\.instagram\.com$/i,
  // Twitter / X CDNs
  /\.twimg\.com$/i,
  /\.x\.com$/i,
  /\.twitter\.com$/i,
  // Reddit CDNs
  /\.redd\.it$/i,
  /\.reddit\.com$/i,
  /v\.redd\.it$/i,
  /\.redditmedia\.com$/i,
  // Pinterest CDNs
  /\.pinimg\.com$/i,
  /\.pinterest\.com$/i,
  // Major Delivery CDNs
  /\.akamaized\.net$/i,
  /\.akamaihd\.net$/i,
  /\.cloudfront\.net$/i,
  /\.fastly\.net$/i,
  /\.googleapis\.com$/i,
  /\.soundhelix\.com$/i,
  /\.wikimedia\.org$/i,
  /\.w3\.org$/i,
  /^w3\.org$/i,
  /\.mozilla\.net$/i,
  /\.plyr\.io$/i,
];

/**
 * Checks if an IP string is a private, loopback, link-local, or cloud-metadata IP.
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  if (!ip) return true;

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    const [a, b] = parts;
    // 0.0.0.0/8 (current network)
    if (a === 0) return true;
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (private)
    if (a === 10) return true;
    // 172.16.0.0/12 (private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (link-local, cloud metadata)
    if (a === 169 && b === 254) return true;
    // 224.0.0.0/4 (multicast)
    if (a >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // ::1 loopback
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // Unique local fe80:: / fc00::
    if (lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) return true;
    // IPv4-mapped IPv6
    if (lower.startsWith('::ffff:')) {
      const v4Part = ip.substring(7);
      return isPrivateOrReservedIP(v4Part);
    }
  }

  return false;
}

export type SupportedPlatformName =
  | 'TikTok'
  | 'YouTube'
  | 'Instagram'
  | 'Facebook'
  | 'Twitter/X'
  | 'Reddit'
  | 'Pinterest'
  | 'Social Video';

export function detectSocialPlatform(urlOrHost: string): SupportedPlatformName {
  const lower = urlOrHost.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('musical.ly')) return 'TikTok';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'Instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'Facebook';
  if (lower.includes('twitter.com') || lower.includes('x.com') || lower.includes('t.co')) return 'Twitter/X';
  if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'Reddit';
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) return 'Pinterest';
  return 'Social Video';
}

/**
 * Validates a user-supplied social media URL across all supported networks
 */
export function validateSocialMediaUrl(inputUrl: string): {
  valid: boolean;
  normalizedUrl?: string;
  platform?: SupportedPlatformName;
  error?: string;
} {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = inputUrl.trim();
  if (trimmed.length > 2000) {
    return { valid: false, error: 'URL exceeds maximum length of 2000 characters' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Malformed URL format' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only secure HTTPS URLs are supported' };
  }

  const hostname = parsed.hostname.toLowerCase();

  const isAllowedHost = ALLOWED_SOCIAL_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowedHost) {
    return {
      valid: false,
      error: `Unsupported domain "${hostname}". Please provide a valid link from TikTok, YouTube, Instagram, Facebook, Twitter/X, Reddit, or Pinterest.`,
    };
  }

  if (/^(javascript|data|file):/i.test(trimmed)) {
    return { valid: false, error: 'Dangerous protocol detected' };
  }

  const platform = detectSocialPlatform(hostname);

  return { valid: true, normalizedUrl: parsed.href, platform };
}

/**
 * Validates a user-supplied TikTok URL:
 * - Must be valid HTTPS URL
 * - Must belong strictly to the allowed TikTok domains
 */
export function validateTikTokUrl(inputUrl: string): { valid: boolean; normalizedUrl?: string; error?: string } {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = inputUrl.trim();
  if (trimmed.length > 2000) {
    return { valid: false, error: 'URL exceeds maximum length of 2000 characters' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Malformed URL format' };
  }

  // Must be HTTPS protocol
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only secure HTTPS URLs are supported' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check against allowed TikTok hosts
  const isAllowedHost = ALLOWED_TIKTOK_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowedHost) {
    return {
      valid: false,
      error: `Unsupported domain "${hostname}". Please provide a valid TikTok link (tiktok.com or vm.tiktok.com).`,
    };
  }

  // Check for suspicious characters in path/query (no javascript: or data: URIs)
  if (/^(javascript|data|file):/i.test(trimmed)) {
    return { valid: false, error: 'Dangerous protocol detected' };
  }

  return { valid: true, normalizedUrl: parsed.href };
}

/**
 * Validates whether a media URL is safe to download/stream from backend proxy
 */
export function validateMediaUrl(mediaUrl: string): { valid: boolean; error?: string } {
  if (!mediaUrl || typeof mediaUrl !== 'string') {
    return { valid: false, error: 'Media URL is missing' };
  }

  let parsed: URL;
  try {
    parsed = new URL(mediaUrl);
  } catch {
    return { valid: false, error: 'Invalid media URL format' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS media streams are permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Prevent SSRF against loopback, metadata, or private IP hostnames
  if (
    hostname === 'localhost' ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    return { valid: false, error: 'Target host is restricted' };
  }

  if (isPrivateOrReservedIP(hostname)) {
    return { valid: false, error: 'Restricted network destination' };
  }

  // Check against verified media CDN patterns
  const isAllowedMediaHost = ALLOWED_MEDIA_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  if (!isAllowedMediaHost) {
    return {
      valid: false,
      error: `Media host "${hostname}" is not an authorized content delivery network`,
    };
  }

  return { valid: true };
}

/**
 * Safely sanitizes a filename for Content-Disposition header
 */
export function sanitizeFilename(filename: string, fallback = 'a9_tiktok_video.mp4'): string {
  if (!filename || typeof filename !== 'string') return fallback;

  // Extract basename to discard directory paths
  const base = filename.replace(/\\/g, '/').split('/').pop() || '';

  // Remove traversal sequences and unsafe characters
  let cleaned = base
    .replace(/\.\./g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^[\s._]+/, '')
    .replace(/_{2,}/g, '_')
    .trim();

  if (cleaned.length === 0 || cleaned === '.' || cleaned === '..') {
    return fallback;
  }

  // Truncate length
  if (cleaned.length > 80) {
    const ext = cleaned.includes('.') ? cleaned.substring(cleaned.lastIndexOf('.')) : '';
    cleaned = cleaned.substring(0, 80 - ext.length) + ext;
  }

  return cleaned;
}
