import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ArrowLeft,
  Award,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Flame,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Trash2,
  User,
  Volume2,
  Wifi,
  X,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useScanHistory } from '../context/ScanHistoryContext';
import { usePlantJourney } from '../context/PlantJourneyContext';
import { useXP } from '../context/XPContext';
import { useMotion } from '../context/MotionContext';
import {
  GrowingSystemType,
  PakistanAgriRegion,
  ReminderWindow,
  usePreferences
} from '../context/PreferencesContext';
import { DpCameraCropModal, DpViewerLightbox, ProfileCropShape } from './ProfilePhotoModal';

interface ProfileViewProps {
  onOpenAuth: () => void;
  onOpenScanner: () => void;
  onOpenAdmin?: () => void;
}

const REGION_LABELS: Record<PakistanAgriRegion, { en: string; ur: string }> = {
  punjab_central: { en: 'Central Punjab', ur: 'وسطی پنجاب' },
  punjab_south: { en: 'South Punjab', ur: 'جنوبی پنجاب' },
  sindh_lower: { en: 'Lower Sindh', ur: 'زیریں سندھ' },
  potohar: { en: 'Potohar', ur: 'پوٹھوہار' },
  kp_swat: { en: 'KP / Swat', ur: 'سوات / کے پی' }
};

const SYSTEM_LABELS: Record<GrowingSystemType, { en: string; ur: string }> = {
  open_field: { en: 'Open Field', ur: 'کھلا کھیت' },
  plastic_tunnel: { en: 'Plastic Tunnel', ur: 'پلاسٹک ٹنل' }
};

const REMINDER_LABELS: Record<ReminderWindow, { en: string; ur: string }> = {
  morning: { en: 'Morning · 7:00 AM', ur: 'صبح 7:00 بجے' },
  evening: { en: 'Evening · 5:00 PM', ur: 'شام 5:00 بجے' },
  off: { en: 'Reminders Off', ur: 'یاد دہانی بند' }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const panelTransitionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }
  }
};

function readStoredDpShape(uid?: string): ProfileCropShape {
  if (typeof window === 'undefined') return 'circle';
  try {
    const val = localStorage.getItem(`agrovision_dp_shape_${uid || 'guest'}`);
    return val === 'rectangle' ? 'rectangle' : 'circle';
  } catch {
    return 'circle';
  }
}

function writeStoredDpShape(uid: string | undefined, shape: ProfileCropShape) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`agrovision_dp_shape_${uid || 'guest'}`, shape);
  } catch {
    // ignore storage errors
  }
}

function MobileToggleSwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${
        checked ? 'bg-[#0f766e]' : 'bg-[#cbdcd0]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenAuth,
  onOpenScanner,
  onOpenAdmin
}) => {
  const { isUrdu } = useLanguage();
  const {
    activeProfile,
    isAdmin,
    signOutAccount,
    updateGrowerProfile,
    sendPasswordReset
  } = useAuth();
  const { scans, clearScans } = useScanHistory();
  const { plants } = usePlantJourney();
  const {
    dailyStreak,
    level,
    xp,
    levelProgressPercent,
    xpIntoLevel,
    xpForNextLevel,
    levelTitleEn,
    levelTitleUr,
    badges,
    unlockedBadges
  } = useXP();
  const { calmMode, setCalmMode } = useMotion();
  const {
    lowDataMode,
    autoVoiceReadout,
    dailyReminderTime,
    preferredRegion,
    growingSystem,
    updatePreference
  } = usePreferences();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(activeProfile?.displayName || '');
  const [editPhone, setEditPhone] = useState(activeProfile?.phoneNumber || '');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [confirmClearScans, setConfirmClearScans] = useState(false);
  const [dpShape, setDpShape] = useState<ProfileCropShape>(() => readStoredDpShape(activeProfile?.uid));
  const [isDpViewerOpen, setIsDpViewerOpen] = useState(false);
  const [isDpCropModalOpen, setIsDpCropModalOpen] = useState(false);

  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    setDpShape(readStoredDpShape(activeProfile?.uid));
  }, [activeProfile?.uid]);

  useEffect(() => {
    setEditName(activeProfile?.displayName || '');
    setEditPhone(activeProfile?.phoneNumber || '');
  }, [activeProfile?.displayName, activeProfile?.phoneNumber]);

  const showToast = (msg: string) => {
    setSuccessNotice(msg);
    window.setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleSaveCroppedDp = (croppedDataUrl: string, shape: ProfileCropShape) => {
    setDpShape(shape);
    writeStoredDpShape(activeProfile?.uid, shape);
    updateGrowerProfile(editName || activeProfile?.displayName || 'Tomato Grower', croppedDataUrl, editPhone);
    showToast(isUrdu ? 'پروفائل تصویر (DP) محفوظ ہو گئی۔' : 'Profile photo updated.');
  };

  const handleRemoveDp = () => {
    updateGrowerProfile(editName || activeProfile?.displayName || 'Tomato Grower', '', editPhone);
    showToast(isUrdu ? 'پروفائل تصویر ہٹا دی گئی۔' : 'Profile photo removed.');
  };

  const handleAvatarPressStart = () => {
    longPressTriggeredRef.current = false;
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (activeProfile?.photoURL) {
        setIsDpViewerOpen(true);
      } else {
        setIsDpCropModalOpen(true);
      }
    }, 380);
  };

  const handleAvatarPressEnd = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleAvatarClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    if (activeProfile?.photoURL) {
      setIsDpViewerOpen(true);
    } else {
      setIsDpCropModalOpen(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateGrowerProfile(editName, undefined, editPhone);
    showToast(
      isUrdu ? 'کاشتکار کا نام اور فون نمبر محفوظ ہو گیا۔' : 'Grower profile saved.'
    );
  };

  const handlePasswordReset = async () => {
    if (!activeProfile?.email || activeProfile.source !== 'firebase') {
      setSecurityNotice({
        type: 'err',
        text: isUrdu
          ? 'پاس ورڈ ری سیٹ صرف ای میل سے بنے کلاؤڈ اکاؤنٹ کے لیے دستیاب ہے۔'
          : 'Password reset applies to cloud email accounts. Update details or sign in with email.'
      });
      return;
    }
    const ok = await sendPasswordReset(activeProfile.email);
    setSecurityNotice({
      type: ok ? 'ok' : 'err',
      text: ok
        ? isUrdu
          ? `پاس ورڈ ری سیٹ لنک ${activeProfile.email} پر بھیج دیا گیا۔`
          : `Password reset link sent to ${activeProfile.email}.`
        : isUrdu
        ? 'پاس ورڈ ری سیٹ ای میل نہیں بھیجی جا سکی۔'
        : 'Unable to send password reset email right now.'
    });
  };

  const unlockedSet = new Set(unlockedBadges.map((b) => b.id));
  const regionLabel = isUrdu ? REGION_LABELS[preferredRegion].ur : REGION_LABELS[preferredRegion].en;
  const systemLabel = isUrdu ? SYSTEM_LABELS[growingSystem].ur : SYSTEM_LABELS[growingSystem].en;
  const reminderLabel = isUrdu ? REMINDER_LABELS[dailyReminderTime].ur : REMINDER_LABELS[dailyReminderTime].en;
  const displayName = activeProfile?.displayName || (isUrdu ? 'ٹماٹر کاشتکار' : 'Tomato Grower');

  const fieldStats = [
    {
      id: 'streak',
      value: dailyStreak,
      label: isUrdu ? 'روزانہ سلسلہ' : 'Streak Days',
      icon: Flame,
      cardClass: 'bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/80 to-[#fde68a]/50 border-[#f59e0b]/45',
      iconWrap: 'bg-[#f59e0b] text-white',
      valueClass: 'text-[#92400e]'
    },
    {
      id: 'level',
      value: level,
      label: isUrdu ? 'مشن لیول' : 'Grower Level',
      icon: Award,
      cardClass: 'bg-gradient-to-br from-[#f7fee7] via-[#ecfccb]/85 to-[#d9f99d]/50 border-[#84cc16]/45',
      iconWrap: 'bg-[#4d7c0f] text-white',
      valueClass: 'text-[#365314]'
    },
    {
      id: 'scans',
      value: scans.length,
      label: isUrdu ? 'محفوظ اسکین' : 'Leaf Scans',
      icon: ClipboardList,
      cardClass: 'bg-gradient-to-br from-[#f0fdfa] via-[#ccfbf1]/75 to-[#99f6e4]/45 border-[#14b8a6]/45',
      iconWrap: 'bg-[#0f766e] text-white',
      valueClass: 'text-[#115e59]'
    },
    {
      id: 'plants',
      value: plants.length,
      label: isUrdu ? 'پودے' : 'Plants Tracked',
      icon: Sprout,
      cardClass: 'bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5]/80 to-[#a7f3d0]/45 border-[#10b981]/45',
      iconWrap: 'bg-[#047857] text-white',
      valueClass: 'text-[#064e3b]'
    }
  ];

  return (
    <MotionConfig reducedMotion={calmMode ? 'always' : 'user'}>
      <div className="w-full max-w-4xl mx-auto pb-24 space-y-4">

        {successNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-2xl bg-[#ecfdf5] border border-[#10b981]/50 text-[#064e3b] text-xs font-bold flex items-center justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              aria-label="Close notice"
              className="p-1 rounded-lg hover:bg-[#d1fae5] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!isSettingsOpen ? (
            <motion.div
              key="profile-main"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
              className="space-y-5"
            >
              {/* Vibrant Hero Card */}
              <motion.section
                variants={cardVariants}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#14532d] to-[#0f766e] p-5 sm:p-7 text-white shadow-lg"
              >
                {/* Decorative Ambient Glows (compositor-friendly) */}
                {!calmMode && !lowDataMode && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], opacity: [0.22, 0.34, 0.22] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      className="pointer-events-none absolute -top-16 -right-12 w-56 h-56 rounded-full bg-[#34d399] blur-3xl"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.16, 0.26, 0.16] }}
                      transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="pointer-events-none absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-[#f59e0b] blur-3xl"
                    />
                  </>
                )}

                {/* Top-Corner Settings Button */}
                <div className="relative z-10 flex items-center justify-between gap-3 mb-5">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#fef3c7]">
                    <Award className="w-4 h-4 text-[#fbbf24]" />
                    <span className="tabular-nums">
                      {isUrdu
                        ? `لیول ${level} · ${levelTitleUr}`
                        : `Level ${level} · ${levelTitleEn}`}
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsSettingsOpen(true)}
                    className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Settings className="w-4 h-4 text-[#fde68a]" />
                    <span>{isUrdu ? 'سیٹنگز' : 'Settings'}</span>
                  </motion.button>
                </div>

                {/* Main Profile Identity Row */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Interactive DP Avatar (tap or press/hold to view photo) + Camera Badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        onPointerDown={handleAvatarPressStart}
                        onPointerUp={handleAvatarPressEnd}
                        onPointerLeave={handleAvatarPressEnd}
                        onPointerCancel={handleAvatarPressEnd}
                        onContextMenu={(e) => {
                          if (activeProfile?.photoURL) {
                            e.preventDefault();
                            setIsDpViewerOpen(true);
                          }
                        }}
                        aria-label={
                          activeProfile?.photoURL
                            ? isUrdu
                              ? 'پروفائل تصویر دیکھیں'
                              : 'View profile picture'
                            : isUrdu
                            ? 'پروفائل تصویر لگائیں'
                            : 'Add profile picture'
                        }
                        className={`block p-[3px] bg-gradient-to-tr from-[#f59e0b] via-[#fde68a] to-[#34d399] shadow-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white select-none ${
                          dpShape === 'circle' ? 'rounded-full' : 'rounded-3xl'
                        }`}
                      >
                        <div
                          className={`w-24 h-24 sm:w-28 sm:h-28 bg-[#0b3322] overflow-hidden flex items-center justify-center ${
                            dpShape === 'circle' ? 'rounded-full' : 'rounded-[21px]'
                          }`}
                        >
                          {activeProfile?.photoURL ? (
                            <img
                              src={activeProfile.photoURL}
                              alt={displayName}
                              draggable={false}
                              className="w-full h-full object-cover select-none"
                            />
                          ) : (
                            <User className="w-12 h-12 text-[#a7f3d0]" />
                          )}
                        </div>
                      </button>

                      {/* Camera Badge (Opens Camera / Gallery Upload + Preview & Crop Modal) */}
                      <button
                        type="button"
                        onClick={() => setIsDpCropModalOpen(true)}
                        aria-label={isUrdu ? 'کیمرہ یا تصویر منتخب کریں' : 'Take or upload profile photo'}
                        className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white border-2 border-[#064e3b] shadow-md flex items-center justify-center cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </motion.div>
                  </div>

                  {/* Grower Name, Location Bio, & Animated XP Progress */}
                  <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0 w-full">
                    <div>
                      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                        {displayName}
                      </h1>
                      <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#d1fae5]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#fbbf24]" />
                          <span>{regionLabel}</span>
                        </span>
                        <span aria-hidden="true" className="text-white/40">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Sprout className="w-3.5 h-3.5 text-[#6ee7b7]" />
                          <span>{systemLabel}</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#ecfdf5]/90 leading-relaxed max-w-xl mx-auto sm:mx-0">
                      {isUrdu
                        ? 'ٹماٹر کی صحت، روزانہ فیلڈ مشن اور فصل کی حفاظت کا ذاتی پروفائل۔'
                        : 'Tomato field grower tracking leaf health, daily scouting missions, and harvest readiness.'}
                    </p>

                    {/* Animated XP Progress Bar */}
                    <div className="pt-1.5 max-w-md mx-auto sm:mx-0">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#d1fae5] mb-1.5 tabular-nums">
                        <span className="inline-flex items-center gap-1 font-extrabold text-[#fde68a]">
                          <Zap className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24]" />
                          {xp} XP
                        </span>
                        <span>
                          {xpIntoLevel}/{xpForNextLevel} XP · Lv.{level + 1}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-black/30 overflow-hidden border border-white/15">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(5, levelProgressPercent)}%` }}
                          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-[#fef08a] via-[#f59e0b] to-[#34d399]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Colorful Animated Field Stats */}
              <motion.section variants={cardVariants} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-display text-base font-extrabold text-[#13281c]">
                    {isUrdu ? 'فیلڈ کے اعداد و شمار' : 'Your Field Stats'}
                  </h2>
                  <span className="text-[11px] font-mono text-[#3d5947] tabular-nums">
                    {isUrdu ? `کل ${xp} پوائنٹس` : `${xp} Total XP`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {fieldStats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 + idx * 0.05, duration: 0.32 }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 ${stat.cardClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${stat.iconWrap}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <div
                            className={`font-mono text-2xl font-extrabold tabular-nums leading-none ${stat.valueClass}`}
                          >
                            {stat.value}
                          </div>
                          <div className="text-[11px] font-bold text-[#3d5947] mt-1.5">
                            {stat.label}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>

              {/* General Grower Profile Overview + Official Website Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Everyday Grower Summary Card */}
                <motion.section
                  variants={cardVariants}
                  className="rounded-3xl bg-white border border-[#cbdcd0] p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#cbdcd0]/70">
                      <h2 className="font-display text-base font-extrabold text-[#13281c] inline-flex items-center gap-2">
                        <User className="w-4 h-4 text-[#0f766e]" />
                        <span>{isUrdu ? 'کاشتکار کی تفصیلات' : 'Grower Overview'}</span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-xs font-bold text-[#0f766e] hover:text-[#14532d] cursor-pointer"
                      >
                        {isUrdu ? 'ترمیم کریں' : 'Edit in Settings'}
                      </button>
                    </div>

                    <div className="divide-y divide-[#cbdcd0]/50 text-xs">
                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-[#5b7463] font-medium">
                          {isUrdu ? 'علاقہ و کاشت' : 'Farm Setup'}
                        </span>
                        <span className="font-bold text-[#13281c] text-right">
                          {regionLabel} · {systemLabel}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-[#5b7463] font-medium">
                          {isUrdu ? 'واٹس ایپ / فون' : 'Phone / WhatsApp'}
                        </span>
                        <span className="font-mono font-bold text-[#13281c] tabular-nums">
                          {activeProfile?.phoneNumber
                            ? activeProfile.phoneNumber
                            : isUrdu
                            ? 'شامل نہیں'
                            : 'Not added yet'}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-[#5b7463] font-medium">
                          {isUrdu ? 'فیلڈ چیک وقت' : 'Daily Reminder'}
                        </span>
                        <span className="font-bold text-[#13281c]">{reminderLabel}</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-[#5b7463] font-medium">
                          {isUrdu ? 'فیلڈ رینک' : 'Current Rank'}
                        </span>
                        <span className="font-bold text-[#b45309]">
                          Lv.{level} · {isUrdu ? levelTitleUr : levelTitleEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={onOpenScanner}
                      className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#14532d] to-[#0f766e] hover:from-[#0f3d21] hover:to-[#0d5f59] text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isUrdu ? 'پتہ اسکین کریں' : 'Scan Leaf Now'}</span>
                    </motion.button>

                    {!activeProfile && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={onOpenAuth}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#f59e0b]/50 text-[#92400e] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>{isUrdu ? 'سائن ان' : 'Sign In'}</span>
                      </motion.button>
                    )}
                  </div>
                </motion.section>

                {/* Visit Our Website Card (agrovision-a.vercel.app) */}
                <motion.section
                  variants={cardVariants}
                  className="rounded-3xl bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/60 to-[#ecfdf5] border border-[#f59e0b]/40 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d97706] to-[#b45309] text-white flex items-center justify-center shadow-sm">
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#92400e]">
                        agrovision-a.vercel.app
                      </span>
                    </div>

                    <h2 className="font-display text-base font-extrabold text-[#13281c]">
                      {isUrdu ? 'ہماری آفیشل ویب سائٹ دیکھیں' : 'Visit Our Official Website'}
                    </h2>
                    <p className="text-xs text-[#3d5947] leading-relaxed">
                      {isUrdu
                        ? 'ایگرو وژن کا آن لائن ویب پورٹل کھولیں، تازہ ٹماٹر کی معلومات، گائیڈز اور کمیونٹی وسائل دیکھیں۔'
                        : 'Open the full AgroVision web portal for tomato pathology guides, research showcase, and field updates.'}
                    </p>
                  </div>

                  <motion.a
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    href="https://agrovision-a.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#13281c] hover:bg-[#14532d] text-white text-xs font-extrabold inline-flex items-center justify-between gap-2 shadow-sm"
                  >
                    <span>{isUrdu ? 'ہماری ویب سائٹ وزٹ کریں' : 'Visit Our Website'}</span>
                    <ExternalLink className="w-4 h-4 text-[#fde68a] shrink-0" />
                  </motion.a>
                </motion.section>
              </div>

              {/* Milestone Badges Showcase (Colorful Animated Tiles) */}
              <motion.section
                variants={cardVariants}
                className="rounded-3xl bg-white border border-[#cbdcd0] p-5 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#cbdcd0]/60">
                  <h2 className="font-display text-base font-extrabold text-[#13281c] inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d97706]" />
                    <span>{isUrdu ? 'فیلڈ رینک بیجز' : 'Grower Milestone Badges'}</span>
                  </h2>
                  <span className="font-mono text-xs font-extrabold text-[#0f766e] tabular-nums">
                    {unlockedBadges.length}/{badges.length} {isUrdu ? 'حاصل شدہ' : 'Unlocked'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {badges.map((badge, idx) => {
                    const isUnlocked = unlockedSet.has(badge.id);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 + idx * 0.04, duration: 0.28 }}
                        whileHover={isUnlocked ? { y: -2, scale: 1.02 } : undefined}
                        className={`p-3.5 rounded-2xl border transition-shadow ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-white to-[#ecfdf5] border-[#6ee7b7] shadow-xs'
                            : 'bg-[#faf8f2] border-[#cbdcd0]/80 opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                            style={{ backgroundColor: isUnlocked ? badge.accentHex : '#94a3b8' }}
                          >
                            {isUnlocked ? (
                              <Award className="w-4 h-4" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-mono text-[10px] font-extrabold text-[#5b7463] tabular-nums">
                            Lv.{badge.requiredLevel}
                          </span>
                        </div>
                        <div className="font-display text-xs font-extrabold text-[#13281c] truncate">
                          {isUrdu ? badge.titleUr : badge.titleEn}
                        </div>
                        <div className="text-[11px] text-[#3d5947] truncate mt-0.5">
                          {isUnlocked
                            ? isUrdu
                              ? badge.subtitleUr
                              : badge.subtitleEn
                            : `${badge.requiredXp} XP`}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            </motion.div>
          ) : (
            /* Mobile-App-Style Settings Screen */
            <motion.div
              key="profile-settings"
              variants={panelTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              {/* Settings Sticky Top Bar */}
              <div className="rounded-2xl bg-gradient-to-r from-[#13281c] to-[#14532d] text-white p-4 flex items-center justify-between gap-3 shadow-md">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isUrdu ? 'پروفائل پر واپس' : 'Back to Profile'}</span>
                </button>

                <div className="flex items-center gap-2 font-display text-sm font-extrabold text-[#fef3c7]">
                  <Settings className="w-4 h-4 text-[#fbbf24]" />
                  <span>{isUrdu ? 'پروفائل اور ایپ سیٹنگز' : 'Settings'}</span>
                </div>
              </div>

              {/* Section 1: Grower Profile & Identity */}
              <section className="rounded-3xl bg-white border border-[#cbdcd0] p-5 space-y-4 shadow-xs">
                <div className="pb-2.5 border-b border-[#cbdcd0]/70 flex items-center justify-between gap-2">
                  <h2 className="font-display text-sm font-extrabold text-[#13281c] inline-flex items-center gap-2">
                    <User className="w-4 h-4 text-[#14532d]" />
                    <span>{isUrdu ? 'کاشتکار پروفائل کی معلومات' : 'Grower Profile Information'}</span>
                  </h2>
                </div>

                {/* DP Control Row inside Settings */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#faf8f2] border border-[#cbdcd0]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        activeProfile?.photoURL
                          ? setIsDpViewerOpen(true)
                          : setIsDpCropModalOpen(true)
                      }
                      aria-label={isUrdu ? 'پروفائل تصویر دیکھیں' : 'View profile picture'}
                      className={`w-14 h-14 bg-[#14532d] text-white overflow-hidden flex items-center justify-center shrink-0 border-2 border-[#f59e0b] cursor-pointer ${
                        dpShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                      }`}
                    >
                      {activeProfile?.photoURL ? (
                        <img
                          src={activeProfile.photoURL}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-[#a7f3d0]" />
                      )}
                    </button>
                    <div>
                      <div className="text-xs font-extrabold text-[#13281c]">
                        {isUrdu ? 'پروفائل تصویر (DP)' : 'Profile Picture (DP)'}
                      </div>
                      <div className="text-[11px] text-[#5b7463]">
                        {isUrdu
                          ? 'کیمرہ یا گیلری سے تصویر لیں اور گول یا مستطیل کراپ کریں'
                          : 'Capture or upload photo and crop as circle or rectangle'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDpCropModalOpen(true)}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {activeProfile?.photoURL
                          ? isUrdu
                            ? 'تصویر بدلیں'
                            : 'Change Photo'
                          : isUrdu
                          ? 'تصویر لگائیں'
                          : 'Set Photo'}
                      </span>
                    </button>
                    {activeProfile?.photoURL && (
                      <button
                        type="button"
                        onClick={handleRemoveDp}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] text-xs font-bold cursor-pointer"
                      >
                        {isUrdu ? 'ہٹائیں' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#13281c] mb-1">
                        {isUrdu ? 'کاشتکار کا نام' : 'Grower Name'}
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder={isUrdu ? 'اپنا نام لکھیں' : 'Enter grower name'}
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-bold text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#13281c] mb-1">
                        {isUrdu ? 'موبائل / واٹس ایپ نمبر' : 'Mobile / WhatsApp Number'}
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" />
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+92 3XX XXXXXXX"
                          className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-mono text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#13281c] mb-1">
                      {isUrdu ? 'ای میل آئی ڈی' : 'Account Email'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={
                        activeProfile?.email ||
                        (isUrdu ? 'سائن ان نہیں' : 'Not signed in yet')
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#f1f6f1] border border-[#cbdcd0] text-xs font-mono text-[#5b7463] cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="submit"
                      className="min-h-[42px] px-5 py-2 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white text-xs font-extrabold cursor-pointer shadow-xs"
                    >
                      {isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Profile Changes'}
                    </button>

                    {activeProfile ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await signOutAccount();
                        }}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#fef2f2] border border-[#fca5a5] text-[#b91c1c] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#fee2e2]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'سائن آؤٹ' : 'Sign Out'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#edf5ef] hover:bg-[#dcebe1] text-[#14532d] text-xs font-bold cursor-pointer border border-[#cbdcd0]"
                      >
                        {isUrdu ? 'سائن ان / اکاؤنٹ بنائیں' : 'Sign In / Create Account'}
                      </button>
                    )}
                  </div>
                </form>
              </section>

              {/* Section 2: Rural Area & Preferences (Clean Grouped Rows) */}
              <section className="rounded-3xl bg-white border border-[#cbdcd0] p-5 space-y-4 shadow-xs">
                <div className="pb-2.5 border-b border-[#cbdcd0]/70 flex items-center justify-between gap-2">
                  <h2 className="font-display text-sm font-extrabold text-[#13281c] inline-flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#0f766e]" />
                    <span>{isUrdu ? 'علاقہ اور دیہی ایپ ترجیحات' : 'Rural Area & App Preferences'}</span>
                  </h2>
                </div>

                {/* Region, System, Reminder Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-[#faf8f2] border border-[#cbdcd0]">
                    <label className="block text-[11px] font-bold text-[#3d5947] mb-1.5">
                      {isUrdu ? 'پاکستان زرعی علاقہ' : 'Pakistan Region'}
                    </label>
                    <select
                      value={preferredRegion}
                      onChange={(e) =>
                        updatePreference('preferredRegion', e.target.value as PakistanAgriRegion)
                      }
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
                    >
                      <option value="punjab_central">
                        {isUrdu ? 'وسطی پنجاب' : 'Central Punjab'}
                      </option>
                      <option value="punjab_south">
                        {isUrdu ? 'جنوبی پنجاب' : 'South Punjab'}
                      </option>
                      <option value="sindh_lower">
                        {isUrdu ? 'زیریں سندھ' : 'Lower Sindh'}
                      </option>
                      <option value="potohar">{isUrdu ? 'پوٹھوہار' : 'Potohar'}</option>
                      <option value="kp_swat">{isUrdu ? 'سوات / کے پی' : 'KP / Swat'}</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#faf8f2] border border-[#cbdcd0]">
                    <label className="block text-[11px] font-bold text-[#3d5947] mb-1.5">
                      {isUrdu ? 'کاشت کا نظام' : 'Growing System'}
                    </label>
                    <select
                      value={growingSystem}
                      onChange={(e) =>
                        updatePreference('growingSystem', e.target.value as GrowingSystemType)
                      }
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
                    >
                      <option value="open_field">{isUrdu ? 'کھلا کھیت' : 'Open Field'}</option>
                      <option value="plastic_tunnel">
                        {isUrdu ? 'پلاسٹک ٹنل' : 'Plastic Tunnel'}
                      </option>
                    </select>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#faf8f2] border border-[#cbdcd0]">
                    <label className="block text-[11px] font-bold text-[#3d5947] mb-1.5">
                      <span className="inline-flex items-center gap-1">
                        <Bell className="w-3 h-3 text-[#d97706]" />
                        {isUrdu ? 'روزانہ یاد دہانی' : 'Daily Reminder'}
                      </span>
                    </label>
                    <select
                      value={dailyReminderTime}
                      onChange={(e) =>
                        updatePreference('dailyReminderTime', e.target.value as ReminderWindow)
                      }
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
                    >
                      <option value="morning">{isUrdu ? 'صبح 7:00 بجے' : 'Morning (7:00 AM)'}</option>
                      <option value="evening">{isUrdu ? 'شام 5:00 بجے' : 'Evening (5:00 PM)'}</option>
                      <option value="off">{isUrdu ? 'بند' : 'Off'}</option>
                    </select>
                  </div>
                </div>

                {/* Clean Mobile-Style Switch Rows */}
                <div className="divide-y divide-[#cbdcd0]/60 rounded-2xl border border-[#cbdcd0] bg-[#faf8f2] px-4">
                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Wifi className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#13281c]">
                          {isUrdu ? 'دیہی لو-ڈیٹا موڈ' : 'Rural Low-Data Mode'}
                        </div>
                        <p className="text-[11px] text-[#5b7463] mt-0.5">
                          {isUrdu
                            ? 'انٹرنیٹ ڈیٹا بچاتا ہے اور ہلکی تصاویر استعمال کرتا ہے۔'
                            : 'Compresses scan uploads and turns off heavy ambient effects.'}
                        </p>
                      </div>
                    </div>
                    <MobileToggleSwitch
                      checked={lowDataMode}
                      onChange={(val) => {
                        updatePreference('lowDataMode', val);
                        showToast(isUrdu ? 'لو-ڈیٹا موڈ اپڈیٹ ہو گیا۔' : 'Low-Data Mode updated.');
                      }}
                      label="Rural Low-Data Mode"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Sparkles className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#13281c]">
                          {isUrdu ? 'پرسکون ڈسپلے (کم حرکت)' : 'Reduced Motion (Calm Display)'}
                        </div>
                        <p className="text-[11px] text-[#5b7463] mt-0.5">
                          {isUrdu
                            ? 'اسکرین کی اضافی حرکت کم کر کے بیٹری بچاتا ہے۔'
                            : 'Reduces animations for calmer daylight viewing and battery life.'}
                        </p>
                      </div>
                    </div>
                    <MobileToggleSwitch
                      checked={calmMode}
                      onChange={(val) => setCalmMode(val)}
                      label="Reduced Motion"
                    />
                  </div>

                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Volume2 className="w-4 h-4 text-[#14532d] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#13281c]">
                          {isUrdu ? 'آٹو وائس رہنمائی' : 'Auto Voice Readout'}
                        </div>
                        <p className="text-[11px] text-[#5b7463] mt-0.5">
                          {isUrdu
                            ? 'نتیجہ آنے پر خودکار آواز میں علاج سنائیں۔'
                            : 'Reads leaf scan summary aloud after analysis.'}
                        </p>
                      </div>
                    </div>
                    <MobileToggleSwitch
                      checked={autoVoiceReadout}
                      onChange={(val) => updatePreference('autoVoiceReadout', val)}
                      label="Auto Voice Readout"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Security & Data Controls */}
              <section className="rounded-3xl bg-white border border-[#cbdcd0] p-5 space-y-3.5 shadow-xs">
                <div className="pb-2.5 border-b border-[#cbdcd0]/70 flex items-center justify-between gap-2">
                  <h2 className="font-display text-sm font-extrabold text-[#13281c] inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#14532d]" />
                    <span>{isUrdu ? 'سیکیورٹی اور ڈیٹا کنٹرولز' : 'Security & Data Controls'}</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#faf8f2] border border-[#cbdcd0] space-y-1">
                    <div className="text-[11px] text-[#5b7463]">
                      {isUrdu ? 'اکاؤنٹ حالت' : 'Account Status'}
                    </div>
                    <div className="font-bold text-[#13281c]">
                      {activeProfile
                        ? activeProfile.emailVerified
                          ? isUrdu
                            ? 'تصدیق شدہ کلاؤڈ اکاؤنٹ'
                            : 'Verified Cloud Account'
                          : activeProfile.source === 'firebase'
                          ? isUrdu
                            ? 'فعال کلاؤڈ اکاؤنٹ'
                            : 'Active Cloud Account'
                          : isUrdu
                          ? 'مقامی کاشتکار پروفائل'
                          : 'Active Grower Profile'
                        : isUrdu
                        ? 'لاگ ان نہیں — سائن ان کریں'
                        : 'Not Signed In'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#faf8f2] border border-[#cbdcd0] space-y-1">
                    <div className="text-[11px] text-[#5b7463]">
                      {isUrdu ? 'محفوظ اسکین رپورٹس' : 'Saved Scan Records'}
                    </div>
                    <div className="font-mono font-bold text-[#13281c] tabular-nums">
                      {scans.length} {isUrdu ? 'محفوظ رپورٹس' : 'records saved'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {activeProfile?.source === 'firebase' && activeProfile?.provider === 'email' && (
                    <button
                      type="button"
                      onClick={() => void handlePasswordReset()}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#edf5ef] hover:bg-[#dcebe1] border border-[#cbdcd0] text-xs font-bold text-[#14532d] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Send Password Reset Email'}</span>
                    </button>
                  )}

                  {scans.length > 0 && !confirmClearScans && (
                    <button
                      type="button"
                      onClick={() => setConfirmClearScans(true)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#faf8f2] hover:bg-[#fee2e2] border border-[#cbdcd0] text-xs font-bold text-[#991b1b] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'اسکین ہسٹری صاف کریں' : 'Clear Local Scan Cache'}</span>
                    </button>
                  )}

                  {confirmClearScans && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-[#fef2f2] border border-[#fca5a5]">
                      <span className="text-[11px] font-bold text-[#991b1b]">
                        {isUrdu ? 'تمام اسکین حذف کریں؟' : 'Remove all cached scans?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearScans();
                          setConfirmClearScans(false);
                          setSecurityNotice({
                            type: 'ok',
                            text: isUrdu
                              ? 'مقامی اسکین ہسٹری صاف کر دی گئی۔'
                              : 'Local scan cache cleared.'
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#b91c1c] text-white text-[11px] font-bold cursor-pointer"
                      >
                        {isUrdu ? 'ہاں، صاف کریں' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearScans(false)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#cbdcd0] text-[11px] font-bold text-[#13281c] cursor-pointer"
                      >
                        {isUrdu ? 'منسوخ' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>

                {securityNotice && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      securityNotice.type === 'ok'
                        ? 'bg-[#edf5ef] text-[#14532d] border border-[#8bb398]'
                        : 'bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]'
                    }`}
                  >
                    {securityNotice.text}
                  </div>
                )}
              </section>

              {/* Section 4: Website Link */}
              <section className="rounded-3xl bg-white border border-[#cbdcd0] p-4 shadow-xs">
                <a
                  href="https://agrovision-a.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-[#faf8f2] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#fffbeb] border border-[#f59e0b]/40 text-[#b45309] flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#13281c]">
                        {isUrdu ? 'ہماری ویب سائٹ دیکھیں' : 'Visit Our Website'}
                      </div>
                      <div className="text-[11px] font-mono text-[#0f766e] truncate">
                        agrovision-a.vercel.app
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#5b7463] shrink-0" />
                </a>
              </section>

              {/* Section 5 (VERY BOTTOM of Settings): Admin Panel */}
              {onOpenAdmin && (
                <section className="rounded-3xl bg-gradient-to-br from-[#13281c] to-[#0f3d21] text-white p-5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-sm font-extrabold text-[#fef3c7]">
                      <LayoutDashboard className="w-4 h-4 text-[#fbbf24]" />
                      <span>{isUrdu ? 'ایڈمن پینل' : 'Admin Panel'}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 text-[10px] font-mono text-[#d1fae5]">
                      <Lock className="w-3 h-3" />
                      <span>{isAdmin ? 'Admin Ready' : 'Protected'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#d1fae5]/90 leading-relaxed">
                    {isUrdu
                      ? 'صارفین کے نام، فون نمبرز، اسکین رپورٹس اور ایپ سرگرمی دیکھنے کے لیے ایڈمن پینل کھولیں۔'
                      : 'Inspect signed-in users, names, phone numbers, activity logs, and scanner feedback reports.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#fef3c7] hover:bg-[#fde68a] text-[#78350f] text-xs font-extrabold flex items-center justify-between cursor-pointer"
                  >
                    <span>{isUrdu ? 'ایڈمن ڈیش بورڈ کھولیں' : 'Open Admin Dashboard'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-Resolution DP Viewer (Tap or Press & Hold Avatar) */}
        <DpViewerLightbox
          isOpen={isDpViewerOpen}
          photoURL={activeProfile?.photoURL || ''}
          displayName={displayName}
          shape={dpShape}
          onClose={() => setIsDpViewerOpen(false)}
          isUrdu={isUrdu}
        />

        {/* Camera / Upload + Preview & Circle/Rectangle Crop Modal */}
        <DpCameraCropModal
          isOpen={isDpCropModalOpen}
          initialPhotoURL={activeProfile?.photoURL}
          initialShape={dpShape}
          onClose={() => setIsDpCropModalOpen(false)}
          onSavePhoto={handleSaveCroppedDp}
          onRemovePhoto={activeProfile?.photoURL ? handleRemoveDp : undefined}
          isUrdu={isUrdu}
        />
      </div>
    </MotionConfig>
  );
};
