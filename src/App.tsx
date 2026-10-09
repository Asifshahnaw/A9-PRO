/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabType, ResolvedVideoData, AppSettings, HistoryItem } from './types/index.js';
import { loadSettings, saveSettings, loadHistory, removeHistoryItem, clearAllHistory, DEFAULT_SETTINGS } from './utils/storage.js';
import { Header } from './components/Header.js';
import { BottomNav } from './components/BottomNav.js';
import { Hero } from './components/Hero.js';
import { UrlInputCard } from './components/UrlInputCard.js';
import { VideoPreviewCard } from './components/VideoPreviewCard.js';
import { BatchDownloader } from './components/BatchDownloader.js';
import { HistorySection } from './components/HistorySection.js';
import { SettingsModal } from './components/SettingsModal.js';
import { HelpCenter } from './components/HelpCenter.js';
import { WifiOff, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('single');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [resolvedVideo, setResolvedVideo] = useState<ResolvedVideoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Initialize storage and theme
  useEffect(() => {
    const loadedS = loadSettings();
    setSettings(loadedS);
    setHistory(loadHistory());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync theme changes with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // System theme
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const toggleTheme = () => {
    const nextTheme: 'dark' | 'light' = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: AppSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleClearHistory = () => {
    clearAllHistory();
    setHistory([]);
  };

  const handleRemoveHistoryItem = (id: string) => {
    const updated = removeHistoryItem(id);
    setHistory(updated);
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  };

  // Video resolution workflow
  const handleResolve = async (url: string) => {
    setIsLoading(true);
    setStatusMessage('Validating link...');
    setErrorMessage(null);

    try {
      setStatusMessage('Resolving video stream...');
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const contentType = response.headers.get('content-type') || '';
      let json: any = null;

      if (contentType.includes('application/json')) {
        json = await response.json();
      } else {
        const text = await response.text();
        if (text.includes('warmup') || text.includes('<!doctype') || text.includes('<html')) {
          throw new Error('The service is connecting to the media gateway. Please try clicking Download again.');
        }
        throw new Error(text || `Server returned error (${response.status})`);
      }

      if (!response.ok || !json.success) {
        throw new Error(json.error || `Unable to resolve video stream (${response.status})`);
      }

      if (!json.data) {
        throw new Error('Could not parse video metadata from response.');
      }

      setStatusMessage('Loading available formats...');
      setResolvedVideo(json.data);
    } catch (err: any) {
      console.error('Resolution error:', err);
      setErrorMessage(err.message || 'Unable to resolve video. Please verify the URL and try again.');
      setResolvedVideo(null);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090B10] text-[#F7F9FC] transition-colors pb-20 md:pb-8">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-[#F5B942] text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="h-4 w-4" />
          <span>You are currently offline. Check your network connection.</span>
        </div>
      )}

      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={settings.theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
        {activeTab === 'single' && (
          <div>
            <Hero />
            <UrlInputCard
              onResolve={handleResolve}
              isLoading={isLoading}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              onClearError={() => setErrorMessage(null)}
            />

            {resolvedVideo && (
              <VideoPreviewCard
                data={resolvedVideo}
                defaultQuality={settings.defaultQuality}
              />
            )}
          </div>
        )}

        {activeTab === 'batch' && <BatchDownloader />}

        {activeTab === 'history' && (
          <HistorySection
            history={history}
            onRemoveItem={handleRemoveHistoryItem}
            onClearAll={handleClearHistory}
          />
        )}

        {activeTab === 'guide' && <HelpCenter />}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearAllHistory={handleClearHistory}
            onResetAllSettings={handleResetSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#293244]/80 py-6 mt-12 text-center text-xs text-[#A4ADBD]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F7F9FC]">A9 PRO</span>
            <span>·</span>
            <span>Fast, Private & Mobile-First</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('guide')}
              className="hover:text-[#F7F9FC] transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="hover:text-[#F7F9FC] transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
