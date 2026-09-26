/**
 * Utility to resolve public URLs for QR codes and citizen access links.
 * Prioritizes configured public domain (e.g., Cloudflare Tunnel or official domain)
 * over localhost/internal origin to ensure citizens scanning with 4G/mobile can access.
 */

export function cleanUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function isValidHttpUrl(string: string): boolean {
  try {
    const newUrl = new URL(string);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getPublicUrl(path: string, customBaseUrl?: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 1. If explicit valid custom base URL provided (from organization setting)
  if (customBaseUrl && isValidHttpUrl(customBaseUrl)) {
    return `${cleanUrl(customBaseUrl)}${normalizedPath}`;
  }

  // 2. Check localStorage fallback if admin cached it locally
  try {
    const cached = localStorage.getItem('smart_queue_public_url');
    if (cached && isValidHttpUrl(cached)) {
      return `${cleanUrl(cached)}${normalizedPath}`;
    }
  } catch {}

  // 3. Fallback to current browser origin (window.location.origin)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${cleanUrl(window.location.origin)}${normalizedPath}`;
  }

  return normalizedPath;
}

/**
 * Returns true if the URL or current host is a local/private network address
 * which cannot be opened from outside devices on 4G/Internet without a tunnel.
 */
export function isLocalAddress(urlOrHost?: string): boolean {
  const target = urlOrHost || (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!target) return false;
  return (
    target.includes('localhost') ||
    target.includes('127.0.0.1') ||
    target.startsWith('192.168.') ||
    target.startsWith('10.') ||
    target.endsWith('.local')
  );
}
