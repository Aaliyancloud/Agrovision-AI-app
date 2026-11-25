import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  closeLabel?: string;
  dir?: 'ltr' | 'rtl';
  maxWidthClass?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  closeLabel = 'Close',
  dir = 'ltr',
  maxWidthClass = 'max-w-[440px]',
  footer,
  children
}) => {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDragOffsetY(0);
      setIsDragging(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = e.clientY;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const delta = e.clientY - dragStartYRef.current;
    const nextOffset = delta < 0 ? Math.max(-16, delta * 0.22) : Math.min(240, delta);
    setDragOffsetY(nextOffset);
  };

  const finishDrag = () => {
    if (dragStartYRef.current === null) return;
    const shouldClose = dragOffsetY >= 72;
    dragStartYRef.current = null;
    setIsDragging(false);
    setDragOffsetY(0);
    if (shouldClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#13281c]/65 backdrop-blur-sm animate-in fade-in duration-150"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClass} max-h-full rounded-3xl bg-white border border-[#cfe5d7] shadow-[0_18px_48px_rgba(19,40,28,0.28)] native-sheet-enter flex flex-col overflow-hidden`}
        style={{
          transform: dragOffsetY !== 0 ? `translate3d(0, ${dragOffsetY}px, 0)` : undefined,
          transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {/* Isolated Drag Pill (never intercepts clicks on title/close button) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          className="pt-2.5 pb-1 flex justify-center touch-none select-none cursor-grab active:cursor-grabbing shrink-0 sm:hidden"
        >
          <div className="w-10 h-1.5 rounded-full bg-[#cbdcd0]" />
        </div>

        {/* Pinned Non-Scrolling Header with Prominent >=44px Close Button */}
        <div className="px-4 py-3 border-b border-[#cfe5d7] bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="font-display text-sm sm:text-base font-extrabold text-[#13281c] truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] font-mono text-[#3d5947] truncate tabular-nums mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="min-h-[44px] px-3.5 rounded-full inline-flex items-center justify-center gap-1.5 bg-[#edf5ef] hover:bg-[#dcebe1] border border-[#b9dac4] text-[#14532d] text-xs font-extrabold native-press cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532d]"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>{closeLabel}</span>
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 min-h-0 px-4 py-3.5 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="px-4 py-3 border-t border-[#cfe5d7] bg-[#faf8f2] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
