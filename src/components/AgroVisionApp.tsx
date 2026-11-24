import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Cloud,
  Compass,
  Download,
  Droplets,
  Flame,
  FlaskConical,
  Globe,
  Home,
  Leaf,
  Lightbulb,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
  Zap
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSensors } from '../context/SensorContext';
import { useScanHistory, ScanHistoryEntry } from '../context/ScanHistoryContext';
import { usePlantJourney } from '../context/PlantJourneyContext';
import { MissionId, useXP } from '../context/XPContext';
import {
  evaluateGrowthStageAlert,
  GROWTH_STAGE_CONFIGS,
  GrowthStage
} from '../data/growthStageAlerts';
import { getDailyAgriTip } from '../data/learningModules';
import { LiveWeatherSnapshot, WeatherAlertCard } from './WeatherAlertCard';
import { SmartSensorSection } from './SmartSensorSection';
import { FieldMessengerView } from './FieldMessengerView';
import { PlantJourneyView } from './PlantJourneyView';
import { LearningCenterView } from './LearningCenterView';
import { ProfileView } from './ProfileView';
import { PlantScheduleCard } from './PlantScheduleCard';
import { LevelBadgeModal, NavbarBadgeButton } from './NavbarBadgeControl';
import { AuthModal } from './AuthModal';
import { SwipeableRow } from './SwipeableRow';
import { AppBotanicalBackdrop, HangingBranchMoss } from './BotanicalMotifs';
import { PWAInstallButton } from './PWAInstallButton';
import { hapticScanTap } from '../utils/haptics';
import type { DiagnosticExternalAction } from './DiagnosticStudio';

const DiagnosticStudio = lazy(() =>
  import('./DiagnosticStudio').then((m) => ({ default: m.DiagnosticStudio }))
);

export type AppTab =
  | 'home'
  | 'plants'
  | 'scan'
  | 'care'
  | 'learn'
  | 'history'
  | 'messenger'
  | 'anatomy'
  | 'profile';

interface AgroVisionAppProps {
  initialTab?: AppTab;
  initialAction?: 'camera' | null;
}

function ViewLoadingFallback() {
  return (
    <div className="w-full rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-4 native-view-enter">
      <div className="h-5 w-40 rounded-lg native-shimmer" />
      <div className="h-44 w-full rounded-2xl native-shimmer" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl native-shimmer" />
        <div className="h-16 rounded-xl native-shimmer" />
      </div>
    </div>
  );
}

function ConfidenceProgressIndicator({
  confidence,
  isUrdu,
  showLabel = false
}: {
  confidence: number;
  isUrdu?: boolean;
  showLabel?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(confidence)));
  const barColor =
    clamped >= 85
      ? 'bg-[#166534]'
      : clamped >= 70
      ? 'bg-[#b45309]'
      : 'bg-[#b91c1c]';

  const certaintyText =
    clamped >= 85
      ? isUrdu
        ? 'اعلیٰ یقین'
        : 'High certainty'
      : clamped >= 70
      ? isUrdu
        ? 'درمیانہ یقین'
        : 'Moderate certainty'
      : isUrdu
      ? 'کم یقین'
      : 'Low certainty';

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="w-14 h-1.5 rounded-full bg-[#e2ece5] overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped}% ${certaintyText}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="font-mono text-xs font-bold tabular-nums text-[#13281c]">
        {clamped}%
      </span>
      {showLabel && (
        <span className="text-[11px] text-[#3d5947]">
          · {certaintyText}
        </span>
      )}
    </div>
  );
}

export const AgroVisionApp: React.FC<AgroVisionAppProps> = ({
  initialTab = 'home',
  initialAction = null
}) => {
  const { isUrdu, toggleLanguage } = useLanguage();
  const { activeProfile, cloudSyncStatus } = useAuth();
  const { moistureEnabled, moisturePercent, phEnabled, soilPh } = useSensors();
  const { scans, removeScan, clearScans } = useScanHistory();
  const { plants } = usePlantJourney();
  const {
    completedMissions,
    dailyStreak,
    longestStreak,
    hasCompletedMissionToday,
    streakFreezes,
    maxStreakFreezes,
    streakProtectedByFreeze,
    nextStreakMilestone,
    todayStreakBonusXp,
    nextStreakBonusXp,
    recentBadgeUnlock,
    dismissRecentBadgeUnlock,
    lastXpEvent,
    dismissLastXpEvent
  } = useXP();

  const [activeTab, setActiveTab] = useState<AppTab>(
    initialAction === 'camera' ? 'scan' : initialTab === 'anatomy' ? 'learn' : initialTab
  );
  const [learnDefaultSubTab, setLearnDefaultSubTab] = useState<'guides' | 'atlas'>(
    initialTab === 'anatomy' ? 'atlas' : 'guides'
  );
  const [selectedPlantForScan, setSelectedPlantForScan] = useState<string | null>(null);
  const [liveWeather, setLiveWeather] = useState<LiveWeatherSnapshot | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'tomato' | 'other'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [detailScanId, setDetailScanId] = useState<string | null>(null);
  const [isDetectionSessionActive, setIsDetectionSessionActive] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pullStartYRef = useRef<number | null>(null);
  const detailSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const dailyTip = getDailyAgriTip();

  const triggerRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    }, 420);
  };

  const [isStageExpanded, setIsStageExpanded] = useState(false);

  const [growthStage, setGrowthStage] = useState<GrowthStage>(() => {
    if (typeof window === 'undefined') return 'flowering';
    const saved = window.localStorage.getItem('agrovision_growth_stage_v1');
    if (
      saved === 'seedling' ||
      saved === 'vegetative' ||
      saved === 'flowering' ||
      saved === 'fruiting'
    ) {
      return saved;
    }
    return 'flowering';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agrovision_growth_stage_v1', growthStage);
    }
  }, [growthStage]);

  const nonceRef = useRef(1);
  const aiNonceRef = useRef(1);
  const [diagnosticAction, setDiagnosticAction] = useState<DiagnosticExternalAction | null>(() =>
    initialAction === 'camera' ? { type: 'camera', nonce: 1 } : null
  );
  const [pendingAiQuestion, setPendingAiQuestion] = useState<{ text: string; nonce: number } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const missionsSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    url.searchParams.delete('action');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, [activeTab]);

  const selectTab = (tab: AppTab, subAtlas?: 'guides' | 'atlas') => {
    if (tab !== 'history') {
      setDetailScanId(null);
    }
    if (tab === 'anatomy') {
      setLearnDefaultSubTab('atlas');
      setActiveTab('learn');
    } else {
      if (subAtlas) setLearnDefaultSubTab(subAtlas);
      setActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAI = (prompt: string) => {
    aiNonceRef.current += 1;
    setPendingAiQuestion({ text: prompt, nonce: aiNonceRef.current });
    selectTab('messenger');
  };

  const launchCameraScan = (plantId?: string | null) => {
    hapticScanTap();
    if (plantId) setSelectedPlantForScan(plantId);
    nonceRef.current += 1;
    setDiagnosticAction({ type: 'camera', nonce: nonceRef.current });
    selectTab('scan');
  };

  const handleUploadPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      nonceRef.current += 1;
      setDiagnosticAction({ type: 'upload', file, nonce: nonceRef.current });
      selectTab('scan');
    }
    e.target.value = '';
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(isUrdu ? 'ur-PK' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const handleExportLog = () => {
    if (scans.length === 0) return;
    const blob = new Blob([JSON.stringify(scans, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrovision-field-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredScans = scans.filter((entry) => {
    const matchesTab =
      historyFilter === 'all' ||
      (historyFilter === 'tomato' && entry.isTomatoLeaf) ||
      (historyFilter === 'other' && !entry.isTomatoLeaf);
    const q = historySearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      entry.diseaseName.toLowerCase().includes(q) ||
      entry.scientificName.toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  const detailEntry: ScanHistoryEntry | null =
    detailScanId ? scans.find((s) => s.id === detailScanId) ?? null : null;

  // Strictly event-driven daily missions (NO manual checkbox toggle)
  const missions: {
    id: MissionId;
    title: string;
    howToComplete: string;
    xp: string;
    ctaLabel: string;
    onNavigate: () => void;
    done: boolean;
  }[] = [
    {
      id: 'scan_lower_leaf',
      title: isUrdu ? 'ٹماٹر کے پتے کا اسکین مکمل کریں' : 'Complete a verified tomato leaf scan',
      howToComplete: isUrdu
        ? 'اسکینر سے حقیقی یا نمونہ پتہ تصدیق کروائیں'
        : 'Auto-completes on verified tomato scan',
      xp: '+30 XP',
      ctaLabel: isUrdu ? 'اسکین کریں' : 'Scan Leaf',
      onNavigate: () => launchCameraScan(),
      done: Boolean(completedMissions.scan_lower_leaf)
    },
    {
      id: 'check_soil_sensors',
      title: isUrdu ? 'مٹی کا تجزیہ یا سینسر چیک کریں' : 'Inspect live soil profile or probe input',
      howToComplete: isUrdu
        ? 'مٹی انٹیلی جنس دیکھنے یا پروب سیٹ کرنے پر'
        : 'Auto-completes on Soil Hub lookup',
      xp: '+35 XP',
      ctaLabel: isUrdu ? 'مٹی دیکھیں' : 'Open Soil Hub',
      onNavigate: () => selectTab('care'),
      done: Boolean(completedMissions.check_soil_sensors)
    },
    {
      id: 'explore_library',
      title: isUrdu ? 'امراض اٹلس میں بیماری کا مطالعہ کریں' : 'Open a condition in Disease Atlas',
      howToComplete: isUrdu
        ? 'اٹلس میں کسی بیماری کی تفصیل کھولنے پر'
        : 'Auto-completes when viewing an entry',
      xp: '+25 XP',
      ctaLabel: isUrdu ? 'اٹلس کھولیں' : 'Open Atlas',
      onNavigate: () => selectTab('learn', 'atlas'),
      done: Boolean(completedMissions.explore_library)
    },
    {
      id: 'learning_activity',
      title: isUrdu ? 'سبق مکمل کریں یا اے آئی سے مشورہ لیں' : 'Complete a guide or consult AI Assistant',
      howToComplete: isUrdu
        ? 'لرننگ سبق یا اے آئی چیٹ استعمال کرنے پر'
        : 'Auto-completes via Guide or AI Chat',
      xp: '+25 XP',
      ctaLabel: isUrdu ? 'سیکھیں' : 'Open Learn',
      onNavigate: () => selectTab('learn', 'guides'),
      done: Boolean(completedMissions.learning_activity)
    }
  ];

  const completedCount = missions.filter((m) => m.done).length;
  const readinessScore = Math.min(
    100,
    56 +
      (moistureEnabled && moisturePercent >= 45 && moisturePercent <= 68 ? 16 : 6) +
      (phEnabled && soilPh >= 5.8 && soilPh <= 7.0 ? 14 : 4) +
      completedCount * 4
  );

  const stageAlert = evaluateGrowthStageAlert(growthStage, {
    moistureEnabled,
    moisturePercent,
    phEnabled,
    soilPh
  });

  const headerTitle =
    activeTab === 'home'
      ? isUrdu
        ? 'ایگرو وژن فیلڈ ایپ'
        : 'AgroVision AI'
      : activeTab === 'plants'
      ? isUrdu
        ? 'پودوں کی نشوونما'
        : 'Plant Journey'
      : activeTab === 'scan'
      ? isUrdu
        ? 'لائیو لیف اسکینر'
        : 'Leaf Scanner'
      : activeTab === 'care'
      ? isUrdu
        ? 'مٹی و موسمی مرکز'
        : 'Soil & Climate'
      : activeTab === 'learn'
      ? isUrdu
        ? 'لرننگ سینٹر و اٹلس'
        : 'Learning & Atlas'
      : activeTab === 'history'
      ? isUrdu
        ? 'فیلڈ اسکین لاگ'
        : 'Field Scan Log'
      : isUrdu
      ? 'اے آئی پلانٹ ہیلتھ ماہر'
      : 'AI Assistant';

  const desktopNavItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: isUrdu ? 'ہوم' : 'Home', icon: Home },
    { id: 'plants', label: isUrdu ? 'پودے' : 'Plants', icon: Sprout },
    { id: 'scan', label: isUrdu ? 'اسکین' : 'Scanner', icon: Camera },
    { id: 'care', label: isUrdu ? 'مٹی و موسم' : 'Soil & Climate', icon: Droplets },
    { id: 'learn', label: isUrdu ? 'لرننگ' : 'Learn & Atlas', icon: BookOpen },
    { id: 'messenger', label: isUrdu ? 'اے آئی ماہر' : 'AI Assistant', icon: Bot },
    { id: 'history', label: isUrdu ? 'ریکارڈ' : 'Field Log', icon: ClipboardList },
    { id: 'profile', label: isUrdu ? 'پروفائل' : 'Profile', icon: User }
  ];

  const mobileDockItems: {
    id: AppTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'home', label: isUrdu ? 'ہوم' : 'Home', icon: Home },
    { id: 'plants', label: isUrdu ? 'پودے' : 'Plants', icon: Sprout },
    { id: 'scan', label: isUrdu ? 'اسکین' : 'Scan', icon: Camera },
    { id: 'messenger', label: isUrdu ? 'اے آئی' : 'AI Chat', icon: Bot },
    { id: 'profile', label: isUrdu ? 'پروفائل' : 'Profile', icon: User }
  ];

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`min-h-screen w-full bg-[#f1f6f1] text-[#13281c] flex flex-col relative overflow-x-clip font-sans selection:bg-[#edf5ef] selection:text-[#14532d] ${
        isUrdu ? 'font-urdu' : ''
      }`}
    >
      <AppBotanicalBackdrop />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        onChange={handleUploadPick}
        className="hidden"
        aria-label={isUrdu ? 'ٹماٹر کے پتے کی تصویر منتخب کریں' : 'Upload leaf image'}
      />

      {/* Desktop Top Bar (3-Zone Clean Forest + Cream Header) */}
      <header className="hidden lg:flex sticky top-0 z-40 w-full h-16 bg-white/95 backdrop-blur-md border-b border-[#cbdcd0] px-6 items-center">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Brand Identity */}
          <button
            type="button"
            onClick={() => selectTab('home')}
            className="flex items-center gap-2.5 text-start cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[#14532d] text-white flex items-center justify-center shadow-xs">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-sm font-extrabold text-[#13281c] leading-tight">
                AgroVision <span className="text-[#b45309]">AI</span>
              </div>
              <div className="text-[10px] font-mono text-[#5b7463] uppercase tracking-wider">
                Tomato Intelligence
              </div>
            </div>
          </button>

          {/* Zone 2: Horizontal Navigation */}
          <nav aria-label="Primary Workspace Navigation" className="flex items-center gap-1">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#14532d] text-white shadow-xs'
                      : 'text-[#3d5947] hover:bg-[#edf5ef] hover:text-[#13281c]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.id === 'history' && scans.length > 0 && (
                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        isActive ? 'text-[#fef3c7]' : 'text-[#b45309]'
                      }`}
                    >
                      ({scans.length})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Grower Account, Rank/Streak, Language & App Install */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-[#faf8f2] hover:bg-[#edf5ef] border border-[#cbdcd0] text-xs font-bold text-[#13281c] inline-flex items-center gap-1.5 cursor-pointer"
            >
              {activeProfile ? (
                <>
                  <Cloud
                    className={`w-3.5 h-3.5 ${
                      cloudSyncStatus === 'synced' || cloudSyncStatus === 'device'
                        ? 'text-[#166534]'
                        : 'text-[#b45309]'
                    }`}
                  />
                  <span className="max-w-[90px] truncate">
                    {activeProfile.displayName || activeProfile.email?.split('@')[0] || 'Grower'}
                  </span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-[#14532d]" />
                  <span>{isUrdu ? 'سائن ان' : 'Sign In'}</span>
                </>
              )}
            </button>

            <NavbarBadgeButton
              isOpen={isLevelModalOpen}
              onOpen={() => setIsLevelModalOpen(true)}
            />

            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white hover:bg-[#edf5ef] border border-[#cbdcd0] text-xs font-bold text-[#13281c] inline-flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#14532d]" />
              <span>{isUrdu ? 'EN' : 'اردو'}</span>
            </button>

            <PWAInstallButton compact />
          </div>
        </div>
      </header>

      {/* Mobile Compact Header (Safe-Area Top Aware) */}
      <header
        className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#cbdcd0] px-3 shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="h-14 flex items-center justify-between gap-1.5">
          {activeTab === 'history' && detailEntry ? (
            <button
              type="button"
              onClick={() => setDetailScanId(null)}
              className="min-h-[42px] inline-flex items-center gap-1.5 text-sm font-bold text-[#14532d] cursor-pointer min-w-0"
            >
              {isUrdu ? <ArrowRight className="w-4 h-4 shrink-0" /> : <ArrowLeft className="w-4 h-4 shrink-0" />}
              <span className="truncate">{isUrdu ? 'فیلڈ لاگ' : 'Field Log'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#14532d] text-white flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-[13px] font-extrabold text-[#13281c] truncate leading-tight">
                  {headerTitle}
                </div>
                <div className="text-[9.5px] font-mono text-[#5b7463] leading-tight truncate">
                  {isUrdu ? 'ٹماٹر کی حفاظت' : 'Tomato Care App'}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              aria-label={activeProfile ? 'Profile & Sync' : 'Sign In'}
              className="min-h-[34px] min-w-[34px] px-1.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-[#14532d] flex items-center justify-center cursor-pointer"
            >
              {activeProfile ? (
                <Cloud
                  className={`w-4 h-4 ${
                    cloudSyncStatus === 'synced' || cloudSyncStatus === 'device'
                      ? 'text-[#166534]'
                      : 'text-[#b45309]'
                  }`}
                />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </button>

            <NavbarBadgeButton
              isOpen={isLevelModalOpen}
              onOpen={() => setIsLevelModalOpen(true)}
              compact
            />

            <PWAInstallButton compact />

            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[34px] inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-white border border-[#cbdcd0] text-[11px] font-bold text-[#13281c] cursor-pointer"
            >
              <Globe className="w-3 h-3 text-[#14532d]" />
              <span>{isUrdu ? 'EN' : 'اردو'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* XP Event Notification Strip */}
      {lastXpEvent && (
        <div className="w-full max-w-7xl mx-auto px-4 pt-3">
          <div
            role="status"
            className="px-4 py-2.5 rounded-xl bg-[#14532d] text-white text-xs font-bold flex items-center justify-between gap-2 shadow-sm"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <Zap className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b] shrink-0" />
              <span className="truncate">
                {isUrdu ? lastXpEvent.reasonUr : lastXpEvent.reasonEn}
              </span>
            </span>
            <button
              type="button"
              onClick={dismissLastXpEvent}
              aria-label="Dismiss XP notice"
              className="p-0.5 rounded hover:bg-white/15 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Badge Unlock Notice Strip */}
      {recentBadgeUnlock && (
        <div className="w-full max-w-7xl mx-auto px-4 pt-2">
          <div
            role="status"
            className="px-4 py-2.5 rounded-xl bg-[#fef3c7] border border-[#d97706]/50 text-[#78350f] text-xs font-bold flex items-center justify-between gap-2"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <Award className="w-4 h-4 text-[#b45309] shrink-0" />
              <span className="truncate">
                {isUrdu
                  ? `نیا بیج کھل گیا: ${recentBadgeUnlock.titleUr}`
                  : `Badge unlocked: ${recentBadgeUnlock.titleEn}`}
              </span>
            </span>
            <button
              type="button"
              onClick={dismissRecentBadgeUnlock}
              aria-label="Dismiss badge unlock"
              className="p-0.5 rounded hover:bg-black/5 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Workspace Container */}
      <main
        onTouchStart={(e) => {
          if ((activeTab === 'home' || activeTab === 'history') && window.scrollY <= 2) {
            pullStartYRef.current = e.touches[0].clientY;
          }
        }}
        onTouchMove={(e) => {
          if (pullStartYRef.current === null || isRefreshing) return;
          if (window.scrollY > 2) {
            pullStartYRef.current = null;
            setPullDistance(0);
            return;
          }
          const delta = e.touches[0].clientY - pullStartYRef.current;
          if (delta > 8) {
            setPullDistance(Math.min(68, Math.round((delta - 8) * 0.45)));
          }
        }}
        onTouchEnd={() => {
          pullStartYRef.current = null;
          if (pullDistance >= 44) triggerRefresh();
          else setPullDistance(0);
        }}
        className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3.5 pb-28 lg:pb-12 space-y-4"
      >
        {(pullDistance > 8 || isRefreshing) && (
          <div className="flex items-center justify-center gap-2 py-1 text-[11px] font-mono font-semibold text-[#14532d]">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing
                ? isUrdu
                  ? 'اپڈیٹ ہو رہا ہے...'
                  : 'Refreshing...'
                : pullDistance >= 44
                ? isUrdu
                  ? 'ریفرش کرنے کے لیے چھوڑیں'
                  : 'Release to refresh'
                : isUrdu
                ? 'ریفرش کرنے کے لیے نیچے کھینچیں'
                : 'Pull to refresh'}
            </span>
          </div>
        )}

        {/* HOME WORKSPACE */}
        {activeTab === 'home' && (
          <div
            key="home"
            className={`grid grid-cols-1 lg:grid-cols-12 gap-5 items-start ${
              isRefreshing ? 'opacity-75 transition-opacity' : ''
            }`}
          >
            {/* Left Primary Column */}
            <div className="lg:col-span-7 space-y-3">
              {/* Forest Command Hero Card */}
              <section style={{ textAlign: 'justify' }} className="relative overflow-hidden rounded-3xl bg-[#14532d] p-4 sm:p-5 text-white shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#fef3c7] font-bold">
                      {isUrdu ? 'ٹماٹر کیئر ہوم' : 'TOMATO CARE HOME'}
                    </div>
                    <h1 className="font-display text-lg sm:text-2xl font-extrabold leading-snug text-balance">
                      {isUrdu
                        ? 'پتا چیک کریں اور فصل بچائیں'
                        : 'Check, Spot & Save Your Crop'}
                    </h1>
                  </div>

                  <div className="flex items-stretch gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        missionsSectionRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center'
                        })
                      }
                      className="px-2.5 py-1.5 rounded-2xl bg-[#166534] hover:bg-[#1f5134] border border-white/15 text-center cursor-pointer"
                    >
                      <div className="font-mono text-base font-extrabold leading-none tabular-nums inline-flex items-center gap-1">
                        <Flame
                          className={`w-4 h-4 ${
                            hasCompletedMissionToday
                              ? 'text-[#f59e0b] fill-[#f59e0b]'
                              : 'text-white/80'
                          }`}
                        />
                        <span>{dailyStreak}</span>
                      </div>
                      <div className="text-[9px] font-mono uppercase text-white/80 mt-1">
                        {isUrdu ? 'سلسلہ' : 'Streak'}
                      </div>
                    </button>

                    <div className="px-2.5 py-1.5 rounded-2xl bg-[#166534] border border-white/15 text-center">
                      <div className="font-mono text-base font-extrabold leading-none tabular-nums">
                        {readinessScore}%
                      </div>
                      <div className="text-[9px] font-mono uppercase text-white/80 mt-1">
                        {isUrdu ? 'صحت' : 'Health'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth Stage Switcher (Collapsed by default; opens tips on tap, no truncation) */}
                <div className="relative z-10 space-y-2 bg-[#0f3d21] border border-white/15 rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-bold min-w-0">
                      <Sprout className="w-3.5 h-3.5 text-[#bbf7d0] shrink-0" />
                      <span className="truncate">
                        {isUrdu ? 'ٹماٹر کی نشوونما کا مرحلہ' : 'Tomato Growth Stage'}
                      </span>
                    </span>
                    <div className="inline-flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[10px] text-white/85 tabular-nums">
                        {isUrdu ? stageAlert.stage.daysUr : stageAlert.stage.daysEn}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsStageExpanded((prev) => !prev)}
                        aria-expanded={isStageExpanded}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-[#bbf7d0] cursor-pointer"
                      >
                        <span>
                          {isStageExpanded
                            ? isUrdu
                              ? 'بند'
                              : 'Hide'
                            : isUrdu
                            ? 'تفصیل'
                            : 'Tips'}
                        </span>
                        {isStageExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.keys(GROWTH_STAGE_CONFIGS) as GrowthStage[]).map((stageKey) => {
                      const cfg = GROWTH_STAGE_CONFIGS[stageKey];
                      const active = growthStage === stageKey;
                      const showAsSelected = active && isStageExpanded;
                      return (
                        <button
                          key={stageKey}
                          type="button"
                          onClick={() => {
                            if (growthStage === stageKey && isStageExpanded) {
                              setIsStageExpanded(false);
                            } else {
                              setGrowthStage(stageKey);
                              setIsStageExpanded(true);
                            }
                          }}
                          className={`min-h-[40px] px-1 py-1 rounded-xl text-[10.5px] sm:text-[11px] leading-tight text-center font-bold transition-colors whitespace-normal break-words cursor-pointer flex items-center justify-center ${
                            showAsSelected
                              ? 'bg-white text-[#14532d] shadow-xs'
                              : active
                              ? 'bg-[#1b5e36] text-white border border-white/35'
                              : 'bg-[#166534] text-white/95 hover:bg-[#1f5134]'
                          }`}
                        >
                          {isUrdu ? cfg.labelUr : cfg.labelEn}
                        </button>
                      );
                    })}
                  </div>

                  {isStageExpanded && (
                    <div
                      role="status"
                      aria-live="polite"
                      className={`rounded-xl p-3 border space-y-1.5 ${
                        stageAlert.severity === 'action'
                          ? 'bg-[#7c2d12] border-[#f59e0b]/60 text-white'
                          : stageAlert.severity === 'watch'
                          ? 'bg-[#78350f] border-[#d97706]/60 text-white'
                          : 'bg-[#166534] border-white/20 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                          {stageAlert.severity === 'action' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#fef3c7] shrink-0" />
                          ) : stageAlert.severity === 'watch' ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-[#fef3c7] shrink-0" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{isUrdu ? stageAlert.headlineUr : stageAlert.headlineEn}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#fef3c7] shrink-0">
                          {isUrdu ? stageAlert.statusLabelUr : stageAlert.statusLabelEn}
                        </span>
                      </div>

                      <p className="text-[11px] text-white/90 leading-relaxed">
                        {isUrdu ? stageAlert.messageUr : stageAlert.messageEn}
                      </p>

                      <div className="pt-1.5 border-t border-white/15 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-white/85 tabular-nums">
                          {isUrdu
                            ? `ہدف نمی: ${stageAlert.stage.moistureMin}–${stageAlert.stage.moistureMax}% · pH ${stageAlert.stage.phMin}–${stageAlert.stage.phMax}`
                            : `Target ${stageAlert.stage.moistureMin}–${stageAlert.stage.moistureMax}% · pH ${stageAlert.stage.phMin}–${stageAlert.stage.phMax}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            stageAlert.actionTarget === 'sensors'
                              ? selectTab('care')
                              : launchCameraScan()
                          }
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#edf5ef] text-[#14532d] text-[11px] font-extrabold cursor-pointer shrink-0"
                        >
                          {isUrdu ? stageAlert.actionLabelUr : stageAlert.actionLabelEn}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Camera + Upload CTA Pair */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => launchCameraScan()}
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#b45309] to-[#d97706] hover:from-[#92400e] hover:to-[#b45309] border border-white/25 text-white text-xs font-extrabold shadow-md cursor-pointer"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>{isUrdu ? 'کیمرہ اسکین' : 'Camera Scan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-white hover:bg-[#edf5ef] text-[#14532d] text-xs font-extrabold shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>{isUrdu ? 'تصویر چنیں' : 'Upload Photo'}</span>
                  </button>
                </div>
              </section>

              {/* Quick Workspace Grid (4 Action Cards with Hanging Moss/Algae Branch Touch) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => selectTab('care')}
                  className="relative overflow-hidden p-3 rounded-2xl bg-white border border-[#cbdcd0] hover:border-[#14532d] text-start transition-colors cursor-pointer shadow-xs group"
                >
                  <HangingBranchMoss variant={0} />
                  <div className="w-8 h-8 rounded-xl bg-[#edf5ef] text-[#14532d] flex items-center justify-center mb-1.5 relative z-10">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div className="font-display text-xs font-extrabold text-[#13281c] relative z-10">
                    {isUrdu ? 'مٹی و پانی' : 'Soil & Water'}
                  </div>
                  <div className="font-mono text-[10px] text-[#5b7463] mt-0.5 tabular-nums relative z-10">
                    {moisturePercent}% · pH {soilPh.toFixed(1)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectTab('plants')}
                  className="relative overflow-hidden p-3 rounded-2xl bg-white border border-[#cbdcd0] hover:border-[#14532d] text-start transition-colors cursor-pointer shadow-xs group"
                >
                  <HangingBranchMoss variant={1} />
                  <div className="w-8 h-8 rounded-xl bg-[#edf5ef] text-[#14532d] flex items-center justify-center mb-1.5 relative z-10">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div className="font-display text-xs font-extrabold text-[#13281c] relative z-10">
                    {isUrdu ? 'میرے پودے' : 'My Plants'}
                  </div>
                  <div className="font-mono text-[10px] text-[#5b7463] mt-0.5 tabular-nums relative z-10">
                    {plants.length} {isUrdu ? 'پودے' : 'Tracked'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectTab('learn', 'guides')}
                  className="relative overflow-hidden p-3 rounded-2xl bg-white border border-[#cbdcd0] hover:border-[#14532d] text-start transition-colors cursor-pointer shadow-xs group"
                >
                  <HangingBranchMoss variant={2} />
                  <div className="w-8 h-8 rounded-xl bg-[#edf5ef] text-[#14532d] flex items-center justify-center mb-1.5 relative z-10">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="font-display text-xs font-extrabold text-[#13281c] relative z-10">
                    {isUrdu ? 'کورسز و اٹلس' : 'Courses & Atlas'}
                  </div>
                  <div className="font-mono text-[10px] text-[#5b7463] mt-0.5 relative z-10">
                    10 {isUrdu ? 'اسباق' : 'Lessons'} · 10 {isUrdu ? 'امراض' : 'Diseases'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectTab('history')}
                  className="relative overflow-hidden p-3 rounded-2xl bg-white border border-[#cbdcd0] hover:border-[#14532d] text-start transition-colors cursor-pointer shadow-xs group"
                >
                  <HangingBranchMoss variant={3} />
                  <div className="w-8 h-8 rounded-xl bg-[#edf5ef] text-[#14532d] flex items-center justify-center mb-1.5 relative z-10">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="font-display text-xs font-extrabold text-[#13281c] relative z-10">
                    {isUrdu ? 'پتا ریکارڈ' : 'Leaf Log'}
                  </div>
                  <div className="font-mono text-[10px] text-[#5b7463] mt-0.5 tabular-nums relative z-10">
                    {scans.length} {isUrdu ? 'محفوظ' : 'Saved'}
                  </div>
                </button>
              </div>

              {/* Plant Watering & Fertilizer Schedule Section */}
              <PlantScheduleCard />

              {/* Today's Field Tip Card */}
              <div className="rounded-2xl bg-[#edf5ef] border border-[#cbdcd0] p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#b45309] text-white flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase font-bold text-[#14532d]">
                      {isUrdu ? dailyTip.tagUr : dailyTip.tagEn}
                    </div>
                    <div className="font-display font-bold text-sm text-[#13281c]">
                      {isUrdu ? dailyTip.titleUr : dailyTip.titleEn}
                    </div>
                    <p className="text-xs text-[#3d5947] mt-0.5 leading-relaxed">
                      {isUrdu ? dailyTip.bodyUr : dailyTip.bodyEn}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => selectTab('learn', 'guides')}
                  className="text-xs font-bold text-[#14532d] hover:underline shrink-0 cursor-pointer"
                >
                  {isUrdu ? 'مزید' : 'Lessons →'}
                </button>
              </div>

              {/* Recent Field Scans Preview */}
              <section className="rounded-2xl bg-white border border-[#cbdcd0] p-3.5 sm:p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#cbdcd0]">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#13281c]">
                      {isUrdu ? 'آپ کے پتے کی جانچ' : 'Your Leaf Checks'}
                    </h2>
                    <p className="text-[11px] text-[#5b7463]">
                      {isUrdu
                        ? 'پتے کی تصویر لیں یا ٹیسٹ نمونہ آزمائیں'
                        : 'Tap a sample or snap a leaf photo to check plant health'}
                    </p>
                  </div>
                  {scans.length > 0 && (
                    <button
                      type="button"
                      onClick={() => selectTab('history')}
                      className="text-xs font-bold text-[#14532d] hover:underline cursor-pointer"
                    >
                      {isUrdu ? 'سب دیکھیں' : 'View all'}
                    </button>
                  )}
                </div>

                {scans.length === 0 ? (
                  <div className="py-5 text-center flex flex-col items-center gap-2.5">
                    <p className="text-xs text-[#3d5947] max-w-xs">
                      {isUrdu
                        ? 'ابھی تک کوئی اسکین محفوظ نہیں ہے۔ کیمرہ یا گیلری سے پہلا پتہ چیک کریں۔'
                        : 'No scans saved yet. Capture or upload a tomato leaf to start your diagnostic record.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => launchCameraScan()}
                      className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'پہلا اسکین کریں' : 'Start First Scan'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#cbdcd0]/70">
                    {scans.slice(0, 3).map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          setDetailScanId(entry.id);
                          selectTab('history');
                        }}
                        className="w-full py-2.5 first:pt-0.5 last:pb-0.5 flex items-center gap-3 text-start hover:bg-[#faf8f2] transition-colors cursor-pointer"
                      >
                        <img
                          src={entry.thumbnailUrl}
                          alt={entry.diseaseName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover border border-[#cbdcd0] shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#13281c] truncate">
                              {entry.diseaseName}
                            </span>
                            <ConfidenceProgressIndicator confidence={entry.confidence} />
                          </div>
                          <div className="text-[11px] text-[#5b7463] truncate">
                            {entry.source} · {formatDate(entry.createdAt)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Secondary Column: Live Weather & Event-Driven Daily Missions */}
            <div className="lg:col-span-5 space-y-4">
              <WeatherAlertCard onWeatherLoaded={setLiveWeather} />

              {/* Event-Driven Daily Field Missions (NO Manual Checkbox Toggle) */}
              <section
                ref={missionsSectionRef}
                className="rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#cbdcd0]/80">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#b45309] shrink-0" />
                      <h2 className="font-display text-sm font-extrabold text-[#13281c]">
                        {isUrdu ? 'آج کے خودکار فیلڈ مشن' : 'Daily Field Missions'}
                      </h2>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#5b7463] tabular-nums">
                      <span>
                        {completedCount}/{missions.length} {isUrdu ? 'مکمل' : 'Verified'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {isUrdu ? `بہترین: ${longestStreak} دن` : `Best: ${longestStreak}d`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-[#14532d] font-bold">
                        <Shield className="w-3 h-3 shrink-0" />
                        {streakFreezes}/{maxStreakFreezes} {isUrdu ? 'فریز' : 'Freeze'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-end shrink-0">
                    <Flame
                      className={`w-5 h-5 shrink-0 ${
                        hasCompletedMissionToday
                          ? 'text-[#b45309] fill-[#b45309]'
                          : dailyStreak > 0
                          ? 'text-[#b45309]'
                          : 'text-[#cbdcd0]'
                      }`}
                    />
                    <div className="font-mono tabular-nums leading-tight">
                      <div className="text-sm font-extrabold text-[#13281c]">
                        {isUrdu
                          ? `${dailyStreak} دن`
                          : `${dailyStreak} ${dailyStreak === 1 ? 'Day' : 'Days'}`}
                      </div>
                      <div className="text-[10px] font-bold text-[#b45309]">
                        {isUrdu ? 'روزانہ سلسلہ' : 'Daily Streak'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streak Bonus Status */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`font-semibold ${
                        hasCompletedMissionToday ? 'text-[#166534]' : 'text-[#b45309]'
                      }`}
                    >
                      {streakProtectedByFreeze
                        ? isUrdu
                          ? `گريس فریز فعال! آج 1 مشن پر +${nextStreakBonusXp} بونس XP`
                          : `Grace freeze active! Complete 1 mission for +${nextStreakBonusXp} XP`
                        : hasCompletedMissionToday
                        ? isUrdu
                          ? `آج کا تسلسل محفوظ! +${todayStreakBonusXp} بونس XP ملا`
                          : `Streak secured today! +${todayStreakBonusXp} Bonus XP earned`
                        : isUrdu
                        ? `آج کوئی ایک سرگرمی مکمل کر کے +${nextStreakBonusXp} بونس XP حاصل کریں`
                        : `Complete any verified activity today for +${nextStreakBonusXp} Bonus XP`}
                    </span>
                    <span className="font-mono text-[10px] text-[#5b7463] tabular-nums">
                      {isUrdu ? `ہدف: ${nextStreakMilestone} دن` : `Goal: ${nextStreakMilestone}d`}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((dayNum) => {
                      const reached = dailyStreak >= dayNum;
                      const isNext = !hasCompletedMissionToday && dailyStreak + 1 === dayNum;
                      const dayBonus = Math.min(50, 10 + dayNum * 5);
                      return (
                        <div
                          key={dayNum}
                          className={`py-1.5 px-1 rounded-xl text-center font-mono tabular-nums ${
                            reached
                              ? 'bg-[#fef3c7] text-[#92400e] border border-[#d97706]'
                              : isNext
                              ? 'bg-[#fffbeb] text-[#b45309] border border-dashed border-[#b45309]'
                              : 'bg-[#faf8f2] text-[#5b7463] border border-[#cbdcd0]'
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase">
                            {isUrdu ? `دن ${dayNum}` : `Day ${dayNum}`}
                          </div>
                          <div className="text-[10px] font-extrabold">+{dayBonus}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Read-Only Auto-Tracked Mission Rows */}
                <div className="space-y-2 pt-1">
                  {missions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        mission.done
                          ? 'bg-[#edf5ef] border-[#8bb398] text-[#14532d]'
                          : 'bg-[#faf8f2] border-[#cbdcd0] text-[#13281c]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            mission.done ? 'text-[#166534]' : 'text-[#cbdcd0]'
                          }`}
                        />
                        <div className="min-w-0">
                          <div
                            className={`text-xs font-bold leading-snug ${
                              mission.done ? 'line-through opacity-80' : ''
                            }`}
                          >
                            {mission.title}
                          </div>
                          <div className="text-[10px] text-[#5b7463] mt-0.5">
                            {mission.howToComplete}
                          </div>
                        </div>
                      </div>

                      {mission.done ? (
                        <span className="font-mono text-[10px] font-bold text-[#166534] shrink-0">
                          {isUrdu ? 'تصدیق شدہ' : 'Verified'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={mission.onNavigate}
                          className="px-2.5 py-1.5 rounded-lg bg-[#14532d] hover:bg-[#166534] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                        >
                          {mission.ctaLabel} · {mission.xp}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* PLANT GROWTH JOURNEY TAB */}
        {activeTab === 'plants' && (
          <div key="plants" className="native-view-enter">
            <PlantJourneyView
              onScanPlant={(plantId) => launchCameraScan(plantId)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {/* LEAF SCANNER TAB */}
        {activeTab === 'scan' && (
          <div key="scan" className="native-view-enter">
            <Suspense fallback={<ViewLoadingFallback />}>
              <DiagnosticStudio
                externalAction={diagnosticAction}
                onExternalActionHandled={() => setDiagnosticAction(null)}
                onDetectionSessionChange={setIsDetectionSessionActive}
                initialPlantId={selectedPlantForScan}
                onOpenSensors={() => selectTab('care')}
              />
            </Suspense>
          </div>
        )}

        {/* SOIL & CLIMATE INTELLIGENCE HUB */}
        {activeTab === 'care' && (
          <div key="care" className="space-y-4 native-view-enter">
            <WeatherAlertCard onWeatherLoaded={setLiveWeather} />
            <SmartSensorSection onScanClick={() => selectTab('scan')} />
          </div>
        )}

        {/* LEARNING CENTRE & DISEASE ATLAS */}
        {activeTab === 'learn' && (
          <div key="learn" className="native-view-enter">
            <LearningCenterView
              defaultSubTab={learnDefaultSubTab}
              onScanClick={() => selectTab('scan')}
              onAskAI={handleAskAI}
            />
          </div>
        )}

        {/* FIELD SCAN HISTORY LOG */}
        {activeTab === 'history' && (
          <div key="history" className="native-view-enter">
            {detailEntry ? (
              <section
                key={detailEntry.id}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  detailSwipeStartRef.current = { x: t.clientX, y: t.clientY };
                }}
                onTouchEnd={(e) => {
                  if (!detailSwipeStartRef.current) return;
                  const t = e.changedTouches[0];
                  const dx = t.clientX - detailSwipeStartRef.current.x;
                  const dy = t.clientY - detailSwipeStartRef.current.y;
                  detailSwipeStartRef.current = null;
                  if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.6) {
                    if ((!isUrdu && dx > 0) || (isUrdu && dx < 0)) {
                      setDetailScanId(null);
                    }
                  }
                }}
                className="rounded-2xl bg-white border border-[#cbdcd0] p-5 space-y-4 native-view-enter"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#cbdcd0]">
                  <button
                    type="button"
                    onClick={() => setDetailScanId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14532d] hover:underline cursor-pointer"
                  >
                    {isUrdu ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    <span>{isUrdu ? 'تمام اسکین پر واپس جائیں' : 'Back to Field Log'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeScan(detailEntry.id);
                      setDetailScanId(null);
                    }}
                    className="p-2 rounded-xl text-[#b91c1c] hover:bg-[#fef2f2] cursor-pointer"
                    aria-label="Delete scan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-3.5">
                  <img
                    src={detailEntry.thumbnailUrl}
                    alt={detailEntry.diseaseName}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover border border-[#cbdcd0] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5b7463]">
                      {detailEntry.isTomatoLeaf ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
                      )}
                      <span>{formatDate(detailEntry.createdAt)}</span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#13281c] leading-snug mt-0.5">
                      {detailEntry.diseaseName}
                    </h2>
                    <p className="text-xs italic text-[#3d5947]">{detailEntry.scientificName}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#5b7463]">
                      {isUrdu ? 'ماڈل یقین' : 'AI Model Certainty'}
                    </div>
                    <div className="mt-1">
                      <ConfidenceProgressIndicator
                        confidence={detailEntry.confidence}
                        isUrdu={isUrdu}
                        showLabel
                      />
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="text-[10px] font-mono uppercase text-[#5b7463]">
                      {isUrdu ? 'شدت' : 'Severity'}
                    </div>
                    <div className="font-mono text-xs font-bold text-[#13281c] mt-0.5">
                      {detailEntry.severity}
                    </div>
                  </div>
                </div>

                {detailEntry.sensorSnapshot && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#3d5947] py-2 border-y border-[#cbdcd0]/70">
                    <span className="inline-flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#166534]" />
                      <span className="font-mono tabular-nums">
                        {isUrdu ? 'نمی' : 'Moisture'}: {detailEntry.sensorSnapshot.moisturePercent}%
                      </span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      pH: {detailEntry.sensorSnapshot.soilPh.toFixed(1)}
                    </span>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-[#13281c] leading-relaxed">
                  {detailEntry.summary}
                </p>

                {detailEntry.organicTreatment.length > 0 && (
                  <div className="pt-2 border-t border-[#cbdcd0]/70 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#14532d]">
                      {isUrdu ? 'نامیاتی علاج کے مراحل' : 'Organic Recovery Steps'}
                    </h3>
                    <ul className="text-xs text-[#3d5947] space-y-1.5 list-disc list-inside leading-relaxed">
                      {detailEntry.organicTreatment.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-2xl bg-white border border-[#cbdcd0] p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#cbdcd0]">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#13281c]">
                      {isUrdu ? 'فیلڈ اسکین ریکارڈ' : 'Field Scan Log'}
                    </h2>
                    <p className="text-[11px] text-[#5b7463] mt-0.5">
                      {activeProfile?.source === 'firebase'
                        ? isUrdu
                          ? 'فون اور آپ کے کلاؤڈ اکاؤنٹ میں محفوظ'
                          : 'Saved locally & synced to your grower account'
                        : activeProfile
                        ? isUrdu
                          ? 'اس فون کے گروور پروفائل میں محفوظ'
                          : 'Saved to your grower profile on this device'
                        : isUrdu
                        ? 'فون اسٹوریج میں محفوظ تاریخچہ'
                        : 'Saved locally on this device'}
                    </p>
                  </div>

                  {scans.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleExportLog}
                        className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#edf5ef] hover:bg-[#dcebe1] border border-[#cbdcd0] text-[11px] font-bold text-[#14532d] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={clearScans}
                        className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fca5a5] text-[11px] font-bold text-[#b91c1c] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'صاف' : 'Clear'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {scans.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-[#5b7463] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder={isUrdu ? 'ریکارڈ تلاش کریں...' : 'Search scans by disease or notes...'}
                        className="w-full min-h-[40px] pl-9 pr-8 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                      />
                      {historySearch && (
                        <button
                          type="button"
                          onClick={() => setHistorySearch('')}
                          aria-label="Clear search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5b7463] hover:text-[#13281c] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
                      {(
                        [
                          { id: 'all', label: isUrdu ? 'تمام' : 'All' },
                          { id: 'tomato', label: isUrdu ? 'ٹماٹر' : 'Tomato' },
                          { id: 'other', label: isUrdu ? 'دیگر' : 'Non-Tomato' }
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setHistoryFilter(tab.id)}
                          className={`min-h-[34px] px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            historyFilter === tab.id
                              ? 'bg-[#14532d] text-white'
                              : 'text-[#3d5947] hover:text-[#13281c]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {scans.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#edf5ef] border border-[#cbdcd0] flex items-center justify-center text-[#14532d]">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-[#3d5947] max-w-xs">
                      {isUrdu
                        ? 'ابھی تک کوئی اسکین محفوظ نہیں ہے۔ اسکینر سے اپنا پہلا پتہ چیک کریں۔'
                        : 'No scans saved yet. Capture or upload a tomato leaf to build your field log.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => launchCameraScan()}
                      className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isUrdu ? 'اسکین شروع کریں' : 'Start First Scan'}</span>
                    </button>
                  </div>
                ) : filteredScans.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#5b7463]">
                    {isUrdu
                      ? 'اس فلٹر کے مطابق کوئی ریکارڈ نہیں ملا۔'
                      : 'No scans match your current filter.'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-[#5b7463] pb-1">
                      {isUrdu ? 'حذف کرنے کے لیے کارڈ کو سوائپ کریں' : 'Swipe left on a scan to delete'}
                    </div>
                    <div className="divide-y divide-[#cbdcd0]/70">
                      {filteredScans.map((entry) => (
                        <SwipeableRow
                          key={entry.id}
                          onDelete={() => removeScan(entry.id)}
                          deleteLabel={isUrdu ? 'حذف' : 'Delete'}
                          isRtl={isUrdu}
                        >
                          <button
                            type="button"
                            onClick={() => setDetailScanId(entry.id)}
                            className="w-full py-3 flex items-center gap-3 text-start hover:bg-[#faf8f2] cursor-pointer"
                          >
                            <img
                              src={entry.thumbnailUrl}
                              alt={entry.diseaseName}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-[#cbdcd0] shrink-0"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-[#13281c] truncate">
                                  {entry.diseaseName}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#5b7463] shrink-0" />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-[#5b7463] truncate">
                                  {entry.severity} · {formatDate(entry.createdAt)}
                                </span>
                                <ConfidenceProgressIndicator confidence={entry.confidence} />
                              </div>
                            </div>
                          </button>
                        </SwipeableRow>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* AI PLANT HEALTH ASSISTANT TAB */}
        {activeTab === 'messenger' && (
          <div key="messenger" className="native-view-enter">
            <FieldMessengerView
              liveWeather={liveWeather}
              onOpenScanner={() => launchCameraScan()}
              onOpenSensors={() => selectTab('care')}
              pendingQuestion={pendingAiQuestion}
              onPendingQuestionHandled={() => setPendingAiQuestion(null)}
            />
          </div>
        )}

        {/* PROFILE SCREEN VIEW */}
        {activeTab === 'profile' && (
          <div key="profile" className="native-view-enter">
            <ProfileView
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenScanner={() => launchCameraScan()}
            />
          </div>
        )}
      </main>

      {/* Mobile Floating Pill Bottom Navigation Dock (Raised Center Scan Gesture Accent) */}
      <nav
        aria-label={isUrdu ? 'ایپ نیویگیشن' : 'Mobile Floating Dock'}
        className="lg:hidden fixed left-3 right-3 z-50 max-w-[440px] mx-auto rounded-full bg-white/95 backdrop-blur-xl border border-[#cbdcd0] shadow-[0_10px_30px_rgba(19,40,28,0.16)] px-1.5 py-1.5 overflow-visible"
        style={{ bottom: 'calc(0.65rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-end justify-between gap-1">
          {mobileDockItems.map((item) => {
            const Icon = item.icon;
            const isCenterScan = item.id === 'scan';
            const isActive = isCenterScan
              ? activeTab === 'scan' || isDetectionSessionActive
              : activeTab === item.id;

            if (isCenterScan) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => launchCameraScan()}
                  className={`flex-1 min-w-0 -mt-4 min-h-[54px] px-2 py-1.5 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-lg ring-4 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#b45309] to-[#d97706] text-white ring-[#fef3c7] font-extrabold'
                      : 'bg-gradient-to-r from-[#b45309] to-[#d97706] hover:from-[#92400e] hover:to-[#b45309] text-white ring-[#f1f6f1] font-extrabold'
                  }`}
                >
                  <Icon className="w-[19px] h-[19px] shrink-0" />
                  <span className="text-[10px] leading-none truncate">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`flex-1 min-w-0 min-h-[44px] px-1.5 py-1.5 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#14532d] text-white font-extrabold shadow-xs'
                    : 'text-[#3d5947] hover:bg-[#edf5ef] hover:text-[#13281c]'
                }`}
              >
                <Icon className="w-[17px] h-[17px] shrink-0" />
                <span className="text-[10px] leading-none truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Standardized Viewport-Contained Modals */}
      <LevelBadgeModal isOpen={isLevelModalOpen} onClose={() => setIsLevelModalOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};
