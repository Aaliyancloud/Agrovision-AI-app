import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Loader2,
  Mail,
  Phone,
  Send,
  User,
  X
} from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { DiagnosisResult } from '../types/disease';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';

interface ScanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DiagnosisResult;
}

type ReportIssueType =
  | 'wrong_disease'
  | 'false_rejection'
  | 'human_or_object_error'
  | 'blur_quality'
  | 'other';

async function buildCompactThumbnail(src: string): Promise<string | undefined> {
  if (!src) return undefined;
  if (src.startsWith('/') || src.startsWith('https://')) {
    return src.slice(0, 500);
  }
  if (!src.startsWith('data:image/')) return undefined;
  if (src.length <= 120000) return src;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 280;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(40, Math.round((img.width || 240) * scale));
        const h = Math.max(40, Math.round((img.height || 240) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.65).slice(0, 175000));
      } catch {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

export const ScanReportModal: React.FC<ScanReportModalProps> = ({ isOpen, onClose, result }) => {
  const { isUrdu } = useLanguage();
  const { activeProfile, user } = useAuth();

  const defaultIssue: ReportIssueType = !result.isTomatoLeaf
    ? result.stage1.detectedSubjectCategory === 'human' ||
      result.stage1.detectedSubjectCategory === 'green_object'
      ? 'human_or_object_error'
      : result.stage1.status === 'blurry'
      ? 'blur_quality'
      : 'false_rejection'
    : 'wrong_disease';

  const [issueType, setIssueType] = useState<ReportIssueType>(defaultIssue);
  const [reporterName, setReporterName] = useState(activeProfile?.displayName || '');
  const [reporterEmail, setReporterEmail] = useState(activeProfile?.email || '');
  const [reporterPhone, setReporterPhone] = useState(activeProfile?.phoneNumber || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIssueType(defaultIssue);
    setReporterName(activeProfile?.displayName || '');
    setReporterEmail(activeProfile?.email || '');
    setReporterPhone(activeProfile?.phoneNumber || '');
    setNotes('');
    setSubmitError(null);
    setSubmittedReportId(null);
  }, [isOpen, result.id]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const issueOptions: { id: ReportIssueType; en: string; ur: string }[] = [
    {
      id: 'wrong_disease',
      en: 'Wrong disease / health result predicted',
      ur: 'بیماری یا صحت کا نتیجہ غلط بتایا گیا'
    },
    {
      id: 'false_rejection',
      en: 'Real tomato leaf got rejected by scanner',
      ur: 'اصل ٹماٹر کا پتہ مسترد کر دیا گیا'
    },
    {
      id: 'human_or_object_error',
      en: 'Person, wall, or non-plant gave wrong detection',
      ur: 'انسان، کپڑے یا غیر پودے پر غلط نتیجہ آیا'
    },
    {
      id: 'blur_quality',
      en: 'Blurry photo warning was inaccurate',
      ur: 'دھندلی تصویر کی وارننگ درست نہیں تھی'
    },
    {
      id: 'other',
      en: 'Other scanner model feedback',
      ur: 'اسکینر ماڈل کے بارے میں دیگر رائے'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = reporterName.trim() || activeProfile?.displayName || 'Anonymous Grower';
    if (!notes.trim()) {
      setSubmitError(
        isUrdu
          ? 'برائے مہربانی مختصر طور پر مسئلہ لکھیں تاکہ ماڈل ٹیم اسے چیک کر سکے۔'
          : 'Please describe briefly what went wrong so AgroVision Studio can review this scan.'
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const compactThumb = await buildCompactThumbnail(result.imageUri);
    const authMode = activeProfile?.source === 'firebase' ? 'firebase' : activeProfile ? 'device' : 'guest';

    const payload = {
      id: reportId,
      reporterUid: activeProfile?.uid || 'guest',
      reporterName: cleanName.slice(0, 120),
      reporterEmail: reporterEmail.trim().toLowerCase().slice(0, 320),
      reporterPhone: reporterPhone.trim().slice(0, 32),
      authMode,
      issueType,
      diagnosisId: (result.diseaseId || result.stage1.status || 'unknown').slice(0, 80),
      diagnosisName: (
        result.isTomatoLeaf
          ? result.diseaseName
          : result.stage1.rejectionTitle || result.stage1.speciesCommonName || result.diseaseName
      ).slice(0, 140),
      stage1Status: result.stage1.status,
      confidence: Math.round(result.confidence || result.stage1.confidence || 0),
      sourceType: result.sourceType,
      aiEngineUsed: result.aiEngineUsed,
      notes: notes.trim().slice(0, 1200),
      thumbnailUrl: compactThumb
    };

    try {
      const response = await fetch('/api/scan-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error || 'Could not submit report to AgroVision Studio server.');
      }

      if (user) {
        try {
          await setDoc(doc(db, 'scanReports', reportId), {
            ...payload,
            status: 'open',
            adminNote: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch {
          // Backend store already persisted the report cleanly even if Firestore rules are pending
        }
      }

      setSubmittedReportId(reportId);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : isUrdu
          ? 'رپورٹ محفوظ نہیں ہو سکی، دوبارہ کوشش کریں۔'
          : 'Failed to submit feedback report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const mailtoSubject = encodeURIComponent(
    `[AgroVision AI Scan Feedback] ${result.diseaseName} (${issueType})`
  );
  const mailtoBody = encodeURIComponent(
    `Reporter: ${reporterName || 'Grower'}\nEmail: ${reporterEmail || 'N/A'}\nPhone: ${
      reporterPhone || 'N/A'
    }\nScan Output: ${result.diseaseName} (${result.confidence}%)\nStage 1 Status: ${
      result.stage1.status
    }\nAI Engine: ${result.aiEngineUsed}\nIssue Type: ${issueType}\nNotes:\n${notes}\nReport ID: ${
      submittedReportId || 'pending'
    }`
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-[#13281c]/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isUrdu ? 'اسکینر فیڈبیک رپورٹ' : 'Report Scan Issue'}
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] bg-[#faf8f2] border border-[#cbdcd0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] native-sheet-enter"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#14532d] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-[#fef3c7]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-sm sm:text-base leading-tight truncate">
                {isUrdu ? 'اے آئی اسکینر کی غلطی رپورٹ کریں' : 'Report AI Scanner Issue'}
              </h2>
              <p className="text-[11px] text-[#dcfce7]/90 truncate">
                {isUrdu
                  ? 'آپ کی رپورٹ براہِ راست ایگرو ویژن اسٹوڈیو اور ایڈمن پینل کو جائے گی'
                  : 'Sends diagnostic sample & feedback to AgroVision Studio'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isUrdu ? 'بند کریں' : 'Close'}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#13281c]">
          {/* Scanned Context Banner */}
          <div className="p-3 rounded-2xl bg-white border border-[#cbdcd0] flex items-center gap-3">
            <img
              src={result.imageUri}
              alt="Reported scan preview"
              className="w-12 h-12 rounded-xl object-cover border border-[#cbdcd0] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono uppercase text-[#5b7463]">
                {isUrdu ? 'اسکین کا نتیجہ' : 'Scanned Result'} · {result.aiEngineUsed}
              </div>
              <div className="font-display font-bold text-xs sm:text-sm text-[#13281c] truncate">
                {result.isTomatoLeaf
                  ? result.diseaseName
                  : result.stage1.rejectionTitle || result.stage1.speciesCommonName}
              </div>
              <div className="font-mono text-[10px] text-[#3d5947]">
                {isUrdu ? 'یقین:' : 'Confidence:'}{' '}
                {Math.round(result.confidence || result.stage1.confidence || 0)}% · {result.stage1.status}
              </div>
            </div>
          </div>

          {submittedReportId ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#86efac] text-[#14532d] space-y-2">
                <div className="flex items-center gap-2 font-display font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0" />
                  <span>
                    {isUrdu
                      ? 'شکریہ! آپ کی فیڈبیک رپورٹ موصول ہو گئی ہے'
                      : 'Thank you! Report sent to AgroVision Studio'}
                  </span>
                </div>
                <p className="text-xs text-[#3d5947] leading-relaxed">
                  {isUrdu
                    ? 'ایگرو ویژن ٹیم اور ایڈمن پینل اب اس تصویر اور ماڈل کے نتیجے کا جائزہ لے سکیں گے تاکہ ماڈل کو مزید بہتر بنایا جا سکے۔'
                    : 'Your scan metadata, details, and notes are now logged in the Admin Panel for model review.'}
                </p>
                <div className="text-[10px] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-[#bbf7d0] inline-block">
                  Report ID: {submittedReportId}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:yousaaf.awan56@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`}
                  className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-white border border-[#cbdcd0] hover:bg-[#edf5ef] text-[#14532d] font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'ای میل ایپ سے بھی بھیجیں' : 'Also Send via Email App'}</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs cursor-pointer"
                >
                  {isUrdu ? 'مکمل / بند کریں' : 'Done'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {submitError && (
                <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'اسکین میں کیا مسئلہ پیش آیا؟' : 'What went wrong with this scan?'}
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as ReportIssueType)}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white border border-[#cbdcd0] text-xs font-semibold text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                >
                  {issueOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isUrdu ? opt.ur : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                    {isUrdu ? 'آپ کا نام' : 'Your Name'}
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder={isUrdu ? 'مثال: عالیان اعوان' : 'Your name'}
                      className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                    {isUrdu ? 'فون نمبر' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      placeholder="+92 3XX XXXXXXX"
                      className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs font-mono text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'ای میل (جواب کے لیے)' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" />
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'تفصیل / صحیح نتیجہ کیا ہونا چاہیے؟' : 'Details / What was actually in the photo?'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isUrdu
                      ? 'مثلاً: تصویر میں سبز دیوار یا انسان تھا مگر پتا دکھایا گیا، یا ٹماٹر کے پتے پر غلط بیماری آئی...'
                      : 'e.g. Photo had green fabric / person, or this tomato leaf actually has Early Blight...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isUrdu ? 'رپورٹ بھیجیں' : 'Submit Report to Studio'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
