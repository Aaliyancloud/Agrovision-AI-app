import React from 'react';
import { AgroVisionLogo } from './AgroVisionLogo';
import { Leaf, Sprout, Sparkles } from 'lucide-react';

export const AppInitialSkeleton: React.FC = () => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading AgroVision AI for Aaryan Awan"
      className="fixed inset-0 z-[100] bg-[#14532d] text-white flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,101,52,0.8)_0%,rgba(15,61,33,0.95)_100%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6">
        {/* Animated Emblem Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 rounded-full bg-[#fef3c7]/20 animate-ping opacity-75" />
          <div className="absolute -inset-8 rounded-full bg-[#166534]/40 animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-[#faf8f2] shadow-2xl flex items-center justify-center border-2 border-[#fef3c7]/60">
            <AgroVisionLogo className="w-16 h-16 text-[#14532d]" />
          </div>
        </div>

        {/* Branded Title & Grower Greeting */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] text-[#78350f] text-xs font-mono font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#b45309]" />
            <span>AGROVISION AI · 2026</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hello, Aaryan Awan!
          </h1>

          <p className="text-xs sm:text-sm text-[#dcfce7] font-medium max-w-xs mx-auto leading-relaxed">
            How are you and how is your plant journey today? Loading your tomato field intelligence...
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full max-w-[220px] space-y-2 pt-2">
          <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden p-0.5 border border-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-[#fef3c7] to-[#b45309] animate-[shimmer_1.5s_infinite]" style={{ width: '75%' }} />
          </div>
          <div className="text-[10px] font-mono text-[#bbf7d0] tracking-wider uppercase">
            Preparing your greenhouse...
          </div>
        </div>
      </div>
    </div>
  );
};
