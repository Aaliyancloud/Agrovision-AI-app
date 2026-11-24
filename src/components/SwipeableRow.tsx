import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  onDelete: () => void;
  deleteLabel?: string;
  isRtl?: boolean;
  children: React.ReactNode;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  onDelete,
  deleteLabel = 'Delete',
  isRtl = false,
  children
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const lockedAxisRef = useRef<'x' | 'y' | null>(null);

  const REVEAL_WIDTH = 76;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    startXRef.current = t.clientX;
    startYRef.current = t.clientY;
    lockedAxisRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startXRef.current === null || startYRef.current === null) return;
    const t = e.touches[0];
    const dx = t.clientX - startXRef.current;
    const dy = t.clientY - startYRef.current;

    if (!lockedAxisRef.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      lockedAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (lockedAxisRef.current !== 'x') return;

    // Reveal direction: swipe left in LTR, swipe right in RTL
    if (!isRtl) {
      const clamped = Math.min(12, Math.max(-REVEAL_WIDTH - 16, dx));
      setOffsetX(clamped);
    } else {
      const clamped = Math.max(-12, Math.min(REVEAL_WIDTH + 16, dx));
      setOffsetX(clamped);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    startXRef.current = null;
    startYRef.current = null;

    if (lockedAxisRef.current !== 'x') {
      lockedAxisRef.current = null;
      return;
    }
    lockedAxisRef.current = null;

    const revealed = isRtl ? offsetX >= 36 : offsetX <= -36;
    setOffsetX(revealed ? (isRtl ? REVEAL_WIDTH : -REVEAL_WIDTH) : 0);
  };

  const isRevealed = isRtl ? offsetX > 10 : offsetX < -10;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Revealed Trailing Delete Action */}
      <div
        className={`absolute inset-y-0 ${
          isRtl ? 'left-0 justify-start' : 'right-0 justify-end'
        } flex items-center px-1 transition-opacity duration-150 ${
          isRevealed ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setOffsetX(0);
            onDelete();
          }}
          aria-label={deleteLabel}
          className="h-[calc(100%-8px)] min-w-[68px] px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 native-press cursor-pointer"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>{deleteLabel}</span>
        </button>
      </div>

      {/* Foreground Row Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={() => {
          if (isRevealed) setOffsetX(0);
        }}
        className="relative bg-white touch-pan-y"
        style={{
          transform: `translate3d(${offsetX}px, 0, 0)`,
          transition: isSwiping ? 'none' : 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
};
