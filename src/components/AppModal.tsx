import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  closeLabel?: string;
  dir?: 'ltr' | 'rtl';
  variant?: 'dialog' | 'sheet';
  headerTone?: 'light' | 'forest';
  headerLeading?: React.ReactNode;
  maxWidthClass?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  showTextCloseButton?: boolean;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  closeLabel = 'Close',
  dir = 'ltr',
  variant = 'dialog',
  headerTone = 'light',
  headerLeading,
  maxWidthClass = 'max-w-md',
  bodyClassName = 'p-4 sm:p-5',
  footer,
  showTextCloseButton = true,
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isForest = headerTone === 'forest';
  const isSheet = variant === 'sheet';

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 z-[100] flex justify-center bg-[#13281c]/65 backdrop-blur-sm animate-in fade-in duration-150 ${
        isSheet ? 'items-end sm:items-center' : 'items-center'
      }`}
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))'
      }}
    >
      <div
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidthClass} max-h-full flex flex-col overflow-hidden border shadow-2xl ${
          isSheet
            ? 'rounded-3xl bg-white border-[#cfe5d7] native-sheet-enter'
            : 'rounded-3xl bg-[#faf8f2] border-[#cbdcd0] native-view-enter'
        }`}
      >
        {/* Pinned Non-Scrolling Header with Prominent Safe-Area Close Button */}
        <div
          className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
            isForest
              ? 'bg-[#14532d] border-[#166534] text-white'
              : 'bg-white border-[#cbdcd0] text-[#13281c]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {headerLeading && <div className="shrink-0">{headerLeading}</div>}
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-sm sm:text-base leading-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <p
                  className={`text-[11px] truncate mt-0.5 ${
                    isForest ? 'text-[#dcfce7]' : 'text-[#3d5947]'
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={`min-h-[44px] ${
              showTextCloseButton ? 'px-3.5 gap-1.5' : 'min-w-[44px] px-2'
            } rounded-full inline-flex items-center justify-center text-xs font-extrabold transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 ${
              isForest
                ? 'bg-white/15 hover:bg-white/25 text-white border border-white/25 focus-visible:ring-white'
                : 'bg-[#edf5ef] hover:bg-[#dcebe1] text-[#14532d] border border-[#b9dac4] focus-visible:ring-[#14532d]'
            }`}
          >
            <X className="w-4 h-4 shrink-0" />
            {showTextCloseButton && <span>{closeLabel}</span>}
          </button>
        </div>

        {/* Guaranteed Viewport-Contained Scrollable Body */}
        <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${bodyClassName}`}>
          {children}
        </div>

        {/* Optional Pinned Footer */}
        {footer && (
          <div
            className={`px-4 sm:px-5 py-3 border-t shrink-0 ${
              isSheet ? 'bg-white border-[#cfe5d7]' : 'bg-white border-[#cbdcd0]'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
