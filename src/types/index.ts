/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SupportedPlatform =
  | 'TikTok'
  | 'YouTube'
  | 'Instagram'
  | 'Facebook'
  | 'Twitter/X'
  | 'Reddit'
  | 'Pinterest'
  | 'Social Video';

export interface VideoFormatOption {
  id:
    | 'uhd_4k'
    | 'qhd_2k'
    | 'fhd_1080p'
    | 'hd_720p'
    | 'sd_480p'
    | 'no_watermark'
    | 'hd_watermark_free'
    | 'with_watermark'
    | 'audio_mp3'
    | string;
  label: string;
  resolution: string;
  format: 'mp4' | 'mp3' | 'webm';
  mimeType: 'video/mp4' | 'audio/mpeg' | 'video/webm';
  sizeBytes: number | null;
  sizeFormatted: string | null;
  mediaUrl: string;
  isAudioOnly: boolean;
  qualityBadge: string;
  fps?: number;
  codec?: string;
  isUltraHd?: boolean;
}

export interface ResolvedVideoData {
  id: string;
  originalUrl: string;
  canonicalUrl: string;
  title: string;
  author: {
    nickname: string;
    username: string;
    avatarUrl: string;
  };
  thumbnailUrl: string;
  durationSeconds: number;
  durationFormatted: string;
  formats: VideoFormatOption[];
  sourcePlatform: SupportedPlatform;
  providerName: string;
  viewCountFormatted?: string;
  likeCountFormatted?: string;
  commentCountFormatted?: string;
  shareCountFormatted?: string;
  embedVideoUrl?: string;
  music?: {
    title: string;
    author: string;
    audioUrl: string;
  };
}

export interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  creator: string;
  thumbnailUrl: string;
  selectedQuality: string;
  format: 'mp4' | 'mp3' | 'webm';
  downloadUrl: string;
  timestamp: number;
  sizeFormatted?: string | null;
  downloadDurationSec?: number | null;
  sourceUrl: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  defaultQuality: 'hd_watermark_free' | 'no_watermark' | 'audio_mp3';
  historyEnabled: boolean;
  confirmBeforeDownload: boolean;
}

export type TabType = 'single' | 'batch' | 'history' | 'guide' | 'settings';

export type ResolutionStatus = 'idle' | 'validating' | 'resolving' | 'ready' | 'error';

export type DownloadProgressState = 'idle' | 'preparing' | 'downloading' | 'completed' | 'failed' | 'cancelled';
