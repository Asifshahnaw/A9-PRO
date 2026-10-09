/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResolvedVideoData } from '../types/index.js';
import { Layers, ArrowRight, Loader2, AlertCircle, CheckCircle, Download, Film } from 'lucide-react';
import { validateClientTikTokUrl } from '../utils/validation.js';

interface BatchResultItem {
  index: number;
  url: string;
  success: boolean;
  data?: ResolvedVideoData;
  error?: string;
}

export const BatchDownloader: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BatchResultItem[]>([]);
  const [overallError, setOverallError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setOverallError('Please enter at least one TikTok video URL.');
      return;
    }

    if (lines.length > 5) {
      setOverallError('Batch entry is limited to a maximum of 5 URLs at a time.');
      return;
    }

    setOverallError(null);
    setIsLoading(true);
    setResults([]);

    try {
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: lines }),
      });

      const contentType = response.headers.get('content-type') || '';
      let json: any = null;

      if (contentType.includes('application/json')) {
        json = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.includes('<!doctype') ? 'Server is warming up. Please try again.' : text);
      }

      if (!response.ok) {
        throw new Error(json.error || `Batch request failed with status ${response.status}`);
      }

      setResults(json.results || []);
    } catch (err: any) {
      setOverallError(err.message || 'Failed to process batch request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSingle = (data: ResolvedVideoData, qualityId?: string) => {
    const format = data.formats.find((f) => f.id === qualityId) || data.formats[0];
    if (!format) return;

    const downloadEndpoint = `/api/download?url=${encodeURIComponent(
      format.mediaUrl
    )}&title=${encodeURIComponent(data.title)}&format=${format.format}&id=${encodeURIComponent(
      data.id
    )}&quality=${encodeURIComponent(format.qualityBadge)}`;

    const link = document.createElement('a');
    link.href = downloadEndpoint;
    link.download = `a9pro_${data.id}_${format.qualityBadge}.${format.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-[#293244] bg-[#151B26] p-5 sm:p-7 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-5 w-5 text-[#4F8CFF]" />
          <h2 className="text-lg font-bold text-[#F7F9FC]">Batch Video Downloader</h2>
        </div>
        <p className="text-xs text-[#A4ADBD] mb-4">
          Enter up to 5 TikTok video URLs (one per line) to resolve and download them in a single batch.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={`https://www.tiktok.com/@user/video/123456789\nhttps://vm.tiktok.com/ZM8vN5yUq/\nhttps://www.tiktok.com/@creator/video/987654321`}
            className="w-full rounded-xl border border-[#293244] bg-[#0D121B] p-3 text-xs sm:text-sm font-mono text-[#F7F9FC] placeholder:text-[#A4ADBD]/50 focus:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/20 transition-all resize-y"
          />

          {overallError && (
            <div className="flex items-center gap-2 rounded-xl border border-[#F87171]/30 bg-[#F87171]/10 p-3 text-xs text-[#F87171]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{overallError}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A4ADBD]">
              {inputText.split('\n').filter((s) => s.trim().length > 0).length} / 5 URLs queued
            </span>

            <button
              type="submit"
              disabled={isLoading || inputText.trim().length === 0}
              className="min-h-[44px] px-6 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#8257FF] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-[#4F8CFF]/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <span>Resolve Batch Links</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Batch Results List */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#F7F9FC] px-1">
            Batch Results ({results.filter((r) => r.success).length}/{results.length} resolved)
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {results.map((item, idx) => {
              if (item.success && item.data) {
                const vid = item.data;
                const bestFormat =
                  vid.formats.find((f) => f.id === 'hd_watermark_free') ||
                  vid.formats.find((f) => f.id === 'no_watermark') ||
                  vid.formats[0];

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#293244] bg-[#151B26]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-16 w-12 rounded-lg bg-[#090B10] border border-[#293244] overflow-hidden shrink-0">
                        {vid.thumbnailUrl ? (
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#A4ADBD]">
                            <Film className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-[#31C48D] font-semibold mb-0.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Ready for Download</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#F7F9FC] truncate max-w-sm sm:max-w-md">
                          {vid.title}
                        </h4>
                        <div className="text-xs text-[#A4ADBD]">
                          {vid.author.nickname} · {vid.durationFormatted}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleDownloadSingle(vid, bestFormat.id)}
                        className="min-h-[40px] px-4 rounded-xl bg-[#4F8CFF] hover:bg-[#3D7AEA] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download ({bestFormat.qualityBadge})</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-xl border border-[#F87171]/20 bg-[#151B26]/60 text-xs"
                >
                  <AlertCircle className="h-4 w-4 text-[#F87171] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] text-[#A4ADBD] block truncate">{item.url}</span>
                    <span className="text-[#F87171] font-medium">{item.error || 'Resolution failed'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
