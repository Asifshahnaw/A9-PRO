/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TabType } from '../types/index.js';
import { Download, Layers, History, HelpCircle, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-[#293244] bg-[#090B10]/95 backdrop-blur-md pb-safe"
    >
      <div className="grid h-full grid-cols-5 items-center px-2">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'single' ? 'text-[#4F8CFF]' : 'text-[#A4ADBD] hover:text-[#F7F9FC]'
          }`}
        >
          <Download className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium tracking-tight">Downloader</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'batch' ? 'text-[#4F8CFF]' : 'text-[#A4ADBD] hover:text-[#F7F9FC]'
          }`}
        >
          <Layers className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium tracking-tight">Batch</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'history' ? 'text-[#4F8CFF]' : 'text-[#A4ADBD] hover:text-[#F7F9FC]'
          }`}
        >
          <History className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium tracking-tight">History</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'guide' ? 'text-[#4F8CFF]' : 'text-[#A4ADBD] hover:text-[#F7F9FC]'
          }`}
        >
          <HelpCircle className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium tracking-tight">FAQ</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'settings' ? 'text-[#4F8CFF]' : 'text-[#A4ADBD] hover:text-[#F7F9FC]'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium tracking-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
};
