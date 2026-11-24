import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MotionProvider } from './context/MotionContext';
import { LanguageProvider } from './context/LanguageContext';
import { SensorProvider } from './context/SensorContext';
import { ScanHistoryProvider } from './context/ScanHistoryContext';
import { XPProvider } from './context/XPContext';
import { PlantJourneyProvider } from './context/PlantJourneyContext';
import { LearningProvider } from './context/LearningContext';
import { AnimatedFavicon } from './components/AnimatedFavicon';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AgroVisionApp, AppTab } from './components/AgroVisionApp';
import { AgroWebsiteView } from './components/AgroWebsiteView';
import { AppInitialSkeleton } from './components/AppInitialSkeleton';

type AppMode = 'mobile' | 'website';

function getInitialAppRoute(): { mode: AppMode; tab: AppTab; action: 'camera' | null } {
  if (typeof window === 'undefined') {
    return { mode: 'mobile', tab: 'home', action: null };
  }
  const url = new URL(window.location.href);
  const viewParam = url.searchParams.get('view');
  const tabParam = url.searchParams.get('tab');
  const actionParam = url.searchParams.get('action');

  const validTabs: AppTab[] = [
    'home',
    'plants',
    'scan',
    'care',
    'learn',
    'history',
    'messenger',
    'anatomy',
    'profile'
  ];
  const tab: AppTab = validTabs.includes(tabParam as AppTab)
    ? (tabParam as AppTab)
    : actionParam === 'camera'
    ? 'scan'
    : 'home';

  return {
    mode: viewParam === 'website' ? 'website' : 'mobile',
    tab,
    action: actionParam === 'camera' ? 'camera' : null
  };
}

const AppShell: React.FC = () => {
  const initialRoute = getInitialAppRoute();
  const [mode, setMode] = useState<AppMode>(initialRoute.mode);
  const { authReady } = useAuth();
  const [minBootDone, setMinBootDone] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });

  useEffect(() => {
    if (minBootDone) return;
    const timer = window.setTimeout(() => setMinBootDone(true), 450);
    return () => window.clearTimeout(timer);
  }, [minBootDone]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (mode === 'website') {
      url.searchParams.set('view', 'website');
    } else {
      url.searchParams.delete('view');
    }
    window.history.replaceState({}, '', url.pathname + url.search);
  }, [mode]);

  const switchMode = (next: AppMode) => {
    setMode(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (mode !== 'website' && (!minBootDone || !authReady)) {
    return <AppInitialSkeleton />;
  }

  return (
    <>
      {mode === 'website' ? (
        <AgroWebsiteView onOpenMobileApp={() => switchMode('mobile')} />
      ) : (
        <AgroVisionApp
          initialTab={initialRoute.tab}
          initialAction={initialRoute.action}
        />
      )}
      <OfflineIndicator />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MotionProvider>
          <LanguageProvider>
            <SensorProvider>
              <ScanHistoryProvider>
                <XPProvider>
                  <PlantJourneyProvider>
                    <LearningProvider>
                      <AnimatedFavicon />
                      <AppShell />
                    </LearningProvider>
                  </PlantJourneyProvider>
                </XPProvider>
              </ScanHistoryProvider>
            </SensorProvider>
          </LanguageProvider>
        </MotionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
