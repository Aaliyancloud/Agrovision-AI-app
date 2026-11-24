import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { hapticBadgeUnlock, hapticMissionComplete } from '../utils/haptics';

export type MissionId =
  | 'scan_lower_leaf'
  | 'check_soil_sensors'
  | 'explore_library'
  | 'learning_activity';

export interface DailyMissionItem {
  id: MissionId;
  xpReward: number;
}

export const DAILY_MISSIONS: DailyMissionItem[] = [
  { id: 'scan_lower_leaf', xpReward: 30 },
  { id: 'check_soil_sensors', xpReward: 35 },
  { id: 'explore_library', xpReward: 25 },
  { id: 'learning_activity', xpReward: 25 }
];

export type BadgeActionTarget = 'scan' | 'sensors' | 'library' | 'learn' | 'missions';

export interface BadgeDefinition {
  id: string;
  requiredLevel: number;
  requiredXp: number;
  titleEn: string;
  titleUr: string;
  subtitleEn: string;
  subtitleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  howToEarnEn: string;
  howToEarnUr: string;
  actionLabelEn: string;
  actionLabelUr: string;
  actionTarget: BadgeActionTarget;
  accentHex: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'tomato_scout',
    requiredLevel: 1,
    requiredXp: 0,
    titleEn: 'Tomato Scout',
    titleUr: 'ٹماٹر اسکاؤٹ',
    subtitleEn: 'Field Initiated',
    subtitleUr: 'فیلڈ آغاز',
    descriptionEn:
      'Awarded to growers stepping into the tomato rows ready to spot early leaf stress before spores spread.',
    descriptionUr:
      'ٹماٹر کی فصل کی حفاظت کا سفر شروع کرنے والے کاشتکاروں اور طلبہ کے لیے پہلا اعزاز۔',
    howToEarnEn: 'Unlocked automatically at Level 1 (0 XP).',
    howToEarnUr: 'لیول 1 (0 XP) پر خودکار طور پر کھلتا ہے۔',
    actionLabelEn: 'Scan a Leaf (+40 XP)',
    actionLabelUr: 'پتہ اسکین کریں (+40 XP)',
    actionTarget: 'scan',
    accentHex: '#166534'
  },
  {
    id: 'canopy_watcher',
    requiredLevel: 2,
    requiredXp: 100,
    titleEn: 'Canopy Watcher',
    titleUr: 'پتوں کا نگہبان',
    subtitleEn: 'Sharp Leaf Eye',
    subtitleUr: 'تندورستی کی نظر',
    descriptionEn:
      'Recognizes growers who actively scout lower canopy leaves and inspect crop stages for early warning signs.',
    descriptionUr:
      'نچلے پتوں کا باقاعدہ معائنہ کرنے اور بیماری کی ابتدائی علامات پکڑنے پر ملتا ہے۔',
    howToEarnEn: 'Reach Level 2 (100 XP) via leaf scans & event-tracked missions.',
    howToEarnUr: 'اسکین اور روزانہ مشن مکمل کر کے لیول 2 (100 XP) حاصل کریں۔',
    actionLabelEn: 'Complete Missions',
    actionLabelUr: 'روزانہ مشن دیکھیں',
    actionTarget: 'missions',
    accentHex: '#14532D'
  },
  {
    id: 'pathology_pro',
    requiredLevel: 3,
    requiredXp: 200,
    titleEn: 'Pathology Pro',
    titleUr: 'پیتھالوجی پرو',
    subtitleEn: 'Diagnostic Ace',
    subtitleUr: 'تشخیصی ماہر',
    descriptionEn:
      'Mastery of fungal, bacterial, and viral leaf lesion diagnosis paired with organic treatment steps.',
    descriptionUr:
      'پھپھوندی، بیکٹیریا اور وائرس کی علامات کی درست تشخیص اور قدرتی علاج میں مہارت۔',
    howToEarnEn: 'Reach Level 3 (200 XP) by analyzing leaves and studying the Disease Atlas.',
    howToEarnUr: 'پتوں کا تجزیہ کر کے اور امراض اٹلس دیکھ کر لیول 3 (200 XP) حاصل کریں۔',
    actionLabelEn: 'Open Disease Atlas',
    actionLabelUr: 'امراض اٹلس کھولیں',
    actionTarget: 'library',
    accentHex: '#B45309'
  },
  {
    id: 'soil_alchemist',
    requiredLevel: 4,
    requiredXp: 300,
    titleEn: 'Soil Alchemist',
    titleUr: 'مٹی کا ماہر',
    subtitleEn: 'Root-Zone Balance',
    subtitleUr: 'جڑوں کا توازن',
    descriptionEn:
      'Celebrates tuning soil intelligence and pH probes to separate root nutrient stress from pathogen outbreaks.',
    descriptionUr:
      'مٹی کی نمی اور پی ایچ کو متوازن رکھ کر فصل کو بیماریوں سے بچانے کا اعزاز۔',
    howToEarnEn: 'Reach Level 4 (300 XP) by checking real soil intelligence and root probes.',
    howToEarnUr: 'مٹی کا تجزیہ اور سینسر چیک کر کے لیول 4 (300 XP) حاصل کریں۔',
    actionLabelEn: 'Open Soil Intelligence',
    actionLabelUr: 'مٹی کا ڈیٹا دیکھیں',
    actionTarget: 'sensors',
    accentHex: '#1F5134'
  },
  {
    id: 'harvest_guardian',
    requiredLevel: 5,
    requiredXp: 400,
    titleEn: 'Harvest Guardian',
    titleUr: 'فصل کا محافظ',
    subtitleEn: 'Yield Protector',
    subtitleUr: 'پیداوار کا ضامن',
    descriptionEn:
      'Honors consistent preventative care across the Learning Centre, Disease Atlas, and Plant Growth Journey.',
    descriptionUr:
      'لرننگ سینٹر اور مسلسل حفاظتی نگہداشت سے بھرپور فصل حاصل کرنے پر۔',
    howToEarnEn: 'Reach Level 5 (400 XP) across scans, soil checks, and Learning Centre guides.',
    howToEarnUr: 'اسکین، مٹی کی جانچ اور لرننگ سینٹر سے لیول 5 (400 XP) تک پہنچیں۔',
    actionLabelEn: 'Open Learning Centre',
    actionLabelUr: 'لرننگ سینٹر کھولیں',
    actionTarget: 'learn',
    accentHex: '#92400E'
  },
  {
    id: 'master_agronomist',
    requiredLevel: 6,
    requiredXp: 500,
    titleEn: 'Master Agronomist',
    titleUr: 'ماہرِ زراعت',
    subtitleEn: 'Peak Field Mastery',
    subtitleUr: 'اعلیٰ ترین مہارت',
    descriptionEn:
      'The highest AgroVision distinction—earned by growers who unite AI diagnostics, live soil science, and botanical mastery.',
    descriptionUr:
      'ایگرو وژن کا سب سے بڑا اعزاز — اے آئی تشخیص، مٹی کے علم اور نباتاتی مہارت کے لیے۔',
    howToEarnEn: 'Reach Level 6 (500 XP) to unlock the complete AgroVision badge collection.',
    howToEarnUr: 'مکمل بیج کلیکشن کھولنے کے لیے لیول 6 (500 XP) حاصل کریں۔',
    actionLabelEn: 'Keep Scouting (+40 XP)',
    actionLabelUr: 'مزید اسکین کریں (+40 XP)',
    actionTarget: 'scan',
    accentHex: '#13281C'
  }
];

export interface XPEventBanner {
  id: number;
  amount: number;
  reasonEn: string;
  reasonUr: string;
  streakBonus?: number;
}

interface XPContextValue {
  xp: number;
  level: number;
  xpPerLevel: number;
  levelProgressPercent: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelTitleEn: string;
  levelTitleUr: string;
  dailyStreak: number;
  longestStreak: number;
  hasCompletedMissionToday: boolean;
  streakFreezes: number;
  maxStreakFreezes: number;
  streakProtectedByFreeze: boolean;
  nextStreakMilestone: number;
  todayStreakBonusXp: number;
  nextStreakBonusXp: number;
  badges: BadgeDefinition[];
  unlockedBadges: BadgeDefinition[];
  currentBadge: BadgeDefinition;
  nextBadge: BadgeDefinition | null;
  recentBadgeUnlock: BadgeDefinition | null;
  dismissRecentBadgeUnlock: () => void;
  completedMissions: Record<string, boolean>;
  awardedActions: Record<string, boolean>;
  lastXpEvent: XPEventBanner | null;
  dismissLastXpEvent: () => void;
  completeMissionByEvent: (id: MissionId) => boolean;
  awardXP: (
    amount: number,
    reasonEn: string,
    reasonUr: string,
    onceKey?: string,
    notify?: boolean
  ) => boolean;
}

const XP_STORAGE_KEY = 'agrovision_xp_state_v1';
const MISSIONS_STORAGE_KEY = 'agrovision_daily_missions_v1';
const STREAK_STORAGE_KEY = 'agrovision_daily_streak_v1';
const XP_PER_LEVEL = 100;
const MAX_STREAK_FREEZES = 2;
const STREAK_MILESTONES = [3, 7, 14, 30, 60];

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateKey(d);
}

export function computeStreakBonusXp(streakDays: number): number {
  return Math.min(50, 10 + Math.max(1, streakDays) * 5);
}

interface PersistedXPState {
  xp: number;
  awardedActions: Record<string, boolean>;
}

interface PersistedMissionsState {
  date: string;
  missions: Record<string, boolean>;
}

interface PersistedStreakState {
  streakCount: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  lastBonusDate: string | null;
  lastBonusAmount: number;
  streakFreezes: number;
  lastFreezeUsedDate: string | null;
}

function readStoredXP(): PersistedXPState {
  if (typeof window === 'undefined') return { xp: 20, awardedActions: {} };
  try {
    const raw = localStorage.getItem(XP_STORAGE_KEY);
    if (!raw) return { xp: 20, awardedActions: {} };
    const parsed = JSON.parse(raw);
    return {
      xp: typeof parsed.xp === 'number' && parsed.xp >= 0 ? Math.min(100000, parsed.xp) : 20,
      awardedActions:
        parsed.awardedActions && typeof parsed.awardedActions === 'object'
          ? parsed.awardedActions
          : {}
    };
  } catch {
    return { xp: 20, awardedActions: {} };
  }
}

function readStoredMissions(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  const today = getLocalDateKey();
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedMissionsState | Record<string, boolean>;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'date' in parsed &&
      'missions' in parsed &&
      typeof parsed.date === 'string' &&
      parsed.missions &&
      typeof parsed.missions === 'object'
    ) {
      return parsed.date === today ? (parsed.missions as Record<string, boolean>) : {};
    }
    return {};
  } catch {
    return {};
  }
}

function readStoredStreak(): PersistedStreakState {
  const defaultState: PersistedStreakState = {
    streakCount: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    lastBonusDate: null,
    lastBonusAmount: 0,
    streakFreezes: 1,
    lastFreezeUsedDate: null
  };
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    const loaded: PersistedStreakState = {
      streakCount: typeof parsed.streakCount === 'number' && parsed.streakCount >= 0 ? parsed.streakCount : 0,
      longestStreak:
        typeof parsed.longestStreak === 'number' && parsed.longestStreak >= 0 ? parsed.longestStreak : 0,
      lastCompletedDate: typeof parsed.lastCompletedDate === 'string' ? parsed.lastCompletedDate : null,
      lastBonusDate: typeof parsed.lastBonusDate === 'string' ? parsed.lastBonusDate : null,
      lastBonusAmount:
        typeof parsed.lastBonusAmount === 'number' && parsed.lastBonusAmount >= 0 ? parsed.lastBonusAmount : 0,
      streakFreezes:
        typeof parsed.streakFreezes === 'number' && parsed.streakFreezes >= 0
          ? Math.min(MAX_STREAK_FREEZES, parsed.streakFreezes)
          : 1,
      lastFreezeUsedDate: typeof parsed.lastFreezeUsedDate === 'string' ? parsed.lastFreezeUsedDate : null
    };

    // Automatic 1-day Streak Grace / Freeze preservation if user missed yesterday
    const yesterday = getOffsetDateKey(1);
    const twoDaysAgo = getOffsetDateKey(2);
    if (
      loaded.streakCount > 0 &&
      loaded.lastCompletedDate === twoDaysAgo &&
      loaded.streakFreezes > 0 &&
      loaded.lastFreezeUsedDate !== yesterday
    ) {
      return {
        ...loaded,
        streakFreezes: loaded.streakFreezes - 1,
        lastCompletedDate: yesterday,
        lastFreezeUsedDate: yesterday
      };
    }

    return loaded;
  } catch {
    return defaultState;
  }
}

const LEVEL_RANKS = [
  { minLevel: 1, en: 'Tomato Scout', ur: 'ٹماٹر اسکاؤٹ' },
  { minLevel: 2, en: 'Canopy Watcher', ur: 'پتوں کا نگہبان' },
  { minLevel: 3, en: 'Pathology Pro', ur: 'پیتھالوجی پرو' },
  { minLevel: 4, en: 'Soil Alchemist', ur: 'مٹی کا ماہر' },
  { minLevel: 5, en: 'Harvest Guardian', ur: 'فصل کا محافظ' },
  { minLevel: 6, en: 'Master Agronomist', ur: 'ماہرِ زراعت' }
];

function trimBoundedMap(input: Record<string, boolean>, maxKeys: number): Record<string, boolean> {
  const entries = Object.entries(input).filter(([, v]) => Boolean(v));
  if (entries.length <= maxKeys) return Object.fromEntries(entries);
  return Object.fromEntries(entries.slice(entries.length - maxKeys));
}

const XPContext = createContext<XPContextValue | undefined>(undefined);

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setCloudSyncStatus } = useAuth();
  const [xpState, setXpState] = useState<PersistedXPState>(() => readStoredXP());
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>(() =>
    readStoredMissions()
  );
  const [streakState, setStreakState] = useState<PersistedStreakState>(() => readStoredStreak());
  const [lastXpEvent, setLastXpEvent] = useState<XPEventBanner | null>(null);
  const [recentBadgeUnlock, setRecentBadgeUnlock] = useState<BadgeDefinition | null>(null);

  const xpStateRef = useRef(xpState);
  xpStateRef.current = xpState;
  const completedMissionsRef = useRef(completedMissions);
  completedMissionsRef.current = completedMissions;
  const streakStateRef = useRef(streakState);
  streakStateRef.current = streakState;

  const level = Math.floor(xpState.xp / XP_PER_LEVEL) + 1;
  const prevLevelRef = useRef<number>(level);
  const bannerTimeoutRef = useRef<number | null>(null);
  const badgeTimeoutRef = useRef<number | null>(null);
  const hydratedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (level > prevLevelRef.current) {
      const newlyUnlocked = [...BADGE_DEFINITIONS]
        .reverse()
        .find((b) => b.requiredLevel > prevLevelRef.current && b.requiredLevel <= level);
      if (newlyUnlocked) {
        setRecentBadgeUnlock(newlyUnlocked);
        hapticBadgeUnlock();
        if (badgeTimeoutRef.current) window.clearTimeout(badgeTimeoutRef.current);
        badgeTimeoutRef.current = window.setTimeout(() => {
          setRecentBadgeUnlock((curr) => (curr?.id === newlyUnlocked.id ? null : curr));
        }, 4200);
      }
    }
    prevLevelRef.current = level;
  }, [level]);

  // Persist locally
  useEffect(() => {
    try {
      localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(xpState));
    } catch {
      // Ignore quota errors
    }
  }, [xpState]);

  useEffect(() => {
    try {
      const payload: PersistedMissionsState = {
        date: getLocalDateKey(),
        missions: completedMissions
      };
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [completedMissions]);

  useEffect(() => {
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakState));
    } catch {
      // Ignore quota errors
    }
  }, [streakState]);

  // Hydrate & merge guest progress when user signs into Firebase
  useEffect(() => {
    if (!user) {
      hydratedUidRef.current = null;
      return;
    }
    if (hydratedUidRef.current === user.uid) return;
    hydratedUidRef.current = user.uid;

    let cancelled = false;
    const syncFromCloud = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const today = getLocalDateKey();

        if (!snap.exists()) {
          const unlockedIds = BADGE_DEFINITIONS.filter((b) => level >= b.requiredLevel).map((b) => b.id);
          await setDoc(userRef, {
            uid: user.uid,
            email: (user.email || '').slice(0, 320),
            displayName: (user.displayName || user.email?.split('@')[0] || 'Grower').slice(0, 120),
            role: 'grower',
            xp: Math.min(100000, Math.max(0, xpStateRef.current.xp)),
            dailyStreak: Math.min(3650, Math.max(0, streakStateRef.current.streakCount)),
            longestStreak: Math.min(3650, Math.max(0, streakStateRef.current.longestStreak)),
            lastCompletedDate: streakStateRef.current.lastCompletedDate,
            lastBonusDate: streakStateRef.current.lastBonusDate,
            lastBonusAmount: Math.min(100, Math.max(0, streakStateRef.current.lastBonusAmount)),
            streakFreezes: Math.min(2, Math.max(0, streakStateRef.current.streakFreezes)),
            lastFreezeUsedDate: streakStateRef.current.lastFreezeUsedDate,
            dailyMissionsDate: today,
            completedMissions: trimBoundedMap(completedMissionsRef.current, 12),
            awardedActions: trimBoundedMap(xpStateRef.current.awardedActions, 180),
            unlockedBadges: unlockedIds.slice(0, 12),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          if (!cancelled) setCloudSyncStatus('synced');
          return;
        }

        const remote = snap.data();
        if (cancelled || !remote) return;

        const mergedXp = Math.max(
          typeof remote.xp === 'number' ? remote.xp : 0,
          xpStateRef.current.xp
        );
        const mergedAwarded = trimBoundedMap(
          {
            ...(remote.awardedActions || {}),
            ...xpStateRef.current.awardedActions
          },
          180
        );
        setXpState({ xp: mergedXp, awardedActions: mergedAwarded });

        const remoteTodayMissions =
          remote.dailyMissionsDate === today && remote.completedMissions
            ? (remote.completedMissions as Record<string, boolean>)
            : {};
        setCompletedMissions((prev) => ({ ...remoteTodayMissions, ...prev }));

        const remoteStreak = typeof remote.dailyStreak === 'number' ? remote.dailyStreak : 0;
        const remoteLongest = typeof remote.longestStreak === 'number' ? remote.longestStreak : 0;
        setStreakState((prev) => ({
          streakCount: Math.max(prev.streakCount, remoteStreak),
          longestStreak: Math.max(prev.longestStreak, remoteLongest),
          lastCompletedDate:
            prev.lastCompletedDate === today
              ? today
              : remote.lastCompletedDate || prev.lastCompletedDate,
          lastBonusDate:
            prev.lastBonusDate === today ? today : remote.lastBonusDate || prev.lastBonusDate,
          lastBonusAmount: Math.max(prev.lastBonusAmount, remote.lastBonusAmount || 0),
          streakFreezes: Math.max(
            prev.streakFreezes,
            typeof remote.streakFreezes === 'number' ? remote.streakFreezes : 1
          ),
          lastFreezeUsedDate: remote.lastFreezeUsedDate || prev.lastFreezeUsedDate
        }));
        setCloudSyncStatus('synced');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
          setCloudSyncStatus('rules-pending');
        } else {
          setCloudSyncStatus('offline-cache');
        }
      }
    };

    void syncFromCloud();
    return () => {
      cancelled = true;
    };
  }, [user, level, setCloudSyncStatus]);

  // Debounced cloud sync on XP/mission/streak mutations
  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const unlockedIds = BADGE_DEFINITIONS.filter(
          (b) => Math.floor(xpState.xp / XP_PER_LEVEL) + 1 >= b.requiredLevel
        ).map((b) => b.id);
        await updateDoc(userRef, {
          xp: Math.min(100000, Math.max(0, xpState.xp)),
          dailyStreak: Math.min(3650, Math.max(0, streakState.streakCount)),
          longestStreak: Math.min(3650, Math.max(0, streakState.longestStreak)),
          lastCompletedDate: streakState.lastCompletedDate,
          lastBonusDate: streakState.lastBonusDate,
          lastBonusAmount: Math.min(100, Math.max(0, streakState.lastBonusAmount)),
          streakFreezes: Math.min(2, Math.max(0, streakState.streakFreezes)),
          lastFreezeUsedDate: streakState.lastFreezeUsedDate,
          dailyMissionsDate: getLocalDateKey(),
          completedMissions: trimBoundedMap(completedMissions, 12),
          awardedActions: trimBoundedMap(xpState.awardedActions, 180),
          unlockedBadges: unlockedIds.slice(0, 12),
          updatedAt: serverTimestamp()
        });
        setCloudSyncStatus('synced');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
          setCloudSyncStatus('rules-pending');
        }
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [user, xpState, completedMissions, streakState, setCloudSyncStatus]);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
      if (badgeTimeoutRef.current) window.clearTimeout(badgeTimeoutRef.current);
    };
  }, []);

  const showBanner = useCallback(
    (amount: number, reasonEn: string, reasonUr: string, streakBonus?: number) => {
      const eventId = Date.now();
      setLastXpEvent({ id: eventId, amount, reasonEn, reasonUr, streakBonus });
      if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = window.setTimeout(() => {
        setLastXpEvent((prev) => (prev?.id === eventId ? null : prev));
      }, 3600);
    },
    []
  );

  const dismissLastXpEvent = useCallback(() => {
    if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
    setLastXpEvent(null);
  }, []);

  const dismissRecentBadgeUnlock = useCallback(() => {
    if (badgeTimeoutRef.current) window.clearTimeout(badgeTimeoutRef.current);
    setRecentBadgeUnlock(null);
  }, []);

  const awardXP = useCallback(
    (
      amount: number,
      reasonEn: string,
      reasonUr: string,
      onceKey?: string,
      notify = false
    ): boolean => {
      if (amount <= 0) return false;
      if (onceKey && xpStateRef.current.awardedActions[onceKey]) {
        return false;
      }
      setXpState((prev) => {
        if (onceKey && prev.awardedActions[onceKey]) {
          return prev;
        }
        return {
          xp: Math.min(100000, prev.xp + amount),
          awardedActions: onceKey
            ? trimBoundedMap({ ...prev.awardedActions, [onceKey]: true }, 180)
            : prev.awardedActions
        };
      });
      if (notify) {
        showBanner(amount, reasonEn, reasonUr);
      }
      return true;
    },
    [showBanner]
  );

  /**
   * Event-driven mission completion: NEVER called directly by clicking a mission row.
   * Only genuine feature events (verified scan, live soil inspection, library read, learning/AI consult) invoke this.
   */
  const completeMissionByEvent = useCallback(
    (id: MissionId): boolean => {
      const missionDef = DAILY_MISSIONS.find((m) => m.id === id);
      if (!missionDef) return false;

      const today = getLocalDateKey();
      const missionOnceKey = `mission_${today}_${id}`;
      if (completedMissionsRef.current[id] || xpStateRef.current.awardedActions[missionOnceKey]) {
        if (!completedMissionsRef.current[id]) {
          setCompletedMissions((prev) => ({ ...prev, [id]: true }));
        }
        return false;
      }

      const currentStreak = streakStateRef.current;
      const yesterday = getOffsetDateKey(1);
      const alreadyCompletedToday = currentStreak.lastCompletedDate === today;

      setCompletedMissions((prev) => ({ ...prev, [id]: true }));
      hapticMissionComplete();

      let bonusXp = 0;
      if (!alreadyCompletedToday) {
        const activeBefore =
          currentStreak.lastCompletedDate === yesterday ? currentStreak.streakCount : 0;
        const nextStreak = activeBefore + 1;
        const bonusAlreadyClaimedToday = currentStreak.lastBonusDate === today;
        bonusXp = bonusAlreadyClaimedToday ? 0 : computeStreakBonusXp(nextStreak);
        const earnedFreeze = nextStreak > 0 && nextStreak % 3 === 0 ? 1 : 0;

        setStreakState({
          streakCount: nextStreak,
          longestStreak: Math.max(currentStreak.longestStreak, nextStreak),
          lastCompletedDate: today,
          lastBonusDate: today,
          lastBonusAmount: bonusAlreadyClaimedToday ? currentStreak.lastBonusAmount : bonusXp,
          streakFreezes: Math.min(MAX_STREAK_FREEZES, currentStreak.streakFreezes + earnedFreeze),
          lastFreezeUsedDate: currentStreak.lastFreezeUsedDate
        });
      }

      setXpState((curr) => {
        if (curr.awardedActions[missionOnceKey]) return curr;
        return {
          xp: Math.min(100000, curr.xp + missionDef.xpReward + bonusXp),
          awardedActions: trimBoundedMap({ ...curr.awardedActions, [missionOnceKey]: true }, 180)
        };
      });

      const labels: Record<MissionId, { en: string; ur: string }> = {
        scan_lower_leaf: {
          en: `Daily Mission Verified: Leaf Scan (+${missionDef.xpReward} XP)`,
          ur: `روزانہ مشن مکمل: پتے کا اسکین (+${missionDef.xpReward} XP)`
        },
        check_soil_sensors: {
          en: `Daily Mission Verified: Soil Intelligence (+${missionDef.xpReward} XP)`,
          ur: `روزانہ مشن مکمل: مٹی کی جانچ (+${missionDef.xpReward} XP)`
        },
        explore_library: {
          en: `Daily Mission Verified: Disease Atlas (+${missionDef.xpReward} XP)`,
          ur: `روزانہ مشن مکمل: امراض اٹلس (+${missionDef.xpReward} XP)`
        },
        learning_activity: {
          en: `Daily Mission Verified: Learning / AI Consult (+${missionDef.xpReward} XP)`,
          ur: `روزانہ مشن مکمل: لرننگ / اے آئی مشورہ (+${missionDef.xpReward} XP)`
        }
      };

      showBanner(
        missionDef.xpReward + bonusXp,
        labels[id].en,
        labels[id].ur,
        bonusXp > 0 ? bonusXp : undefined
      );

      return true;
    },
    [showBanner]
  );

  const today = getLocalDateKey();
  const yesterday = getOffsetDateKey(1);
  const hasCompletedMissionToday = streakState.lastCompletedDate === today;
  const dailyStreak =
    streakState.lastCompletedDate === today || streakState.lastCompletedDate === yesterday
      ? streakState.streakCount
      : 0;
  const longestStreak = Math.max(streakState.longestStreak, dailyStreak);
  const streakProtectedByFreeze =
    !hasCompletedMissionToday &&
    dailyStreak > 0 &&
    streakState.lastFreezeUsedDate === yesterday;
  const nextStreakMilestone =
    STREAK_MILESTONES.find((m) => m > dailyStreak) ?? Math.ceil((dailyStreak + 1) / 30) * 30;
  const todayStreakBonusXp =
    streakState.lastBonusDate === today ? streakState.lastBonusAmount : 0;
  const nextStreakBonusXp = computeStreakBonusXp(
    hasCompletedMissionToday ? dailyStreak : dailyStreak + 1
  );

  const xpIntoLevel = xpState.xp % XP_PER_LEVEL;
  const levelProgressPercent = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));

  const rankObj =
    [...LEVEL_RANKS].reverse().find((r) => level >= r.minLevel) || LEVEL_RANKS[0];

  const unlockedBadges = useMemo(
    () => BADGE_DEFINITIONS.filter((b) => level >= b.requiredLevel),
    [level]
  );

  const currentBadge = unlockedBadges[unlockedBadges.length - 1] ?? BADGE_DEFINITIONS[0];

  const nextBadge = useMemo(
    () => BADGE_DEFINITIONS.find((b) => level < b.requiredLevel) ?? null,
    [level]
  );

  return (
    <XPContext.Provider
      value={{
        xp: xpState.xp,
        level,
        xpPerLevel: XP_PER_LEVEL,
        levelProgressPercent,
        xpIntoLevel,
        xpForNextLevel: XP_PER_LEVEL,
        levelTitleEn: rankObj.en,
        levelTitleUr: rankObj.ur,
        dailyStreak,
        longestStreak,
        hasCompletedMissionToday,
        streakFreezes: streakState.streakFreezes,
        maxStreakFreezes: MAX_STREAK_FREEZES,
        streakProtectedByFreeze,
        nextStreakMilestone,
        todayStreakBonusXp,
        nextStreakBonusXp,
        badges: BADGE_DEFINITIONS,
        unlockedBadges,
        currentBadge,
        nextBadge,
        recentBadgeUnlock,
        dismissRecentBadgeUnlock,
        completedMissions,
        awardedActions: xpState.awardedActions,
        lastXpEvent,
        dismissLastXpEvent,
        completeMissionByEvent,
        awardXP
      }}
    >
      {children}
    </XPContext.Provider>
  );
};

export function useXP(): XPContextValue {
  const ctx = useContext(XPContext);
  if (!ctx) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return ctx;
}

export function useOptionalXP(): XPContextValue | undefined {
  return useContext(XPContext);
}
