/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedPlatform } from '../types/index.js';

export const ALLOWED_SOCIAL_DOMAINS = [
  // TikTok
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
  'v16-webapp-prime.tiktok.com',
  // YouTube
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  // Instagram
  'instagram.com',
  'www.instagram.com',
  'instagr.am',
  // Facebook
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'fb.watch',
  'fb.com',
  // Twitter / X
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
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
];

export const ALLOWED_TIKTOK_DOMAINS = ALLOWED_SOCIAL_DOMAINS;

export interface ClientValidationResult {
  valid: boolean;
  cleanUrl?: string;
  platform?: SupportedPlatform;
  error?: string;
}

export function detectPlatformFromUrl(rawUrl: string): SupportedPlatform {
  const lower = rawUrl.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('musical.ly')) return 'TikTok';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'Instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'Facebook';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'Twitter/X';
  if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'Reddit';
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) return 'Pinterest';
  return 'Social Video';
}

/**
 * Validates social video URL across all supported networks on the client side
 */
export function validateClientTikTokUrl(rawUrl: string): ClientValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please enter or paste a valid video URL' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Please enter a video URL' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL. Make sure it begins with https://' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only secure HTTPS links are supported' };
  }

  const host = parsed.hostname.toLowerCase();
  const isMatch = ALLOWED_SOCIAL_DOMAINS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );

  if (!isMatch) {
    return {
      valid: false,
      error: `Unsupported domain "${host}". A9 PRO supports TikTok, YouTube, Instagram, Facebook, X/Twitter, Reddit, and Pinterest.`,
    };
  }

  const platform = detectPlatformFromUrl(parsed.href);

  return { valid: true, cleanUrl: parsed.href, platform };
}
