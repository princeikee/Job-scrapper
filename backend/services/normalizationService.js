import crypto from 'node:crypto';

export function normalizeLocation(rawLocation = '') {
  return rawLocation.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function detectRemote(rawLocation = '', rawDescription = '') {
  const text = `${rawLocation} ${rawDescription}`.toLowerCase();
  return /\bremote\b/.test(text);
}

export function canonicalJobUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.trim();
  }
}

export function buildUrlHash(url) {
  return crypto.createHash('sha256').update(canonicalJobUrl(url)).digest('hex');
}
