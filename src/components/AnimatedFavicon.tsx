import React, { useEffect } from 'react';

/**
 * AnimatedFavicon
 *
 * Updates the browser tab icon with the AgroVision AI emblem
 * (deep forest crest, scanner corner marks, serrated tomato leaf, and red tomato).
 */
export const AnimatedFavicon: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let linkEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'icon';
      document.head.appendChild(linkEl);
    }
    linkEl.type = 'image/png';

    const drawLogo = () => {
      ctx.clearRect(0, 0, 64, 64);

      // Rounded forest crest
      ctx.beginPath();
      ctx.roundRect(2, 2, 60, 60, 16);
      ctx.fillStyle = '#14532d';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(134, 239, 172, 0.45)';
      ctx.stroke();

      // Golden scanner corner marks
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Top-left
      ctx.moveTo(12, 20);
      ctx.lineTo(12, 12);
      ctx.lineTo(20, 12);
      // Top-right
      ctx.moveTo(44, 12);
      ctx.lineTo(52, 12);
      ctx.lineTo(52, 20);
      // Bottom-left
      ctx.moveTo(12, 44);
      ctx.lineTo(12, 52);
      ctx.lineTo(20, 52);
      // Bottom-right
      ctx.moveTo(44, 52);
      ctx.lineTo(52, 52);
      ctx.lineTo(52, 44);
      ctx.stroke();

      // Botanical green leaf calyx
      ctx.beginPath();
      ctx.moveTo(32, 14);
      ctx.quadraticCurveTo(38, 19, 36, 26);
      ctx.quadraticCurveTo(44, 24, 46, 29);
      ctx.quadraticCurveTo(39, 32, 32, 30);
      ctx.quadraticCurveTo(25, 32, 18, 29);
      ctx.quadraticCurveTo(20, 24, 28, 26);
      ctx.quadraticCurveTo(26, 19, 32, 14);
      ctx.closePath();
      ctx.fillStyle = '#86efac';
      ctx.fill();

      // Tomato fruit body
      ctx.beginPath();
      ctx.arc(32, 40, 11.5, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Specular sheen
      ctx.beginPath();
      ctx.arc(28, 36, 3.2, Math.PI * 0.9, Math.PI * 1.6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sun accent dot
      ctx.beginPath();
      ctx.arc(45, 19, 2.3, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      try {
        if (linkEl) {
          linkEl.href = canvas.toDataURL('image/png');
        }
      } catch {
        // Ignore restricted contexts
      }
    };

    const timer = window.setTimeout(drawLogo, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
};
