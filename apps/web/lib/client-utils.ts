/**
 * SSR-safe utilities for client-side only operations
 */

/**
 * Safely check if code is running in browser
 */
export const isBrowser = typeof window !== "undefined";

/**
 * SSR-safe localStorage wrapper
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail in incognito or when storage is full
    }
  },
  
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },
};

/**
 * Get window location origin safely
 */
export const getWindowOrigin = (): string => {
  if (!isBrowser) return "";
  return window.location.origin;
};

/**
 * Get window location href safely
 */
export const getWindowHref = (): string => {
  if (!isBrowser) return "";
  return window.location.href;
};

/**
 * Safe window matchMedia wrapper
 */
export const safeMatchMedia = (query: string): MediaQueryList | null => {
  if (!isBrowser) return null;
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
};
