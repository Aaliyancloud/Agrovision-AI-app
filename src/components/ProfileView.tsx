import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useScanHistory } from '../context/ScanHistoryContext';
import { usePlantJourney } from '../context/PlantJourneyContext';
import { useXP } from '../context/XPContext';
import {
  User,
  Camera,
  Cloud,
  Smartphone,
  ShieldCheck,
  Award,
  Flame,
  Sprout,
  ClipboardList,
  LogOut,
  CheckCircle2,
  Sparkles,
  Globe,
  Settings
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAuth: () => void;
  onOpenScanner: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuth, onOpenScanner }) => {
  const { isUrdu } = useLanguage();
  const { activeProfile, user, cloudSyncStatus, signOutAccount, updateGrowerProfile } = useAuth();
  const { scans } = useScanHistory();
  const { plants } = usePlantJourney();
  const { dailyStreak, level, xp } = useXP();

  const [editName, setEditName] = useState(activeProfile?.displayName || 'Aaryan Awan');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile?.displayName) {
      setEditName(activeProfile.displayName);
    }
  }, [activeProfile?.displayName]);

  const handleDpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateGrowerProfile(editName, result);
        setSuccessNotice(isUrdu ? 'پروفائل تصویر اپ ڈیٹ ہو گئی!' : 'Display picture updated successfully!');
        setTimeout(() => setSuccessNotice(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateGrowerProfile(editName);
    setSuccessNotice(isUrdu ? 'کاشتکار کا نام محفوظ ہو گیا!' : 'Grower name saved successfully!');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const syncLabel =
    cloudSyncStatus === 'synced'
      ? isUrdu
        ? 'کلاؤڈ بیک اپ فعال'
        : 'Cloud Synced'
      : cloudSyncStatus === 'syncing'
      ? isUrdu
        ? 'محفوظ ہو رہا ہے...'
        : 'Saving...'
      : cloudSyncStatus === 'device'
      ? isUrdu
        ? 'اس موبائل پر محفوظ'
        : 'Saved on This Device'
      : isUrdu
      ? 'مہمان موڈ'
      : 'Guest Mode';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 native-view-enter pb-20">
      {/* Profile Hero Header Card */}
      <section className="relative overflow-hidden rounded-3xl bg-[#14532d] p-6 text-white shadow-md space-y-4">
        <div className="absolute -right-6 -bottom-6 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar / DP Upload Container */}
          <div className="relative group w-24 h-24 rounded-2xl bg-[#0f3d21] border-2 border-[#fef3c7] overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
            {activeProfile?.photoURL ? (
              <img
                src={activeProfile.photoURL}
                alt={activeProfile.displayName || 'Grower'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-[#bbf7d0]" />
            )}
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold cursor-pointer transition-opacity p-1 text-center">
              <Camera className="w-5 h-5 mb-0.5" />
              <span>{isUrdu ? 'تصویر بدلیں' : 'Change DP'}</span>
              <input type="file" accept="image/*" onChange={handleDpUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-start space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f] text-[10px] font-mono font-bold">
              <Sparkles className="w-3 h-3 text-[#b45309]" />
              <span>{syncLabel}</span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Hello, {activeProfile?.displayName || 'Aaryan Awan'}!
            </h1>

            <p className="text-xs sm:text-sm text-[#dcfce7] font-medium leading-relaxed">
              {isUrdu
                ? 'آپ کیسی ہیں؟ آج آپ کا ٹماٹر فیلڈ پلان اور پودوں کا سفر کیسا جا رہا ہے؟'
                : 'How are you and what is your plant journey plan today? Your field checks & data are securely managed.'}
            </p>
          </div>
        </div>

        {successNotice && (
          <div className="p-3 rounded-2xl bg-[#f0fdf4] border border-[#86efac] text-[#14532d] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
      </section>

      {/* Grid of Profile Settings & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Grower Details & Name Edit */}
        <div className="md:col-span-2 space-y-4">
          <section className="rounded-2xl bg-white border border-[#cbdcd0] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#cbdcd0]">
              <h2 className="font-display text-base font-bold text-[#13281c] inline-flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#14532d]" />
                <span>{isUrdu ? 'کاشتکار کی تفصیلات' : 'Grower Information'}</span>
              </h2>
              {activeProfile?.source === 'firebase' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#edf5ef] text-[#14532d] text-xs font-bold">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Firebase Account</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#faf8f2] text-[#b45309] text-xs font-bold border border-[#cbdcd0]">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Device Storage</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'کاشتکار کا نام' : 'Grower Name'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Aaryan Awan"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-bold text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'ای میل یا شناختی آئی ڈی' : 'Email / Identifier'}
                </label>
                <input
                  type="text"
                  disabled
                  value={activeProfile?.email || 'aaryan.awan@agrovision.ai'}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#f1f6f1] border border-[#cbdcd0] text-xs font-mono text-[#5b7463] cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  {isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Profile Changes'}
                </button>

                {!activeProfile && (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#edf5ef] hover:bg-[#dcebe1] text-[#14532d] text-xs font-bold cursor-pointer border border-[#cbdcd0]"
                  >
                    {isUrdu ? 'سائن ان / کلاؤڈ' : 'Sign In / Sync'}
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Local Security & Data Note */}
          <section className="rounded-2xl bg-[#edf5ef] border border-[#cbdcd0] p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#14532d] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#13281c]">
                {isUrdu ? 'محفوظ اور نجی ڈیٹا' : 'Secure & Private Storage'}
              </div>
              <p className="text-xs text-[#3d5947] leading-relaxed">
                {isUrdu
                  ? 'آپ کے تمام اسکین ریکارڈ، پودوں کے نوٹس اور کاشتکار پروفائل آپ کے فون پر محفوظ ہیں۔ آپ جب چاہیں گوگل اکاؤنٹ کے ذریعے کلاؤڈ پر بھی سنک کر سکتے ہیں۔'
                  : 'Your tomato leaf scans, plant journey notes, and profile settings are stored securely on your phone. Scanning is always open without login restrictions.'}
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Grower Stats & Quick Actions */}
        <div className="space-y-4">
          <section className="rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-3 shadow-xs">
            <h3 className="font-display text-sm font-bold text-[#13281c]">
              {isUrdu ? 'فیلڈ کے اعداد و شمار' : 'Your Field Stats'}
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-center">
                <div className="font-mono text-lg font-extrabold text-[#14532d] tabular-nums inline-flex items-center gap-1">
                  <Flame className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b]" />
                  <span>{dailyStreak}</span>
                </div>
                <div className="text-[10px] font-mono uppercase text-[#5b7463] mt-0.5">
                  {isUrdu ? 'روزانہ سلسلہ' : 'Streak Days'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-center">
                <div className="font-mono text-lg font-extrabold text-[#b45309] tabular-nums inline-flex items-center gap-1">
                  <Award className="w-4 h-4 text-[#b45309]" />
                  <span>{level}</span>
                </div>
                <div className="text-[10px] font-mono uppercase text-[#5b7463] mt-0.5">
                  {isUrdu ? 'مشن لیول' : 'Grower Level'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-center">
                <div className="font-mono text-lg font-extrabold text-[#13281c] tabular-nums inline-flex items-center gap-1">
                  <ClipboardList className="w-4 h-4 text-[#14532d]" />
                  <span>{scans.length}</span>
                </div>
                <div className="text-[10px] font-mono uppercase text-[#5b7463] mt-0.5">
                  {isUrdu ? 'محفوظ اسکین' : 'Leaf Scans'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-center">
                <div className="font-mono text-lg font-extrabold text-[#13281c] tabular-nums inline-flex items-center gap-1">
                  <Sprout className="w-4 h-4 text-[#166534]" />
                  <span>{plants.length}</span>
                </div>
                <div className="text-[10px] font-mono uppercase text-[#5b7463] mt-0.5">
                  {isUrdu ? 'پودے' : 'Plants Tracked'}
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-2.5 shadow-xs">
            <h3 className="font-display text-sm font-bold text-[#13281c]">
              {isUrdu ? 'فوری اقدامات' : 'Quick Actions'}
            </h3>

            <button
              type="button"
              onClick={onOpenScanner}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-gradient-to-r from-[#b45309] to-[#d97706] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>{isUrdu ? 'نیا پتہ اسکین کریں' : 'Scan Leaf Now'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await signOutAccount();
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#fef2f2] border border-[#fca5a5] text-[#b91c1c] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-[#fee2e2]"
            >
              <LogOut className="w-4 h-4" />
              <span>{isUrdu ? 'اکاؤنٹ سے باہر نکلیں' : 'Sign Out / Reset Profile'}</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
