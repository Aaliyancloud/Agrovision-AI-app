import React, { useEffect } from 'react';
import { AgroVisionLogo } from './AgroVisionLogo';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export interface AppInitialSkeletonProps {
  userName?: string;
}

export function playTactilePopSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Subtle tactile 'pop' / 'click' cue: rapid frequency drop with snappy decay
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Audio policy safe
  }
}

export const AppInitialSkeleton: React.FC<AppInitialSkeletonProps> = ({ userName }) => {
  const { isUrdu } = useLanguage();
  const { activeProfile } = useAuth();

  // Dynamic user name resolution:
  // 1. Explicit prop passed from AppShell
  // 2. Active profile from AuthContext
  // 3. Stored profile from localStorage (synchronous read)
  // 4. Fallback to friendly "Grower" / "کاشتکار"
  let resolvedName = (userName || activeProfile?.displayName || '').trim();
  if (!resolvedName && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('agrovision_local_profile_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.displayName) resolvedName = String(parsed.displayName).trim();
      }
    } catch {
      // ignore parse errors
    }
  }

  const displayName = resolvedName || (isUrdu ? 'کاشتکار' : 'Grower');

  useEffect(() => {
    // Startup soft botanical chord chime (C5, E5, G5)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.001, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.85);
        });
      }
    } catch {
      // Ignored if browser restricts autoplay before touch
    }

    // Subtle tactile 'pop' or 'click' audio cue when the app finishes loading and mounts
    return () => {
      playTactilePopSound();
    };
  }, []);

  return (
    <div
      aria-busy="true"
      aria-label={`Loading AgroVision AI for ${displayName}`}
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

        {/* Branded Title & Personalized Dynamic Grower Greeting */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] text-[#78350f] text-xs font-mono font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#b45309]" />
            <span>AGROVISION AI · 2026</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isUrdu ? `ہیلو، ${displayName}!` : `Hello, ${displayName}!`}
          </h1>

          <p className="text-xs sm:text-sm text-[#dcfce7] font-medium max-w-xs mx-auto leading-relaxed">
            {isUrdu
              ? 'آپ کیسے ہیں اور آج آپ کے پودوں کا سفر کیسا جا رہا ہے؟ فیلڈ انٹیلیجنس لوڈ ہو رہی ہے...'
              : 'How are you and how is your plant journey today? Initializing field intelligence with startup audio...'}
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full max-w-[220px] space-y-2 pt-2">
          <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden p-0.5 border border-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#fef3c7] to-[#b45309] animate-[shimmer_1.5s_infinite]"
              style={{ width: '85%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-[#bbf7d0] tracking-wider uppercase">
            {isUrdu ? 'فیلڈ سسٹم تیار ہو رہا ہے...' : 'Preparing greenhouse audio...'}
          </div>
        </div>
      </div>
    </div>
  );
};
