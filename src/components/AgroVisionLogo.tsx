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
    <img
      src="/icon-v4-192.png?v=4"
      alt="AgroVision AI Logo"
      decoding="async"
      className={`${className} ${
        variant === 'badge'
          ? 'rounded-xl object-cover border border-[#86efac]/40 shadow-xs'
          : 'rounded-lg object-cover'
      }`}
    />
  );
};
