import React, { createContext, useContext, useState } from 'react';
import { SensorContextInput } from '../types/disease';

export type FieldSensorPreset = 'optimal' | 'waterlogged_acidic' | 'drought_alkaline';

export interface PairedSensorKit {
  kitId: string;
  name: string;
  zone: string;
  batteryPercent: number;
  firmware: string;
  pairedAt: string;
}

export interface QRPairResult {
  success: boolean;
  kit?: PairedSensorKit;
  error?: string;
}

interface SensorContextValue {
  moistureEnabled: boolean;
  setMoistureEnabled: (enabled: boolean) => void;
  toggleMoisture: () => void;
  moisturePercent: number;
  setMoisturePercent: (value: number) => void;
  phEnabled: boolean;
  setPhEnabled: (enabled: boolean) => void;
  togglePh: () => void;
  soilPh: number;
  setSoilPh: (value: number) => void;
  applyPreset: (preset: FieldSensorPreset) => void;
  resetSensors: () => void;
  sensorContext: SensorContextInput;
  activeSensorCount: number;
  pairedKit: PairedSensorKit | null;
  pairKitFromQR: (payload: string) => QRPairResult;
  unpairKit: () => void;
}

const DEFAULT_MOISTURE = 58;
const DEFAULT_PH = 6.4;
const PAIRED_KIT_STORAGE_KEY = 'agrovision_paired_sensor_kit_v1';

const SensorContext = createContext<SensorContextValue | undefined>(undefined);

function readStoredPairedKit(): PairedSensorKit | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PAIRED_KIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.kitId === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredPairedKit(kit: PairedSensorKit | null) {
  if (typeof window === 'undefined') return;
  try {
    if (kit) {
      localStorage.setItem(PAIRED_KIT_STORAGE_KEY, JSON.stringify(kit));
    } else {
      localStorage.removeItem(PAIRED_KIT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moistureEnabled, setMoistureEnabled] = useState<boolean>(true);
  const [moisturePercent, setMoisturePercentState] = useState<number>(DEFAULT_MOISTURE);
  const [phEnabled, setPhEnabled] = useState<boolean>(true);
  const [soilPh, setSoilPhState] = useState<number>(DEFAULT_PH);
  const [pairedKit, setPairedKit] = useState<PairedSensorKit | null>(() => readStoredPairedKit());

  const setMoisturePercent = (value: number) => {
    const clamped = Math.min(95, Math.max(10, Math.round(value)));
    setMoisturePercentState(clamped);
  };

  const setSoilPh = (value: number) => {
    const clamped = Math.min(8.5, Math.max(4.5, Number(value.toFixed(1))));
    setSoilPhState(clamped);
  };

  const toggleMoisture = () => setMoistureEnabled((prev) => !prev);
  const togglePh = () => setPhEnabled((prev) => !prev);

  const applyPreset = (preset: FieldSensorPreset) => {
    setMoistureEnabled(true);
    setPhEnabled(true);
    if (preset === 'optimal') {
      setMoisturePercentState(58);
      setSoilPhState(6.4);
    } else if (preset === 'waterlogged_acidic') {
      setMoisturePercentState(86);
      setSoilPhState(5.2);
    } else if (preset === 'drought_alkaline') {
      setMoisturePercentState(24);
      setSoilPhState(7.8);
    }
  };

  const resetSensors = () => {
    setMoistureEnabled(true);
    setMoisturePercentState(DEFAULT_MOISTURE);
    setPhEnabled(true);
    setSoilPhState(DEFAULT_PH);
  };

  const pairKitFromQR = (rawPayload: string): QRPairResult => {
    const trimmed = rawPayload.trim();
    if (!trimmed) {
      return { success: false, error: 'Empty QR code payload.' };
    }

    let kitId = '';
    let name = 'AgroSense Dual Probe';
    let zone = 'Field Plot A';
    let batteryPercent = 94;
    let firmware = 'v2.4';
    let parsedMoisture: number | null = null;
    let parsedPh: number | null = null;

    // 1. JSON QR payload
    if (trimmed.startsWith('{')) {
      try {
        const obj = JSON.parse(trimmed);
        kitId = String(obj.kitId || obj.id || obj.serial || 'AGRO-KIT-01').toUpperCase();
        if (obj.name) name = String(obj.name);
        if (obj.zone) zone = String(obj.zone);
        if (typeof obj.battery === 'number') batteryPercent = Math.min(100, Math.max(10, obj.battery));
        if (obj.firmware) firmware = String(obj.firmware);
        if (typeof obj.moisture === 'number') parsedMoisture = obj.moisture;
        if (typeof obj.ph === 'number') parsedPh = obj.ph;
      } catch {
        return { success: false, error: 'Invalid JSON QR sensor kit format.' };
      }
    } else if (trimmed.includes('://') || trimmed.includes('?')) {
      // 2. URL QR payload e.g. agrovision://pair?id=AGRO-402&moisture=64&ph=6.3&zone=Punjab
      try {
        const normalizedUrl = trimmed.startsWith('http') ? trimmed : `https://agrovision.local/${trimmed.replace(/^[a-z]+:\/\//i, '')}`;
        const url = new URL(normalizedUrl);
        kitId = (url.searchParams.get('id') || url.searchParams.get('kit') || 'AGRO-KIT-402').toUpperCase();
        name = url.searchParams.get('name') || `Soil Kit ${kitId}`;
        zone = url.searchParams.get('zone') || 'Field Plot A';
        const m = Number(url.searchParams.get('moisture'));
        const p = Number(url.searchParams.get('ph'));
        if (!Number.isNaN(m) && m > 0) parsedMoisture = m;
        if (!Number.isNaN(p) && p > 0) parsedPh = p;
      } catch {
        kitId = trimmed.slice(0, 24).toUpperCase();
      }
    } else {
      // 3. Pipe/colon delimited e.g. AGRO-PJB-402|moisture:64|ph:6.3|zone:Punjab|name:Drip Probe
      const parts = trimmed.split(/[|,;]+/).map((s) => s.trim()).filter(Boolean);
      kitId = (parts[0] || 'AGRO-KIT').replace(/^id:/i, '').toUpperCase();
      for (const part of parts.slice(1)) {
        const [k, v] = part.split(/[:=]/).map((s) => s.trim());
        if (!k || !v) continue;
        const lower = k.toLowerCase();
        if (lower === 'moisture' || lower === 'm') {
          const val = Number(v);
          if (!Number.isNaN(val)) parsedMoisture = val;
        } else if (lower === 'ph') {
          const val = Number(v);
          if (!Number.isNaN(val)) parsedPh = val;
        } else if (lower === 'zone') {
          zone = v;
        } else if (lower === 'name') {
          name = v;
        } else if (lower === 'battery') {
          const val = Number(v);
          if (!Number.isNaN(val)) batteryPercent = Math.min(100, Math.max(10, val));
        }
      }
      if (name === 'AgroSense Dual Probe' && kitId) {
        name = `Sensor Kit ${kitId}`;
      }
    }

    if (!kitId) {
      return { success: false, error: 'Could not read sensor kit ID from QR code.' };
    }

    setMoistureEnabled(true);
    setPhEnabled(true);
    if (parsedMoisture !== null) {
      setMoisturePercent(parsedMoisture);
    }
    if (parsedPh !== null) {
      setSoilPh(parsedPh);
    }

    const nextKit: PairedSensorKit = {
      kitId,
      name,
      zone,
      batteryPercent,
      firmware,
      pairedAt: new Date().toISOString()
    };

    setPairedKit(nextKit);
    writeStoredPairedKit(nextKit);

    return { success: true, kit: nextKit };
  };

  const unpairKit = () => {
    setPairedKit(null);
    writeStoredPairedKit(null);
  };

  const sensorContext: SensorContextInput = {
    moistureEnabled,
    moisturePercent,
    phEnabled,
    soilPh
  };

  const activeSensorCount = (moistureEnabled ? 1 : 0) + (phEnabled ? 1 : 0);

  return (
    <SensorContext.Provider
      value={{
        moistureEnabled,
        setMoistureEnabled,
        toggleMoisture,
        moisturePercent,
        setMoisturePercent,
        phEnabled,
        setPhEnabled,
        togglePh,
        soilPh,
        setSoilPh,
        applyPreset,
        resetSensors,
        sensorContext,
        activeSensorCount,
        pairedKit,
        pairKitFromQR,
        unpairKit
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export const useSensors = (): SensorContextValue => {
  const ctx = useContext(SensorContext);
  if (!ctx) {
    throw new Error('useSensors must be used within a SensorProvider');
  }
  return ctx;
};
