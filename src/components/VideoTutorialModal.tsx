import React from 'react';
import { Play, CheckCircle2, Camera, Smartphone, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AppModal } from './AppModal';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryScanner?: () => void;
}

export const VideoTutorialModal: React.FC<VideoTutorialModalProps> = ({
  isOpen,
  onClose,
  onTryScanner
}) => {
  const { isUrdu } = useLanguage();

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isUrdu ? 'rtl' : 'ltr'}
      maxWidthClass="max-w-lg"
      bodyClassName="p-0"
      title={isUrdu ? 'پتا اسکین کرنے کی ویڈیو گائیڈ' : 'How to Scan a Tomato Leaf'}
      subtitle={isUrdu ? '15 سیکنڈ میں آسان طریقہ دیکھیں' : 'Quick 3-step field guide'}
      closeLabel={isUrdu ? 'بند کریں' : 'Close'}
      headerLeading={
        <div className="w-8 h-8 rounded-xl bg-[#edf5ef] text-[#14532d] flex items-center justify-center">
          <Play className="w-4 h-4 fill-[#14532d]" />
        </div>
      }
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-3 py-2 text-xs font-bold text-[#13281c] bg-[#faf8f2] border border-[#cbdcd0] hover:bg-[#edf5ef] rounded-xl cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
          {onTryScanner && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onTryScanner();
              }}
              className="flex-[1.6] min-h-[44px] px-4 py-2 text-xs font-extrabold text-white bg-[#14532d] hover:bg-[#166534] rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{isUrdu ? 'ابھی اسکین کریں' : 'Open Scanner'}</span>
            </button>
          )}
        </div>
      }
    >
      {/* Bounded Video Frame */}
      <div className="relative w-full bg-[#0c1b12] flex items-center justify-center overflow-hidden">
        <video
          src="/assets/aistudio/tutorial-demo__2__9e77b096.mp4"
          className="w-full max-h-[38dvh] object-contain"
          controls
          autoPlay
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Compact 3-Step Guide */}
      <div className="p-3.5 bg-white">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
            <Eye className="w-4 h-4 text-[#14532d] mx-auto mb-1" />
            <div className="font-bold text-[11px] text-[#13281c] leading-tight">
              {isUrdu ? '1. پتا چنیں' : '1. Pick Leaf'}
            </div>
            <div className="text-[10px] text-[#3d5947] mt-0.5 leading-tight">
              {isUrdu ? 'دھبوں والا پتا' : 'Spot or curl'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
            <Smartphone className="w-4 h-4 text-[#14532d] mx-auto mb-1" />
            <div className="font-bold text-[11px] text-[#13281c] leading-tight">
              {isUrdu ? '2. واضح تصویر' : '2. Clear Light'}
            </div>
            <div className="text-[10px] text-[#3d5947] mt-0.5 leading-tight">
              {isUrdu ? 'فون سیدھا رکھیں' : 'Hold steady'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
            <CheckCircle2 className="w-4 h-4 text-[#166534] mx-auto mb-1" />
            <div className="font-bold text-[11px] text-[#13281c] leading-tight">
              {isUrdu ? '3. آسان علاج' : '3. Get Steps'}
            </div>
            <div className="text-[10px] text-[#3d5947] mt-0.5 leading-tight">
              {isUrdu ? 'فوری رہنمائی' : 'Save & treat'}
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
};
