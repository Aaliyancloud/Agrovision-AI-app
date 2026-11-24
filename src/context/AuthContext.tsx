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
  photoURL?: string | null;
  emailVerified: boolean;
  source: 'firebase' | 'device';
}

interface StoredDeviceAccount {
  uid: string;
  displayName: string;
  email: string;
  password: string;
  createdAt: string;
}

const DEVICE_PROFILE_STORAGE_KEY = 'agrovision_local_profile_v1';
const DEVICE_ACCOUNTS_STORAGE_KEY = 'agrovision_local_accounts_v1';

interface AuthContextValue {
  user: User | null;
  activeProfile: GrowerProfile | null;
  authReady: boolean;
  isGuest: boolean;
  cloudSyncStatus: CloudSyncStatus;
  setCloudSyncStatus: (status: CloudSyncStatus) => void;
  authError: string | null;
  authSuccess: string | null;
  clearAuthMessages: () => void;
  signInWithGoogleAccount: () => Promise<boolean>;
  signUpWithEmailAccount: (displayName: string, email: string, password: string) => Promise<boolean>;
  signInWithEmailAccount: (email: string, password: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  signOutAccount: () => Promise<void>;
  ensureUserProfileDoc: (activeUser: User) => Promise<void>;
  updateGrowerProfile: (displayName: string, photoURL?: string) => void;
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

function readDeviceProfile(): GrowerProfile {
  const defaultProf: GrowerProfile = {
    uid: 'device_aaryan_awan',
    displayName: 'Aaryan Awan',
    email: 'aaryan.awan@agrovision.ai',
    emailVerified: true,
    source: 'device'
  };
  if (typeof window === 'undefined') return defaultProf;
  try {
    const raw = localStorage.getItem(DEVICE_PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEVICE_PROFILE_STORAGE_KEY, JSON.stringify(defaultProf));
      return defaultProf;
    }
    const parsed = JSON.parse(raw) as GrowerProfile;
    return parsed?.uid && parsed?.email ? parsed : defaultProf;
  } catch {
    return defaultProf;
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
  const [authReady, setAuthReady] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(() =>
    readDeviceProfile() ? 'device' : 'guest'
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const ensureUserProfileDoc = useCallback(async (activeUser: User) => {
    try {
      const userRef = doc(db, 'users', activeUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const cleanName = (activeUser.displayName || activeUser.email?.split('@')[0] || 'Grower').slice(0, 120);
        await setDoc(userRef, {
          uid: activeUser.uid,
          email: (activeUser.email || '').slice(0, 320),
          displayName: cleanName,
          role: 'grower',
          xp: 20,
          dailyStreak: 0,
          longestStreak: 0,
          streakFreezes: 1,
          unlockedBadges: ['tomato_scout'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
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
    // Handle any returning Google redirect flow
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          writeDeviceProfile(null);
          setDeviceProfile(null);
          void ensureUserProfileDoc(res.user);
        }
      })
      .catch(() => {
        // Ignore stale redirect state errors
      });

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        writeDeviceProfile(null);
        setDeviceProfile(null);
        setCloudSyncStatus('syncing');
        void ensureUserProfileDoc(firebaseUser);
      } else {
        const savedDevice = readDeviceProfile();
        setDeviceProfile(savedDevice);
        setCloudSyncStatus(savedDevice ? 'device' : 'guest');
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
    async (displayName: string, email: string, password: string): Promise<boolean> => {
      setAuthError(null);
      setAuthSuccess(null);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (displayName.trim() || cleanEmail.split('@')[0] || 'Grower').slice(0, 80);

      if (password.length < 6) {
        setAuthError('Please choose a password with at least 6 characters.');
        return false;
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (cleanName) {
          await updateProfile(cred.user, { displayName: cleanName });
        }
        try {
          await sendEmailVerification(cred.user);
          setAuthSuccess('Account created! Welcome to AgroVision.');
        } catch {
          setAuthSuccess('Account created! Your profile is ready.');
        }
        await ensureUserProfileDoc(cred.user);
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
            password,
            createdAt: new Date().toISOString()
          };
          writeStoredAccounts([...existing, newAccount]);
          const localProf: GrowerProfile = {
            uid,
            displayName: cleanName,
            email: cleanEmail,
            emailVerified: false,
            source: 'device'
          };
          writeDeviceProfile(localProf);
          setDeviceProfile(localProf);
          setCloudSyncStatus('device');
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
            emailVerified: false,
            source: 'device'
          };
          writeDeviceProfile(localProf);
          setDeviceProfile(localProf);
          setCloudSyncStatus('device');
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
            password,
            createdAt: new Date().toISOString()
          };
          writeStoredAccounts([...localAccounts, newAccount]);
          const localProf: GrowerProfile = {
            uid,
            displayName: cleanName,
            email: cleanEmail,
            emailVerified: false,
            source: 'device'
          };
          writeDeviceProfile(localProf);
          setDeviceProfile(localProf);
          setCloudSyncStatus('device');
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
    const defaultProf: GrowerProfile = {
      uid: 'device_aaryan_awan',
      displayName: 'Aaryan Awan',
      email: 'aaryan.awan@agrovision.ai',
      emailVerified: true,
      source: 'device'
    };
    writeDeviceProfile(defaultProf);
    setDeviceProfile(defaultProf);
    try {
      await signOut(auth);
    } catch {
      // ignore if only local profile was signed in
    }
    setCloudSyncStatus('device');
  }, []);

  const updateGrowerProfile = useCallback((newName: string, newPhotoURL?: string) => {
    const cleanName = newName.trim() || 'Aaryan Awan';
    if (user) {
      void updateProfile(user, {
        displayName: cleanName,
        ...(newPhotoURL !== undefined ? { photoURL: newPhotoURL } : {})
      }).then(() => {
        setUser({ ...user, displayName: cleanName, ...(newPhotoURL !== undefined ? { photoURL: newPhotoURL } : {}) });
      });
    } else if (deviceProfile) {
      const updated: GrowerProfile = {
        ...deviceProfile,
        displayName: cleanName,
        ...(newPhotoURL !== undefined ? { photoURL: newPhotoURL } : {})
      };
      writeDeviceProfile(updated);
      setDeviceProfile(updated);
    }
  }, [user, deviceProfile]);

  const activeProfile: GrowerProfile | null = user
    ? {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Aaryan Awan',
        email: user.email || '',
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        source: 'firebase'
      }
    : deviceProfile;

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        authReady,
        isGuest: !activeProfile,
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
        updateGrowerProfile
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
