/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I copy a video link from the TikTok app?',
    answer:
      'Open the video in the TikTok app, tap the Share icon (arrow) on the right side of the screen, and tap "Copy Link". Then switch to A9 PRO and tap the Paste button.',
  },
  {
    question: 'Where do downloaded videos go on my device?',
    answer:
      'Videos are saved to your device’s default Downloads folder. You can immediately access them in your device file manager, downloads panel, or native gallery and media player.',
  },
  {
    question: 'Why are some videos missing the 1080p HD option?',
    answer:
      'A9 PRO detects and displays genuine resolutions delivered by the video provider. If the original creator uploaded at 720p or lower, or if the provider has not encoded a 1080p stream for that video, we display the highest authentic resolution rather than claiming false 1080p.',
  },
  {
    question: 'Can I download private or geo-restricted videos?',
    answer:
      'No. In compliance with security standards and content protection, A9 PRO only resolves public, accessible videos. Private accounts, friend-only videos, and DRM-protected media cannot and should not be bypassed.',
  },
  {
    question: 'Does A9 PRO store or share my videos?',
    answer:
      'No. All video streams are passed directly between the authorized media CDN and your device in real-time. We never store copies of your downloaded videos or user queries on our servers.',
  },
  {
    question: 'How do I install A9 PRO as an app on my phone?',
    answer:
      'Tap the "Install App" button in the top bar or tap the three dots (⋮) in your browser menu and select "Install app" or "Add to Home Screen". On iPhone Safari, tap the Share button and select "Add to Home Screen".',
  },
];

export const HelpCenter: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-[#293244] bg-[#151B26] p-5 sm:p-7 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#293244]">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5 text-[#4F8CFF]" />
            <div>
              <h2 className="text-lg font-bold text-[#F7F9FC]">Help Center & FAQs</h2>
              <p className="text-xs text-[#A4ADBD]">Guidance on links, resolutions, and high-speed downloads</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="divide-y divide-[#293244] pt-2">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between text-left focus:outline-none group"
                >
                  <span className="text-sm font-semibold text-[#F7F9FC] group-hover:text-[#4F8CFF] transition-colors pr-4">
                    {item.question}
                  </span>
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#293244] bg-[#11151D] text-[#A4ADBD] transition-transform ${
                      isOpen ? 'rotate-180 text-[#4F8CFF]' : ''
                    }`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 text-xs leading-relaxed text-[#A4ADBD] pr-8 animate-in fade-in">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
