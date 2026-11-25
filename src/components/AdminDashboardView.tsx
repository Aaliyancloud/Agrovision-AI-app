import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Flag,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  User,
  Users
} from 'lucide-react';
import { collection, doc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';

interface SyncedUserRecord {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
  provider: 'google' | 'email' | 'device';
  emailVerified: boolean;
  xp: number;
  level: number;
  dailyStreak: number;
  scansCount: number;
  plantsCount: number;
  recentScans: {
    id: string;
    diseaseName: string;
    confidence: number;
    isTomatoLeaf: boolean;
    createdAt: string;
  }[];
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
}

interface ScanReportRecord {
  id: string;
  reporterUid: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  authMode: 'firebase' | 'device' | 'guest';
  issueType: string;
  diagnosisId: string;
  diagnosisName: string;
  stage1Status: string;
  confidence: number;
  sourceType: string;
  aiEngineUsed: string;
  notes: string;
  status: 'open' | 'reviewed' | 'resolved';
  adminNote: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface SignInEventRecord {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  provider: 'google' | 'email' | 'device';
  timestamp: string;
}

interface DashboardStats {
  totalUsers: number;
  usersWithPhone: number;
  totalScansReported: number;
  totalPlantsTracked: number;
  totalReports: number;
  openReports: number;
  signInEventsCount: number;
}

type AdminSubTab = 'users' | 'reports' | 'activity';

function formatTimestamp(iso: string, isUrdu: boolean): string {
  if (!iso) return '—';
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
}

function escapeCsvCell(val: unknown): string {
  const s = String(val ?? '').replace(/\r?\n/g, ' ');
  if (s.includes(',') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const AdminDashboardView: React.FC = () => {
  const { isUrdu } = useLanguage();
  const { user, syncAllAccountsNow } = useAuth();

  // In-memory only admin token (never persisted to localStorage)
  const [adminToken, setAdminToken] = useState<string>('');
  const [passcodeMode, setPasscodeMode] = useState<'loading' | 'env' | 'claimed' | 'unclaimed'>('loading');
  const [adminEmailHint, setAdminEmailHint] = useState<string>('yousaaf.awan56@gmail.com');

  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [subTab, setSubTab] = useState<AdminSubTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [users, setUsers] = useState<SyncedUserRecord[]>([]);
  const [reports, setReports] = useState<ScanReportRecord[]>([]);
  const [signInEvents, setSignInEvents] = useState<SignInEventRecord[]>([]);
  const [expandedUserUid, setExpandedUserUid] = useState<string | null>(null);
  const [reportAdminNotes, setReportAdminNotes] = useState<Record<string, string>>({});
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  const isVerifiedFirebaseAdmin = Boolean(
    user?.email &&
      user.emailVerified &&
      user.email.trim().toLowerCase() === adminEmailHint.trim().toLowerCase()
  );

  const buildAuthHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
    if (isVerifiedFirebaseAdmin && user) {
      try {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      } catch {
        // ignore if token unavailable
      }
    }
    if (!headers['x-admin-token'] && !headers.Authorization) {
      return null;
    }
    return headers;
  }, [adminToken, isVerifiedFirebaseAdmin, user]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/status')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (typeof data?.adminEmail === 'string' && data.adminEmail) {
          setAdminEmailHint(data.adminEmail);
        }
        setPasscodeMode(
          data?.passcodeMode === 'env' || data?.passcodeMode === 'claimed'
            ? data.passcodeMode
            : 'unclaimed'
        );
      })
      .catch(() => {
        if (active) setPasscodeMode('claimed');
      });
    return () => {
      active = false;
    };
  }, []);

  const loadDashboardData = useCallback(async () => {
    const headers = await buildAuthHeaders();
    if (!headers) return;

    setLoadingDashboard(true);
    setAuthError(null);
    try {
      await syncAllAccountsNow();

      const res = await fetch('/api/admin/dashboard', { headers });
      if (res.status === 401 || res.status === 403) {
        setAdminToken('');
        setLoadingDashboard(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load admin telemetry.');
      }

      const data = await res.json();
      const serverUsers: SyncedUserRecord[] = Array.isArray(data.users) ? data.users : [];
      const serverReports: ScanReportRecord[] = Array.isArray(data.reports) ? data.reports : [];
      const serverEvents: SignInEventRecord[] = Array.isArray(data.signInEvents)
        ? data.signInEvents
        : [];

      const userMap = new Map<string, SyncedUserRecord>();
      serverUsers.forEach((u) => userMap.set(u.uid, u));

      const reportMap = new Map<string, ScanReportRecord>();
      serverReports.forEach((r) => reportMap.set(r.id, r));

      const cloudBackfill: any[] = [];

      // Optionally enrich with Firestore docs when signed in as verified Firebase Admin
      if (isVerifiedFirebaseAdmin) {
        try {
          const fsUsersSnap = await getDocs(query(collection(db, 'users'), limit(200)));
          fsUsersSnap.forEach((docSnap) => {
            const d = docSnap.data();
            const existing = userMap.get(docSnap.id);
            const createdIso =
              typeof d.createdAt === 'string'
                ? d.createdAt
                : d.createdAt?.toDate
                ? d.createdAt.toDate().toISOString()
                : '';
            const lastLoginIso =
              typeof d.lastLoginAt === 'string'
                ? d.lastLoginAt
                : d.lastLoginAt?.toDate
                ? d.lastLoginAt.toDate().toISOString()
                : '';
            const updatedIso =
              typeof d.updatedAt === 'string'
                ? d.updatedAt
                : d.updatedAt?.toDate
                ? d.updatedAt.toDate().toISOString()
                : '';
            const mergedUser: SyncedUserRecord = {
              uid: docSnap.id,
              displayName: d.displayName || existing?.displayName || 'Grower',
              email: d.email || existing?.email || '',
              phoneNumber: d.phoneNumber || existing?.phoneNumber || '',
              photoURL: existing?.photoURL || d.photoURL || '',
              provider: (d.loginProvider as any) || existing?.provider || 'email',
              emailVerified: existing?.emailVerified ?? true,
              xp: Math.max(Number(d.xp || 0), existing?.xp || 0),
              level: existing?.level || Math.floor(Number(d.xp || 0) / 100) + 1,
              dailyStreak: Math.max(Number(d.dailyStreak || 0), existing?.dailyStreak || 0),
              scansCount: Math.max(Number(d.scansCount ?? d.scanCount ?? 0), existing?.scansCount || 0),
              plantsCount: Math.max(Number(d.plantsCount ?? d.plantCount ?? 0), existing?.plantsCount || 0),
              recentScans: existing?.recentScans || [],
              createdAt: existing?.createdAt || createdIso,
              lastLoginAt: existing?.lastLoginAt || lastLoginIso || updatedIso,
              updatedAt: existing?.updatedAt || updatedIso
            };
            userMap.set(docSnap.id, mergedUser);
            cloudBackfill.push(mergedUser);
          });

          if (cloudBackfill.length > 0) {
            void fetch('/api/users/sync-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ users: cloudBackfill })
            }).catch(() => {});
          }

          const fsReportsSnap = await getDocs(
            query(collection(db, 'scanReports'), orderBy('createdAt', 'desc'), limit(200))
          );
          fsReportsSnap.forEach((docSnap) => {
            const d = docSnap.data();
            if (!reportMap.has(docSnap.id)) {
              const createdIso = d.createdAt?.toDate
                ? d.createdAt.toDate().toISOString()
                : new Date().toISOString();
              reportMap.set(docSnap.id, {
                id: docSnap.id,
                reporterUid: d.reporterUid || 'guest',
                reporterName: d.reporterName || 'Grower',
                reporterEmail: d.reporterEmail || '',
                reporterPhone: d.reporterPhone || '',
                authMode: d.authMode || 'firebase',
                issueType: d.issueType || 'other',
                diagnosisId: d.diagnosisId || 'unknown',
                diagnosisName: d.diagnosisName || 'Scan Feedback',
                stage1Status: d.stage1Status || 'unknown',
                confidence: Number(d.confidence || 0),
                sourceType: d.sourceType || 'upload',
                aiEngineUsed: d.aiEngineUsed || 'AgroVision AI',
                notes: d.notes || '',
                status: d.status || 'open',
                adminNote: d.adminNote || '',
                thumbnailUrl: d.thumbnailUrl,
                createdAt: createdIso,
                updatedAt: createdIso
              });
            }
          });
        } catch {
          // Firestore rules or offline mode may block direct list read; server backend store still loads
        }
      }

      const mergedUsers = Array.from(userMap.values()).sort(
        (a, b) =>
          new Date(b.lastLoginAt || b.updatedAt || 0).getTime() -
          new Date(a.lastLoginAt || a.updatedAt || 0).getTime()
      );
      const mergedReports = Array.from(reportMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setUsers(mergedUsers);
      setReports(mergedReports);
      setSignInEvents(serverEvents);
      setReportAdminNotes((prev) => {
        const next = { ...prev };
        mergedReports.forEach((r) => {
          if (next[r.id] === undefined) {
            next[r.id] = r.adminNote || '';
          }
        });
        return next;
      });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to fetch dashboard data.');
    } finally {
      setLoadingDashboard(false);
    }
  }, [buildAuthHeaders, isVerifiedFirebaseAdmin, syncAllAccountsNow]);

  const isUnlocked = Boolean(adminToken) || isVerifiedFirebaseAdmin;

  useEffect(() => {
    if (isUnlocked) {
      void loadDashboardData();
    }
  }, [isUnlocked, loadDashboardData]);

  const handleSetupPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passcodeInput.trim().length < 6) {
      setAuthError('Passcode must be at least 6 characters.');
      return;
    }
    if (passcodeInput.trim() !== confirmPasscodeInput.trim()) {
      setAuthError('Passcodes do not match. Please double-check.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() })
      });
      const json = await res.json();
      if (!res.ok || !json?.token) {
        throw new Error(json?.error || 'Could not save admin passcode.');
      }
      setPasscodeMode('claimed');
      setAdminToken(json.token);
      setPasscodeInput('');
      setConfirmPasscodeInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Setup failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleUnlockPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passcodeInput.trim()) return;

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() })
      });
      const json = await res.json();
      if (!res.ok || !json?.token) {
        throw new Error(json?.error || 'Incorrect admin passcode.');
      }
      setAdminToken(json.token);
      setPasscodeInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to unlock.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    status: 'open' | 'reviewed' | 'resolved'
  ) => {
    const headers = await buildAuthHeaders();
    if (!headers) return;

    setUpdatingReportId(reportId);
    const adminNote = (reportAdminNotes[reportId] || '').trim();
    try {
      const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNote })
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status, adminNote, updatedAt: new Date().toISOString() }
              : r
          )
        );
        if (isVerifiedFirebaseAdmin) {
          void updateDoc(doc(db, 'scanReports', reportId), {
            status,
            adminNote
          }).catch(() => {});
        }
      }
    } finally {
      setUpdatingReportId(null);
    }
  };

  const stats: DashboardStats = useMemo(
    () => ({
      totalUsers: users.length,
      usersWithPhone: users.filter((u) => Boolean(u.phoneNumber)).length,
      totalScansReported: users.reduce((sum, u) => sum + (u.scansCount || 0), 0),
      totalPlantsTracked: users.reduce((sum, u) => sum + (u.plantsCount || 0), 0),
      totalReports: reports.length,
      openReports: reports.filter((r) => r.status === 'open').length,
      signInEventsCount: signInEvents.length
    }),
    [users, reports, signInEvents]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(normalizedSearch) ||
        u.email.toLowerCase().includes(normalizedSearch) ||
        u.phoneNumber.toLowerCase().includes(normalizedSearch) ||
        u.provider.toLowerCase().includes(normalizedSearch)
    );
  }, [users, normalizedSearch]);

  const filteredReports = useMemo(() => {
    if (!normalizedSearch) return reports;
    return reports.filter(
      (r) =>
        r.reporterName.toLowerCase().includes(normalizedSearch) ||
        r.reporterEmail.toLowerCase().includes(normalizedSearch) ||
        r.reporterPhone.toLowerCase().includes(normalizedSearch) ||
        r.diagnosisName.toLowerCase().includes(normalizedSearch) ||
        r.notes.toLowerCase().includes(normalizedSearch)
    );
  }, [reports, normalizedSearch]);

  const filteredEvents = useMemo(() => {
    if (!normalizedSearch) return signInEvents;
    return signInEvents.filter(
      (ev) =>
        ev.displayName.toLowerCase().includes(normalizedSearch) ||
        ev.email.toLowerCase().includes(normalizedSearch) ||
        ev.phoneNumber.toLowerCase().includes(normalizedSearch)
    );
  }, [signInEvents, normalizedSearch]);

  const exportCsv = () => {
    const header = [
      'Name',
      'Phone',
      'Email',
      'Provider',
      'Level',
      'XP',
      'Streak',
      'LeafScans',
      'Plants',
      'LastLogin'
    ];
    const rows = filteredUsers.map((u) => [
      escapeCsvCell(u.displayName),
      escapeCsvCell(u.phoneNumber || '—'),
      escapeCsvCell(u.email || '—'),
      escapeCsvCell(u.provider),
      u.level,
      u.xp,
      u.dailyStreak,
      u.scansCount,
      u.plantsCount,
      escapeCsvCell(u.lastLoginAt)
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrovision-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      stats,
      users: filteredUsers,
      reports: filteredReports,
      signInEvents: filteredEvents
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrovision-admin-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isUnlocked) {
    return (
      <div className="w-full max-w-lg mx-auto py-4 native-view-enter pb-20">
        <section className="rounded-3xl bg-white border border-[#cbdcd0] shadow-md overflow-hidden">
          <div className="bg-[#14532d] text-white p-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-[#fef3c7] text-[10px] font-mono font-bold">
              <Lock className="w-3 h-3" />
              <span>ADMIN SECURITY GATE</span>
            </div>
            <h1 className="font-display text-xl font-extrabold">
              {isUrdu ? 'ایگرو وژن ایڈمن پینل' : 'AgroVision Admin Panel'}
            </h1>
            <p className="text-xs text-[#dcfce7]/90 leading-relaxed">
              {isUrdu
                ? 'صارفین کے نام، فون نمبرز، لاگ ان ریکارڈ اور اسکینر فیڈبیک دیکھنے کے لیے ایڈمن پاس کوڈ درج کریں۔'
                : 'Enter your private admin passcode to inspect all signed-in users, phone numbers, activity logs, and scanner feedback.'}
            </p>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {authError && (
              <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {passcodeMode === 'loading' ? (
              <div className="py-8 flex items-center justify-center gap-2 text-[#3d5947]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking admin security status...</span>
              </div>
            ) : passcodeMode === 'unclaimed' ? (
              <form onSubmit={handleSetupPasscode} className="space-y-3">
                <div className="p-3 rounded-xl bg-[#fffbeb] border border-amber-300 text-[#92400e] leading-relaxed">
                  <strong>{isUrdu ? 'پہلی بار سیٹ اپ:' : 'First-Run Admin Setup:'}</strong>{' '}
                  {isUrdu
                    ? 'اس ایپ کے لیے اپنا ذاتی ایڈمن پاس کوڈ سیٹ کریں (کم از کم 6 حروف)۔'
                    : 'Set a private admin passcode (min 6 characters) to protect the Admin Dashboard.'}
                </div>
                <div>
                  <label className="block font-bold text-[#13281c] mb-1">
                    {isUrdu ? 'نیا ایڈمن پاس کوڈ' : 'New Admin Passcode'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-[#13281c] mb-1">
                    {isUrdu ? 'پاس کوڈ کی تصدیق کریں' : 'Confirm Passcode'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPasscodeInput}
                    onChange={(e) => setConfirmPasscodeInput(e.target.value)}
                    placeholder="Re-enter passcode"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full min-h-[44px] rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isUrdu ? 'ایڈمن پاس کوڈ محفوظ کریں اور کھولیں' : 'Save Passcode & Unlock'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleUnlockPasscode} className="space-y-3">
                <div>
                  <label className="block font-bold text-[#13281c] mb-1">
                    {isUrdu ? 'ایڈمن پاس کوڈ درج کریں' : 'Enter Admin Passcode'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3" />
                    <input
                      type="password"
                      required
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full min-h-[44px] rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isUrdu ? 'ایڈمن پینل کھولیں' : 'Unlock Admin Panel'}</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 native-view-enter pb-24">
      {/* Header Banner */}
      <section className="rounded-3xl bg-[#14532d] text-white p-5 sm:p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f] text-[10px] font-mono font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>ADMIN CONTROL CENTER</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold">
            {isUrdu ? 'ایگرو وژن ایڈمن ڈیش بورڈ' : 'AgroVision Admin Dashboard'}
          </h1>
          <p className="text-xs text-[#dcfce7]/90">
            {isUrdu
              ? 'صارفین کی تفصیلات، فون نمبرز، لاگ ان ریکارڈ اور اے آئی اسکینر کی غلطیوں کی رپورٹس۔'
              : 'Live directory of signed-in users, phone numbers, scan telemetry, and scanner feedback queue.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadDashboardData()}
            disabled={loadingDashboard}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDashboard ? 'animate-spin' : ''}`} />
            <span>{isUrdu ? 'ریفریش' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white text-[#14532d] hover:bg-[#edf5ef] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={exportJson}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#fef3c7] text-[#78350f] hover:bg-[#fde68a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          {adminToken && (
            <button
              type="button"
              onClick={() => setAdminToken('')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'لاک کریں' : 'Lock'}</span>
            </button>
          )}
        </div>
      </section>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#cbdcd0] shadow-xs">
          <div className="flex items-center justify-between text-[#5b7463] mb-1">
            <span className="text-[11px] font-mono uppercase">{isUrdu ? 'کل صارفین' : 'Signed-In Users'}</span>
            <Users className="w-4 h-4 text-[#14532d]" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#13281c] tabular-nums">
            {stats.totalUsers}
          </div>
          <div className="text-[11px] text-[#3d5947] mt-0.5 tabular-nums">
            {stats.signInEventsCount} {isUrdu ? 'لاگ ان ایونٹس' : 'total login events'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#cbdcd0] shadow-xs">
          <div className="flex items-center justify-between text-[#5b7463] mb-1">
            <span className="text-[11px] font-mono uppercase">{isUrdu ? 'فون نمبرز' : 'Phone Numbers'}</span>
            <Phone className="w-4 h-4 text-[#166534]" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#14532d] tabular-nums">
            {stats.usersWithPhone}
          </div>
          <div className="text-[11px] text-[#3d5947] mt-0.5 tabular-nums">
            {stats.totalUsers > 0
              ? `${Math.round((stats.usersWithPhone / stats.totalUsers) * 100)}% coverage`
              : '0% coverage'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#cbdcd0] shadow-xs">
          <div className="flex items-center justify-between text-[#5b7463] mb-1">
            <span className="text-[11px] font-mono uppercase">{isUrdu ? 'اسکین و پودے' : 'Scans & Plants'}</span>
            <Sprout className="w-4 h-4 text-[#b45309]" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#13281c] tabular-nums">
            {stats.totalScansReported}
          </div>
          <div className="text-[11px] text-[#3d5947] mt-0.5 tabular-nums">
            {stats.totalPlantsTracked} {isUrdu ? 'پودے ٹریک شدہ' : 'plants tracked'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#cbdcd0] shadow-xs">
          <div className="flex items-center justify-between text-[#5b7463] mb-1">
            <span className="text-[11px] font-mono uppercase">{isUrdu ? 'اسکینر رپورٹس' : 'Bug Reports'}</span>
            <Flag className="w-4 h-4 text-[#b45309]" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-[#b45309] tabular-nums">
            {stats.openReports}
          </div>
          <div className="text-[11px] text-[#3d5947] mt-0.5 tabular-nums">
            {stats.totalReports} {isUrdu ? 'کل رپورٹس' : 'total feedback tickets'}
          </div>
        </div>
      </div>

      {/* Tabs + Search Bar */}
      <div className="rounded-2xl bg-white border border-[#cbdcd0] p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
            {([
              { id: 'users', label: isUrdu ? `صارفین (${users.length})` : `Users (${users.length})`, icon: Users },
              {
                id: 'reports',
                label: isUrdu ? `رپورٹس (${reports.length})` : `Bug Reports (${reports.length})`,
                icon: Flag
              },
              {
                id: 'activity',
                label: isUrdu ? `لاگ ان لاگ (${signInEvents.length})` : `Sign-Ins (${signInEvents.length})`,
                icon: Activity
              }
            ] as const).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSubTab(t.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    subTab === t.id ? 'bg-[#14532d] text-white' : 'text-[#3d5947] hover:text-[#13281c]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#5b7463] absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'نام، فون یا ای میل تلاش کریں...' : 'Search name, phone, email, disease...'}
              className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
            />
          </div>
        </div>

        {/* SUB-TAB 1: USERS DIRECTORY */}
        {subTab === 'users' && (
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5b7463]">
                {isUrdu
                  ? 'ابھی کوئی صارف ریکارڈ نہیں ملا۔ جب کوئی کاشتکار سائن ان کرے گا تو اس کا نام اور فون نمبر یہاں ظاہر ہوگا۔'
                  : 'No signed-in growers found yet. Records appear here as soon as someone signs in or updates their profile.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredUsers.map((u) => {
                  const expanded = expandedUserUid === u.uid;
                  return (
                    <div
                      key={u.uid}
                      className="rounded-2xl border border-[#cbdcd0] bg-[#faf8f2] overflow-hidden"
                    >
                      <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#14532d] text-white flex items-center justify-center shrink-0 overflow-hidden border border-[#cbdcd0]">
                            {u.photoURL ? (
                              <img
                                src={u.photoURL}
                                alt={u.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display font-extrabold text-sm text-[#13281c] truncate">
                                {u.displayName}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbdcd0] text-[10px] font-mono uppercase text-[#14532d] font-bold">
                                {u.provider}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-[#fef3c7] text-[#92400e] text-[10px] font-mono font-bold tabular-nums">
                                Lv.{u.level} · {u.xp} XP
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#3d5947]">
                              <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#13281c]">
                                <Phone className="w-3 h-3 text-[#166534]" />
                                {u.phoneNumber || (isUrdu ? 'فون درج نہیں' : 'No phone provided')}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Mail className="w-3 h-3 text-[#5b7463]" />
                                {u.email || '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <div className="text-end font-mono text-[11px] tabular-nums">
                            <div className="font-bold text-[#13281c]">
                              {u.scansCount} scans · {u.plantsCount} plants
                            </div>
                            <div className="text-[#5b7463]">
                              Last: {formatTimestamp(u.lastLoginAt || u.updatedAt, isUrdu)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedUserUid(expanded ? null : u.uid)}
                            className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white border border-[#cbdcd0] text-[11px] font-bold text-[#14532d] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isUrdu ? 'تفصیل' : 'Inspect'}</span>
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-4 py-3 bg-white border-t border-[#cbdcd0] text-xs space-y-2">
                          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#5b7463]">
                            <span>UID: {u.uid}</span>
                            <span>Streak: {u.dailyStreak}d</span>
                            <span>Joined: {formatTimestamp(u.createdAt, isUrdu)}</span>
                          </div>
                          {u.recentScans && u.recentScans.length > 0 ? (
                            <div className="space-y-1">
                              <div className="font-bold text-[#13281c]">Recent Leaf Scans:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {u.recentScans.map((scan, idx) => (
                                  <div
                                    key={scan.id || idx}
                                    className="p-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center justify-between gap-2"
                                  >
                                    <span className="font-semibold text-[#13281c] truncate">
                                      {scan.diseaseName}
                                    </span>
                                    <span className="font-mono text-[10px] text-[#14532d] shrink-0">
                                      {Math.round(scan.confidence)}% · {scan.isTomatoLeaf ? 'Tomato' : 'Rejected'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#5b7463] italic">
                              No scan telemetry synced from this session yet.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 2: SCANNER BUG REPORTS QUEUE */}
        {subTab === 'reports' && (
          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5b7463]">
                {isUrdu
                  ? 'ابھی تک کوئی اسکینر غلطی یا فیڈبیک رپورٹ موصول نہیں ہوئی۔'
                  : 'No scanner bug reports submitted yet. Reports from the Leaf Scanner appear here automatically.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="rounded-2xl border border-[#cbdcd0] bg-[#faf8f2] p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {rep.thumbnailUrl ? (
                          <img
                            src={rep.thumbnailUrl}
                            alt={rep.diagnosisName}
                            className="w-16 h-16 rounded-xl object-cover border border-[#cbdcd0] bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white border border-[#cbdcd0] flex items-center justify-center shrink-0">
                            <Flag className="w-5 h-5 text-[#b45309]" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                                rep.status === 'resolved'
                                  ? 'bg-[#dcfce7] text-[#14532d]'
                                  : rep.status === 'reviewed'
                                  ? 'bg-[#fef3c7] text-[#92400e]'
                                  : 'bg-[#fee2e2] text-[#991b1b]'
                              }`}
                            >
                              {rep.status}
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#cbdcd0] text-[#3d5947]">
                              {rep.issueType}
                            </span>
                            <span className="font-mono text-[10px] text-[#5b7463]">
                              {formatTimestamp(rep.createdAt, isUrdu)}
                            </span>
                          </div>

                          <div className="font-display font-bold text-sm text-[#13281c]">
                            {rep.diagnosisName}{' '}
                            <span className="font-mono text-xs font-normal text-[#3d5947]">
                              ({rep.confidence}% · {rep.aiEngineUsed})
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#3d5947]">
                            <span className="font-bold text-[#13281c]">Reporter: {rep.reporterName}</span>
                            {rep.reporterPhone && (
                              <span className="font-mono">📞 {rep.reporterPhone}</span>
                            )}
                            {rep.reporterEmail && <span className="font-mono">✉️ {rep.reporterEmail}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] leading-relaxed">
                      <strong>User Feedback:</strong> {rep.notes || 'No extra notes provided.'}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={reportAdminNotes[rep.id] ?? rep.adminNote ?? ''}
                        onChange={(e) =>
                          setReportAdminNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                        }
                        placeholder={isUrdu ? 'ایڈمن نوٹ لکھیں...' : 'Add internal triage note...'}
                        className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs text-[#13281c]"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={updatingReportId === rep.id}
                          onClick={() => void handleUpdateReportStatus(rep.id, 'reviewed')}
                          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#fef3c7] hover:bg-[#fde68a] border border-amber-300 text-[#92400e] text-[11px] font-bold cursor-pointer"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          type="button"
                          disabled={updatingReportId === rep.id}
                          onClick={() => void handleUpdateReportStatus(rep.id, 'resolved')}
                          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 3: SIGN-IN ACTIVITY LOG */}
        {subTab === 'activity' && (
          <div className="space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5b7463]">
                {isUrdu
                  ? 'ابھی تک کوئی لاگ ان سرگرمی ریکارڈ نہیں ہوئی۔'
                  : 'No chronological sign-in events logged yet.'}
              </div>
            ) : (
              <div className="divide-y divide-[#cbdcd0]/70 rounded-2xl border border-[#cbdcd0] overflow-hidden">
                {filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-[#faf8f2] flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbdcd0] font-mono text-[10px] font-bold uppercase text-[#14532d]">
                        {ev.provider}
                      </span>
                      <span className="font-bold text-[#13281c]">{ev.displayName}</span>
                      {ev.phoneNumber && (
                        <span className="font-mono text-[#3d5947]">{ev.phoneNumber}</span>
                      )}
                      {ev.email && <span className="font-mono text-[#5b7463]">{ev.email}</span>}
                    </div>
                    <span className="font-mono text-[11px] text-[#5b7463] tabular-nums">
                      {formatTimestamp(ev.timestamp, isUrdu)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
