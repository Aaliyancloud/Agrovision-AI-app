import fs from 'fs';
import sharp from 'sharp';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#166534" />
      <stop offset="50%" stop-color="#14532d" />
      <stop offset="100%" stop-color="#0a2a16" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <linearGradient id="tomatoGrad" x1="20%" y1="15%" x2="80%" y2="85%">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="35%" stop-color="#ef4444" />
      <stop offset="75%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>

    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="50%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Base Rounded Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Outer Tech Border -->
  <rect x="20" y="20" width="472" height="472" rx="96" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.6" />
  <rect x="28" y="28" width="456" height="456" rx="88" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.4" />

  <!-- Corner AI Scanner Brackets -->
  <path d="M 46 80 L 46 46 L 80 46" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
  <path d="M 432 46 L 466 46 L 466 80" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
  <path d="M 46 432 L 46 466 L 80 466" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
  <path d="M 432 466 L 466 466 L 466 432" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />

  <!-- Central Emblem Container -->
  <g transform="translate(256, 195) scale(1.15)">
    <!-- Glow Ring behind Tomato -->
    <circle cx="0" cy="0" r="105" fill="#f59e0b" opacity="0.12" />
    <circle cx="0" cy="0" r="95" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="6 4" opacity="0.5" />

    <!-- Tomato Body with 3D Shadow -->
    <g filter="url(#shadow)">
      <circle cx="0" cy="8" r="76" fill="url(#tomatoGrad)" />
      <!-- Subtle Tomato Ribs -->
      <path d="M -50 -20 C -25 20 -25 45 -40 70" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.15" stroke-linecap="round" />
      <path d="M 50 -20 C 25 20 25 45 40 70" fill="none" stroke="#000000" stroke-width="5" opacity="0.2" stroke-linecap="round" />
      <!-- Specular Highlight -->
      <ellipse cx="-26" cy="-22" rx="20" ry="12" transform="rotate(-30, -26, -22)" fill="#ffffff" opacity="0.35" />
      <circle cx="-12" cy="-34" r="5" fill="#ffffff" opacity="0.6" />
    </g>

    <!-- Calyx & Leaves on Top of Tomato -->
    <g filter="url(#shadow)">
      <!-- Central Stem -->
      <path d="M 0 -70 C 3 -85 10 -92 18 -98 C 22 -95 18 -82 6 -68 Z" fill="#15803d" />
      <!-- Crown Leaves -->
      <path d="M 0 -66 C -20 -82 -48 -88 -62 -75 C -46 -64 -26 -60 0 -62 Z" fill="url(#leafGrad)" />
      <path d="M 0 -66 C 20 -82 48 -88 62 -75 C 46 -64 26 -60 0 -62 Z" fill="url(#leafGrad)" />
      <path d="M 0 -66 C -32 -55 -60 -42 -55 -28 C -40 -35 -18 -48 0 -62 Z" fill="url(#leafGrad)" />
      <path d="M 0 -66 C 32 -55 60 -42 55 -28 C 40 -35 18 -48 0 -62 Z" fill="url(#leafGrad)" />
      <path d="M 0 -66 C -10 -45 -14 -22 0 -18 C 14 -22 10 -45 0 -66 Z" fill="#22c55e" />
    </g>

    <!-- AI Scan Reticle Overlay on Tomato -->
    <g opacity="0.65">
      <circle cx="0" cy="8" r="84" fill="none" stroke="#fef3c7" stroke-width="1.5" stroke-dasharray="12 8" />
      <line x1="-96" y1="8" x2="-76" y2="8" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
      <line x1="76" y1="8" x2="96" y2="8" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
      <line x1="0" y1="-88" x2="0" y2="-68" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
      <line x1="0" y1="84" x2="0" y2="104" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
    </g>
  </g>

  <!-- Prominent "AGROVISION" Typography Banner -->
  <g transform="translate(256, 385)" filter="url(#shadow)">
    <!-- Outer Pill Plate -->
    <rect x="-195" y="-36" width="390" height="72" rx="36" fill="#092113" stroke="url(#goldGrad)" stroke-width="3.5" />
    <!-- Inner Accent Line -->
    <rect x="-187" y="-28" width="374" height="56" rx="28" fill="#14532d" opacity="0.95" />

    <!-- AGROVISION Main Text -->
    <text
      x="0"
      y="12"
      text-anchor="middle"
      font-family="DejaVu Sans, Arial, Helvetica, sans-serif"
      font-weight="900"
      font-size="40"
      letter-spacing="4"
      fill="#fef3c7"
    >AGROVISION</text>
  </g>

  <!-- "AI" Tech Sub-Badge -->
  <g transform="translate(256, 446)" filter="url(#shadow)">
    <rect x="-48" y="-15" width="96" height="30" rx="15" fill="url(#goldGrad)" />
    <text
      x="0"
      y="6"
      text-anchor="middle"
      font-family="DejaVu Sans, Arial, Helvetica, sans-serif"
      font-weight="900"
      font-size="18"
      letter-spacing="3"
      fill="#14532d"
    >AI</text>
  </g>
</svg>`;

fs.writeFileSync('scripts/icon.svg', svgContent);
console.log('Wrote scripts/icon.svg');

const targets = [
  { file: 'public/pwa-512x512.png', size: 512 },
  { file: 'public/pwa-maskable-512x512.png', size: 512 },
  { file: 'public/pwa-192x192.png', size: 192 },
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/favicon.png', size: 64 },
  { file: 'public/assets/aistudio/favicon.png', size: 64 },
  { file: 'public/favicon.ico', size: 32 }
];

async function generate() {
  const svgBuffer = Buffer.from(svgContent);
  for (const target of targets) {
    try {
      await sharp(svgBuffer)
        .resize(target.size, target.size)
        .png()
        .toFile(target.file);
      console.log(`Generated ${target.file} (${target.size}x${target.size})`);
    } catch (err) {
      console.error(`Failed ${target.file}:`, err.message);
    }
  }
}

generate();
