/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistoryItem } from '../types/index.js';
import {
  History,
  Trash2,
  Download,
  ExternalLink,
  Film,
  Calendar,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Timer,
} from 'lucide-react';

interface HistorySectionProps {
  history: HistoryItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history, onRemoveItem, onClearAll }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-[#293244] bg-[#151B26] p-5 sm:p-7 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#293244]">
          <div className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-[#4F8CFF]" />
            <div>
              <h2 className="text-lg font-bold text-[#F7F9FC]">Download History</h2>
              <p className="text-xs text-[#A4ADBD]">Stored privately in your browser storage</p>
            </div>
          </div>

          {history.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <span className="text-xs text-[#F87171] font-medium">Clear all?</span>
                  <button
                    onClick={() => {
                      onClearAll();
                      setShowClearConfirm(false);
                    }}
                    className="min-h-[36px] px-3 rounded-lg bg-[#F87171] hover:bg-[#EF4444] text-white text-xs font-semibold transition-colors"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="min-h-[36px] px-3 rounded-lg border border-[#293244] bg-[#11151D] text-[#A4ADBD] text-xs font-semibold hover:text-[#F7F9FC]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="min-h-[36px] px-3 rounded-lg border border-[#293244] bg-[#11151D] hover:border-[#F87171]/50 hover:text-[#F87171] text-[#A4ADBD] text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* History List or Empty State */}
        {history.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#11151D] border border-[#293244] text-[#A4ADBD] mb-3">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#F7F9FC]">No Downloads Yet</h3>
            <p className="text-xs text-[#A4ADBD] max-w-sm mx-auto mt-1">
              Your resolved and downloaded video records will appear here for easy access.
            </p>
          </div>
        ) : (
          <div className="pt-4 divide-y divide-[#293244]">
            {history.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-16 w-12 rounded-lg bg-[#090B10] border border-[#293244] overflow-hidden shrink-0">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
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
                    <h4 className="text-sm font-bold text-[#F7F9FC] truncate max-w-xs sm:max-w-md">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#A4ADBD]">
                      <span className="text-[#F7F9FC] font-medium">{item.creator}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.timestamp)}
                      </span>
                      {item.sizeFormatted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 font-mono">
                            <HardDrive className="h-3 w-3" />
                            {item.sizeFormatted}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="text-[#4F8CFF] font-medium">{item.selectedQuality}</span>
                      {item.downloadDurationSec && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 font-mono text-[#31C48D]">
                            <Timer className="h-3 w-3" />
                            {item.downloadDurationSec}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <a
                    href={item.downloadUrl}
                    download
                    className="min-h-[36px] px-3.5 rounded-lg bg-[#4F8CFF] hover:bg-[#3D7AEA] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Again</span>
                  </a>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    aria-label="Remove item"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#293244] bg-[#11151D] text-[#A4ADBD] hover:text-[#F87171] hover:border-[#F87171]/40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
