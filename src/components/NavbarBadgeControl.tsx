import React, { useState } from 'react';
import { Award, Flame, Lock, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BadgeDefinition, useXP } from '../context/XPContext';
import { BottomSheet } from './BottomSheet';

function MiniBadgeGlyph({
  badge,
  unlocked,
  sizeClass = 'w-5 h-5'
}: {
  badge: BadgeDefinition;
  unlocked: boolean;
  sizeClass?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={`${sizeClass} shrink-0`} aria-hidden="true">
      <circle
        cx="16"
        cy="16"
        r="14"
        fill={unlocked ? badge.accentHex : '#cbd5e1'}
        stroke="#ffffff"
        strokeWidth="2"
      />
      {unlocked ? (
        <path
          d="M11 16.5 L14.5 20 L21.5 12.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <circle cx="16" cy="16" r="4" fill="#64748b" />
      )}
    </svg>
  );
}

interface NavbarBadgeButtonProps {
  onOpen: () => void;
  isOpen?: boolean;
  compact?: boolean;
}

export const NavbarBadgeButton: React.FC<NavbarBadgeButtonProps> = ({
  onOpen,
  isOpen = false,
  compact = false
}) => {
  const { isUrdu } = useLanguage();
  const { level, currentBadge } = useXP();

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={
        isUrdu
          ? `${currentBadge.titleUr} — لیول ${level}`
          : `${currentBadge.titleEn} — Level ${level}`
      }
      className={`${
        compact ? 'min-h-[34px] pl-1.5 pr-2' : 'min-h-[36px] pl-1.5 pr-2.5'
      } py-1 rounded-xl bg-[#edf5ef] hover:bg-[#dcebe1] border border-[#b9dac4] text-[#14532d] text-[11px] font-extrabold native-press whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532d]`}
    >
      <MiniBadgeGlyph badge={currentBadge} unlocked sizeClass="w-5 h-5" />
      <span className="font-mono tabular-nums">Lv.{level}</span>
    </button>
  );
};

interface LevelBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LevelBadgeModal: React.FC<LevelBadgeModalProps> = ({ isOpen, onClose }) => {
  const { isUrdu } = useLanguage();
  const {
    xp,
    level,
    levelProgressPercent,
    xpIntoLevel,
    xpForNextLevel,
    dailyStreak,
    streakFreezes,
    maxStreakFreezes,
    streakProtectedByFreeze,
    nextStreakMilestone,
    badges,
    unlockedBadges,
    currentBadge,
    nextBadge
  } = useXP();

  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const inspectedBadge =
    badges.find((b) => b.id === selectedBadgeId) ?? nextBadge ?? currentBadge;
  const inspectedUnlocked = level >= inspectedBadge.requiredLevel;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      dir={isUrdu ? 'rtl' : 'ltr'}
      maxWidthClass="max-w-lg"
      title={isUrdu ? currentBadge.titleUr : currentBadge.titleEn}
      subtitle={isUrdu ? `لیول ${level} · ${xp} XP` : `Level ${level} · ${xp} XP`}
      closeLabel={isUrdu ? 'بند کریں' : 'Close'}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] rounded-2xl bg-[#14532d] hover:bg-[#166534] text-white text-xs font-extrabold cursor-pointer"
        >
          {isUrdu ? 'بند کریں' : 'Done'}
        </button>
      }
    >
      <div className="space-y-4">
        {/* XP Level Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded-full bg-[#e7f3ec] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#166534] transition-all duration-300"
              style={{ width: `${Math.max(6, levelProgressPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#3d5947] tabular-nums">
            <span>
              {xpIntoLevel}/{xpForNextLevel} XP
            </span>
            <span>
              {nextBadge
                ? isUrdu
                  ? `اگلا لیول: ${nextBadge.requiredXp} XP`
                  : `Next unlock: ${nextBadge.requiredXp} XP`
                : isUrdu
                ? 'اعلیٰ ترین لیول'
                : 'Max rank unlocked'}
            </span>
          </div>
        </div>

        {/* Streak & Grace Freeze Summary Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[#f8fbf9] border border-[#cfe5d7] space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#13281c]">
              <Flame className="w-3.5 h-3.5 text-[#c2410c] shrink-0" />
              <span className="font-mono tabular-nums">
                {isUrdu ? `${dailyStreak} دن کا سلسلہ` : `${dailyStreak}d Streak`}
              </span>
            </div>
            <div className="text-[10px] text-[#3d5947] font-mono tabular-nums">
              {streakProtectedByFreeze
                ? isUrdu
                  ? 'گريس فریز سے محفوظ'
                  : 'Saved by Grace Freeze'
                : isUrdu
                ? `ہدف: ${nextStreakMilestone} دن`
                : `Milestone: ${nextStreakMilestone}d`}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#f8fbf9] border border-[#cfe5d7] space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#13281c]">
              <Shield className="w-3.5 h-3.5 text-[#14532d] shrink-0" />
              <span className="font-mono tabular-nums">
                {isUrdu
                  ? `${streakFreezes}/${maxStreakFreezes} فریز`
                  : `${streakFreezes}/${maxStreakFreezes} Freeze`}
              </span>
            </div>
            <div className="text-[10px] text-[#3d5947]">
              {isUrdu
                ? 'ہر 3 دن پر 1 فریز ملتا ہے'
                : '+1 earned every 3-day streak'}
            </div>
          </div>
        </div>

        {/* Interactive 6-Badge Shelf */}
        <div className="pt-2 border-t border-[#cfe5d7]/70 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#3d5947] tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#13281c]">
              <Award className="w-3.5 h-3.5 text-[#166534]" />
              {isUrdu ? 'فیلڈ بیجز' : 'Field Badges'}
            </span>
            <span>
              {unlockedBadges.length}/{badges.length}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {badges.map((badge) => {
              const unlocked = level >= badge.requiredLevel;
              const isSelected = inspectedBadge.id === badge.id;
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadgeId(badge.id)}
                  aria-label={`${isUrdu ? badge.titleUr : badge.titleEn} (Lv.${badge.requiredLevel})`}
                  className={`relative min-h-[44px] rounded-xl flex items-center justify-center native-press cursor-pointer border transition-colors ${
                    isSelected
                      ? 'bg-[#edf5ef] border-[#166534]'
                      : 'bg-white border-transparent hover:bg-[#f4f8f5]'
                  }`}
                >
                  <MiniBadgeGlyph badge={badge} unlocked={unlocked} sizeClass="w-8 h-8" />
                  {!unlocked && (
                    <Lock className="w-3 h-3 text-[#64748b] absolute bottom-1 right-1 bg-white rounded-full p-[1px]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Badge Details */}
          <div className="p-2.5 rounded-xl bg-[#f8fbf9] border border-[#cfe5d7] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#13281c] truncate">
                {isUrdu ? inspectedBadge.titleUr : inspectedBadge.titleEn}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#047857] shrink-0 tabular-nums">
                {inspectedUnlocked
                  ? isUrdu
                    ? `حاصل شدہ · Lv.${inspectedBadge.requiredLevel}`
                    : `Unlocked · Lv.${inspectedBadge.requiredLevel}`
                  : isUrdu
                  ? `${inspectedBadge.requiredXp} XP درکار`
                  : `Requires ${inspectedBadge.requiredXp} XP`}
              </span>
            </div>
            <p className="text-[11px] text-[#3d5947] leading-snug">
              {isUrdu ? inspectedBadge.howToEarnUr : inspectedBadge.howToEarnEn}
            </p>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export const NavbarBadgeControl: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <NavbarBadgeButton isOpen={isOpen} onOpen={() => setIsOpen(true)} />
      <LevelBadgeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
