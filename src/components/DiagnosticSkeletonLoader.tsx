import React from 'react';
import { Check, Leaf, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DiagnosticSkeletonLoaderProps {
  progress: number;
  stepText: string;
  imageUri?: string | null;
}

export const DiagnosticSkeletonLoader: React.FC<DiagnosticSkeletonLoaderProps> = ({
  progress,
  stepText,
  imageUri
}) => {
  const { isUrdu } = useLanguage();

  const stageIndex = progress < 45 ? 1 : progress < 80 ? 2 : 3;

  return (
    <div className="w-full mt-5 pt-5 border-t border-[#cbdcd0]/70 native-view-enter space-y-4">
      {/* Clean Progress Header & Track */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[#13281c] truncate">
            {stepText ||
              (isUrdu
                ? 'ٹماٹر کے پتے کا تجزیہ کیا جا رہا ہے...'
                : 'Analyzing tomato leaf specimen...')}
          </span>
          <span className="font-mono font-bold text-[#047857] tabular-nums shrink-0">
            {progress}%
          </span>
        </div>

        <div
          className="w-full h-2 rounded-full bg-[#e7f3ec] overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[#059669] transition-all duration-300 ease-out"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
      </div>

      {/* Clean Preview + Shimmer Skeleton Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="relative rounded-2xl overflow-hidden border border-[#cfe5d7] bg-[#f8fbf9] aspect-[16/10] flex items-center justify-center">
          {imageUri ? (
            <img
              src={imageUri}
              alt={isUrdu ? 'زیرِ تجزیہ پتہ' : 'Specimen under analysis'}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full native-shimmer flex items-center justify-center">
              <Leaf className="w-8 h-8 text-[#059669]/40" />
            </div>
          )}

          {/* Restrained Botanical Sweep Line */}
          <div className="absolute inset-x-0 top-0 pointer-events-none">
            <div className="w-full h-0.5 bg-[#10b981] opacity-80 animate-laser-gpu" />
          </div>

          <div className="absolute bottom-2.5 left-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-white/92 backdrop-blur-md border border-[#cfe5d7] text-[11px] font-mono text-[#13281c] flex items-center justify-between shadow-xs">
            <span className="inline-flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="truncate">
                {stageIndex === 1
                  ? isUrdu
                    ? 'مرحلہ 1: پتے کی تصدیق'
                    : 'Stage 1: Leaf Verification'
                  : stageIndex === 2
                  ? isUrdu
                    ? 'مرحلہ 2: علامات کا جائزہ'
                    : 'Stage 2: Lesion Inspection'
                  : isUrdu
                  ? 'مرحلہ 3: علاج کی تیاری'
                  : 'Stage 3: Care Protocol'}
              </span>
            </span>
            <span className="font-bold text-[#047857] tabular-nums shrink-0">
              {stageIndex}/3
            </span>
          </div>
        </div>

        {/* 3-Step Clean Status Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          {[
            { id: 1, en: 'Species', ur: 'تصدیق', threshold: 38 },
            { id: 2, en: 'Symptoms', ur: 'علامات', threshold: 75 },
            { id: 3, en: 'Care Plan', ur: 'علاج', threshold: 95 }
          ].map((step) => {
            const done = progress >= step.threshold;
            const active = stageIndex === step.id && !done;
            return (
              <div
                key={step.id}
                className={`p-2 rounded-xl border transition-colors ${
                  done
                    ? 'bg-[#ecfdf5] border-emerald-300 text-[#064e3b] font-bold'
                    : active
                    ? 'bg-white border-[#059669] text-[#13281c] font-semibold'
                    : 'bg-[#f8fbf9] border-[#cfe5d7] text-[#52695b]'
                }`}
              >
                <div className="inline-flex items-center justify-center gap-1">
                  {done && <Check className="w-3 h-3 text-[#059669] shrink-0" />}
                  <span>{isUrdu ? step.ur : step.en}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Skeleton Shimmer Content Placeholders */}
        <div className="p-4 rounded-2xl bg-white border border-[#cfe5d7] space-y-3">
          <div className="h-4 w-2/5 rounded-lg native-shimmer" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-md native-shimmer" />
            <div className="h-3 w-5/6 rounded-md native-shimmer" />
            <div className="h-3 w-3/4 rounded-md native-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};
