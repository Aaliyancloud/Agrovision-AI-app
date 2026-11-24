import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { GrowthStage } from '../data/growthStageAlerts';

export type PlantHealthStatus = 'thriving' | 'watch' | 'recovering';

export interface PlantJourneyEntry {
  id: string;
  name: string;
  cultivar: string;
  stage: GrowthStage;
  plantedDate: string;
  healthStatus: PlantHealthStatus;
  locationNote: string;
  thumbnailUrl?: string;
  latestNote: string;
  linkedScanIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantInput {
  name: string;
  cultivar?: string;
  stage: GrowthStage;
  plantedDate: string;
  healthStatus: PlantHealthStatus;
  locationNote?: string;
  thumbnailUrl?: string;
  latestNote?: string;
}

interface PlantJourneyContextValue {
  plants: PlantJourneyEntry[];
  addPlant: (input: CreatePlantInput) => Promise<PlantJourneyEntry>;
  updatePlant: (id: string, patch: Partial<Omit<PlantJourneyEntry, 'id' | 'createdAt'>>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  attachScanIdToPlant: (plantId: string, scanId: string) => Promise<void>;
  compressPlantPhoto: (dataUrl: string) => Promise<string>;
}

const PLANTS_STORAGE_KEY = 'agrovision_plant_journey_v1';

const PlantJourneyContext = createContext<PlantJourneyContextValue | undefined>(undefined);

function readStoredPlants(): PlantJourneyEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLANTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredPlants(plants: PlantJourneyEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(plants));
  } catch {
    // Ignore quota errors
  }
}

export async function compressPlantPhoto(uri: string): Promise<string> {
  if (!uri || typeof document === 'undefined' || !uri.startsWith('data:')) {
    return uri.slice(0, 210000);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 320;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || maxSide) * scale));
        const h = Math.max(1, Math.round((img.height || maxSide) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.72).slice(0, 210000));
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

export const PlantJourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, ensureUserProfileDoc, setCloudSyncStatus } = useAuth();
  const [plants, setPlants] = useState<PlantJourneyEntry[]>(() => readStoredPlants());

  useEffect(() => {
    writeStoredPlants(plants);
  }, [plants]);

  // Load and merge cloud plants when user signs in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadCloudPlants = async () => {
      try {
        await ensureUserProfileDoc(user);
        const plantsRef = collection(db, 'users', user.uid, 'plants');
        const snap = await getDocs(query(plantsRef, orderBy('updatedAt', 'desc')));
        if (cancelled) return;

        const remotePlants: PlantJourneyEntry[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            name: String(data.name || 'Tomato Plot'),
            cultivar: String(data.cultivar || 'Roma / Sahil'),
            stage: (data.stage as GrowthStage) || 'vegetative',
            plantedDate: String(data.plantedDate || new Date().toISOString().slice(0, 10)),
            healthStatus: (data.healthStatus as PlantHealthStatus) || 'thriving',
            locationNote: String(data.locationNote || ''),
            thumbnailUrl: typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : undefined,
            latestNote: String(data.latestNote || ''),
            linkedScanIds: Array.isArray(data.linkedScanIds) ? data.linkedScanIds : [],
            createdAt:
              typeof data.createdAt === 'string'
                ? data.createdAt
                : data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt:
              typeof data.updatedAt === 'string'
                ? data.updatedAt
                : data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
          };
        });

        const remoteIds = new Set(remotePlants.map((p) => p.id));
        const localOnly = readStoredPlants().filter((p) => !remoteIds.has(p.id));

        for (const p of localOnly) {
          try {
            await setDoc(doc(db, 'users', user.uid, 'plants', p.id), {
              id: p.id,
              uid: user.uid,
              name: p.name.slice(0, 100),
              cultivar: (p.cultivar || '').slice(0, 100),
              stage: p.stage,
              plantedDate: p.plantedDate.slice(0, 32),
              healthStatus: p.healthStatus,
              locationNote: (p.locationNote || '').slice(0, 140),
              ...(p.thumbnailUrl ? { thumbnailUrl: p.thumbnailUrl.slice(0, 215000) } : {}),
              latestNote: (p.latestNote || '').slice(0, 600),
              linkedScanIds: p.linkedScanIds.slice(0, 10),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch {
            break;
          }
        }

        const merged = [...localOnly, ...remotePlants];
        writeStoredPlants(merged);
        setPlants(merged);
        setCloudSyncStatus('synced');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
          setCloudSyncStatus('rules-pending');
        }
      }
    };

    void loadCloudPlants();
    return () => {
      cancelled = true;
    };
  }, [user, ensureUserProfileDoc, setCloudSyncStatus]);

  const addPlant = useCallback(
    async (input: CreatePlantInput): Promise<PlantJourneyEntry> => {
      const now = new Date().toISOString();
      const thumb = input.thumbnailUrl ? await compressPlantPhoto(input.thumbnailUrl) : undefined;
      const entry: PlantJourneyEntry = {
        id: `plant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: input.name.trim().slice(0, 100) || 'Tomato Plant',
        cultivar: (input.cultivar || 'Roma / Desi Hybrid').trim().slice(0, 100),
        stage: input.stage,
        plantedDate: input.plantedDate.slice(0, 32),
        healthStatus: input.healthStatus,
        locationNote: (input.locationNote || '').trim().slice(0, 140),
        ...(thumb ? { thumbnailUrl: thumb } : {}),
        latestNote: (input.latestNote || '').trim().slice(0, 600),
        linkedScanIds: [],
        createdAt: now,
        updatedAt: now
      };

      setPlants((prev) => [entry, ...prev]);

      if (user) {
        try {
          await ensureUserProfileDoc(user);
          await setDoc(doc(db, 'users', user.uid, 'plants', entry.id), {
            id: entry.id,
            uid: user.uid,
            name: entry.name,
            cultivar: entry.cultivar,
            stage: entry.stage,
            plantedDate: entry.plantedDate,
            healthStatus: entry.healthStatus,
            locationNote: entry.locationNote,
            ...(entry.thumbnailUrl ? { thumbnailUrl: entry.thumbnailUrl } : {}),
            latestNote: entry.latestNote,
            linkedScanIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
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

  const updatePlant = useCallback(
    async (id: string, patch: Partial<Omit<PlantJourneyEntry, 'id' | 'createdAt'>>) => {
      const compressedThumb =
        typeof patch.thumbnailUrl === 'string'
          ? await compressPlantPhoto(patch.thumbnailUrl)
          : undefined;
      const now = new Date().toISOString();

      setPlants((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                ...patch,
                ...(compressedThumb !== undefined ? { thumbnailUrl: compressedThumb } : {}),
                updatedAt: now
              }
            : p
        )
      );

      if (user) {
        try {
          const firestorePatch: Record<string, unknown> = {
            updatedAt: serverTimestamp()
          };
          if (patch.name !== undefined) firestorePatch.name = patch.name.slice(0, 100);
          if (patch.cultivar !== undefined) firestorePatch.cultivar = patch.cultivar.slice(0, 100);
          if (patch.stage !== undefined) firestorePatch.stage = patch.stage;
          if (patch.plantedDate !== undefined) firestorePatch.plantedDate = patch.plantedDate.slice(0, 32);
          if (patch.healthStatus !== undefined) firestorePatch.healthStatus = patch.healthStatus;
          if (patch.locationNote !== undefined) firestorePatch.locationNote = patch.locationNote.slice(0, 140);
          if (compressedThumb !== undefined) firestorePatch.thumbnailUrl = compressedThumb;
          if (patch.latestNote !== undefined) firestorePatch.latestNote = patch.latestNote.slice(0, 600);
          if (patch.linkedScanIds !== undefined) {
            firestorePatch.linkedScanIds = patch.linkedScanIds.slice(0, 10);
          }

          await updateDoc(doc(db, 'users', user.uid, 'plants', id), firestorePatch);
        } catch {
          // Local copy updated cleanly
        }
      }
    },
    [user]
  );

  const attachScanIdToPlant = useCallback(
    async (plantId: string, scanId: string) => {
      const existing = plants.find((p) => p.id === plantId);
      if (!existing) return;
      const nextScanIds = Array.from(new Set([scanId, ...existing.linkedScanIds])).slice(0, 10);
      await updatePlant(plantId, { linkedScanIds: nextScanIds });
    },
    [plants, updatePlant]
  );

  const deletePlant = useCallback(
    async (id: string) => {
      setPlants((prev) => prev.filter((p) => p.id !== id));
      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'plants', id));
        } catch {
          // Ignore cloud delete failure
        }
      }
    },
    [user]
  );

  return (
    <PlantJourneyContext.Provider
      value={{
        plants,
        addPlant,
        updatePlant,
        deletePlant,
        attachScanIdToPlant,
        compressPlantPhoto
      }}
    >
      {children}
    </PlantJourneyContext.Provider>
  );
};

export function usePlantJourney(): PlantJourneyContextValue {
  const ctx = useContext(PlantJourneyContext);
  if (!ctx) {
    throw new Error('usePlantJourney must be used within a PlantJourneyProvider');
  }
  return ctx;
}
