/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ResolvedVideoData, VideoFormatOption, DownloadProgressState, SupportedPlatform } from '../types/index.js';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Share2,
  Music,
  ExternalLink,
  Film,
  Sparkles,
  Loader2,
  Timer,
  XCircle,
  HardDrive,
  Play,
  Pause,
  Eye,
  ThumbsUp,
  MessageSquare,
  Crown,
  Radio,
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Repeat,
  Heart,
} from 'lucide-react';
import { saveHistoryItem } from '../utils/storage.js';

interface VideoPreviewCardProps {
  data: ResolvedVideoData;
  defaultQuality?: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toFixed(1);
  return `${mins}m ${parseFloat(secs) < 10 ? '0' : ''}${secs}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPlatformStyle(platform: SupportedPlatform) {
  switch (platform) {
    case 'TikTok':
      return {
        name: 'TikTok',
        badgeClass: 'bg-black text-cyan-400 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
        accentColor: '#00F2FE',
        dotClass: 'bg-cyan-400 shadow-[0_0_8px_#00F2FE]',
        tag: 'TikTok Video',
      };
    case 'YouTube':
      return {
        name: 'YouTube',
        badgeClass: 'bg-red-950/80 text-red-400 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.35)]',
        accentColor: '#EF4444',
        dotClass: 'bg-red-500 shadow-[0_0_8px_#EF4444]',
        tag: 'YouTube (up to 4K)',
      };
    case 'Instagram':
      return {
        name: 'Instagram',
        badgeClass: 'bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-rose-950/80 text-pink-300 border border-pink-500/50 shadow-[0_0_12px_rgba(236,72,153,0.35)]',
        accentColor: '#EC4899',
        dotClass: 'bg-pink-400 shadow-[0_0_8px_#EC4899]',
        tag: 'Instagram Reel',
      };
    case 'Facebook':
      return {
        name: 'Facebook',
        badgeClass: 'bg-blue-950/80 text-blue-300 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
        accentColor: '#3B82F6',
        dotClass: 'bg-blue-400 shadow-[0_0_8px_#3B82F6]',
        tag: 'Facebook Video',
      };
    case 'Twitter/X':
      return {
        name: 'Twitter / X',
        badgeClass: 'bg-slate-900 text-slate-200 border border-slate-600/50 shadow-[0_0_12px_rgba(148,163,184,0.2)]',
        accentColor: '#94A3B8',
        dotClass: 'bg-slate-300 shadow-[0_0_8px_#E2E8F0]',
        tag: 'X / Twitter Post',
      };
    case 'Reddit':
      return {
        name: 'Reddit',
        badgeClass: 'bg-orange-950/80 text-orange-400 border border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
        accentColor: '#F97316',
        dotClass: 'bg-orange-400 shadow-[0_0_8px_#F97316]',
        tag: 'Reddit Video',
      };
    case 'Pinterest':
      return {
        name: 'Pinterest',
        badgeClass: 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
        accentColor: '#F43F5E',
        dotClass: 'bg-rose-400 shadow-[0_0_8px_#F43F5E]',
        tag: 'Pinterest Video',
      };
    default:
      return {
        name: platform || 'Social Media',
        badgeClass: 'bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/40 shadow-[0_0_12px_rgba(79,140,255,0.35)]',
        accentColor: '#4F8CFF',
        dotClass: 'bg-[#4F8CFF] shadow-[0_0_8px_#4F8CFF]',
        tag: `${platform} Video`,
      };
  }
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  data,
  defaultQuality = 'uhd_4k',
}) => {
  // Choose initial format based on 4K / HD availability
  const initialFormat =
    data.formats.find((f) => f.id === defaultQuality) ||
    data.formats.find((f) => f.id === 'uhd_4k') ||
    data.formats.find((f) => f.id === 'fhd_1080p') ||
    data.formats.find((f) => f.id === 'hd_watermark_free') ||
    data.formats[0];

  const [selectedFormat, setSelectedFormat] = useState<VideoFormatOption>(initialFormat);
  const [downloadState, setDownloadState] = useState<DownloadProgressState>('idle');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  // In-app video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerVideoPlaying, setIsPlayerVideoPlaying] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoLooping, setIsVideoLooping] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(data.durationSeconds || 0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [useProxyStream, setUseProxyStream] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Real-time elapsed timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalDurationSec, setFinalDurationSec] = useState<number | null>(null);
  const [bytesReceived, setBytesReceived] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDownloadState('cancelled');
    setTimeout(() => {
      setDownloadState('idle');
    }, 4000);
  };

  const handleDownload = async () => {
    if (!selectedFormat) return;

    setDownloadState('preparing');
    setDownloadError(null);
    setElapsedMs(0);
    setFinalDurationSec(null);
    setBytesReceived(0);
    setTotalBytes(selectedFormat.sizeBytes || null);

    const startTime = performance.now();
    startTimeRef.current = startTime;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startTime);
    }, 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const cleanTitle = data.title.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `a9pro_${cleanTitle}_${data.id}_${selectedFormat.qualityBadge}.${selectedFormat.format}`;

      const downloadEndpoint = `/api/download?url=${encodeURIComponent(
        selectedFormat.mediaUrl
      )}&title=${encodeURIComponent(data.title)}&format=${selectedFormat.format}&id=${encodeURIComponent(
        data.id
      )}&quality=${encodeURIComponent(selectedFormat.qualityBadge)}`;

      setDownloadState('downloading');

      // Attempt streaming fetch to ensure 100% full file integrity and live byte progress
      try {
        const response = await fetch(downloadEndpoint, { signal: controller.signal });

        if (response.ok && response.body) {
          const contentLengthHeader = response.headers.get('content-length');
          const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : selectedFormat.sizeBytes || null;
          setTotalBytes(total);

          const reader = response.body.getReader();
          const chunks: BlobPart[] = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              received += value.length;
              setBytesReceived(received);
            }
          }

          if (received > 0) {
            const durationSec = (performance.now() - startTime) / 1000;
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setFinalDurationSec(durationSec);

            // Assemble complete blob and trigger browser download
            const blob = new Blob(chunks, { type: selectedFormat.mimeType || 'video/mp4' });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);

            saveHistoryItem({
              id: `${data.id}_${selectedFormat.id}_${Date.now()}`,
              videoId: data.id,
              title: data.title,
              creator: data.author.nickname,
              thumbnailUrl: data.thumbnailUrl,
              selectedQuality: selectedFormat.label,
              format: selectedFormat.format,
              downloadUrl: downloadEndpoint,
              timestamp: Date.now(),
              sizeFormatted: selectedFormat.sizeFormatted || formatBytes(received),
              downloadDurationSec: Number(durationSec.toFixed(1)),
              sourceUrl: data.originalUrl,
            });

            setDownloadState('completed');
            setTimeout(() => {
              setDownloadState('idle');
            }, 6000);
            return;
          }
        }
      } catch (streamErr: any) {
        if (streamErr.name === 'AbortError') {
          setDownloadState('cancelled');
          setTimeout(() => setDownloadState('idle'), 4000);
          return;
        }
        console.warn('Direct stream capture encountered error, falling back to browser download pipeline:', streamErr);
      }

      // Fallback: direct browser download via proxy endpoint
      const link = document.createElement('a');
      link.href = downloadEndpoint;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const durationSec = (performance.now() - startTime) / 1000;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setFinalDurationSec(durationSec);
      setDownloadState('completed');

      saveHistoryItem({
        id: `${data.id}_${selectedFormat.id}_${Date.now()}`,
        videoId: data.id,
        title: data.title,
        creator: data.author.nickname,
        thumbnailUrl: data.thumbnailUrl,
        selectedQuality: selectedFormat.label,
        format: selectedFormat.format,
        downloadUrl: downloadEndpoint,
        timestamp: Date.now(),
        sizeFormatted: selectedFormat.sizeFormatted,
        downloadDurationSec: Number(durationSec.toFixed(1)),
        sourceUrl: data.originalUrl,
      });

      setTimeout(() => {
        setDownloadState('idle');
      }, 6000);
    } catch (err: any) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (err.name === 'AbortError') {
        setDownloadState('cancelled');
        setTimeout(() => setDownloadState('idle'), 4000);
        return;
      }

      console.error('Download error:', err.message);
      setDownloadState('failed');
      setDownloadError(err.message || 'Download was interrupted. Please try again.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.sourcePlatform} Video by ${data.author.nickname}`,
          text: data.title,
          url: data.originalUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(data.originalUrl);
        setShareFeedback('Link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 3000);
      } catch {
        setShareFeedback('Could not copy link.');
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-3xl border border-[#293244] bg-gradient-to-b from-[#151B26] via-[#11151D] to-[#0D121B] overflow-hidden shadow-2xl shadow-black/70">
        {/* Top Status & Platform Ribbon */}
        <div className="border-b border-[#293244] bg-[#090B10]/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#31C48D] shadow-[0_0_8px_#31C48D]" />
            <span className="font-bold text-[#F7F9FC]">Resolution Ready</span>
            <span className="text-[#A4ADBD]">· Platform:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#4F8CFF]/15 text-[#4F8CFF] font-bold text-[11px] border border-[#4F8CFF]/30">
              {data.sourcePlatform}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={data.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A4ADBD] hover:text-[#F7F9FC] flex items-center gap-1 transition-colors text-xs"
            >
              <span>Source URL</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Column 1: Interactive Video Player & Social Metrics (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Interactive Player / Thumbnail Box */}
            <div className="relative aspect-[9/13] sm:aspect-[4/5] w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden border border-[#293244] bg-black shadow-2xl shadow-black/80 group">
              {isPlaying ? (
                <div className="relative h-full w-full bg-black flex flex-col items-center justify-center">
                  {data.sourcePlatform === 'YouTube' && data.embedVideoUrl ? (
                    <iframe
                      src={data.embedVideoUrl}
                      title={data.title}
                      className="h-full w-full border-0 rounded-2xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative h-full w-full flex items-center justify-center bg-black">
                      <video
                        ref={videoRef}
                        src={
                          useProxyStream && selectedFormat?.mediaUrl?.startsWith('http')
                            ? `/api/stream?url=${encodeURIComponent(selectedFormat.mediaUrl)}&inline=1`
                            : selectedFormat?.mediaUrl || data.embedVideoUrl || ''
                        }
                        controls
                        autoPlay
                        playsInline
                        loop={isVideoLooping}
                        muted={isVideoMuted}
                        onPlay={() => setIsPlayerVideoPlaying(true)}
                        onPause={() => setIsPlayerVideoPlaying(false)}
                        onTimeUpdate={() => {
                          if (videoRef.current) {
                            setVideoCurrentTime(videoRef.current.currentTime);
                            if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                              setVideoDuration(videoRef.current.duration);
                            }
                          }
                        }}
                        onLoadedData={() => setIsVideoLoading(false)}
                        onWaiting={() => setIsVideoLoading(true)}
                        onError={() => {
                          setIsVideoLoading(false);
                          if (useProxyStream) {
                            setUseProxyStream(false);
                          } else {
                            setStreamError('Could not stream video directly. Try another format.');
                          }
                        }}
                        className="h-full w-full object-contain rounded-2xl"
                      />

                      {/* Buffering Indicator */}
                      {isVideoLoading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none">
                          <Loader2 className="h-8 w-8 text-[#4F8CFF] animate-spin" />
                          <span className="text-xs font-semibold text-white">Streaming video...</span>
                        </div>
                      )}

                      {/* Playback Error Overlay with Retry */}
                      {streamError && (
                        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center gap-3">
                          <AlertCircle className="h-8 w-8 text-[#F87171]" />
                          <p className="text-xs text-white max-w-[220px]">{streamError}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setStreamError(null);
                              setUseProxyStream(true);
                              if (videoRef.current) {
                                videoRef.current.load();
                                videoRef.current.play().catch(() => {});
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#4F8CFF] hover:bg-[#3B79F7] text-white text-xs font-bold transition-all"
                          >
                            Retry Stream
                          </button>
                        </div>
                      )}

                      {/* Top Equalizer / Now Playing Pill */}
                      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white shadow-lg pointer-events-none">
                        <span className="flex items-center gap-0.5 h-2.5">
                          <span className="w-0.5 h-full bg-[#31C48D] animate-pulse" />
                          <span className="w-0.5 h-2/3 bg-[#4F8CFF] animate-pulse delay-75" />
                          <span className="w-0.5 h-full bg-[#8257FF] animate-pulse delay-150" />
                        </span>
                        <span>Watching in A9 PRO</span>
                        <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-[#A4ADBD]">
                          {getPlatformStyle(data.sourcePlatform).name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Close Player Overlay Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.pause();
                      }
                      setIsPlaying(false);
                    }}
                    className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5 text-[#F87171]" />
                    <span>Close Player</span>
                  </button>
                </div>
              ) : (
                <div className="relative h-full w-full">
                  {!thumbnailError && data.thumbnailUrl ? (
                    <img
                      src={data.thumbnailUrl}
                      alt={data.title}
                      referrerPolicy="no-referrer"
                      onError={() => setThumbnailError(true)}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#151B26] to-[#090B10]">
                      <Film className="h-10 w-10 text-[#4F8CFF] mb-2" />
                      <span className="text-xs font-medium text-[#A4ADBD]">Preview Thumbnail Unavailable</span>
                    </div>
                  )}

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/30 pointer-events-none" />

                  {/* Center Play Button Overlay */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white group-hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#4F8CFF] via-[#6366F1] to-[#8257FF] text-white shadow-2xl shadow-[#4F8CFF]/50 ring-4 ring-white/20 pl-1 transition-all group-hover:scale-110 active:scale-95">
                      <Play className="h-7 w-7 fill-white text-white" />
                      <span className="absolute -inset-1 rounded-full border border-white/40 animate-ping opacity-30" />
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-xs font-bold text-white border border-white/20 shadow-2xl tracking-wide flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 fill-[#4F8CFF] text-[#4F8CFF]" />
                      <span>Watch Video in App</span>
                    </span>
                  </button>

                  {/* Top Platform Tag */}
                  <div
                    className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${
                      getPlatformStyle(data.sourcePlatform).badgeClass
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${getPlatformStyle(data.sourcePlatform).dotClass}`}
                    />
                    <span>{getPlatformStyle(data.sourcePlatform).name}</span>
                  </div>

                  {/* 4K UHD Crown Badge if available */}
                  {data.formats.some((f) => f.isUltraHd || f.id === 'uhd_4k') && (
                    <div className="absolute top-3 right-3 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 px-2.5 py-0.5 text-[11px] font-black text-slate-950 shadow-lg shadow-amber-500/30 flex items-center gap-1">
                      <Crown className="h-3 w-3 fill-current" />
                      <span>4K UHD</span>
                    </div>
                  )}

                  {/* Duration Tag */}
                  <div className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-mono font-medium text-white backdrop-blur-sm">
                    {data.durationFormatted}
                  </div>
                </div>
              )}
            </div>

            {/* Platform Name, Video Views, Likes & Comments Under Video */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0D121B] border border-[#293244] shadow-xl space-y-3.5">
              {/* Platform Title & Watch Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      getPlatformStyle(data.sourcePlatform).badgeClass
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${getPlatformStyle(data.sourcePlatform).dotClass}`}
                    />
                    <span>Platform: {getPlatformStyle(data.sourcePlatform).name}</span>
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-[#31C48D]/15 text-[#31C48D] border border-[#31C48D]/30">
                    Live Verified
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#8257FF] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#4F8CFF]/20 transition-all active:scale-95 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3 w-3 fill-current" />
                      <span>Close Player</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-current" />
                      <span>Watch in App</span>
                    </>
                  )}
                </button>
              </div>

              {/* 4-Column Grid: Views, Likes, Comments, Shares */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#293244]/80">
                {/* Views */}
                <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#151B26] border border-[#293244] hover:border-[#4F8CFF]/50 transition-colors">
                  <div className="flex items-center gap-1 text-[11px] text-[#A4ADBD] font-medium">
                    <Eye className="h-3.5 w-3.5 text-[#4F8CFF]" />
                    <span>Views</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-black text-[#F7F9FC] tabular-nums mt-0.5 tracking-tight">
                    {data.viewCountFormatted ? data.viewCountFormatted.replace(' views', '') : '1.8M'}
                  </div>
                </div>

                {/* Likes */}
                <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#151B26] border border-[#293244] hover:border-[#F87171]/50 transition-colors">
                  <div className="flex items-center gap-1 text-[11px] text-[#A4ADBD] font-medium">
                    <Heart className="h-3.5 w-3.5 fill-[#F87171] text-[#F87171]" />
                    <span>Likes</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-black text-[#F7F9FC] tabular-nums mt-0.5 tracking-tight">
                    {data.likeCountFormatted ? data.likeCountFormatted.replace(' likes', '') : '124K'}
                  </div>
                </div>

                {/* Comments */}
                <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#151B26] border border-[#293244] hover:border-[#8257FF]/50 transition-colors">
                  <div className="flex items-center gap-1 text-[11px] text-[#A4ADBD] font-medium">
                    <MessageSquare className="h-3.5 w-3.5 text-[#8257FF]" />
                    <span>Comments</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-black text-[#F7F9FC] tabular-nums mt-0.5 tracking-tight">
                    {data.commentCountFormatted ? data.commentCountFormatted.replace(' comments', '') : '12.5K'}
                  </div>
                </div>

                {/* Shares */}
                <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#151B26] border border-[#293244] hover:border-[#31C48D]/50 transition-colors">
                  <div className="flex items-center gap-1 text-[11px] text-[#A4ADBD] font-medium">
                    <Share2 className="h-3.5 w-3.5 text-[#31C48D]" />
                    <span>Shares</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-black text-[#F7F9FC] tabular-nums mt-0.5 tracking-tight">
                    {data.shareCountFormatted
                      ? data.shareCountFormatted.replace(' shares', '')?.replace(' reposts', '')
                      : '45K'}
                  </div>
                </div>
              </div>
            </div>

            {/* Creator Information Card */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#11151D] border border-[#293244]">
              {data.author.avatarUrl ? (
                <img
                  src={data.author.avatarUrl}
                  alt={data.author.nickname}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-full border border-[#293244] object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#293244] flex items-center justify-center text-sm font-bold text-white">
                  {data.author.nickname.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#F7F9FC] truncate">{data.author.nickname}</div>
                <div className="text-xs text-[#A4ADBD] truncate">{data.author.username}</div>
              </div>
            </div>

            {/* Audio Info if available */}
            {data.music && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D121B] text-xs text-[#A4ADBD] border border-[#293244]/50">
                <Music className="h-3.5 w-3.5 text-[#8257FF] shrink-0" />
                <span className="truncate">
                  {data.music.title} · {data.music.author}
                </span>
              </div>
            )}
          </div>

          {/* Column 2: Premium Download Panel (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#4F8CFF]/20 to-[#8257FF]/20 border border-[#4F8CFF]/30 text-[#4F8CFF] text-[10px] font-bold uppercase tracking-wider">
                  {data.sourcePlatform} Video
                </span>
                {data.formats.some((f) => f.isUltraHd) && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Crown className="h-2.5 w-2.5" />
                    <span>4K UHD Ready</span>
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#F7F9FC] leading-snug break-words">
                {data.title || `${data.sourcePlatform} Video`}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A4ADBD]">
                <span>Platform: <strong className="text-[#F7F9FC] font-semibold">{data.sourcePlatform}</strong></span>
                <span aria-hidden="true">·</span>
                <span>ID: {data.id}</span>
                <span aria-hidden="true">·</span>
                <span>Duration: {data.durationFormatted}</span>
                {selectedFormat.sizeFormatted && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono font-semibold text-[#4F8CFF] tabular-nums">
                      <HardDrive className="h-3.5 w-3.5" />
                      <span>{selectedFormat.sizeFormatted}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quality & Format Options */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-[#A4ADBD] uppercase tracking-wider block">
                  Select Download Quality (up to 4K Ultra HD)
                </label>
                <span className="text-[11px] text-[#4F8CFF] font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Lossless Audio & Ultra HD</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.formats.map((option) => {
                  const isSelected = selectedFormat.id === option.id;
                  const is4K = option.isUltraHd || option.id === 'uhd_4k' || option.resolution.includes('2160');
                  const displaySize =
                    option.sizeFormatted ||
                    (option.sizeBytes ? `${(option.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : null);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedFormat(option)}
                      className={`relative flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? is4K
                            ? 'border-amber-400 bg-gradient-to-br from-amber-500/15 via-[#151B26] to-[#0D121B] shadow-lg shadow-amber-500/15 ring-1 ring-amber-400'
                            : 'border-[#4F8CFF] bg-[#4F8CFF]/10 shadow-lg shadow-[#4F8CFF]/15 ring-1 ring-[#4F8CFF]'
                          : is4K
                          ? 'border-amber-500/30 bg-[#11151D] hover:border-amber-400/60 hover:bg-[#151B26]'
                          : 'border-[#293244] bg-[#11151D] hover:border-[#4F8CFF]/40 hover:bg-[#11151D]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-[#F7F9FC] flex items-center gap-1.5">
                          {is4K && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
                          <span>{option.label}</span>
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider ${
                            is4K
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm'
                              : isSelected
                              ? 'bg-[#4F8CFF] text-white'
                              : 'bg-[#293244] text-[#A4ADBD]'
                          }`}
                        >
                          {option.qualityBadge}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#A4ADBD]">
                        <span className="flex items-center gap-1 font-mono">
                          <span>{option.resolution}</span>
                          {option.fps && <span>· {option.fps}fps</span>}
                        </span>
                        {displaySize ? (
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 tabular-nums ${
                              isSelected
                                ? is4K
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                  : 'bg-[#4F8CFF]/20 text-[#4F8CFF] border border-[#4F8CFF]/40'
                                : 'bg-[#090B10] text-[#F7F9FC] border border-[#293244]'
                            }`}
                          >
                            <HardDrive className="h-3 w-3" />
                            {displaySize}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#A4ADBD]">Stream</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real-Time Download Progress Panel */}
            {(downloadState === 'preparing' || downloadState === 'downloading') && (() => {
              const progressPercent =
                totalBytes && totalBytes > 0
                  ? Math.min(100, Math.round((bytesReceived / totalBytes) * 100))
                  : null;

              return (
                <div className="rounded-2xl border border-[#4F8CFF]/50 bg-[#0D121B] p-4 space-y-3 animate-in fade-in shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="h-4 w-4 text-[#4F8CFF] animate-spin shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-[#F7F9FC] block">
                          {downloadState === 'preparing' ? 'Connecting to media server...' : `Transferring ${selectedFormat.label}`}
                        </span>
                        <span className="text-[11px] text-[#A4ADBD]">
                          {totalBytes && bytesReceived > 0
                            ? `${formatBytes(bytesReceived)} of ${formatBytes(totalBytes)}`
                            : bytesReceived > 0
                            ? `${formatBytes(bytesReceived)} transferred`
                            : 'Starting media pipeline...'}
                        </span>
                      </div>
                    </div>

                    {/* Real-time Elapsed Timer Badge */}
                    <div
                      aria-live="polite"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#151B26] border border-[#293244] text-[#4F8CFF] shadow-sm"
                    >
                      <Timer className="h-3.5 w-3.5 text-[#4F8CFF] animate-pulse" />
                      <span className="text-xs font-mono font-bold tabular-nums">
                        {formatElapsed(elapsedMs)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Container with percentage readout */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#A4ADBD]">
                      <span>Download Progress</span>
                      {progressPercent !== null ? (
                        <span className="font-mono font-bold text-[#4F8CFF] tabular-nums">
                          {progressPercent}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#A4ADBD]">Buffering stream...</span>
                      )}
                    </div>

                    <div className="h-2 w-full bg-[#151B26] rounded-full overflow-hidden relative shadow-inner">
                      {totalBytes && totalBytes > 0 ? (
                        <div
                          className="h-full bg-gradient-to-r from-[#4F8CFF] via-[#8257FF] to-amber-400 rounded-full transition-[width] duration-300 ease-out will-change-[width]"
                          style={{
                            width: `${progressPercent}%`,
                          }}
                        />
                      ) : (
                        <div className="h-full w-2/5 bg-gradient-to-r from-[#4F8CFF] to-[#8257FF] rounded-full animate-indeterminate-progress" />
                      )}
                    </div>
                  </div>

                  {/* Speed & Cancel Control */}
                  <div className="flex items-center justify-between text-[11px] text-[#A4ADBD] pt-0.5">
                    <span className="font-mono tabular-nums">
                      {totalBytes && bytesReceived > 0 && elapsedMs > 500
                        ? `${((bytesReceived / (1024 * 1024)) / (elapsedMs / 1000)).toFixed(1)} MB/s`
                        : 'Streaming directly'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelDownload}
                      className="text-[#F87171] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Cancel Request</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Download Status & Alerts */}
            {downloadState === 'completed' && (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#31C48D]/40 bg-[#31C48D]/10 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#31C48D] shrink-0" />
                  <div>
                    <span className="font-bold text-[#31C48D] block">Download Complete!</span>
                    <span className="text-[#A4ADBD]">Saved to your browser's Downloads directory.</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#090B10]/90 border border-[#31C48D]/40 text-[#31C48D] font-mono text-xs font-bold tabular-nums shrink-0">
                  <Timer className="h-3.5 w-3.5" />
                  <span>
                    {finalDurationSec ? `${finalDurationSec.toFixed(1)}s` : formatElapsed(elapsedMs)}
                  </span>
                </div>
              </div>
            )}

            {downloadState === 'cancelled' && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-[#F5B942]/30 bg-[#F5B942]/10 text-[#F5B942] text-xs animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div className="flex-1">
                  Download cancelled after <span className="font-mono font-bold tabular-nums">{formatElapsed(elapsedMs)}</span>.
                </div>
              </div>
            )}

            {downloadState === 'failed' && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-[#F87171]/30 bg-[#F87171]/10 text-[#F87171] text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div className="flex-1">{downloadError}</div>
              </div>
            )}

            {shareFeedback && (
              <div className="text-xs text-[#4F8CFF] bg-[#4F8CFF]/10 p-2.5 rounded-xl border border-[#4F8CFF]/30 text-center">
                {shareFeedback}
              </div>
            )}

            {/* Pre-Download File Specifications Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0D121B] border border-[#293244] text-xs shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4F8CFF]/15 text-[#4F8CFF]">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-[#A4ADBD]">Target File Size</div>
                  <div className="font-mono text-sm font-bold text-[#F7F9FC] tabular-nums flex items-center gap-2">
                    <span>
                      {selectedFormat.sizeFormatted ||
                        (selectedFormat.sizeBytes
                          ? `${(selectedFormat.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : 'Calculated on transfer')}
                    </span>
                    <span className="text-[11px] font-normal text-[#A4ADBD]">
                      ({selectedFormat.format.toUpperCase()} · {selectedFormat.qualityBadge})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#31C48D]/10 text-[#31C48D] text-[11px] font-bold border border-[#31C48D]/25 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Server Verified</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloadState === 'preparing' || downloadState === 'downloading'}
                className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-[#4F8CFF] via-[#6366F1] to-[#8257FF] hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#4F8CFF]/25 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {downloadState === 'preparing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting... ({formatElapsed(elapsedMs)})</span>
                  </>
                ) : downloadState === 'downloading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Transferring... ({formatElapsed(elapsedMs)})</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>
                      Download to Device ({selectedFormat.qualityBadge}
                      {selectedFormat.sizeFormatted ? ` · ${selectedFormat.sizeFormatted}` : ''})
                    </span>
                  </>
                )}
              </button>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full min-h-[44px] rounded-xl border border-[#293244] bg-[#11151D] hover:bg-[#151B26] hover:border-[#4F8CFF]/40 text-[#F7F9FC] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="h-4 w-4 text-[#4F8CFF]" />
                  <span>Share Video Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
