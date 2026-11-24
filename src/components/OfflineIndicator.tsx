import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from '../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isUrdu } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="no-print fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 flex items-center gap-2 rounded-xl bg-[#13281c] border border-[#4a7c5d] px-3.5 py-2 text-xs font-semibold text-[#faf8f2] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#cbdcd0] shrink-0" />
      <span className="truncate">
        {isUrdu
          ? 'آف لائن فیلڈ موڈ — محفوظ تشخیص اور ڈیٹا فعال ہے'
          : 'Offline Mode — Cached scanner & care library active'}
      </span>
    </div>
  );
};
