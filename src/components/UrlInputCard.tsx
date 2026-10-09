/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link2, Clipboard, X, ArrowRight, Loader2, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { validateClientTikTokUrl } from '../utils/validation.js';

interface UrlInputCardProps {
  onResolve: (url: string) => Promise<void>;
  isLoading: boolean;
  statusMessage: string;
  errorMessage: string | null;
  onClearError: () => void;
}

const SAMPLE_PLATFORM_URLS = [
  { platform: 'TikTok', label: 'TikTok', url: 'https://www.tiktok.com/@zachking/video/6768504823336815877' },
  { platform: 'YouTube', label: 'YouTube 4K', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { platform: 'Instagram', label: 'Instagram Reel', url: 'https://www.instagram.com/reel/C3p8a_uL8F1/' },
  { platform: 'Facebook', label: 'Facebook HD', url: 'https://www.facebook.com/watch/?v=10153231379946729' },
];

export const UrlInputCard: React.FC<UrlInputCardProps> = ({
  onResolve,
  isLoading,
  statusMessage,
  errorMessage,
  onClearError,
}) => {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);
  const [detectedClipboardUrl, setDetectedClipboardUrl] = useState<string | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<string>('Video');

  const lastDetectedRef = useRef<string | null>(null);
  const dismissedUrlRef = useRef<string | null>(null);

  // Automatically check clipboard for valid TikTok links when window gains focus or tab becomes visible
  const checkClipboardForTikTok = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return;

    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'clipboard-read' as any });
          if (status.state === 'denied') return;
        } catch {
          // Permissions query not supported for clipboard-read in this browser; proceed
        }
      }

      const text = await navigator.clipboard.readText();
      if (!text || typeof text !== 'string') return;
      const trimmed = text.trim();

      if (
        trimmed === url.trim() ||
        trimmed === lastDetectedRef.current ||
        trimmed === dismissedUrlRef.current
      ) {
        return;
      }

      const validation = validateClientTikTokUrl(trimmed);
      if (validation.valid && validation.cleanUrl) {
        lastDetectedRef.current = validation.cleanUrl;
        setDetectedClipboardUrl(validation.cleanUrl);
        setDetectedPlatform(validation.platform || 'Video');
      }
    } catch {
      // Clipboard read blocked by browser permissions policy; fail silently
    }
  };

  useEffect(() => {
    // Initial check on mount
    checkClipboardForTikTok();

    const handleFocus = () => {
      checkClipboardForTikTok();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkClipboardForTikTok();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [url]);

  const handlePasteAndResolve = async () => {
    if (!detectedClipboardUrl || isLoading) return;
    const targetUrl = detectedClipboardUrl;
    setUrl(targetUrl);
    setDetectedClipboardUrl(null);
    setValidationError(null);
    onClearError();
    await onResolve(targetUrl);
  };

  const handlePasteOnly = () => {
    if (!detectedClipboardUrl) return;
    setUrl(detectedClipboardUrl);
    setDetectedClipboardUrl(null);
    setValidationError(null);
    onClearError();
  };

  const handleDismissDetected = () => {
    dismissedUrlRef.current = detectedClipboardUrl;
    setDetectedClipboardUrl(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (validationError) setValidationError(null);
    if (errorMessage) onClearError();
  };

  const handleClear = () => {
    setUrl('');
    setValidationError(null);
    onClearError();
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setClipboardNotice('Clipboard access is restricted by your browser. Please paste manually.');
        setTimeout(() => setClipboardNotice(null), 4000);
        return;
      }

      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        setUrl(text.trim());
        setValidationError(null);
        onClearError();
      } else {
        setClipboardNotice('Clipboard is empty.');
        setTimeout(() => setClipboardNotice(null), 3000);
      }
    } catch (err) {
      setClipboardNotice('Clipboard permission was denied. Please paste with long-press or Ctrl+V.');
      setTimeout(() => setClipboardNotice(null), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError('Please enter a TikTok video link.');
      return;
    }

    const valResult = validateClientTikTokUrl(trimmed);
    if (!valResult.valid) {
      setValidationError(valResult.error || 'Please enter a valid TikTok link.');
      return;
    }

    setValidationError(null);
    await onResolve(valResult.cleanUrl!);
  };

  const handleUseSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setValidationError(null);
    onClearError();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl border border-[#293244] bg-[#151B26] p-5 sm:p-7 shadow-xl shadow-black/40">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="tiktok-url-input" className="text-sm font-semibold text-[#F7F9FC] flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#4F8CFF]" />
              <span>Social Media Video URL</span>
            </label>
            <span className="text-xs text-[#A4ADBD]">Supports up to 4K Ultra HD</span>
          </div>

          {/* Automatic Clipboard Detection Banner */}
          {detectedClipboardUrl && (
            <div
              role="region"
              aria-label="Clipboard link detected"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#4F8CFF]/50 bg-gradient-to-r from-[#4F8CFF]/15 via-[#151B26] to-[#8257FF]/15 text-xs shadow-lg shadow-black/30 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4F8CFF] text-white shadow-sm shadow-[#4F8CFF]/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#F7F9FC] flex items-center gap-1.5">
                    <span>{detectedPlatform} Link Detected on Clipboard</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#4F8CFF]/30 text-[#4F8CFF] font-mono font-semibold">
                      Auto
                    </span>
                  </div>
                  <div className="text-[#A4ADBD] truncate font-mono text-[11px] max-w-xs sm:max-w-md mt-0.5">
                    {detectedClipboardUrl}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleDismissDetected}
                  className="px-2.5 py-1.5 rounded-lg border border-[#293244] bg-[#11151D] hover:bg-[#151B26] text-[#A4ADBD] hover:text-[#F7F9FC] text-xs font-medium transition-colors"
                >
                  Dismiss
                </button>

                <button
                  type="button"
                  onClick={handlePasteOnly}
                  className="px-3 py-1.5 rounded-lg border border-[#4F8CFF]/40 bg-[#151B26] hover:bg-[#4F8CFF]/20 text-[#F7F9FC] text-xs font-semibold transition-colors"
                >
                  Paste Only
                </button>

                <button
                  type="button"
                  onClick={handlePasteAndResolve}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#4F8CFF] to-[#3B82F6] hover:from-[#3D7AEA] hover:to-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#4F8CFF]/25 active:scale-95 transition-all"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Paste & Resolve</span>
                </button>
              </div>
            </div>
          )}

          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-4 text-[#A4ADBD]">
              <Link2 className="h-5 w-5" />
            </div>

            <input
              id="tiktok-url-input"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck="false"
              value={url}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Paste your TikTok video link here (e.g. https://www.tiktok.com/@...)"
              className="w-full rounded-xl border border-[#293244] bg-[#0D121B] py-3.5 pl-11 pr-24 text-sm text-[#F7F9FC] placeholder:text-[#A4ADBD]/60 focus:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/20 transition-all disabled:opacity-60"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {url.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  title="Clear input"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A4ADBD] hover:text-[#F7F9FC] hover:bg-[#151B26] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                disabled={isLoading}
                title="Paste from clipboard"
                className="flex items-center gap-1 rounded-lg border border-[#293244] bg-[#151B26] px-2.5 py-1.5 text-xs font-semibold text-[#A4ADBD] hover:text-[#F7F9FC] hover:border-[#4F8CFF]/50 active:scale-95 transition-all"
              >
                <Clipboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>

          {/* Validation or Error Message */}
          {(validationError || errorMessage || clipboardNotice) && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[#F87171]/30 bg-[#F87171]/10 p-3 text-xs text-[#F87171] animate-in fade-in"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{validationError || errorMessage || clipboardNotice}</span>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#A4ADBD]">
              <span className="text-[#A4ADBD]/80">Try sample:</span>
              {SAMPLE_PLATFORM_URLS.map((sample, idx) => (
                <React.Fragment key={sample.platform}>
                  <button
                    type="button"
                    onClick={() => handleUseSample(sample.url)}
                    className="text-[#4F8CFF] hover:underline focus:outline-none font-medium text-[11px]"
                  >
                    {sample.label}
                  </button>
                  {idx < SAMPLE_PLATFORM_URLS.length - 1 && <span className="text-[#293244]">·</span>}
                </React.Fragment>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || url.trim().length === 0}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#3B82F6] hover:from-[#3D7AEA] hover:to-[#2563EB] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#4F8CFF]/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{statusMessage || 'Resolving video...'}</span>
                </>
              ) : (
                <>
                  <span>Download Video</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
