/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings, HistoryItem } from '../types/index.js';

const SETTINGS_KEY = 'a9_downloader_settings_v1';
const HISTORY_KEY = 'a9_downloader_history_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultQuality: 'hd_watermark_free',
  historyEnabled: true,
  confirmBeforeDownload: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.warn('Could not read settings from storage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save settings to storage:', err);
  }
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read history from storage:', err);
    return [];
  }
}

export function saveHistoryItem(item: HistoryItem): void {
  try {
    const existing = loadHistory();
    // Prepend and filter duplicates by videoId + quality
    const filtered = existing.filter(
      (h) => !(h.videoId === item.videoId && h.selectedQuality === item.selectedQuality)
    );
    const updated = [item, ...filtered].slice(0, 50); // Store up to 50 items
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save history item to storage:', err);
  }
}

export function removeHistoryItem(id: string): HistoryItem[] {
  try {
    const existing = loadHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Could not remove history item:', err);
    return [];
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('Could not clear history:', err);
  }
}
