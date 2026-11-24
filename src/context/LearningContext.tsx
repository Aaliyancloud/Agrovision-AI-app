import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useOptionalXP } from './XPContext';

export interface ModuleProgressRecord {
  moduleId: string;
  completed: boolean;
  bookmarked: boolean;
}

interface LearningContextValue {
  progressMap: Record<string, ModuleProgressRecord>;
  completedCount: number;
  markModuleCompleted: (moduleId: string) => Promise<void>;
  toggleModuleBookmark: (moduleId: string) => Promise<void>;
}

const STORAGE_KEY = 'agrovision_learning_progress_v1';

const LearningContext = createContext<LearningContextValue | undefined>(undefined);

function readStoredProgress(): Record<string, ModuleProgressRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredProgress(map: Record<string, ModuleProgressRecord>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota errors
  }
}

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, ensureUserProfileDoc } = useAuth();
  const xpCtx = useOptionalXP();
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgressRecord>>(() =>
    readStoredProgress()
  );

  useEffect(() => {
    writeStoredProgress(progressMap);
  }, [progressMap]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadCloudLearning = async () => {
      try {
        await ensureUserProfileDoc(user);
        const snap = await getDocs(collection(db, 'users', user.uid, 'learningProgress'));
        if (cancelled) return;
        const remoteMap: Record<string, ModuleProgressRecord> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const modId = String(data.moduleId || d.id);
          remoteMap[modId] = {
            moduleId: modId,
            completed: Boolean(data.completed),
            bookmarked: Boolean(data.bookmarked)
          };
        });

        setProgressMap((prev) => {
          const merged: Record<string, ModuleProgressRecord> = { ...remoteMap };
          Object.entries(prev).forEach(([k, val]) => {
            const existing = merged[k];
            merged[k] = {
              moduleId: k,
              completed: Boolean(existing?.completed || val.completed),
              bookmarked: Boolean(existing?.bookmarked || val.bookmarked)
            };
          });
          return merged;
        });
      } catch {
        // Offline / pending rules: keep local progress seamlessly
      }
    };

    void loadCloudLearning();
    return () => {
      cancelled = true;
    };
  }, [user, ensureUserProfileDoc]);

  const syncModuleToCloud = useCallback(
    async (rec: ModuleProgressRecord) => {
      if (!user) return;
      try {
        await ensureUserProfileDoc(user);
        await setDoc(doc(db, 'users', user.uid, 'learningProgress', rec.moduleId), {
          moduleId: rec.moduleId,
          uid: user.uid,
          completed: rec.completed,
          bookmarked: rec.bookmarked,
          updatedAt: serverTimestamp()
        });
      } catch {
        // Local progress remains saved
      }
    },
    [user, ensureUserProfileDoc]
  );

  const markModuleCompleted = useCallback(
    async (moduleId: string) => {
      const prev = progressMap[moduleId];
      const nextRec: ModuleProgressRecord = {
        moduleId,
        completed: true,
        bookmarked: Boolean(prev?.bookmarked)
      };
      setProgressMap((curr) => ({ ...curr, [moduleId]: nextRec }));
      xpCtx?.completeMissionByEvent('learning_activity');
      xpCtx?.awardXP(
        20,
        `Completed Guide: ${moduleId.replace(/_/g, ' ')} (+20 XP)`,
        'سبق مکمل کرنے پر +20 XP!',
        `learn_${moduleId}`,
        false
      );
      await syncModuleToCloud(nextRec);
    },
    [progressMap, xpCtx, syncModuleToCloud]
  );

  const toggleModuleBookmark = useCallback(
    async (moduleId: string) => {
      const prev = progressMap[moduleId];
      const nextRec: ModuleProgressRecord = {
        moduleId,
        completed: Boolean(prev?.completed),
        bookmarked: !prev?.bookmarked
      };
      setProgressMap((curr) => ({ ...curr, [moduleId]: nextRec }));
      await syncModuleToCloud(nextRec);
    },
    [progressMap, syncModuleToCloud]
  );

  const completedCount = Object.values(progressMap).filter((m) => m.completed).length;

  return (
    <LearningContext.Provider
      value={{
        progressMap,
        completedCount,
        markModuleCompleted,
        toggleModuleBookmark
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export function useLearning(): LearningContextValue {
  const ctx = useContext(LearningContext);
  if (!ctx) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return ctx;
}
