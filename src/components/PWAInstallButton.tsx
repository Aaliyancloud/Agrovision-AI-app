import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppModal } from './AppModal';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isUrdu } = useLanguage();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        title={isUrdu ? 'فون پر ایپ انسٹال کریں' : 'Install App on Phone / Tablet'}
        className={
          compact
            ? 'min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#14532d] hover:bg-[#166534] text-white text-[11px] font-bold cursor-pointer shrink-0'
            : 'min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14532d] hover:bg-[#166534] text-white text-xs font-bold cursor-pointer shrink-0'
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>
          {isUrdu ? (
            'ایپ'
          ) : (
            <>
              <span className="hidden sm:inline">Get </span>App
            </>
          )}
        </span>
      </button>

      <AppModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        dir={isUrdu ? 'rtl' : 'ltr'}
        maxWidthClass="max-w-sm"
        bodyClassName="p-4"
        title={isUrdu ? 'فون / ٹیبلیٹ پر ایپ انسٹال کریں' : 'Install on Phone or Tablet'}
        closeLabel={isUrdu ? 'بند کریں' : 'Close'}
        headerLeading={
          <div className="w-8 h-8 rounded-xl bg-[#14532d] text-white flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
        }
        footer={
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="w-full min-h-[44px] rounded-xl bg-[#14532d] hover:bg-[#166534] text-white text-xs font-extrabold cursor-pointer"
          >
            {isUrdu ? 'سمجھ آ گیا' : 'Got It'}
          </button>
        }
      >
        <div className="space-y-3 text-xs text-[#3d5947] leading-relaxed">
          {isIOS ? (
            <ol className="space-y-2 list-decimal list-inside text-[#13281c]">
              <li>
                {isUrdu
                  ? 'سفاری کے نیچے Share بٹن دبائیں۔'
                  : 'Tap the Share icon in your browser bar.'}
              </li>
              <li>
                {isUrdu
                  ? '"Add to Home Screen" منتخب کریں۔'
                  : 'Select "Add to Home Screen".'}
              </li>
            </ol>
          ) : (
            <ol className="space-y-2 list-decimal list-inside text-[#13281c]">
              <li>
                {isUrdu
                  ? 'اپنے موبائل کروم مینو (⋮) پر کلک کریں۔'
                  : 'Tap the browser menu (⋮) in the top corner.'}
              </li>
              <li>
                {isUrdu
                  ? '"Install app" یا "Add to Home screen" دبائیں — یہ بغیر براؤزر بار کے مکمل موبائل ایپ بن جائے گی۔'
                  : 'Tap "Install app" or "Add to Home screen" to run full-screen like a native app.'}
              </li>
            </ol>
          )}
        </div>
      </AppModal>
    </>
  );
};
