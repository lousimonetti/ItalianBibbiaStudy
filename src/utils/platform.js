// Lightweight iOS detection. Used to surface an iOS-only hint about downloading
// higher-quality system voices (which a web app can't install itself).

// Pure form — takes the navigator bits so it's unit-testable.
export function detectIOS({ ua = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ presents as desktop Safari ("MacIntel") but reports touch points.
  if (platform === 'MacIntel' && maxTouchPoints > 1) return true;
  return false;
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return detectIOS({
    ua: navigator.userAgent || '',
    platform: navigator.platform || '',
    maxTouchPoints: navigator.maxTouchPoints || 0,
  });
}
