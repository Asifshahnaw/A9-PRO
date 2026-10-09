/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  for (const [ip, record] of ipRequestMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      ipRequestMap.delete(ip);
    }
  }
}, 30000);

/**
 * Express middleware for sliding-window rate limiting
 */
export function rateLimiter(options?: { windowMs?: number; max?: number }) {
  const windowMs = options?.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const max = options?.max ?? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Obtain client IP address reliably
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || 'unknown-client'
    );

    const now = Date.now();
    let record = ipRequestMap.get(clientIp);

    if (!record) {
      record = { timestamps: [] };
      ipRequestMap.set(clientIp, record);
    }

    // Retain only requests within the active window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.timestamps.length));

    if (record.timestamps.length >= max) {
      const oldest = record.timestamps[0];
      const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', resetInSeconds);
      res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: resetInSeconds,
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}
