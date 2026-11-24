import React from 'react';

interface AgroVisionLogoProps {
  className?: string;
  variant?: 'badge' | 'mark';
}

export const AgroVisionLogo: React.FC<AgroVisionLogoProps> = ({
  className = 'w-9 h-9',
  variant = 'badge'
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AgroVision AI Logo"
    >
      <defs>
        <linearGradient id="agv_bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="100%" stopColor="#0d3b20" />
        </linearGradient>
        <linearGradient id="agv_leaf" x1="22" y1="14" x2="46" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="agv_fruit" x1="20" y1="26" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>

      {variant === 'badge' && (
        <>
          <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#agv_bg)" />
          <rect
            x="3"
            y="3"
            width="58"
            height="58"
            rx="15"
            stroke="#86efac"
            strokeOpacity="0.32"
            strokeWidth="1.5"
          />
        </>
      )}

      {/* AI Vision Reticle Corners */}
      <path
        d="M12 20V14C12 12.8954 12.8954 12 14 12H20"
        stroke="#fef3c7"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M52 20V14C52 12.8954 51.1046 12 50 12H44"
        stroke="#fef3c7"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M12 44V50C12 51.1046 12.8954 52 14 52H20"
        stroke="#fef3c7"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M52 44V50C52 51.1046 51.1046 52 50 52H44"
        stroke="#fef3c7"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Serrated Botanical Tomato Leaf Crest */}
      <path
        d="M32 13C36.5 16 39 20.5 37.5 25.5C42 23.5 46.5 25 48 28.5C43.5 31.5 38.5 31.5 34.5 29.5L32 30.5L29.5 29.5C25.5 31.5 20.5 31.5 16 28.5C17.5 25 22 23.5 26.5 25.5C25 20.5 27.5 16 32 13Z"
        fill="url(#agv_leaf)"
      />

      {/* Stylized Tomato Fruit Core */}
      <path
        d="M32 29.5C24.2 29.5 19.5 34.8 19.5 41.2C19.5 47.4 24.4 51.5 32 51.5C39.6 51.5 44.5 47.4 44.5 41.2C44.5 34.8 39.8 29.5 32 29.5Z"
        fill="url(#agv_fruit)"
      />

      {/* Crisp Calyx Stem */}
      <path
        d="M32 25.5V31.5M32 30.5L27 28M32 30.5L37 28"
        stroke="#14532d"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Gloss Highlight & Warm Sun Arc */}
      <path
        d="M24.5 37.5C24.5 35.2 26.3 33.4 28.5 33.2"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="45.5" cy="18.5" r="2.2" fill="#fbbf24" />
    </svg>
  );
};
