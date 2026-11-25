import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type PakistanAgriRegion =
  | 'punjab_central'
  | 'punjab_south'
  | 'sindh_lower'
  | 'potohar'
  | 'kp_swat';

export type GrowingSystemType = 'open_field' | 'plastic_tunnel';
export type ReminderWindow = 'morning' | 'evening' | 'off';

export interface GrowerPreferences {
  lowDataMode: boolean;
  autoVoiceReadout: boolean;
  dailyReminderTime: ReminderWindow;
  preferredRegion: PakistanAgriRegion;
  growingSystem: GrowingSystemType;
}

const PREFS_STORAGE_KEY = 'agrovision_preferences_v1';

const DEFAULT_PREFERENCES: GrowerPreferences = {
  lowDataMode: false,
  autoVoiceReadout: false,
  dailyReminderTime: 'morning',
  preferredRegion: 'punjab_central',
  growingSystem: 'open_field'
};

interface PreferencesContextValue extends GrowerPreferences {
  updatePreference: <K extends keyof GrowerPreferences>(
    key: K,
    value: GrowerPreferences[K]
  ) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

function readStoredPreferences(): GrowerPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<GrowerPreferences>;
    return {
      lowDataMode: Boolean(parsed.lowDataMode),
      autoVoiceReadout: Boolean(parsed.autoVoiceReadout),
      dailyReminderTime:
        parsed.dailyReminderTime === 'morning' ||
        parsed.dailyReminderTime === 'evening' ||
        parsed.dailyReminderTime === 'off'
          ? parsed.dailyReminderTime
          : 'morning',
      preferredRegion:
        parsed.preferredRegion === 'punjab_central' ||
        parsed.preferredRegion === 'punjab_south' ||
        parsed.preferredRegion === 'sindh_lower' ||
        parsed.preferredRegion === 'potohar' ||
        parsed.preferredRegion === 'kp_swat'
          ? parsed.preferredRegion
          : 'punjab_central',
      growingSystem:
        parsed.growingSystem === 'open_field' || parsed.growingSystem === 'plastic_tunnel'
          ? parsed.growingSystem
          : 'open_field'
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<GrowerPreferences>(() => readStoredPreferences());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage quota errors
    }
    const root = document.documentElement;
    if (prefs.lowDataMode) {
      root.classList.add('low-data-mode');
    } else {
      root.classList.remove('low-data-mode');
    }
  }, [prefs]);

  const updatePreference = useCallback(
    <K extends keyof GrowerPreferences>(key: K, value: GrowerPreferences[K]) => {
      setPrefs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setPrefs(DEFAULT_PREFERENCES);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        ...prefs,
        updatePreference,
        resetPreferences
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}
