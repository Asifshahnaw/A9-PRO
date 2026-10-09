/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TabType } from '../types/index.js';
import { Download, Layers, History, HelpCircle, Settings, Sun, Moon, ArrowDownToLine } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  theme: 'dark' | 'light' | 'system';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, theme, toggleTheme }) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#293244]/80 bg-[#090B10]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('single')}
          className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] rounded-lg p-1"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#8257FF] p-0.5 shadow-md shadow-[#4F8CFF]/20 transition-transform group-hover:scale-105">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090B10]">
              <span className="font-mono text-xs font-black tracking-tighter text-[#4F8CFF]">PRO</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-[#F7F9FC]">A9 PRO</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-[#4F8CFF] to-[#8257FF] text-white tracking-widest uppercase shadow-sm">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#A4ADBD] hidden sm:inline">4K Social Video Downloader</span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'single'
                ? 'bg-[#151B26] text-[#4F8CFF] shadow-sm'
                : 'text-[#A4ADBD] hover:text-[#F7F9FC] hover:bg-[#151B26]/50'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Downloader</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'batch'
                ? 'bg-[#151B26] text-[#4F8CFF] shadow-sm'
                : 'text-[#A4ADBD] hover:text-[#F7F9FC] hover:bg-[#151B26]/50'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Batch Mode</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'history'
                ? 'bg-[#151B26] text-[#4F8CFF] shadow-sm'
                : 'text-[#A4ADBD] hover:text-[#F7F9FC] hover:bg-[#151B26]/50'
            }`}
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'guide'
                ? 'bg-[#151B26] text-[#4F8CFF] shadow-sm'
                : 'text-[#A4ADBD] hover:text-[#F7F9FC] hover:bg-[#151B26]/50'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#151B26] text-[#4F8CFF] shadow-sm'
                : 'text-[#A4ADBD] hover:text-[#F7F9FC] hover:bg-[#151B26]/50'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Zone 3: Actions (PWA install, theme) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-lg bg-[#4F8CFF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#3D7AEA] active:scale-95 transition-all"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#293244] bg-[#11151D] text-[#A4ADBD] hover:text-[#F7F9FC] hover:border-[#4F8CFF]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            aria-label="Open settings"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[#293244] bg-[#11151D] text-[#A4ADBD] hover:text-[#F7F9FC]"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
