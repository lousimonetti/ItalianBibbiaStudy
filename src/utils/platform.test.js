import { describe, it, expect } from 'vitest';
import { detectIOS } from './platform';

describe('detectIOS', () => {
  it('detects iPhone / iPad / iPod by user agent', () => {
    expect(detectIOS({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe(true);
    expect(detectIOS({ ua: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' })).toBe(true);
    expect(detectIOS({ ua: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)' })).toBe(true);
  });

  it('detects iPadOS masquerading as desktop Safari (MacIntel + touch)', () => {
    expect(detectIOS({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
  });

  it('does not flag a real Mac (no touch points)', () => {
    expect(detectIOS({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
  });

  it('does not flag Android or desktop Chrome', () => {
    expect(detectIOS({ ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)' })).toBe(false);
    expect(detectIOS({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBe(false);
  });

  it('handles empty input', () => {
    expect(detectIOS()).toBe(false);
    expect(detectIOS({})).toBe(false);
  });
});
