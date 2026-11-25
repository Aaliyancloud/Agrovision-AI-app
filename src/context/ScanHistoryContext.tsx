import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { DiagnosisResult, SeverityLevel } from '../types/disease';

export interface ScanHistoryEntry {
  id: string;
  plantId?: string | null;
  createdAt: string;
  source: 'upload' | 'camera' | 'sample';
  diseaseId: string;
  diseaseName: string;
  scientificName: string;
  confidence: number;
  severity: SeverityLevel;
  isTomatoLeaf: boolean;
  validationMessage?: string;
  summary: string;
  organicTreatment: string[];
  thumbnailUrl: string;
  sensorSnapshot?: {
    moistureEnabled: boolean;
    moisturePercent: number;
    phEnabled: boolean;
    soilPh: number;
    riskLevel?: 'Optimal' | 'Elevated' | 'Critical';
  };
}

interface ScanHistoryContextValue {
  scans: ScanHistoryEntry[];
  addScan: (
    result: DiagnosisResult,
    source: 'upload' | 'camera' | 'sample',
    plantId?: string | null
  ) => Promise<ScanHistoryEntry>;
  linkScanToPlant: (scanId: string, plantId: string | null) => Promise<void>;
  removeScan: (id: string) => void;
  clearScans: () => void;
  isHistoryOpen: boolean;
  openHistory: () => void;
  closeHistory: () => void;
}

const STORAGE_KEY = 'agrovision_field_scans_v1';
const MAX_SCANS = 25;
const SCAN_EVENT = 'agrovision-scans-updated';

const ScanHistoryContext = createContext<ScanHistoryContextValue | undefined>(undefined);

function readStoredScans(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredScans(scans: ScanHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SCAN_EVENT));
    }
  } catch {
    // Ignore storage quota errors
  }
}

async function createCompactThumbnail(uri: string): Promise<string> {
  if (!uri || typeof document === 'undefined') return uri;
  if (!uri.startsWith('data:')) return uri.slice(0, 210000);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 220;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || maxSide) * scale));
        const h = Math.max(1, Math.round((img.height || maxSide) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.slice(0, 210000));
          return;
        }
      } catch {
        // Fallback below
      }
      resolve(uri.slice(0, 210000));
    };
    img.onerror = () => resolve(uri.slice(0, 210000));
    img.src = uri;
  });
}

function buildFirestoreScanPayload(uid: string, entry: ScanHistoryEntry) {
  return {
    id: entry.id,
    uid,
    plantId: entry.plantId ?? null,
    createdAt: entry.createdAt.slice(0, 64),
    source: entry.source,
    diseaseId: entry.diseaseId.slice(0, 80),
    diseaseName: entry.diseaseName.slice(0, 140),
    scientificName: entry.scientificName.slice(0, 140),
    confidence: Math.min(100, Math.max(0, Number(entry.confidence) || 0)),
    severity: entry.severity,
    isTomatoLeaf: Boolean(entry.isTomatoLeaf),
    ...(entry.validationMessage ? { validationMessage: entry.validationMessage.slice(0, 500) } : {}),
    summary: entry.summary.slice(0, 1200),
    organicTreatment: entry.organicTreatment.slice(0, 8).map((s) => s.slice(0, 220)),
    thumbnailUrl: (entry.thumbnailUrl || '').slice(0, 215000),
    ...(entry.sensorSnapshot ? { sensorSnapshot: entry.sensorSnapshot } : {}),
    serverCreatedAt: serverTimestamp()
  };
}

export async function saveScanToStorage(
  result: DiagnosisResult,
  source: 'upload' | 'camera' | 'sample',
  plantId: string | null = null
): Promise<ScanHistoryEntry> {
  const thumbnailUrl = await createCompactThumbnail(result.imageUri);
  const entry: ScanHistoryEntry = {
    id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    plantId,
    createdAt: new Date().toISOString(),
    source,
    diseaseId: result.diseaseId,
    diseaseName: result.diseaseName,
    scientificName: result.scientificName,
    confidence: result.confidence,
    severity: result.severity,
    isTomatoLeaf: result.isTomatoLeaf,
    validationMessage: result.validationMessage,
    summary: result.summary,
    organicTreatment: result.treatment.organic.slice(0, 3),
    thumbnailUrl,
    sensorSnapshot: result.sensorInsights
      ? {
          moistureEnabled: result.sensorInsights.moistureEnabled,
          moisturePercent: result.sensorInsights.moisturePercent ?? 58,
          phEnabled: result.sensorInsights.phEnabled,
          soilPh: result.sensorInsights.soilPh ?? 6.4,
          riskLevel: result.sensorInsights.riskLevel
        }
      : undefined
  };

  const next = [entry, ...readStoredScans()].slice(0, MAX_SCANS);
  writeStoredScans(next);
  return entry;
}

export const ScanHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, ensureUserProfileDoc, setCloudSyncStatus } = useAuth();
  const [scans, setScans] = useState<ScanHistoryEntry[]>(() => readStoredScans());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const sync = () => setScans(readStoredScans());
    window.addEventListener(SCAN_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SCAN_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Load remote scans + migrate any local guest scans when user signs in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadAndMergeScans = async () => {
      try {
        await ensureUserProfileDoc(user);
        const scansRef = collection(db, 'users', user.uid, 'scans');
        const snap = await getDocs(query(scansRef, orderBy('serverCreatedAt', 'desc'), limit(MAX_SCANS)));
        if (cancelled) return;

        const remoteScans: ScanHistoryEntry[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            plantId: data.plantId ?? null,
            createdAt: String(data.createdAt || new Date().toISOString()),
            source: data.source || 'upload',
            diseaseId: String(data.diseaseId || 'early_blight'),
            diseaseName: String(data.diseaseName || 'Tomato Leaf Scan'),
            scientificName: String(data.scientificName || 'Solanum lycopersicum'),
            confidence: Number(data.confidence || 0),
            severity: data.severity || 'Mild',
            isTomatoLeaf: Boolean(data.isTomatoLeaf),
            validationMessage: data.validationMessage,
            summary: String(data.summary || ''),
            organicTreatment: Array.isArray(data.organicTreatment) ? data.organicTreatment : [],
            thumbnailUrl: String(data.thumbnailUrl || ''),
            sensorSnapshot: data.sensorSnapshot
          };
        });

        const remoteIds = new Set(remoteScans.map((s) => s.id));
        const localScans = readStoredScans();
        const unsyncedLocal = localScans.filter((s) => !remoteIds.has(s.id));

        for (const item of unsyncedLocal.slice(0, 10)) {
          try {
            await setDoc(doc(db, 'users', user.uid, 'scans', item.id), buildFirestoreScanPayload(user.uid, item));
          } catch {
            break;
          }
        }

        const merged = [...unsyncedLocal, ...remoteScans]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, MAX_SCANS);
        writeStoredScans(merged);
        setScans(merged);
        setCloudSyncStatus('synced');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
          setCloudSyncStatus('rules-pending');
        }
      }
    };

    void loadAndMergeScans();
    return () => {
      cancelled = true;
    };
  }, [user, ensureUserProfileDoc, setCloudSyncStatus]);

  const addScan = useCallback(
    async (
      result: DiagnosisResult,
      source: 'upload' | 'camera' | 'sample',
      plantId: string | null = null
    ): Promise<ScanHistoryEntry> => {
      const entry = await saveScanToStorage(result, source, plantId);
      setScans(readStoredScans());

      if (user) {
        try {
          await ensureUserProfileDoc(user);
          await setDoc(doc(db, 'users', user.uid, 'scans', entry.id), buildFirestoreScanPayload(user.uid, entry));
          const count = readStoredScans().length;
          await setDoc(
            doc(db, 'users', user.uid),
            { scanCount: count, updatedAt: serverTimestamp() },
            { merge: true }
          );
          setCloudSyncStatus('synced');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
            setCloudSyncStatus('rules-pending');
          }
        }
      }
      return entry;
    },
    [user, ensureUserProfileDoc, setCloudSyncStatus]
  );

  const linkScanToPlant = useCallback(
    async (scanId: string, plantId: string | null) => {
      const next = readStoredScans().map((item) =>
        item.id === scanId ? { ...item, plantId } : item
      );
      writeStoredScans(next);
      setScans(next);

      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'scans', scanId), { plantId });
        } catch {
          // Local update remains intact even if cloud rules or offline
        }
      }
    },
    [user]
  );

  const removeScan = useCallback(
    (id: string) => {
      const next = readStoredScans().filter((item) => item.id !== id);
      writeStoredScans(next);
      setScans(next);
      if (user) {
        void deleteDoc(doc(db, 'users', user.uid, 'scans', id)).catch(() => {});
        void setDoc(
          doc(db, 'users', user.uid),
          { scanCount: next.length, updatedAt: serverTimestamp() },
          { merge: true }
        ).catch(() => {});
      }
    },
    [user]
  );

  const clearScans = useCallback(() => {
    const existing = readStoredScans();
    writeStoredScans([]);
    setScans([]);
    if (user) {
      for (const item of existing) {
        void deleteDoc(doc(db, 'users', user.uid, 'scans', item.id)).catch(() => {});
      }
      void setDoc(
        doc(db, 'users', user.uid),
        { scanCount: 0, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch(() => {});
    }
  }, [user]);

  return (
    <ScanHistoryContext.Provider
      value={{
        scans,
        addScan,
        linkScanToPlant,
        removeScan,
        clearScans,
        isHistoryOpen,
        openHistory: () => setIsHistoryOpen(true),
        closeHistory: () => setIsHistoryOpen(false)
      }}
    >
      {children}
    </ScanHistoryContext.Provider>
  );
};

export const useScanHistory = (): ScanHistoryContextValue => {
  const ctx = useContext(ScanHistoryContext);
  if (!ctx) {
    throw new Error('useScanHistory must be used within a ScanHistoryProvider');
  }
  return ctx;
};
