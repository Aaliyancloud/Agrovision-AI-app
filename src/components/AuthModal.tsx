import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AgroVisionLogo } from './AgroVisionLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { isUrdu } = useLanguage();
  const {
    user,
    activeProfile,
    cloudSyncStatus,
    authError,
    authSuccess,
    clearAuthMessages,
    signInWithGoogleAccount,
    signUpWithEmailAccount,
    signInWithEmailAccount,
    resendVerification,
    sendPasswordReset,
    signOutAccount,
    updateGrowerProfile
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editName, setEditName] = useState(activeProfile?.displayName || 'Aaryan Awan');

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
      }
    };
    reader.readAsDataURL(file);
  };

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const clearAuthMessagesRef = useRef(clearAuthMessages);
  clearAuthMessagesRef.current = clearAuthMessages;

  useEffect(() => {
    if (!isOpen) return;
    clearAuthMessagesRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleGoogle = async () => {
    setSubmitting(true);
    const ok = await signInWithGoogleAccount();
    setSubmitting(false);
    if (ok) {
      setTimeout(onClose, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    let ok = false;
    if (mode === 'signin') {
      ok = await signInWithEmailAccount(email, password);
    } else if (mode === 'signup') {
      ok = await signUpWithEmailAccount(displayName, email, password);
    } else {
      ok = await sendPasswordReset(email);
    }
    setSubmitting(false);
    if (ok && mode !== 'forgot') {
      setTimeout(onClose, 550);
    }
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

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-[#13281c]/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isUrdu ? 'ایگرو وژن اکاؤنٹ' : 'AgroVision Account'}
    >
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[390px] bg-[#faf8f2] border border-[#cbdcd0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
      >
        {/* Clean Native Header */}
        <div className="px-5 pt-5 pb-4 bg-[#14532d] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <AgroVisionLogo className="w-10 h-10 shrink-0 shadow-xs" />
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-base leading-tight truncate">
                {activeProfile
                  ? isUrdu
                    ? 'میرا کاشتکار اکاؤنٹ'
                    : 'Your Grower Profile'
                  : mode === 'signup'
                  ? isUrdu
                    ? 'نیا اکاؤنٹ بنائیں'
                    : 'Create Account'
                  : mode === 'forgot'
                  ? isUrdu
                    ? 'پاس ورڈ بحال کریں'
                    : 'Reset Password'
                  : isUrdu
                  ? 'خوش آمدید'
                  : 'Welcome Back'}
              </h2>
              <p className="text-[11px] text-[#dcfce7]/90 truncate mt-0.5">
                {activeProfile
                  ? syncLabel
                  : isUrdu
                  ? 'اپنے پودے اور پتے کے اسکین محفوظ رکھیں'
                  : 'Save your tomato scans & plants'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isUrdu ? 'بند کریں' : 'Close'}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form / Profile Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#3d5947]">
          {authError && (
            <div className="p-3 rounded-2xl bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug font-medium">{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-2xl bg-[#f0fdf4] border border-[#86efac] text-[#14532d] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug font-medium">{authSuccess}</span>
            </div>
          )}

          {activeProfile ? (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-white border border-[#cbdcd0] space-y-3.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative group w-14 h-14 rounded-2xl bg-[#edf5ef] border-2 border-[#14532d] overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {activeProfile.photoURL ? (
                      <img src={activeProfile.photoURL} alt="Display Picture" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-[#14532d]" />
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity">
                      Upload DP
                      <input type="file" accept="image/*" onChange={handleDpUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono font-bold text-[#14532d]">
                      {isUrdu ? 'کاشتکار پروفایل' : 'Grower Profile'}
                    </div>
                    <div className="font-display font-bold text-sm text-[#13281c] truncate">
                      {activeProfile.displayName}
                    </div>
                    <div className="font-mono text-[11px] text-[#3d5947] truncate mt-0.5">
                      {activeProfile.email}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#cbdcd0]/60">
                  <label className="block text-[10px] font-bold text-[#13281c] uppercase tracking-wider">
                    {isUrdu ? 'پروفائل کا نام تبدیل کریں' : 'Update Grower Name'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Aaryan Awan"
                      className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-bold text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                    />
                    <button
                      type="button"
                      onClick={() => updateGrowerProfile(editName)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white text-xs font-bold cursor-pointer shadow-xs"
                    >
                      {isUrdu ? 'محفوظ' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fef3c7]/70 border border-[#d97706]/50 text-[#78350f] text-xs space-y-1">
                <div className="font-bold">Hello {activeProfile.displayName}, how are you?</div>
                <div className="text-[11px] opacity-90 leading-relaxed">
                  What is your plant journey plan today? Your leaf checks, plant notes, and grower records are safely stored on this phone.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#edf5ef] border border-[#cbdcd0] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#14532d] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  {activeProfile.source === 'firebase'
                    ? isUrdu
                      ? 'آپ کے پتے کے اسکین، پودے اور روزانہ اسکور خودکار طور پر آپ کے اکاؤنٹ میں محفوظ ہو رہے ہیں۔'
                      : 'Your leaf scans, plants, and streak progress are saved to your account.'
                    : isUrdu
                    ? 'آپ کا پروفائل اور تمام اسکین محفوظ طریقے سے اس موبائل پر محفوظ ہیں۔'
                    : 'Your Grower Profile, plant notes, and leaf checks are safely stored on this phone.'}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await signOutAccount();
                  onClose();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-white border border-[#fca5a5] text-[#b91c1c] hover:bg-[#fef2f2] font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isUrdu ? 'لاگ آؤٹ کریں' : 'Sign Out'}</span>
              </button>
            </div>
          ) : mode === 'forgot' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <button
                type="button"
                onClick={() => {
                  clearAuthMessages();
                  setMode('signin');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14532d] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'واپس سائن ان پر جائیں' : 'Back to Sign In'}</span>
              </button>

              <div>
                <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'اپنا ای میل لکھیں' : 'Your Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isUrdu ? 'ری سیٹ لنک بھیجیں' : 'Send Reset Link'}</span>
              </button>
            </form>
          ) : (
            <>
              {/* Clean 2-Tab Segmented Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#edf5ef] border border-[#cbdcd0]">
                {([
                  { id: 'signin', label: isUrdu ? 'سائن ان' : 'Sign In' },
                  { id: 'signup', label: isUrdu ? 'نیا اکاؤنٹ' : 'Create Account' }
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      clearAuthMessages();
                      setMode(tab.id);
                    }}
                    className={`min-h-[38px] rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      mode === tab.id
                        ? 'bg-[#14532d] text-white shadow-xs'
                        : 'text-[#3d5947] hover:text-[#13281c]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                      {isUrdu ? 'آپ کا نام' : 'Your Name'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={isUrdu ? 'مثال: احمد خان' : 'e.g. Tariq Farm'}
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                    {isUrdu ? 'ای میل' : 'Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-[#13281c]">
                      {isUrdu ? 'پاس ورڈ' : 'Password'}
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          clearAuthMessages();
                          setMode('forgot');
                        }}
                        className="text-[11px] font-semibold text-[#166534] hover:underline cursor-pointer"
                      >
                        {isUrdu ? 'پاس ورڈ بھول گئے؟' : 'Forgot password?'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isUrdu ? 'کم از کم 6 حروف' : 'At least 6 characters'}
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute top-1/2 -translate-y-1/2 right-2.5 p-1.5 rounded-lg text-[#5b7463] hover:text-[#13281c] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>
                    {mode === 'signin'
                      ? isUrdu
                        ? 'سائن ان کریں'
                        : 'Sign In'
                      : isUrdu
                      ? 'اکاؤنٹ بنائیں'
                      : 'Create Account'}
                  </span>
                </button>
              </form>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[40px] px-3 py-2 rounded-2xl bg-[#edf5ef] hover:bg-[#dcebe1] text-[#14532d] font-bold text-xs cursor-pointer"
              >
                {isUrdu
                  ? 'مہمان کے طور پر استعمال کریں'
                  : 'Continue as Guest'}
              </button>
            </>
          )}

          <div className="pt-2 border-t border-[#cbdcd0]/60 flex items-center justify-center">
            <a
              href="https://agrovision-a.ai.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5b7463] hover:text-[#14532d] underline-offset-2 hover:underline"
            >
              <span>{isUrdu ? 'ہماری ویب سائٹ دیکھیں:' : 'Visit our website:'}</span>
              <span className="font-mono">agrovision-a.ai.studio</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
