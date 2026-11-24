import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Bot,
  Camera,
  Check,
  ChevronRight,
  Droplets,
  Leaf,
  Search,
  ShieldCheck,
  Thermometer,
  Wind,
  X
} from 'lucide-react';
import { TOMATO_DISEASES } from '../data/tomatoDiseases';
import { DiseaseInfo, PathogenType } from '../types/disease';
import { useLanguage } from '../context/LanguageContext';
import { useOptionalXP } from '../context/XPContext';

interface MobilePlantLibraryProps {
  onScanClick?: () => void;
  onAskAI?: (prompt: string) => void;
}

const BOOKMARKS_STORAGE_KEY = 'agrovision_library_bookmarks_v1';

function readBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getUrduName(id: string, fallback: string): string {
  switch (id) {
    case 'early_blight':
      return 'ارلی بلائیٹ (ابتدائی جھلساؤ)';
    case 'late_blight':
      return 'لیٹ بلائیٹ (شدید جھلساؤ)';
    case 'bacterial_spot':
      return 'بیکٹیریل اسپاٹ (سیاہ دھبے)';
    case 'yellow_leaf_curl':
      return 'پیلا پتہ مروڑ وائرس';
    case 'healthy':
      return 'صحت مند ٹماٹر کا پودا';
    case 'septoria_leaf_spot':
      return 'سیپٹوریا لیف اسپاٹ';
    case 'spider_mites':
      return 'دو دھبے والی لال مکڑی';
    case 'target_spot':
      return 'ٹارگٹ اسپاٹ';
    case 'mosaic_virus':
      return 'ٹماٹر کا موزیک وائرس';
    case 'leaf_mold':
      return 'پتوں کی پیلی پھپھوندی';
    default:
      return fallback;
  }
}

function getPathogenStyle(type: PathogenType) {
  switch (type) {
    case 'Healthy':
      return { text: 'text-[#166534]', bar: 'bg-[#166534]' };
    case 'Viral':
      return { text: 'text-[#b45309]', bar: 'bg-[#b45309]' };
    case 'Bacterial':
      return { text: 'text-[#7c2d12]', bar: 'bg-[#7c2d12]' };
    case 'Pest':
      return { text: 'text-[#92400e]', bar: 'bg-[#d97706]' };
    default:
      return { text: 'text-[#991b1b]', bar: 'bg-[#b91c1c]' };
  }
}

export const MobilePlantLibrary: React.FC<MobilePlantLibraryProps> = ({
  onScanClick,
  onAskAI
}) => {
  const { isUrdu } = useLanguage();
  const xpCtx = useOptionalXP();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Saved' | PathogenType>('All');
  const [activeDiseaseId, setActiveDiseaseId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'symptoms' | 'care' | 'climate'>('symptoms');
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks());
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const readerSwipeStartRef = React.useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch {
      // Ignore storage quota errors
    }
  }, [bookmarks]);

  useEffect(() => {
    if (activeDiseaseId) {
      xpCtx?.completeMissionByEvent('explore_library');
    }
  }, [activeDiseaseId, xpCtx]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const activeDisease: DiseaseInfo | null =
    activeDiseaseId ? TOMATO_DISEASES.find((d) => d.id === activeDiseaseId) ?? null : null;

  const filterTabs: { key: 'All' | 'Saved' | PathogenType; label: string }[] = [
    { key: 'All', label: isUrdu ? 'تمام' : 'All' },
    { key: 'Saved', label: isUrdu ? 'محفوظ' : 'Saved' },
    { key: 'Fungal', label: isUrdu ? 'فنگس' : 'Fungal' },
    { key: 'Bacterial', label: isUrdu ? 'بیکٹیریا' : 'Bacterial' },
    { key: 'Viral', label: isUrdu ? 'وائرس' : 'Viral' },
    { key: 'Pest', label: isUrdu ? 'کیڑے' : 'Pest' },
    { key: 'Healthy', label: isUrdu ? 'صحت مند' : 'Healthy' }
  ];

  const filteredDiseases = TOMATO_DISEASES.filter((disease) => {
    const matchesCategory =
      selectedFilter === 'All'
        ? true
        : selectedFilter === 'Saved'
        ? bookmarks.includes(disease.id)
        : disease.pathogenType === selectedFilter;

    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      disease.name.toLowerCase().includes(q) ||
      disease.scientificName.toLowerCase().includes(q) ||
      disease.description.toLowerCase().includes(q) ||
      disease.primarySymptoms.some((s) => s.toLowerCase().includes(q)) ||
      getUrduName(disease.id, disease.name).toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });

  if (activeDisease) {
    const style = getPathogenStyle(activeDisease.pathogenType);
    const isBookmarked = bookmarks.includes(activeDisease.id);
    const imgBroken = Boolean(failedImages[activeDisease.id]);

    return (
      <section
        key={activeDisease.id}
        onTouchStart={(e) => {
          const t = e.touches[0];
          readerSwipeStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (!readerSwipeStartRef.current) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - readerSwipeStartRef.current.x;
          const dy = t.clientY - readerSwipeStartRef.current.y;
          readerSwipeStartRef.current = null;
          if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.6) {
            if ((!isUrdu && dx > 0) || (isUrdu && dx < 0)) {
              setActiveDiseaseId(null);
              setDetailTab('symptoms');
            }
          }
        }}
        className="rounded-2xl bg-white border border-[#cfe5d7] overflow-hidden shadow-xs native-view-enter"
      >
        {/* Native Reader Top Bar */}
        <div className="px-3.5 py-2.5 border-b border-[#cfe5d7]/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveDiseaseId(null);
              setDetailTab('symptoms');
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-extrabold text-[#047857] native-press cursor-pointer"
          >
            {isUrdu ? (
              <ArrowRight className="w-4 h-4 shrink-0" />
            ) : (
              <ArrowLeft className="w-4 h-4 shrink-0" />
            )}
            <span>{isUrdu ? 'لائبریری' : 'Library'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleBookmark(activeDisease.id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
            className={`min-h-[44px] px-2.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-bold native-press cursor-pointer ${
              isBookmarked
                ? 'bg-emerald-50 text-[#047857]'
                : 'text-[#3d5947] hover:bg-[#f4f8f5]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#059669] text-[#059669]' : ''}`} />
            <span>{isBookmarked ? (isUrdu ? 'محفوظ' : 'Saved') : isUrdu ? 'محفوظ کریں' : 'Save'}</span>
          </button>
        </div>

        {/* Specimen Photo Header */}
        <div className="relative h-44 w-full bg-[#edf5ef] overflow-hidden">
          {!imgBroken ? (
            <img
              src={activeDisease.sampleImageUrl}
              alt={activeDisease.name}
              referrerPolicy="no-referrer"
              onError={() =>
                setFailedImages((prev) => ({ ...prev, [activeDisease.id]: true }))
              }
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#047857]">
              <Leaf className="w-8 h-8" />
              <span className="text-xs font-semibold">{activeDisease.name}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-200">
              {activeDisease.pathogenType} · {activeDisease.typicalSeverity}
            </div>
            <h2 className="font-display text-lg font-extrabold leading-snug mt-0.5">
              {isUrdu ? getUrduName(activeDisease.id, activeDisease.name) : activeDisease.name}
            </h2>
            <p className="text-[11px] italic text-white/80">{activeDisease.scientificName}</p>
          </div>
        </div>

        {/* Reader Body */}
        <div className="p-4 space-y-4">
          <p className="text-xs text-[#2f4739] leading-relaxed">{activeDisease.description}</p>

          {/* Clean Segmented Sub-Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#e7f3ec] border border-[#cfe5d7]">
            {(
              [
                { id: 'symptoms', label: isUrdu ? 'علامات' : 'Symptoms' },
                { id: 'care', label: isUrdu ? 'علاج' : 'Care Steps' },
                { id: 'climate', label: isUrdu ? 'موسم' : 'Climate' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDetailTab(tab.id)}
                className={`min-h-[38px] px-2 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  detailTab === tab.id
                    ? 'bg-white text-[#064e3b] shadow-xs'
                    : 'text-[#2f4739] hover:text-[#13281c]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {detailTab === 'symptoms' && (
            <div key="symptoms" className="space-y-3 native-view-enter">
              <ul className="space-y-2">
                {activeDisease.primarySymptoms.map((symptom, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-[#13281c] leading-relaxed"
                  >
                    <Check className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>

              {activeDisease.earlyStageSigns.length > 0 && (
                <div className="pt-3 border-t border-[#cfe5d7]/70 space-y-1.5">
                  <div className="text-[11px] font-mono uppercase font-bold text-[#3d5947]">
                    {isUrdu ? 'ابتدائی نشانیاں' : 'Early Stage Signs'}
                  </div>
                  <ul className="space-y-1 text-xs text-[#2f4739] list-disc list-inside leading-relaxed">
                    {activeDisease.earlyStageSigns.map((sign, idx) => (
                      <li key={idx}>{sign}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {detailTab === 'care' && (
            <div key="care" className="space-y-3.5 native-view-enter">
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase font-bold text-[#047857]">
                  {isUrdu ? 'قدرتی اور نامیاتی علاج' : 'Organic Remedies'}
                </div>
                <ol className="space-y-2 text-xs text-[#13281c] leading-relaxed">
                  {activeDisease.treatment.organic.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#e7f3ec] text-[#064e3b] font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {activeDisease.treatment.prevention.length > 0 && (
                <div className="pt-3 border-t border-[#cfe5d7]/70 space-y-2">
                  <div className="text-[11px] font-mono uppercase font-bold text-[#3d5947] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                    <span>{isUrdu ? 'حفاظتی تدابیر' : 'Prevention'}</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#2f4739] list-disc list-inside leading-relaxed">
                    {activeDisease.treatment.prevention.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {detailTab === 'climate' && (
            <div key="climate" className="divide-y divide-[#cfe5d7]/70 text-xs native-view-enter">
              <div className="py-2.5 flex items-start gap-3">
                <Thermometer className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#13281c]">
                    {isUrdu ? 'موزوں درجہ حرارت' : 'Favorable Temperature'}
                  </div>
                  <div className="text-[#2f4739] mt-0.5">
                    {activeDisease.favorableConditions.temperature}
                  </div>
                </div>
              </div>
              <div className="py-2.5 flex items-start gap-3">
                <Droplets className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#13281c]">
                    {isUrdu ? 'نمی کی سطح' : 'Humidity Threshold'}
                  </div>
                  <div className="text-[#2f4739] mt-0.5">
                    {activeDisease.favorableConditions.humidity}
                  </div>
                </div>
              </div>
              <div className="py-2.5 flex items-start gap-3">
                <Wind className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#13281c]">
                    {isUrdu ? 'پھیلاؤ کا ذریعہ' : 'Spread Vector'}
                  </div>
                  <div className="text-[#2f4739] mt-0.5">
                    {activeDisease.favorableConditions.spreadVector}
                  </div>
                </div>
              </div>
              <div className="pt-2.5 flex items-center justify-between text-[11px] font-mono text-[#3d5947]">
                <span>{isUrdu ? 'پھیلاؤ کا خطرہ' : 'Contagion Risk'}</span>
                <span className={`font-bold ${style.text}`}>{activeDisease.contagionRisk}</span>
              </div>
            </div>
          )}

          {(onScanClick || onAskAI) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onScanClick && (
                <button
                  type="button"
                  onClick={onScanClick}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isUrdu ? 'اپنا پتہ اسکین کریں' : 'Scan a Leaf'}</span>
                </button>
              )}
              {onAskAI && (
                <button
                  type="button"
                  onClick={() =>
                    onAskAI(
                      isUrdu
                        ? `ٹماٹر کی بیماری "${getUrduName(activeDisease.id, activeDisease.name)}" کے علاج اور بچاؤ کا آسان طریقہ بتائیں۔`
                        : `How do I treat and stop ${activeDisease.name} on my tomato plants? Give simple steps.`
                    )
                  }
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>{isUrdu ? 'اے آئی چیٹ سے پوچھیں' : 'Ask AI Chat'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white border border-[#cfe5d7] p-4 space-y-3.5 shadow-xs native-view-enter">
      {/* Clean Library Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#cfe5d7]/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#e7f3ec] text-[#047857] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-extrabold text-[#13281c] truncate">
              {isUrdu ? 'پودوں کی لائبریری' : 'Plant Care Library'}
            </h2>
            <p className="text-[11px] font-mono text-[#3d5947] tabular-nums">
              {TOMATO_DISEASES.length} {isUrdu ? 'مستند پروفائلز' : 'Reference Guides'} ·{' '}
              {bookmarks.length} {isUrdu ? 'محفوظ' : 'Saved'}
            </p>
          </div>
        </div>
      </div>

      {/* Library Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#3d5947] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isUrdu ? 'لائبریری میں بیماری یا علاج تلاش کریں...' : 'Search library by name or symptom...'
          }
          className="w-full min-h-[42px] pl-9 pr-8 py-2 rounded-xl bg-[#f8fbf9] border border-[#cfe5d7] text-xs text-[#13281c] placeholder-[#3d5947]/70 focus:outline-none focus:border-[#059669]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3d5947] hover:text-[#13281c] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Library Shelves Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedFilter(tab.key)}
              className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#064e3b] text-white'
                  : 'bg-[#f1f6f3] text-[#2f4739] hover:bg-[#e3eee7]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Native Book/Catalog Rows */}
      {filteredDiseases.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <BookOpen className="w-7 h-7 text-[#94a3b8] mx-auto" />
          <p className="text-xs text-[#3d5947]">
            {selectedFilter === 'Saved'
              ? isUrdu
                ? 'ابھی تک کوئی گائیڈ محفوظ نہیں کی گئی۔'
                : 'No saved guides yet. Tap the bookmark icon on any entry.'
              : isUrdu
              ? 'کوئی متعلقہ ریکارڈ نہیں ملا۔'
              : 'No matching entries in the library.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#cfe5d7]/70">
          {filteredDiseases.map((disease) => {
            const style = getPathogenStyle(disease.pathogenType);
            const isBookmarked = bookmarks.includes(disease.id);
            const imgBroken = Boolean(failedImages[disease.id]);

            return (
              <div
                key={disease.id}
                className="py-2.5 first:pt-1 last:pb-1 flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => setActiveDiseaseId(disease.id)}
                  className="flex-1 min-w-0 min-h-[56px] flex items-center gap-3 text-start native-press cursor-pointer group"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#edf5ef] border border-[#cfe5d7] shrink-0">
                    {!imgBroken ? (
                      <img
                        src={disease.sampleImageUrl}
                        alt={disease.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [disease.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#059669]">
                        <Leaf className="w-5 h-5" />
                      </div>
                    )}
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-0 right-0 h-1 ${style.bar}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xs font-extrabold text-[#13281c] truncate group-hover:text-[#047857] transition-colors">
                      {isUrdu ? getUrduName(disease.id, disease.name) : disease.name}
                    </div>
                    <div className="text-[11px] italic text-[#3d5947] truncate">
                      {disease.scientificName}
                    </div>
                    <div className="text-[10px] font-mono text-[#3d5947] mt-0.5 flex items-center gap-1.5">
                      <span className={`font-bold ${style.text}`}>{disease.pathogenType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{disease.typicalSeverity}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#3d5947] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={(e) => toggleBookmark(disease.id, e)}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark entry'}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#3d5947] hover:bg-[#f1f6f3] cursor-pointer shrink-0"
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      isBookmarked ? 'fill-[#059669] text-[#059669]' : 'text-[#64748b]'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
