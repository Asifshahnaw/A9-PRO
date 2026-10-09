/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Video, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="text-center pt-8 pb-6 sm:pt-12 sm:pb-8">
      {/* Editorial kicker */}
      <div className="inline-flex items-center gap-2 text-xs font-medium text-[#A4ADBD] mb-4">
        <span className="flex items-center gap-1 text-[#4F8CFF]">
          <Zap className="h-3.5 w-3.5" /> High Performance
        </span>
        <span aria-hidden="true">·</span>
        <span className="text-amber-400 font-bold">Up to 4K Ultra HD</span>
        <span aria-hidden="true">·</span>
        <span>Watch In-App</span>
        <span aria-hidden="true">·</span>
        <span>Live Engagement Stats</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F7F9FC] max-w-2xl mx-auto text-balance">
        Your Videos. Your Quality.
      </h1>

      <p className="mt-3 text-base sm:text-lg text-[#A4ADBD] max-w-xl mx-auto">
        Paste any link from TikTok, YouTube (up to 4K), Instagram, Facebook, or X. Watch directly in the app, inspect live views and likes, and download lossless media.
      </p>

      {/* Unboxed privacy and reliability metadata */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[#A4ADBD]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#31C48D]" /> No account required
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-[#4F8CFF]" /> Clean watermark-free media
        </span>
        <span aria-hidden="true">·</span>
        <span>Zero server media storage</span>
      </div>
    </div>
  );
};
