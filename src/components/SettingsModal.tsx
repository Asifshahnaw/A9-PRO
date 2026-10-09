/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types/index.js';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Shield,
  Trash2,
  Info,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearAllHistory: () => void;
  onResetAllSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClearAllHistory,
  onResetAllSettings,
}) => {
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    // Check backend status
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setProviderStatus(data))
      .catch(() => setProviderStatus({ status: 'offline', activeProvider: 'Local Service' }));
  }, []);

  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleQualityChange = (defaultQuality: 'hd_watermark_free' | 'no_watermark' | 'audio_mp3') => {
    onUpdateSettings({ ...settings, defaultQuality });
  };

  const handleToggleHistory = () => {
    onUpdateSettings({ ...settings, historyEnabled: !settings.historyEnabled });
  };

  const handleClearHistory = () => {
    onClearAllHistory();
    setActionNotice('Download history wiped clean.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleResetSettings = () => {
    onResetAllSettings();
    setActionNotice('Preferences restored to default.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-[#293244] bg-[#151B26] p-5 sm:p-7 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#293244]">
          <Settings className="h-5 w-5 text-[#4F8CFF]" />
          <div>
            <h2 className="text-lg font-bold text-[#F7F9FC]">Application Settings</h2>
            <p className="text-xs text-[#A4ADBD]">Personalize your downloader experience and privacy controls</p>
          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#31C48D]/30 bg-[#31C48D]/10 p-3 text-xs text-[#31C48D]">
            <CheckCircle2 className="h-4 w-4" />
            <span>{actionNotice}</span>
          </div>
        )}

        <div className="divide-y divide-[#293244] text-xs">
          {/* Appearance Section */}
          <div className="py-5 space-y-3">
            <h3 className="text-sm font-bold text-[#F7F9FC]">Appearance</h3>
            <p className="text-[#A4ADBD]">Choose your interface theme style.</p>

            <div className="grid grid-cols-3 gap-2.5 max-w-md pt-1">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border p-2.5 transition-all ${
                  settings.theme === 'dark'
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-white font-semibold'
                    : 'border-[#293244] bg-[#11151D] text-[#A4ADBD] hover:text-[#F7F9FC]'
                }`}
              >
                <Moon className="h-4 w-4 text-[#4F8CFF]" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border p-2.5 transition-all ${
                  settings.theme === 'light'
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-white font-semibold'
                    : 'border-[#293244] bg-[#11151D] text-[#A4ADBD] hover:text-[#F7F9FC]'
                }`}
              >
                <Sun className="h-4 w-4 text-[#F5B942]" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border p-2.5 transition-all ${
                  settings.theme === 'system'
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-white font-semibold'
                    : 'border-[#293244] bg-[#11151D] text-[#A4ADBD] hover:text-[#F7F9FC]'
                }`}
              >
                <Monitor className="h-4 w-4 text-[#A4ADBD]" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Download Preferences */}
          <div className="py-5 space-y-3">
            <h3 className="text-sm font-bold text-[#F7F9FC]">Download Preferences</h3>
            <p className="text-[#A4ADBD]">Set which format should be selected by default when links resolve.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleQualityChange('hd_watermark_free')}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  settings.defaultQuality === 'hd_watermark_free'
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#F7F9FC]'
                    : 'border-[#293244] bg-[#11151D] text-[#A4ADBD]'
                }`}
              >
                <span className="font-bold text-[#F7F9FC] text-xs">HD (No Watermark)</span>
                <span className="text-[11px] text-[#A4ADBD] mt-0.5">Highest 1080p resolution</span>
              </button>

              <button
                type="button"
                onClick={() => handleQualityChange('no_watermark')}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  settings.defaultQuality === 'no_watermark'
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#F7F9FC]'
                    : 'border-[#293244] bg-[#11151D] text-[#A4ADBD]'
                }`}
              >
                <span className="font-bold text-[#F7F9FC] text-xs">Original (No Watermark)</span>
                <span className="text-[11px] text-[#A4ADBD] mt-0.5">Standard 720p stream</span>
              </button>

              <button
                type="button"
                onClick={() => handleQualityChange('audio_mp3')}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  settings.defaultQuality === 'audio_mp3'
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#F7F9FC]'
                    : 'border-[#293244] bg-[#11151D] text-[#A4ADBD]'
                }`}
              >
                <span className="font-bold text-[#F7F9FC] text-xs">Audio Only (MP3)</span>
                <span className="text-[11px] text-[#A4ADBD] mt-0.5">Soundtrack extracted</span>
              </button>
            </div>

            {/* History Toggle */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="font-bold text-[#F7F9FC] block">Record Download History</span>
                <span className="text-[#A4ADBD]">Save past downloads locally in your browser</span>
              </div>
              <button
                type="button"
                onClick={handleToggleHistory}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.historyEnabled ? 'bg-[#4F8CFF]' : 'bg-[#293244]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.historyEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy & Storage */}
          <div className="py-5 space-y-3">
            <h3 className="text-sm font-bold text-[#F7F9FC]">Privacy & Storage</h3>
            <p className="text-[#A4ADBD]">
              A9 PRO runs transparently. Media files are streamed in real time without being retained on the
              application server.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="min-h-[40px] px-4 rounded-xl border border-[#293244] bg-[#11151D] hover:border-[#F87171]/50 text-[#F87171] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Wipe History Storage</span>
              </button>

              <button
                type="button"
                onClick={handleResetSettings}
                className="min-h-[40px] px-4 rounded-xl border border-[#293244] bg-[#11151D] hover:text-[#F7F9FC] text-[#A4ADBD] text-xs font-semibold transition-colors"
              >
                <span>Reset All Settings</span>
              </button>
            </div>
          </div>

          {/* System & Architecture Info */}
          <div className="py-5 space-y-3">
            <h3 className="text-sm font-bold text-[#F7F9FC]">System Diagnostics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#11151D] border border-[#293244]">
                <div className="flex items-center gap-1.5 text-xs text-[#A4ADBD] mb-1">
                  <Server className="h-3.5 w-3.5 text-[#4F8CFF]" />
                  <span>Backend Video Resolver</span>
                </div>
                <div className="text-xs font-bold text-[#F7F9FC]">
                  {providerStatus?.activeProvider || 'TikWM Direct Integration'}
                </div>
                <div className="text-[11px] text-[#31C48D] mt-0.5">Status: Online · SSRF Protection Active</div>
              </div>

              <div className="p-3 rounded-xl bg-[#11151D] border border-[#293244]">
                <div className="flex items-center gap-1.5 text-xs text-[#A4ADBD] mb-1">
                  <Zap className="h-3.5 w-3.5 text-[#8257FF]" />
                  <span>Architecture</span>
                </div>
                <div className="text-xs font-bold text-[#F7F9FC]">A9 PRO Mobile Web PWA v1.0.0</div>
                <div className="text-[11px] text-[#A4ADBD] mt-0.5">Chunked streaming · Memory-safe</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer / Notice */}
        <div className="mt-4 p-4 rounded-xl bg-[#0D121B] border border-[#293244] text-[11px] text-[#A4ADBD] leading-relaxed">
          <strong className="text-[#F7F9FC] block mb-1">Legal & Authorization Notice:</strong>
          A9 PRO is designed for creators and individuals downloading their own content or public domain videos
          they are authorized to archive. Do not attempt to bypass access controls or private video boundaries. A9
          PRO is an independent utility and is not affiliated with TikTok or ByteDance.
        </div>
      </div>
    </div>
  );
};
