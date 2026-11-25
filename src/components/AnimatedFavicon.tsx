import React, { useEffect } from 'react';

/**
 * AnimatedFavicon
 *
 * Ensures browser tab icons stay synced with the AgroVision brand emblem icon.
 */
export const AnimatedFavicon: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let linkEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'icon';
      document.head.appendChild(linkEl);
    }
    linkEl.type = 'image/png';
    linkEl.href = '/icon-v4-192.png?v=4';

    const appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleLink) {
      appleLink.href = '/apple-touch-icon-v4.png?v=4';
    }
  }, []);

  return null;
};
