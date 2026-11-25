import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type CloudSyncStatus = 'guest' | 'device' | 'syncing' | 'synced' | 'offline-cache' | 'rules-pending';

export interface GrowerProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string | null;
  emailVerified: boolean;
  provider?: 'google' | 'email' | 'device';
  source: 'firebase' | 'device';
}

interface StoredDeviceAccount {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  createdAt: string;
}

const ADMIN_EMAIL_LOWER = 'yousaaf.awan56@gmail.com';
const DEVICE_PROFILE_STORAGE_KEY = 'agrovision_local_profile_v1';
const DEVICE_ACCOUNTS_STORAGE_KEY = 'agrovision_local_accounts_v1';
const PHONE_BY_UID_STORAGE_KEY = 'agrovision_phone_by_uid_v1';
const AVATAR_BY_UID_STORAGE_KEY = 'agrovision_avatar_by_uid_v1';

interface AuthContextValue {
  user: User | null;
  activeProfile: GrowerProfile | null;
  authReady: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  cloudSyncStatus: CloudSyncStatus;
  setCloudSyncStatus: (status: CloudSyncStatus) => void;
  authError: string | null;
  authSuccess: string | null;
  clearAuthMessages: () => void;
  signInWithGoogleAccount: () => Promise<boolean>;
  signUpWithEmailAccount: (
    displayName: string,
    email: string,
    password: string,
    phoneNumber?: string
  ) => Promise<boolean>;
  signInWithEmailAccount: (email: string, password: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  signOutAccount: () => Promise<void>;
  ensureUserProfileDoc: (activeUser: User, explicitPhone?: string) => Promise<void>;
  updateGrowerProfile: (displayName: string, photoURL?: string, phoneNumber?: string) => void;
  syncAllAccountsNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isFirebaseConfigOrDomainBlock(err: unknown): boolean {
  const code = (err as { code?: string })?.code || '';
  return (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation' ||
    code === 'auth/operation-not-supported-in-this-environment' ||
    code === 'auth/unauthorized-domain' ||
    code === 'auth/configuration-not-found' ||
    code === 'auth/app-not-authorized' ||
    code === 'auth/invalid-api-key' ||
    code === 'auth/network-request-failed' ||
    code === 'auth/internal-error'
  );
}

function readStoredAccounts(): StoredDeviceAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEVICE_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredAccounts(accounts: StoredDeviceAccount[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEVICE_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // ignore storage quota errors
  }
}

function readDeviceProfile(): GrowerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEVICE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GrowerProfile;
    return parsed?.uid && (parsed?.displayName || parsed?.email) ? parsed : null;
  } catch {
    return null;
  }
}

function writeDeviceProfile(profile: GrowerProfile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      localStorage.setItem(DEVICE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(DEVICE_PROFILE_STORAGE_KEY);
    }
  } catch {
    // ignore storage quota errors
  }
}

function readCachedPhone(uid: string): string {
  if (typeof window === 'undefined' || !uid) return '';
  try {
    const raw = localStorage.getItem(PHONE_BY_UID_STORAGE_KEY);
    if (!raw) return '';
    const map = JSON.parse(raw) as Record<string, string>;
    return typeof map?.[uid] === 'string' ? map[uid] : '';
  } catch {
    return '';
  }
}

function writeCachedPhone(uid: string, phone: string) {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const raw = localStorage.getItem(PHONE_BY_UID_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[uid] = phone.trim().slice(0, 32);
    localStorage.setItem(PHONE_BY_UID_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

function readCachedAvatar(uid: string): string | null {
  if (typeof window === 'undefined' || !uid) return null;
  try {
    const raw = localStorage.getItem(AVATAR_BY_UID_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return typeof map?.[uid] === 'string' ? map[uid] : null;
  } catch {
    return null;
  }
}

function writeCachedAvatar(uid: string, avatarDataOrUrl: string | null) {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const raw = localStorage.getItem(AVATAR_BY_UID_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (avatarDataOrUrl) {
      map[uid] = avatarDataOrUrl;
    } else {
      delete map[uid];
    }
    localStorage.setItem(AVATAR_BY_UID_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

function detectFirebaseProvider(activeUser: User): 'google' | 'email' {
  const isGoogle = activeUser.providerData?.some((p) => p?.providerId === 'google.com');
  return isGoogle ? 'google' : 'email';
}

async function syncUserToServer(params: {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  clearPhoto?: boolean;
  provider: 'google' | 'email' | 'device';
  emailVerified: boolean;
  xp?: number;
  level?: number;
  dailyStreak?: number;
  scansCount?: number;
  plantsCount?: number;
  createdAt?: string;
  lastLoginAt?: string;
  isLoginEvent?: boolean;
}) {
  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  } catch {
    // ignore transient network errors
  }
}

function shouldLogSessionLogin(uid: string): boolean {
  if (typeof window === 'undefined' || !uid) return false;
  try {
    const key = `agrovision_session_logged_${uid}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

async function syncAllLocalAccountsToServer() {
  if (typeof window === 'undefined') return;
  try {
    const accounts = readStoredAccounts();
    const activeDev = readDeviceProfile();
    const payloadMap = new Map<string, any>();

    for (const acc of accounts) {
      if (!acc?.uid) continue;
      const phone = (acc.phoneNumber || readCachedPhone(acc.uid) || '').trim();
      const avatar = readCachedAvatar(acc.uid) || '';
      payloadMap.set(acc.uid, {
        uid: acc.uid,
        displayName: acc.displayName || acc.email?.split('@')[0] || 'Grower',
        email: acc.email || '',
        phoneNumber: phone,
        ...(avatar ? { photoURL: avatar } : {}),
        provider: 'device',
        emailVerified: false,
        createdAt: acc.createdAt || undefined
      });
    }

    if (activeDev?.uid) {
      const existing = payloadMap.get(activeDev.uid);
      const phone = (activeDev.phoneNumber || existing?.phoneNumber || readCachedPhone(activeDev.uid) || '').trim();
      const avatar = activeDev.photoURL || readCachedAvatar(activeDev.uid) || '';
      payloadMap.set(activeDev.uid, {
        ...(existing || {}),
        uid: activeDev.uid,
        displayName: activeDev.displayName || existing?.displayName || 'Grower',
        email: activeDev.email || existing?.email || '',
        phoneNumber: phone,
        ...(avatar ? { photoURL: avatar } : {}),
        provider: activeDev.provider || 'device',
        emailVerified: Boolean(activeDev.emailVerified)
      });
    }

    const users = Array.from(payloadMap.values());
    if (users.length === 0) return;

    await fetch('/api/users/sync-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users })
    });
  } catch {
    // ignore transient offline errors
  }
}

function formatAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const message = err instanceof Error ? err.message : String(err);

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in window was closed before finishing. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the sign-in window. Please allow popups or sign in with your email and password.';
  }
  if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-supported-in-this-environment') {
    return 'Google window is restricted in this embedded view. Enter your email and password above to Sign In right away.';
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return 'Cloud email login is not enabled yet. Saving your profile on this device instead.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists with this email. Switch to Sign In to open it.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email or password does not match. Please double-check and try again.';
  }
  if (code === 'auth/weak-password') {
    return 'Please choose a password with at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address (for example: name@gmail.com).';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many tries right now. Please wait one minute and try again.';
  }
  return message || 'Sign-in could not finish. Please check your details and try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [deviceProfile, setDeviceProfile] = useState<GrowerProfile | null>(() => readDeviceProfile());
  const [firebasePhone, setFirebasePhone] = useState<string>('');
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(() =>
    readDeviceProfile() ? 'device' : 'guest'
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const ensureUserProfileDoc = useCallback(async (activeUser: User, explicitPhone?: string) => {
    const cleanPhone = (explicitPhone ?? readCachedPhone(activeUser.uid) ?? '').trim().slice(0, 32);
    const provider = detectFirebaseProvider(activeUser);
    const cleanName = (activeUser.displayName || activeUser.email?.split('@')[0] || 'Grower').slice(0, 120);

    if (cleanPhone) {
      writeCachedPhone(activeUser.uid, cleanPhone);
      setFirebasePhone(cleanPhone);
    }

    try {
      const userRef = doc(db, 'users', activeUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: activeUser.uid,
          email: (activeUser.email || '').slice(0, 320),
          displayName: cleanName,
          phoneNumber: cleanPhone,
          loginProvider: provider,
          lastLoginAt: new Date().toISOString(),
          role: 'grower',
          xp: 0,
          dailyStreak: 0,
          longestStreak: 0,
          streakFreezes: 1,
          unlockedBadges: ['tomato_scout'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const remoteData = snap.data();
        const remotePhone = typeof remoteData?.phoneNumber === 'string' ? remoteData.phoneNumber : '';
        const finalPhone = cleanPhone || remotePhone;
        if (finalPhone) {
          writeCachedPhone(activeUser.uid, finalPhone);
          setFirebasePhone(finalPhone);
        }
        await setDoc(
          userRef,
          {
            displayName: cleanName,
            ...(finalPhone ? { phoneNumber: finalPhone } : {}),
            loginProvider: provider,
            lastLoginAt: new Date().toISOString(),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }
      setCloudSyncStatus('synced');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setCloudSyncStatus('rules-pending');
      } else {
        setCloudSyncStatus('offline-cache');
      }
    }
  }, []);

  useEffect(() => {
    void syncAllLocalAccountsToServer();

    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          writeDeviceProfile(null);
          setDeviceProfile(null);
          void ensureUserProfileDoc(res.user);
          const logSession = shouldLogSessionLogin(res.user.uid);
          void syncUserToServer({
            uid: res.user.uid,
            displayName: res.user.displayName || res.user.email?.split('@')[0] || 'Grower',
            email: res.user.email || '',
            phoneNumber: readCachedPhone(res.user.uid),
            photoURL: readCachedAvatar(res.user.uid) || res.user.photoURL || '',
            provider: detectFirebaseProvider(res.user),
            emailVerified: res.user.emailVerified,
            isLoginEvent: logSession
          });
        }
      })
      .catch(() => {
        // Ignore stale redirect state errors
      });

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        const cachedPhone = readCachedPhone(firebaseUser.uid);
        const avatar = readCachedAvatar(firebaseUser.uid) || firebaseUser.photoURL || '';
        setFirebasePhone(cachedPhone);
        setCachedAvatar(readCachedAvatar(firebaseUser.uid));
        writeDeviceProfile(null);
        setDeviceProfile(null);
        setCloudSyncStatus('syncing');
        void ensureUserProfileDoc(firebaseUser);
        void syncUserToServer({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Grower',
          email: firebaseUser.email || '',
          phoneNumber: cachedPhone,
          ...(avatar ? { photoURL: avatar } : {}),
          provider: detectFirebaseProvider(firebaseUser),
          emailVerified: firebaseUser.emailVerified,
          isLoginEvent: shouldLogSessionLogin(firebaseUser.uid)
        });
      } else {
        setFirebasePhone('');
        const savedDevice = readDeviceProfile();
        setDeviceProfile(savedDevice);
        setCachedAvatar(savedDevice?.uid ? readCachedAvatar(savedDevice.uid) : null);
        setCloudSyncStatus(savedDevice ? 'device' : 'guest');
        if (savedDevice) {
          void syncUserToServer({
            uid: savedDevice.uid,
            displayName: savedDevice.displayName,
            email: savedDevice.email || '',
            phoneNumber: savedDevice.phoneNumber || readCachedPhone(savedDevice.uid),
            photoURL: savedDevice.photoURL || readCachedAvatar(savedDevice.uid) || '',
            provider: savedDevice.provider || 'device',
            emailVerified: Boolean(savedDevice.emailVerified),
            isLoginEvent: shouldLogSessionLogin(savedDevice.uid)
          });
        }
      }
    });
    return () => unsub();
  }, [ensureUserProfileDoc]);

  const clearAuthMessages = useCallback(() => {
    setAuthError(null);
    setAuthSuccess(null);
  }, []);

  const signInWithGoogleAccount = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    setAuthSuccess(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;

    try {
      const cred = await signInWithPopup(auth, provider);
      writeDeviceProfile(null);
      setDeviceProfile(null);
      await ensureUserProfileDoc(cred.user);
      await syncUserToServer({
        uid: cred.user.uid,
        displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Grower',
        email: cred.user.email || '',
        phoneNumber: readCachedPhone(cred.user.uid),
        photoURL: readCachedAvatar(cred.user.uid) || cred.user.photoURL || '',
        provider: 'google',
        emailVerified: cred.user.emailVerified,
        isLoginEvent: true
      });
      setAuthSuccess('Welcome! Signed in with Google.');
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked' && !inIframe) {
        try {
          await signInWithRedirect(auth, provider);
          return true;
        } catch (redirectErr) {
          setAuthError(formatAuthErrorMessage(redirectErr));
          return false;
        }
      }
      if (inIframe && (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user')) {
        setAuthError(
          'Your browser blocked the Google popup inside this preview window. Please allow popups or sign in with your Email & Password above.'
        );
        return false;
      }
      setAuthError(formatAuthErrorMessage(err));
      return false;
    }
  }, [ensureUserProfileDoc]);

  const signUpWithEmailAccount = useCallback(
    async (
      displayName: string,
      email: string,
      password: string,
      phoneNumber: string = ''
    ): Promise<boolean> => {
      setAuthError(null);
      setAuthSuccess(null);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (displayName.trim() || cleanEmail.split('@')[0] || 'Grower').slice(0, 80);
      const cleanPhone = phoneNumber.trim().slice(0, 32);

      if (password.length < 6) {
        setAuthError('Please choose a password with at least 6 characters.');
        return false;
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (cleanName) {
          await updateProfile(cred.user, { displayName: cleanName });
        }
        if (cleanPhone) {
          writeCachedPhone(cred.user.uid, cleanPhone);
          setFirebasePhone(cleanPhone);
        }
        try {
          await sendEmailVerification(cred.user);
          setAuthSuccess('Account created! Welcome to AgroVision.');
        } catch {
          setAuthSuccess('Account created! Your profile is ready.');
        }
        await ensureUserProfileDoc(cred.user, cleanPhone);
        await syncUserToServer({
          uid: cred.user.uid,
          displayName: cleanName,
          email: cleanEmail,
          phoneNumber: cleanPhone,
          provider: 'email',
          emailVerified: cred.user.emailVerified,
          isLoginEvent: true
        });
        return true;
      } catch (err) {
        if (isFirebaseConfigOrDomainBlock(err)) {
          const existing = readStoredAccounts();
          if (existing.some((acc) => acc.email.toLowerCase() === cleanEmail)) {
            setAuthError('An account with this email already exists on this phone. Switch to Sign In.');
            return false;
          }
          const uid = `device_${Date.now()}`;
          const newAccount: StoredDeviceAccount = {
            uid,
            displayName: cleanName,
            email: cleanEmail,
            phoneNumber: cleanPhone,
            password,
            createdAt: new Date().toISOString()
          };
          writeStoredAccounts([...existing, newAccount]);
          if (cleanPhone) writeCachedPhone(uid, cleanPhone);
          const localProf: GrowerProfile = {
            uid,
            displayName: cleanName,
            email: cleanEmail,
            phoneNumber: cleanPhone,
            emailVerified: false,
            provider: 'device',
            source: 'device'
          };
          writeDeviceProfile(localProf);
          setDeviceProfile(localProf);
          setCloudSyncStatus('device');
          await syncUserToServer({
            uid,
            displayName: cleanName,
            email: cleanEmail,
            phoneNumber: cleanPhone,
            provider: 'device',
            emailVerified: false,
            isLoginEvent: true
          });
          setAuthSuccess('Grower account created and saved on this device.');
          return true;
        }

        setAuthError(formatAuthErrorMessage(err));
        return false;
      }
    },
    [ensureUserProfileDoc]
  );

  const signInWithEmailAccount = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setAuthError(null);
      setAuthSuccess(null);
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes('@')) {
        setAuthError('Please enter a valid email address.');
        return false;
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return false;
      }

      const localAccounts = readStoredAccounts();
      const localMatch = localAccounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        writeDeviceProfile(null);
        setDeviceProfile(null);
        await ensureUserProfileDoc(cred.user);
        await syncUserToServer({
          uid: cred.user.uid,
          displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Grower',
          email: cred.user.email || cleanEmail,
          phoneNumber: readCachedPhone(cred.user.uid),
          photoURL: readCachedAvatar(cred.user.uid) || cred.user.photoURL || '',
          provider: 'email',
          emailVerified: cred.user.emailVerified,
          isLoginEvent: true
        });
        setAuthSuccess('Welcome back! Signed in.');
        return true;
      } catch (err) {
        if (localMatch) {
          if (localMatch.password !== password) {
            setAuthError('Incorrect password for this account. Please try again.');
            return false;
          }
          const localProf: GrowerProfile = {
            uid: localMatch.uid,
            displayName: localMatch.displayName,
            email: localMatch.email,
            phoneNumber: localMatch.phoneNumber || readCachedPhone(localMatch.uid) || '',
            photoURL: readCachedAvatar(localMatch.uid),
            emailVerified: false,
            provider: 'device',
            source: 'device'
          };
          writeDeviceProfile(localProf);
          setDeviceProfile(localProf);
          setCloudSyncStatus('device');
          await syncUserToServer({
            uid: localMatch.uid,
            displayName: localMatch.displayName,
            email: localMatch.email,
            phoneNumber: localProf.phoneNumber,
            photoURL: localProf.photoURL || '',
            provider: 'device',
            emailVerified: false,
            isLoginEvent: true
          });
          setAuthSuccess('Welcome back! Signed in on this device.');
          return true;
        }

        if (isFirebaseConfigOrDomainBlock(err)) {
          const cleanName = (cleanEmail.split('@')[0] || 'Grower').slice(0, 80);
          const uid = `device_${Date.now()}`;
          const newAccount: StoredDeviceAccount = {
            uid,
            displayName: cleanName,
            email: cleanEmail,
            phoneNumber: '',
            password,
            createdAt: new Date().toISOString()
          };
          writeStoredAccounts([...localAccounts, newAccount]);
          const localProf: GrowerProfile = {
            uid,
            displayName: cleanName,
            email: cleanEmail,
            phoneNumber: '',
            emailVerified: false,
            provider: 'device',
            source: 'device'
          };
          writeDeviceProfile(localProf);
          setDeviceProfile(localProf);
          setCloudSyncStatus('device');
          await syncUserToServer({
            uid,
            displayName: cleanName,
            email: cleanEmail,
            phoneNumber: '',
            provider: 'device',
            emailVerified: false,
            isLoginEvent: true
          });
          setAuthSuccess('Signed in! Grower Profile saved on this device.');
          return true;
        }

        setAuthError(formatAuthErrorMessage(err));
        return false;
      }
    },
    [ensureUserProfileDoc]
  );

  const resendVerification = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setAuthSuccess(`Verification link sent to ${auth.currentUser.email}.`);
      return true;
    } catch (err) {
      setAuthError(formatAuthErrorMessage(err));
      return false;
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setAuthError(null);
    setAuthSuccess(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setAuthSuccess('Password reset email sent. Check your inbox.');
      return true;
    } catch (err) {
      const localAccounts = readStoredAccounts();
      const hasLocal = localAccounts.some((acc) => acc.email.toLowerCase() === cleanEmail);
      if (hasLocal && isFirebaseConfigOrDomainBlock(err)) {
        setAuthSuccess('This profile is saved only on your phone. You can sign out or create a new password in Create Account.');
        return true;
      }
      setAuthError(formatAuthErrorMessage(err));
      return false;
    }
  }, []);

  const signOutAccount = useCallback(async () => {
    setAuthError(null);
    setAuthSuccess(null);
    writeDeviceProfile(null);
    setDeviceProfile(null);
    setFirebasePhone('');
    try {
      await signOut(auth);
    } catch {
      // ignore if only local profile was signed in
    }
    setCloudSyncStatus('guest');
  }, []);

  const activeProfile: GrowerProfile | null = user
    ? {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Grower',
        email: user.email || '',
        phoneNumber: firebasePhone || readCachedPhone(user.uid),
        photoURL:
          cachedAvatar !== null
            ? cachedAvatar || null
            : readCachedAvatar(user.uid) || user.photoURL,
        emailVerified: user.emailVerified,
        provider: detectFirebaseProvider(user),
        source: 'firebase'
      }
    : deviceProfile
    ? {
        ...deviceProfile,
        photoURL: deviceProfile.photoURL || cachedAvatar || readCachedAvatar(deviceProfile.uid)
      }
    : null;

  const isAdmin = Boolean(
    activeProfile?.email && activeProfile.email.trim().toLowerCase() === ADMIN_EMAIL_LOWER
  );

  const updateGrowerProfile = useCallback(
    (newName: string, newPhotoURL?: string, newPhoneNumber?: string) => {
      const cleanName = newName.trim() || activeProfile?.displayName || 'Grower';
      const cleanPhone =
        newPhoneNumber !== undefined
          ? newPhoneNumber.trim().slice(0, 32)
          : activeProfile?.phoneNumber || '';

      if (user) {
        if (newPhoneNumber !== undefined) {
          writeCachedPhone(user.uid, cleanPhone);
          setFirebasePhone(cleanPhone);
        }
        if (newPhotoURL !== undefined) {
          const avatarVal = newPhotoURL.trim();
          writeCachedAvatar(user.uid, avatarVal || null);
          setCachedAvatar(avatarVal);
        }
        const safeRemotePhoto =
          newPhotoURL !== undefined && newPhotoURL.length > 0 && newPhotoURL.length < 1800 && !newPhotoURL.startsWith('data:')
            ? newPhotoURL
            : undefined;
        void updateProfile(user, {
          displayName: cleanName,
          ...(safeRemotePhoto !== undefined ? { photoURL: safeRemotePhoto } : {})
        }).catch(() => {
          // ignore profile photo URL length constraints on Firebase Auth
        });

        void setDoc(
          doc(db, 'users', user.uid),
          {
            displayName: cleanName,
            phoneNumber: cleanPhone,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        ).catch(() => {
          // ignore if rules pending
        });

        void syncUserToServer({
          uid: user.uid,
          displayName: cleanName,
          email: user.email || '',
          phoneNumber: cleanPhone,
          ...(newPhotoURL !== undefined
            ? newPhotoURL.trim()
              ? { photoURL: newPhotoURL.trim() }
              : { clearPhoto: true }
            : {}),
          provider: detectFirebaseProvider(user),
          emailVerified: user.emailVerified
        });
      } else {
        const current = deviceProfile || {
          uid: `device_${Date.now()}`,
          email: 'grower@agrovision.local',
          displayName: cleanName,
          phoneNumber: cleanPhone,
          emailVerified: false,
          provider: 'device' as const,
          source: 'device' as const
        };
        if (newPhoneNumber !== undefined) {
          writeCachedPhone(current.uid, cleanPhone);
        }
        if (newPhotoURL !== undefined) {
          const avatarVal = newPhotoURL.trim();
          writeCachedAvatar(current.uid, avatarVal || null);
          setCachedAvatar(avatarVal);
        }
        const updated: GrowerProfile = {
          ...current,
          displayName: cleanName,
          phoneNumber: cleanPhone,
          ...(newPhotoURL !== undefined ? { photoURL: newPhotoURL || null } : {})
        };
        writeDeviceProfile(updated);
        setDeviceProfile(updated);

        const accounts = readStoredAccounts();
        const existsInAccounts = accounts.some((acc) => acc.uid === updated.uid);
        const nextAccounts = existsInAccounts
          ? accounts.map((acc) =>
              acc.uid === updated.uid
                ? { ...acc, displayName: cleanName, phoneNumber: cleanPhone }
                : acc
            )
          : [
              ...accounts,
              {
                uid: updated.uid,
                displayName: cleanName,
                email: updated.email,
                phoneNumber: cleanPhone,
                password: '',
                createdAt: new Date().toISOString()
              }
            ];
        writeStoredAccounts(nextAccounts);

        setCloudSyncStatus('device');
        void syncUserToServer({
          uid: updated.uid,
          displayName: cleanName,
          email: updated.email,
          phoneNumber: cleanPhone,
          ...(newPhotoURL !== undefined
            ? newPhotoURL.trim()
              ? { photoURL: newPhotoURL.trim() }
              : { clearPhoto: true }
            : {}),
          provider: 'device',
          emailVerified: false
        });
      }
    },
    [user, deviceProfile, activeProfile?.displayName, activeProfile?.phoneNumber]
  );

  const syncAllAccountsNow = useCallback(async () => {
    await syncAllLocalAccountsToServer();
    if (user) {
      await syncUserToServer({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Grower',
        email: user.email || '',
        phoneNumber: firebasePhone || readCachedPhone(user.uid),
        photoURL: readCachedAvatar(user.uid) || user.photoURL || '',
        provider: detectFirebaseProvider(user),
        emailVerified: user.emailVerified
      });
    }
  }, [user, firebasePhone]);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        authReady,
        isGuest: !activeProfile,
        isAdmin,
        cloudSyncStatus,
        setCloudSyncStatus,
        authError,
        authSuccess,
        clearAuthMessages,
        signInWithGoogleAccount,
        signUpWithEmailAccount,
        signInWithEmailAccount,
        resendVerification,
        sendPasswordReset,
        signOutAccount,
        ensureUserProfileDoc,
        updateGrowerProfile,
        syncAllAccountsNow
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
