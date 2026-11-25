import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bookmark,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  Lightbulb,
  Loader2,
  Search,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLearning } from '../context/LearningContext';
import {
  COURSE_GROUPS,
  CourseId,
  LEARNING_MODULES,
  LearningModule,
  getDailyAgriTip
} from '../data/learningModules';
import { MobilePlantLibrary } from './MobilePlantLibrary';

interface LearningCenterViewProps {
  onScanClick?: () => void;
  onAskAI?: (prompt: string) => void;
  defaultSubTab?: 'guides' | 'atlas';
}

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({
  onScanClick,
  onAskAI,
  defaultSubTab = 'guides'
}) => {
  const { isUrdu } = useLanguage();
  const { progressMap, completedCount, markModuleCompleted, toggleModuleBookmark } = useLearning();

  const [subTab, setSubTab] = useState<'guides' | 'atlas'>(defaultSubTab);
  const [courseFilter, setCourseFilter] = useState<'all' | 'saved' | CourseId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dailyTip = useMemo(() => getDailyAgriTip(), []);
  const activeModule = LEARNING_MODULES.find((m) => m.id === activeModuleId) || null;

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAudioPlaying(false);
    setIsAudioLoading(false);
  };

  useEffect(() => {
    stopAudio();
    return () => stopAudio();
  }, [activeModuleId, subTab]);

  const handleToggleListen = async (mod: LearningModule) => {
    if (isAudioPlaying || isAudioLoading) {
      stopAudio();
      return;
    }
    stopAudio();
    setIsAudioLoading(true);

    const speechText = isUrdu
      ? `${mod.titleUr}۔ ${mod.summaryUr}۔ کیا دیکھیں: ${mod.lookForUr}۔ اہم باتیں: ${mod.keyTakeawaysUr.join('۔ ')}۔ احتیاط: ${mod.avoidMistakeUr}۔`
      : `${mod.titleEn}. ${mod.summaryEn}. What to look for: ${mod.lookForEn}. Steps: ${mod.keyTakeawaysEn.join('. ')}. Avoid: ${mod.avoidMistakeEn}.`;

    try {
      const res = await fetch('/api/tts-urdu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText, isUrdu })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.audioBase64) {
          const audio = new Audio(`data:${json.format || 'audio/wav'};base64,${json.audioBase64}`);
          audioRef.current = audio;
          audio.onplay = () => {
            setIsAudioPlaying(true);
            setIsAudioLoading(false);
          };
          audio.onended = () => {
            setIsAudioPlaying(false);
            setIsAudioLoading(false);
            audioRef.current = null;
          };
          audio.onerror = () => playSpeechFallback(speechText);
          await audio.play();
          return;
        }
      }
    } catch {
      // fallback cleanly
    }
    playSpeechFallback(speechText);
  };

  const playSpeechFallback = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsAudioLoading(false);
      setIsAudioPlaying(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = isUrdu ? 'ur-PK' : 'en-US';
    utter.rate = 0.94;
    utter.onstart = () => {
      setIsAudioPlaying(true);
      setIsAudioLoading(false);
    };
    utter.onend = () => {
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
    };
    utter.onerror = () => {
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
    };
    window.speechSynthesis.speak(utter);
  };

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LEARNING_MODULES.filter((mod) => {
      const matchesCourse =
        courseFilter === 'all'
          ? true
          : courseFilter === 'saved'
          ? Boolean(progressMap[mod.id]?.bookmarked)
          : mod.courseId === courseFilter;
      if (!matchesCourse) return false;
      if (!q) return true;
      return (
        mod.titleEn.toLowerCase().includes(q) ||
        mod.titleUr.toLowerCase().includes(q) ||
        mod.summaryEn.toLowerCase().includes(q) ||
        mod.summaryUr.toLowerCase().includes(q) ||
        mod.lookForEn.toLowerCase().includes(q) ||
        mod.keyTakeawaysEn.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [courseFilter, searchQuery, progressMap]);

  const progressPct = Math.round((completedCount / LEARNING_MODULES.length) * 100);
  const showGroupedCourses = courseFilter === 'all' && !searchQuery.trim();

  const renderLessonCard = (mod: LearningModule) => {
    const rec = progressMap[mod.id];
    const courseBadge = COURSE_GROUPS.find((c) => c.id === mod.courseId);
    return (
      <div
        key={mod.id}
        className="rounded-2xl bg-white border border-[#cbdcd0] p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[#8bb398] transition-colors"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#5b7463]">
            <span className="font-bold text-[#14532d]">
              {isUrdu ? `${courseBadge?.badgeUr} · سبق ${mod.lessonNumber}` : `${courseBadge?.badgeEn} · Lesson ${mod.lessonNumber}`}
            </span>
            <span className={rec?.completed ? 'text-[#166534] font-bold' : ''}>
              {rec?.completed
                ? isUrdu
                  ? '✓ مکمل'
                  : '✓ Done'
                : `${mod.durationMinutes} min`}
            </span>
          </div>

          <h3 className="font-display font-bold text-sm text-[#13281c]">
            {isUrdu ? mod.titleUr : mod.titleEn}
          </h3>
          <p className="text-xs text-[#3d5947] line-clamp-2 leading-relaxed">
            {isUrdu ? mod.summaryUr : mod.summaryEn}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#cbdcd0]/60">
          <button
            type="button"
            onClick={() => void toggleModuleBookmark(mod.id)}
            aria-label={`Bookmark ${mod.titleEn}`}
            className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-[#edf5ef] flex items-center justify-center cursor-pointer"
          >
            <Bookmark
              className={`w-4 h-4 ${
                rec?.bookmarked ? 'fill-[#b45309] text-[#b45309]' : 'text-[#5b7463]'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleId(mod.id)}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#14532d] hover:underline cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'سبق پڑھیں' : 'Open Lesson'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Sub-Navigation (Farmer Courses | Disease Atlas) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#edf5ef] border border-[#cbdcd0]">
        <button
          type="button"
          onClick={() => setSubTab('guides')}
          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
            subTab === 'guides' ? 'bg-[#14532d] text-white shadow-xs' : 'text-[#2f4739]'
          }`}
        >
          {isUrdu
            ? `کسان کورسز (${completedCount}/${LEARNING_MODULES.length})`
            : `Courses (${completedCount}/${LEARNING_MODULES.length})`}
        </button>
        <button
          type="button"
          onClick={() => setSubTab('atlas')}
          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
            subTab === 'atlas' ? 'bg-[#14532d] text-white shadow-xs' : 'text-[#2f4739]'
          }`}
        >
          {isUrdu ? 'بیماریوں کی کتاب (10)' : 'Disease Atlas (10)'}
        </button>
      </div>

      {subTab === 'atlas' ? (
        <MobilePlantLibrary onScanClick={onScanClick} onAskAI={onAskAI} />
      ) : activeModule ? (
        <article className="rounded-2xl bg-white border border-[#cbdcd0] p-5 space-y-4 shadow-xs native-view-enter">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#cbdcd0]">
            <button
              type="button"
              onClick={() => setActiveModuleId(null)}
              className="text-xs font-bold text-[#14532d] hover:underline cursor-pointer"
            >
              ← {isUrdu ? 'تمام کورسز پر واپس جائیں' : 'Back to Courses'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleToggleListen(activeModule)}
                className={`min-h-[34px] px-3 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                  isAudioPlaying
                    ? 'bg-[#14532d] text-white border-[#14532d]'
                    : 'bg-[#edf5ef] text-[#14532d] border-[#cbdcd0] hover:bg-[#dcebe1]'
                }`}
              >
                {isAudioLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isAudioPlaying ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isAudioPlaying
                    ? isUrdu
                      ? 'بند کریں'
                      : 'Stop'
                    : isUrdu
                    ? 'سنیں'
                    : 'Listen'}
                </span>
              </button>

              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5b7463]">
                <Clock className="w-3.5 h-3.5" />
                {activeModule.durationMinutes}m
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono font-bold text-[#b45309] uppercase">
              {isUrdu
                ? `${COURSE_GROUPS.find((c) => c.id === activeModule.courseId)?.titleUr} · سبق ${activeModule.lessonNumber}`
                : `${COURSE_GROUPS.find((c) => c.id === activeModule.courseId)?.titleEn} · Lesson ${activeModule.lessonNumber}`}
            </div>
            <h2 className="font-display text-xl font-extrabold text-[#13281c] mt-0.5">
              {isUrdu ? activeModule.titleUr : activeModule.titleEn}
            </h2>
            <p className="text-xs text-[#3d5947] leading-relaxed mt-1.5">
              {isUrdu ? activeModule.summaryUr : activeModule.summaryEn}
            </p>
          </div>

          {/* Visual Look-For Box */}
          <div className="p-3.5 rounded-xl bg-[#edf5ef] border border-[#cbdcd0] flex items-start gap-2.5 text-xs text-[#13281c]">
            <Eye className="w-4 h-4 text-[#14532d] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5 text-[#14532d]">
                {isUrdu ? 'پودے میں کیا دیکھیں:' : 'What to Look For:'}
              </strong>
              <span className="leading-relaxed">
                {isUrdu ? activeModule.lookForUr : activeModule.lookForEn}
              </span>
            </div>
          </div>

          {/* Step-by-Step Care Takeaways */}
          <div className="p-4 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] space-y-2.5">
            <div className="text-[11px] font-mono uppercase font-bold text-[#14532d]">
              {isUrdu ? 'آسان عملی مراحل' : 'Simple Care Steps'}
            </div>
            <ul className="space-y-2 text-xs text-[#13281c] leading-relaxed">
              {(isUrdu ? activeModule.keyTakeawaysUr : activeModule.keyTakeawaysEn).map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistake Warning */}
          <div className="p-3.5 rounded-xl bg-[#fffbeb] border border-[#f59e0b]/45 flex items-start gap-2.5 text-xs text-[#78350f]">
            <AlertCircle className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">
                {isUrdu ? 'اس غلطی سے بچیں:' : 'Avoid This Mistake:'}
              </strong>
              <span>{isUrdu ? activeModule.avoidMistakeUr : activeModule.avoidMistakeEn}</span>
            </div>
          </div>

          {/* Field Action Step */}
          <div className="p-3.5 rounded-xl bg-[#edf5ef] border border-[#cbdcd0] flex items-start gap-2.5 text-xs text-[#13281c]">
            <Lightbulb className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">
                {isUrdu ? 'آج کا آسان کام:' : 'Do This Today:'}
              </strong>
              <span>{isUrdu ? activeModule.actionTipUr : activeModule.actionTipEn}</span>
            </div>
          </div>

          {/* Action Bar: Save + Complete + Ask AI Chat */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleModuleBookmark(activeModule.id)}
                className="min-h-[40px] px-3 py-2 rounded-xl border border-[#cbdcd0] bg-white hover:bg-[#edf5ef] text-xs font-bold text-[#13281c] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    progressMap[activeModule.id]?.bookmarked
                      ? 'fill-[#b45309] text-[#b45309]'
                      : 'text-[#5b7463]'
                  }`}
                />
                <span>
                  {progressMap[activeModule.id]?.bookmarked
                    ? isUrdu
                      ? 'محفوظ'
                      : 'Saved'
                    : isUrdu
                    ? 'محفوظ کریں'
                    : 'Save'}
                </span>
              </button>

              {onAskAI && (
                <button
                  type="button"
                  onClick={() =>
                    onAskAI(
                      isUrdu
                        ? `سبق "${activeModule.titleUr}" کے بارے میں مزید آسان رہنمائی دیں۔`
                        : `Give me quick practical tips about "${activeModule.titleEn}" for my tomato plants.`
                    )
                  }
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>{isUrdu ? 'اے آئی سے پوچھیں' : 'Ask AI Chat'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => void markModuleCompleted(activeModule.id)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                progressMap[activeModule.id]?.completed
                  ? 'bg-[#edf5ef] text-[#14532d] border border-[#8bb398]'
                  : 'bg-[#166534] hover:bg-[#14532d] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {progressMap[activeModule.id]?.completed
                  ? isUrdu
                    ? 'مکمل ہو چکا'
                    : 'Done'
                  : isUrdu
                  ? 'مکمل کریں (+20 XP)'
                  : 'Mark Done (+20 XP)'}
              </span>
            </button>
          </div>
        </article>
      ) : (
        <>
          {/* Daily Tip + Overall Course Progress */}
          <div className="rounded-2xl bg-[#14532d] p-4 sm:p-5 text-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#fef3c7] font-bold">
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#f59e0b]" />
                {isUrdu ? dailyTip.tagUr : dailyTip.tagEn}
              </span>
              <span>
                {progressPct}% {isUrdu ? 'کورس مکمل' : 'Courses Done'}
              </span>
            </div>
            <h2 className="relative z-10 font-display text-base sm:text-lg font-extrabold">
              {isUrdu ? dailyTip.titleUr : dailyTip.titleEn}
            </h2>
            <p className="relative z-10 text-xs text-white/90 leading-relaxed">
              {isUrdu ? dailyTip.bodyUr : dailyTip.bodyEn}
            </p>
            <div className="relative z-10 pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveModuleId(dailyTip.linkedModuleId)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#edf5ef] text-[#14532d] text-xs font-extrabold cursor-pointer"
              >
                {isUrdu ? 'متعلقہ سبق کھولیں →' : 'Read Lesson →'}
              </button>
              <div className="w-28 h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-[#f59e0b]" style={{ width: `${Math.max(8, progressPct)}%` }} />
              </div>
            </div>
          </div>

          {/* Search Courses Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#5b7463] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isUrdu
                  ? 'کورس یا سبق تلاش کریں (مثلاً: سفید مکھی، پانی، جھلساؤ)...'
                  : 'Search courses by topic (e.g. blight, watering, whitefly)...'
              }
              className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-2xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] placeholder-[#5b7463] focus:outline-none focus:ring-2 focus:ring-[#166534]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear course search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5b7463] hover:text-[#13281c] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Course Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {([
              { id: 'all', en: 'All Courses', ur: 'تمام کورسز' },
              { id: 'saved', en: 'Saved', ur: 'محفوظ' },
              { id: 'basics', en: '1. Basics', ur: '1. بنیادی' },
              { id: 'diseases', en: '2. Diseases', ur: '2. بیماریاں' },
              { id: 'soil_climate', en: '3. Soil & Heat', ur: '3. مٹی و موسم' }
            ] as const).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCourseFilter(cat.id)}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  courseFilter === cat.id
                    ? 'bg-[#14532d] text-white'
                    : 'bg-white border border-[#cbdcd0] text-[#3d5947] hover:text-[#13281c]'
                }`}
              >
                {isUrdu ? cat.ur : cat.en}
              </button>
            ))}
          </div>

          {filteredModules.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#cbdcd0] p-8 text-center space-y-2">
              <GraduationCap className="w-7 h-7 text-[#94a3b8] mx-auto" />
              <p className="text-xs text-[#3d5947]">
                {courseFilter === 'saved'
                  ? isUrdu
                    ? 'ابھی کوئی سبق محفوظ نہیں ہے۔ کسی سبق پر بک مارک دبائیں۔'
                    : 'No saved lessons yet. Tap the bookmark icon on any lesson.'
                  : isUrdu
                  ? 'آپ کی تلاش سے کوئی سبق نہیں ملا۔'
                  : 'No matching course lessons found.'}
              </p>
            </div>
          ) : showGroupedCourses ? (
            <div className="space-y-5">
              {COURSE_GROUPS.map((group) => {
                const groupLessons = LEARNING_MODULES.filter((m) => m.courseId === group.id);
                const doneInGroup = groupLessons.filter((m) => progressMap[m.id]?.completed).length;
                return (
                  <section key={group.id} className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div>
                        <div className="text-[10px] font-mono font-bold uppercase text-[#b45309]">
                          {isUrdu ? group.badgeUr : group.badgeEn}
                        </div>
                        <h3 className="font-display font-extrabold text-sm text-[#13281c]">
                          {isUrdu ? group.titleUr : group.titleEn}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#14532d] bg-[#edf5ef] border border-[#cbdcd0] px-2.5 py-1 rounded-full">
                        {doneInGroup}/{groupLessons.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupLessons.map(renderLessonCard)}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredModules.map(renderLessonCard)}
            </div>
          )}

          {/* Verified Pakistan Agri Helplines & Anti-Fake Input Reference */}
          <section className="rounded-2xl bg-[#faf8f2] border border-[#cbdcd0] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#cbdcd0]">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase text-[#14532d]">
                  {isUrdu ? 'پاکستان زرعی تصدیق و ہیلپ لائن' : 'PAKISTAN VERIFIED FIELD REFERENCE'}
                </div>
                <h3 className="font-display text-sm font-extrabold text-[#13281c]">
                  {isUrdu ? 'مفت زرعی ہیلپ لائنز اور نقلی دوا سے بچاؤ' : 'Agri Helplines & Anti-Fake Spray Checklist'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModuleId('anti_fake_spray_verification')}
                className="text-xs font-bold text-[#14532d] hover:underline cursor-pointer"
              >
                {isUrdu ? 'مکمل گائیڈ کھولیں →' : 'Read Full Guide →'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-[#cbdcd0] space-y-1.5">
                <div className="font-bold text-[#14532d]">
                  {isUrdu ? 'سرکاری زرعی ہیلپ لائن نمبرز' : 'Official Agriculture Extension Contacts'}
                </div>
                <div className="space-y-1 font-mono text-[11px] text-[#13281c] tabular-nums">
                  <div>
                    {isUrdu ? 'پنجاب زرعی ہیلپ لائن:' : 'Punjab Agri Helpline (Toll-Free):'}{' '}
                    <a href="tel:080017000" className="font-bold text-[#14532d] underline">
                      0800-17000
                    </a>
                  </div>
                  <div>
                    {isUrdu ? 'این اے آر سی / پی اے آر سی:' : 'PARC / NARC Islamabad:'}{' '}
                    <a href="tel:+925190733800" className="font-bold text-[#14532d] underline">
                      +92 51 90733800
                    </a>
                  </div>
                </div>
                <p className="text-[11px] text-[#5b7463] leading-relaxed">
                  {isUrdu
                    ? 'سندھ، کے پی اور بلوچستان میں قریبی تحصیل زرعی دفتر / پیسٹ وارننگ سے مٹی اور پتے کی جانچ کروائیں۔'
                    : 'Contact your nearest District Pest Warning & Quality Control office for lab tests or counterfeit batch checks.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#cbdcd0] space-y-1.5">
                <div className="font-bold text-[#b45309]">
                  {isUrdu ? 'اسپرے خریدتے وقت 4 لازمی چیک' : '4 Checks Before Buying Any Spray'}
                </div>
                <ul className="space-y-1 text-[11px] text-[#3d5947] list-disc list-inside leading-relaxed">
                  <li>
                    {isUrdu
                      ? 'ڈیلر سے بیچ نمبر والی پکی رسید ضرور لیں'
                      : 'Take a printed invoice showing product batch number'}
                  </li>
                  <li>
                    {isUrdu
                      ? 'ڈھکن کے نیچے محفوظ ایلومینیم مہر (Seal) چیک کریں'
                      : 'Verify intact aluminum induction foil seal under cap'}
                  </li>
                  <li>
                    {isUrdu
                      ? 'بوتل پر پرنٹ تاریخِ تنسیخ (Expiry) دیکھیں'
                      : 'Check embossed manufacturing & expiry dates'}
                  </li>
                  <li>
                    {isUrdu
                      ? 'کھلی یا بغیر لیبل بوتل ہرگز استعمال نہ کریں'
                      : 'Avoid unsealed, repackaged, or unmarked bottles'}
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
