import React, { useState } from 'react';
import { Award, Sparkles, Star, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useXP } from '../context/XPContext';

interface FarmerMascotCardProps {
  onQuickScan?: () => void;
}

const MASCOT_TIPS = [
  {
    en: 'Tap a tomato leaf photo to earn +40 XP and keep your garden healthy!',
    ur: 'ٹماٹر کے پتے کی تصویر چیک کریں، +40 XP پائیں اور فصل بچائیں!'
  },
  {
    en: 'Check Soil Sensors in Care tab to boost your daily crop score!',
    ur: 'نگہداشت میں جا کر مٹی کی نمی اور پی ایچ چیک کریں اور XP کمائیں!'
  },
  {
    en: 'Morning sunlight helps leaves dry fast — water only near the roots!',
    ur: 'پودے کو پانی ہمیشہ جڑوں کے پاس دیں، پتوں کو گیلا نہ کریں!'
  },
  {
    en: 'Try speaking your field notes in Field Messenger using the Mic button!',
    ur: 'اب آپ میسنجر میں بول کر بھی اپنا پیغام لکھ سکتے ہیں!'
  }
];

export const FarmerMascotCard: React.FC<FarmerMascotCardProps> = ({ onQuickScan }) => {
  const { isUrdu } = useLanguage();
  const {
    xp,
    level,
    levelProgressPercent,
    xpIntoLevel,
    xpForNextLevel,
    levelTitleEn,
    levelTitleUr,
    lastXpEvent
  } = useXP();

  const [tipIndex, setTipIndex] = useState(0);
  const [isCheering, setIsCheering] = useState(false);

  const handlePatMascot = () => {
    setTipIndex((prev) => (prev + 1) % MASCOT_TIPS.length);
    setIsCheering(true);
    window.setTimeout(() => setIsCheering(false), 650);
  };

  const activeTip = MASCOT_TIPS[tipIndex];

  return (
    <section
      aria-label={isUrdu ? 'کسان دوست اور لیول' : 'Farmer Mascot & XP Level'}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#fef08a] via-[#fde047] to-[#fb923c] border-2 border-[#f59e0b] p-3.5 shadow-[0_10px_28px_rgba(245,158,11,0.25)] text-[#422006]"
    >
      {/* XP Earned Floating Pop */}
      {lastXpEvent && (
        <div
          role="status"
          className="mb-2.5 px-3 py-1.5 rounded-2xl bg-[#064e3b] text-[#fef08a] text-xs font-extrabold flex items-center justify-between gap-2 shadow-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24]" />
            <span>{isUrdu ? lastXpEvent.reasonUr : lastXpEvent.reasonEn}</span>
          </span>
          <span className="font-mono text-[#86efac] tabular-nums">+{lastXpEvent.amount} XP</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Interactive Duolingo-Style Tomato-Farmer Mascot Character */}
        <button
          type="button"
          onClick={handlePatMascot}
          title={isUrdu ? 'نیا مشورہ سننے کے لیے کلک کریں' : 'Tap Buddy for a quick tip'}
          className={`relative w-16 h-16 shrink-0 rounded-2xl bg-white/85 border-2 border-[#f59e0b] shadow-sm flex items-center justify-center transition-transform cursor-pointer active:scale-95 ${
            isCheering || lastXpEvent ? '-translate-y-1 scale-105' : 'hover:scale-105'
          }`}
        >
          <svg
            viewBox="0 0 80 80"
            className="w-14 h-14 overflow-visible"
            aria-hidden="true"
          >
            {/* Straw Farmer Hat */}
            <ellipse cx="40" cy="23" rx="26" ry="6.5" fill="#fbbf24" stroke="#92400e" strokeWidth="2.2" />
            <path
              d="M24 22 C25 11, 55 11, 56 22 Z"
              fill="#fde68a"
              stroke="#92400e"
              strokeWidth="2.2"
            />
            <path d="M24 19 H56" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />

            {/* Sprout Leaf on Hat */}
            <path
              d="M40 12 C40 6, 48 4, 51 9 C47 13, 42 13, 40 12 Z"
              fill="#16a34a"
              stroke="#14532d"
              strokeWidth="1.6"
            />

            {/* Plump Cheerful Tomato-Farmer Face */}
            <circle cx="40" cy="43" r="19" fill="#ef4444" stroke="#991b1b" strokeWidth="2.4" />
            {/* Rosy Cheeks */}
            <circle cx="28" cy="46" r="3.2" fill="#fda4af" opacity="0.85" />
            <circle cx="52" cy="46" r="3.2" fill="#fda4af" opacity="0.85" />

            {/* Expressive Bright Eyes */}
            <circle cx="33" cy="39" r="3.8" fill="#ffffff" />
            <circle cx="47" cy="39" r="3.8" fill="#ffffff" />
            <circle cx="33.8" cy="39" r="2.1" fill="#13281c" />
            <circle cx="47.8" cy="39" r="2.1" fill="#13281c" />
            <circle cx="34.5" cy="38" r="0.8" fill="#ffffff" />
            <circle cx="48.5" cy="38" r="0.8" fill="#ffffff" />

            {/* Big Friendly Smile */}
            <path
              d="M32.5 47 Q40 54.5 47.5 47"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.6"
              strokeLinecap="round"
            />

            {/* Farmer Overalls Collar */}
            <path
              d="M24 58 Q40 66 56 58 L54 71 Q40 75 26 71 Z"
              fill="#0284c7"
              stroke="#0c4a6e"
              strokeWidth="2"
            />
            <circle cx="31" cy="64" r="1.8" fill="#fde047" />
            <circle cx="49" cy="64" r="1.8" fill="#fde047" />

            {/* Waving Hand */}
            <circle
              cx="63"
              cy={isCheering ? 42 : 48}
              r="4.5"
              fill="#fde68a"
              stroke="#92400e"
              strokeWidth="1.8"
            />
          </svg>
          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-lg bg-[#059669] text-white text-[9px] font-mono font-extrabold border border-white shadow-xs">
            Lv.{level}
          </span>
        </button>

        {/* Level Rank, XP Progress Bar & Tip Speech Bubble */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Award className="w-4 h-4 text-[#9a3412] shrink-0" />
              <span className="font-display text-sm font-extrabold text-[#422006] truncate">
                {isUrdu ? levelTitleUr : levelTitleEn}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#422006] text-[#fef08a] font-mono text-[11px] font-extrabold tabular-nums shrink-0">
              <Star className="w-3 h-3 fill-[#fde047] text-[#fde047]" />
              <span>{xp} XP</span>
            </div>
          </div>

          {/* Crisp Level Progress Gauge */}
          <div className="space-y-1">
            <div
              className="w-full h-2.5 rounded-full bg-white/80 border border-[#d97706]/50 overflow-hidden"
              role="progressbar"
              aria-valuenow={levelProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Level ${level} XP progress`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#059669] via-[#10b981] to-[#0284c7] transition-all duration-500"
                style={{ width: `${Math.max(8, levelProgressPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#78350f] tabular-nums">
              <span>
                {isUrdu ? `لیول ${level}` : `Level ${level}`}
              </span>
              <span>
                {xpIntoLevel}/{xpForNextLevel} XP
              </span>
            </div>
          </div>

          {/* Interactive Mascot Speech Bubble */}
          <div className="rounded-xl bg-white/90 border border-[#f59e0b]/60 px-2.5 py-1.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-[#422006] leading-snug">
              {isUrdu ? activeTip.ur : activeTip.en}
            </p>
            {onQuickScan && (
              <button
                type="button"
                onClick={onQuickScan}
                className="min-h-[30px] px-2 py-1 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <Sparkles className="w-3 h-3" />
                <span>+40</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
