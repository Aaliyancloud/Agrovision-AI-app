import React from 'react';

export const AppBotanicalBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Soft Botanical Sage Wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 8%, rgba(22, 101, 52, 0.085) 0%, transparent 45%), radial-gradient(circle at 90% 24%, rgba(20, 83, 45, 0.07) 0%, transparent 42%), radial-gradient(circle at 50% 92%, rgba(77, 124, 15, 0.08) 0%, transparent 50%)'
        }}
      />

      {/* Top-Left Tomato Vine & Leaf Branch */}
      <svg
        viewBox="0 0 220 220"
        className="absolute -top-6 -left-6 w-48 h-48 sm:w-64 sm:h-64 text-[#14532d] opacity-[0.075]"
        fill="none"
      >
        <path
          d="M12 20 C52 44, 88 92, 146 142"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M52 54 C30 62, 18 82, 26 98 C46 98, 62 78, 52 54 Z"
          fill="currentColor"
        />
        <path
          d="M78 76 C94 46, 124 38, 134 56 C122 76, 98 84, 78 76 Z"
          fill="currentColor"
        />
        <path
          d="M104 106 C76 116, 62 142, 74 160 C96 158, 114 132, 104 106 Z"
          fill="currentColor"
        />
        <path
          d="M142 138 C158 112, 188 106, 198 124 C184 146, 160 152, 142 138 Z"
          fill="currentColor"
        />
      </svg>

      {/* Bottom-Right Leafy Mosaic Branch */}
      <svg
        viewBox="0 0 240 240"
        className="absolute bottom-14 -right-6 w-52 h-52 sm:w-72 sm:h-72 text-[#166534] opacity-[0.08]"
        fill="none"
      >
        <path
          d="M228 214 C180 182, 134 134, 84 68"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M174 172 C196 156, 218 158, 222 174 C206 188, 186 186, 174 172 Z"
          fill="currentColor"
        />
        <path
          d="M148 144 C122 152, 100 140, 102 122 C122 114, 142 126, 148 144 Z"
          fill="currentColor"
        />
        <path
          d="M118 110 C138 86, 164 82, 172 98 C158 118, 134 122, 118 110 Z"
          fill="currentColor"
        />
        <path
          d="M84 68 C58 76, 40 60, 44 42 C64 38, 82 50, 84 68 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export const HeroBranchAccent: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 120"
      className={`pointer-events-none select-none ${className}`}
      fill="none"
    >
      <path
        d="M168 12 C136 32, 104 54, 52 78"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M142 28 C148 8, 166 2, 174 12 C164 26, 150 32, 142 28 Z"
        fill="currentColor"
      />
      <path
        d="M118 44 C100 24, 78 24, 74 38 C90 48, 106 50, 118 44 Z"
        fill="currentColor"
      />
      <path
        d="M94 58 C108 76, 104 98, 88 102 C76 88, 80 70, 94 58 Z"
        fill="currentColor"
      />
      <path
        d="M54 76 C36 62, 16 68, 16 82 C30 92, 46 88, 54 76 Z"
        fill="currentColor"
      />
    </svg>
  );
};

/**
 * Delicate dangling vine branch with soft moss & green algae droplets
 * draped gracefully from the top-right corner of the 4 Home branch cards.
 */
export const HangingBranchMoss: React.FC<{ variant?: 0 | 1 | 2 | 3 }> = ({ variant = 0 }) => {
  const mirror = variant % 2 === 1;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 76"
      className={`pointer-events-none select-none absolute -top-0.5 right-0 w-24 h-16 transition-transform duration-300 group-hover:translate-y-0.5 ${
        mirror ? 'scale-x-[-1] opacity-85' : ''
      }`}
      fill="none"
    >
      {/* Top Moss Cushion Strip */}
      <path
        d="M36 0 C48 7, 62 4, 74 10 C86 5, 98 9, 112 3 L120 0 Z"
        fill="#4d7c0f"
        fillOpacity="0.22"
      />
      <path
        d="M54 0 C66 8, 78 5, 92 12 C104 8, 112 10, 120 4 L120 0 Z"
        fill="#166534"
        fillOpacity="0.24"
      />

      {/* Dangling Vine Tendril 1 */}
      <path
        d="M98 2 C94 18, 102 32, 92 48 C88 54, 86 60, 89 65"
        stroke="#15803d"
        strokeOpacity="0.42"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Hanging Tendril 2 */}
      <path
        d="M72 3 C68 15, 73 25, 65 37"
        stroke="#4d7c0f"
        strokeOpacity="0.38"
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      {/* Serrated Hanging Leaflets & Moss Tufts */}
      <path
        d="M95 16 C83 18, 79 27, 86 31 C94 29, 98 22, 95 16 Z"
        fill="#166534"
        fillOpacity="0.3"
      />
      <path
        d="M97 30 C107 28, 113 35, 108 42 C101 42, 96 36, 97 30 Z"
        fill="#4d7c0f"
        fillOpacity="0.34"
      />
      <path
        d="M91 49 C80 49, 77 57, 83 61 C89 60, 93 54, 91 49 Z"
        fill="#65a30d"
        fillOpacity="0.32"
      />
      <path
        d="M68 20 C60 22, 57 29, 63 32 C68 30, 71 25, 68 20 Z"
        fill="#15803d"
        fillOpacity="0.28"
      />

      {/* Tiny Green Algae & Dew Pearls */}
      <circle cx="89" cy="67" r="2.1" fill="#65a30d" fillOpacity="0.45" />
      <circle cx="64" cy="39" r="1.8" fill="#4d7c0f" fillOpacity="0.4" />
      <circle cx="82" cy="9" r="2.2" fill="#84cc16" fillOpacity="0.35" />
      <circle cx="108" cy="14" r="1.9" fill="#166534" fillOpacity="0.3" />
    </svg>
  );
};
