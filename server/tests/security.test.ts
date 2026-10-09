/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateTikTokUrl, validateMediaUrl, isPrivateOrReservedIP, sanitizeFilename } from '../services/security.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- Running A9 PRO Security & Validation Test Suite ---\n');

// 1. TikTok URL validation tests
console.log('1. TikTok URL Validation:');
assert(
  validateTikTokUrl('https://www.tiktok.com/@tiktok/video/7106594312292453678').valid,
  'Accepts valid canonical tiktok.com URL'
);
assert(
  validateTikTokUrl('https://vm.tiktok.com/ZM8vN5yUq/').valid,
  'Accepts valid short link vm.tiktok.com URL'
);
assert(
  validateTikTokUrl('https://vt.tiktok.com/ZS8vN5yUq/').valid,
  'Accepts valid short link vt.tiktok.com URL'
);
assert(
  validateTikTokUrl('https://m.tiktok.com/v/7106594312292453678.html').valid,
  'Accepts valid mobile m.tiktok.com URL'
);
assert(
  !validateTikTokUrl('http://www.tiktok.com/@user/video/123').valid,
  'Rejects insecure HTTP protocol'
);
assert(
  !validateTikTokUrl('https://evil-tiktok.com/@user/video/123').valid,
  'Rejects lookalike domain evil-tiktok.com'
);
assert(
  !validateTikTokUrl('https://youtube.com/watch?v=123').valid,
  'Rejects unsupported third-party domain youtube.com'
);
assert(
  !validateTikTokUrl('').valid,
  'Rejects empty URL'
);
assert(
  !validateTikTokUrl('javascript:alert(1)').valid,
  'Rejects javascript URI scheme'
);

// 2. SSRF and Private IP checking
console.log('\n2. SSRF & Private IP Protection:');
assert(isPrivateOrReservedIP('127.0.0.1'), 'Blocks IPv4 loopback 127.0.0.1');
assert(isPrivateOrReservedIP('10.0.1.20'), 'Blocks 10.0.0.0/8 private network');
assert(isPrivateOrReservedIP('172.16.5.4'), 'Blocks 172.16.0.0/12 private network');
assert(isPrivateOrReservedIP('192.168.1.1'), 'Blocks 192.168.0.0/16 private network');
assert(isPrivateOrReservedIP('169.254.169.254'), 'Blocks cloud metadata 169.254.169.254');
assert(isPrivateOrReservedIP('::1'), 'Blocks IPv6 loopback ::1');
assert(!isPrivateOrReservedIP('8.8.8.8'), 'Allows public IP 8.8.8.8');

// 3. Media URL Allowlist checks
console.log('\n3. Media CDN Stream Validation:');
assert(
  validateMediaUrl('https://v16-webapp-prime.tiktok.com/video/tos/useast2a/tos-useast2a-ve-0068c001/video.mp4').valid,
  'Allows authorized TikTok CDN stream'
);
assert(
  validateMediaUrl('https://tikwm.com/video/media.mp4').valid,
  'Allows authorized TikWM delivery CDN'
);
assert(
  !validateMediaUrl('https://internal.company.com/secret.mp4').valid,
  'Rejects unauthorized arbitrary domain'
);
assert(
  !validateMediaUrl('http://tikwm.com/video.mp4').valid,
  'Rejects insecure HTTP media stream'
);
assert(
  !validateMediaUrl('https://127.0.0.1/video.mp4').valid,
  'Rejects private IP media stream'
);

// 4. Filename sanitization
console.log('\n4. Filename Sanitization:');
assert(
  sanitizeFilename('../../etc/passwd.mp4') === 'passwd.mp4',
  'Strips directory traversal sequences'
);
assert(
  sanitizeFilename('my*cool:video?.mp4') === 'my_cool_video_.mp4',
  'Replaces unsafe characters with safe underscore'
);
assert(
  sanitizeFilename('') === 'a9_tiktok_video.mp4',
  'Falls back to safe default on empty string'
);

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All security checks passed successfully!\n');
}
