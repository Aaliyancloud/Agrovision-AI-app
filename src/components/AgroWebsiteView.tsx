import React, { Suspense, lazy, useRef, useState } from 'react';
import {
  Camera,
  Compass,
  Droplets,
  FlaskConical,
  Globe,
  Layers,
  Leaf,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSensors } from '../context/SensorContext';
import { useScanHistory } from '../context/ScanHistoryContext';
import { WeatherAlertCard } from './WeatherAlertCard';
import { SmartSensorSection } from './SmartSensorSection';
import { DiseaseLibrary } from './DiseaseLibrary';
import { AgriculturalImpact } from './AgriculturalImpact';
import { NeuralPipelineSection } from './NeuralPipelineSection';
import { ExhibitionHub } from './ExhibitionHub';
import { ProjectCreditsSection } from './ProjectCreditsSection';
import { InvestorsShowcaseSection } from './InvestorsShowcaseSection';
import { Footer } from './Footer';
import type { DiagnosticExternalAction } from './DiagnosticStudio';

const HeroPlantCanvas = lazy(() =>
  import('./3d/HeroPlantCanvas').then((m) => ({ default: m.HeroPlantCanvas }))
);
const LeafAnatomySection = lazy(() =>
  import('./LeafAnatomySection').then((m) => ({ default: m.LeafAnatomySection }))
);
const DiagnosticStudio = lazy(() =>
  import('./DiagnosticStudio').then((m) => ({ default: m.DiagnosticStudio }))
);

interface AgroWebsiteViewProps {
  onOpenMobileApp: () => void;
}

export const AgroWebsiteView: React.FC<AgroWebsiteViewProps> = ({ onOpenMobileApp }) => {
  const { isUrdu, toggleLanguage } = useLanguage();
  const { moisturePercent, soilPh } = useSensors();
  const { scans } = useScanHistory();

  const [diagnosticAction, setDiagnosticAction] = useState<DiagnosticExternalAction | null>(null);
  const nonceRef = useRef(1);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const launchWebsiteCamera = () => {
    nonceRef.current += 1;
    setDiagnosticAction({ type: 'camera', nonce: nonceRef.current });
    scrollToSection('web-diagnostic');
  };

  return (
    <div
      id="top"
      dir="ltr"
      className={`min-h-screen w-full bg-[#faf8f2] text-[#13281c] font-sans selection:bg-[#edf5ef] selection:text-[#14532d] ${
        isUrdu ? 'font-urdu' : ''
      }`}
    >
      {/* Forest Green Header Bar */}
      <header className="sticky top-0 z-50 w-full bg-[#13281c] border-b border-[#254935] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#b45309] text-white flex items-center justify-center shadow-xs shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-base sm:text-lg font-extrabold tracking-tight truncate">
                {isUrdu ? 'ایگرو وژن ' : 'AgroVision '}
                <span className="text-[#f59e0b]">3D Showcase</span>
              </div>
              <div className="text-[10px] font-mono text-[#cbdcd0] uppercase tracking-wider truncate">
                {isUrdu ? 'تھری ڈی و سائنسی پورٹل' : 'Botanical Research & Field Architecture'}
              </div>
            </div>
          </div>

          <nav
            aria-label="Website sections"
            className="hidden lg:flex items-center gap-5 text-xs font-semibold text-[#edf5ef]"
          >
            <button
              type="button"
              onClick={() => scrollToSection('web-telemetry')}
              className="hover:text-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
            >
              {isUrdu ? 'موسم و مٹی' : 'Climate & Soil'}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('web-3d-anatomy')}
              className="hover:text-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
            >
              {isUrdu ? 'تھری ڈی پتا' : '3D Leaf Lab'}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('web-diseases')}
              className="hover:text-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
            >
              {isUrdu ? 'امراض اٹلس' : 'Disease Atlas'}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('web-diagnostic')}
              className="hover:text-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
            >
              {isUrdu ? 'اے آئی اسکینر' : 'AI Studio'}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('web-team')}
              className="hover:text-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
            >
              {isUrdu ? 'ٹیم و نمائش' : 'Team & Exhibition'}
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14532d] hover:bg-[#166534] border border-[#2f5d43] text-xs font-bold text-[#faf8f2] cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>{isUrdu ? 'EN' : 'اردو'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMobileApp}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-extrabold shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>{isUrdu ? 'مین ایپ کھولیں' : 'Main Workspace'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Deep Forest Green & Warm Cream Hero Section */}
      <section className="relative overflow-hidden bg-[#14532d] text-white border-b-4 border-[#b45309]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#fef3c7] flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#f59e0b]" />
                <span>
                  {isUrdu ? 'ایگرو وژن اے آئی فیلڈ انٹیلی جنس' : 'AGROVISION AI · TOMATO PATHOLOGY SHOWCASE'}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-balance">
                {isUrdu
                  ? 'ٹماٹر کی فصل کا جدید تھری ڈی اور سائنسی پورٹل'
                  : 'Precision Botanical Intelligence in 3D.'}
              </h1>

              <p className="text-sm sm:text-base text-[#edf5ef] max-w-xl leading-relaxed">
                {isUrdu
                  ? 'انٹرایکٹو تھری ڈی پودے کا معائنہ کریں، مٹی و موسم کی لائیو صورتحال دیکھیں، فوری پتا اسکین کریں، یا مین ورک اسپیس پر واپس جائیں۔'
                  : 'Inspect the interactive 3D tomato plant, check live climate & regional soils, run Gemini 4 leaf diagnostics, or switch back to the main workspace.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={launchWebsiteCamera}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-extrabold text-sm shadow-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'کیمرہ اسکینر شروع کریں' : 'Launch Camera Scan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('web-telemetry')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#13281c] hover:bg-[#0e1f15] text-white font-bold text-sm border border-[#2f5d43] cursor-pointer"
                >
                  <Droplets className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'مٹی و موسم' : 'Climate & Soil'}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenMobileApp}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#fef3c7] shrink-0" />
                  <span>{isUrdu ? 'مین ایپ دیکھیں' : 'Return to App'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-3">
                <div className="rounded-xl bg-[#13281c] border border-[#2f5d43] p-3">
                  <div className="flex items-center justify-between text-[11px] text-[#cbdcd0]">
                    <span>{isUrdu ? 'نمی' : 'Moisture'}</span>
                    <Droplets className="w-3.5 h-3.5 text-[#f59e0b]" />
                  </div>
                  <div className="font-mono tabular-nums text-xl font-extrabold mt-1">
                    {moisturePercent}%
                  </div>
                </div>

                <div className="rounded-xl bg-[#13281c] border border-[#2f5d43] p-3">
                  <div className="flex items-center justify-between text-[11px] text-[#cbdcd0]">
                    <span>{isUrdu ? 'مٹی پی ایچ' : 'Soil pH'}</span>
                    <FlaskConical className="w-3.5 h-3.5 text-[#f59e0b]" />
                  </div>
                  <div className="font-mono tabular-nums text-xl font-extrabold mt-1">
                    {soilPh.toFixed(1)}
                  </div>
                </div>

                <div className="rounded-xl bg-[#13281c] border border-[#2f5d43] p-3">
                  <div className="flex items-center justify-between text-[11px] text-[#cbdcd0]">
                    <span>{isUrdu ? 'اسکینز' : 'Saved Scans'}</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                  </div>
                  <div className="font-mono tabular-nums text-xl font-extrabold mt-1">
                    {scans.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl bg-[#faf8f2] border border-[#cbdcd0] shadow-xl overflow-hidden h-[390px] sm:h-[460px]">
                <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-[#13281c] text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span>{isUrdu ? 'انٹرایکٹو تھری ڈی ماڈل' : '3D Interactive Specimen'}</span>
                </div>
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[#14532d]">
                      {isUrdu ? 'تھری ڈی ماڈل لوڈ ہو رہا ہے...' : 'Loading 3D Tomato Plant...'}
                    </div>
                  }
                >
                  <HeroPlantCanvas onScanClick={launchWebsiteCamera} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cream Climate & Soil Intelligence Band */}
      <section
        id="web-telemetry"
        className="w-full py-12 bg-[#edf5ef] border-b border-[#cbdcd0]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#14532d]">
              <Sun className="w-4 h-4 text-[#b45309]" />
              <span>{isUrdu ? 'لائیو موسمیات اور مٹی انٹیلی جنس' : 'Live Climate & Soil Hub'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#13281c] mt-1">
              {isUrdu ? 'کھیت کا لائیو ڈیٹا اور مٹی کا تجزیہ' : 'Real-Time Microclimate & Soil Telemetry'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <WeatherAlertCard />
            </div>
            <div className="lg:col-span-7">
              <SmartSensorSection onScanClick={launchWebsiteCamera} />
            </div>
          </div>
        </div>
      </section>

      {/* Deep Forest 3D Anatomy Lab Band */}
      <section
        id="web-3d-anatomy"
        className="w-full py-12 bg-[#13281c] border-b border-[#254935]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-white">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#fef3c7]">
                <Layers className="w-4 h-4 text-[#f59e0b]" />
                <span>{isUrdu ? 'تھری ڈی پتا لیبارٹری' : '3D Leaf Micro-Anatomy'}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
                {isUrdu ? 'ٹماٹر کے پتے کے اندر بیماریوں کا سفر' : 'Inside the Tomato Leaf & Pathogen Layers'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenMobileApp}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-extrabold cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'مین ایپ' : 'Return to App'}</span>
            </button>
          </div>

          <div className="rounded-3xl overflow-hidden border border-[#cbdcd0] shadow-xl bg-[#faf8f2]">
            <Suspense
              fallback={
                <div className="py-16 text-center text-sm font-semibold text-[#13281c]">
                  Loading 3D Leaf Lab...
                </div>
              }
            >
              <LeafAnatomySection onScanClick={launchWebsiteCamera} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Disease Atlas + AI Studio Band */}
      <section
        id="web-diseases"
        className="w-full py-12 bg-[#faf8f2] border-b border-[#cbdcd0]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="rounded-3xl border border-[#cbdcd0] bg-white p-4 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#14532d] mb-3">
              <Compass className="w-4 h-4 text-[#b45309]" />
              <span>{isUrdu ? 'ٹماٹر امراض انسائیکلوپیڈیا' : 'Interactive Pathogen Atlas'}</span>
            </div>
            <DiseaseLibrary onSelectForDiagnosis={launchWebsiteCamera} />
          </div>

          <div
            id="web-diagnostic"
            className="rounded-3xl border border-[#cbdcd0] bg-white p-4 sm:p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#cbdcd0]">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#14532d]">
                <ShieldCheck className="w-4 h-4 text-[#166534]" />
                <span>{isUrdu ? 'ویب اے آئی تشخیصی اسٹوڈیو' : 'AgroVision AI Diagnostic Studio'}</span>
              </div>
              <button
                type="button"
                onClick={onOpenMobileApp}
                className="text-xs font-bold text-[#14532d] hover:underline cursor-pointer"
              >
                {isUrdu ? 'مین فیلڈ ایپ میں کھولیں' : 'Switch Back to Main Workspace'}
              </button>
            </div>
            <Suspense
              fallback={
                <div className="py-14 text-center text-sm font-semibold text-[#14532d]">
                  Loading Diagnostic Studio...
                </div>
              }
            >
              <DiagnosticStudio
                externalAction={diagnosticAction}
                onExternalActionHandled={() => setDiagnosticAction(null)}
                onOpenSensors={() => scrollToSection('web-telemetry')}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Pipeline, Impact, Exhibition, Credits, Investors & Footer */}
      <div id="web-team" className="bg-[#faf8f2]">
        <NeuralPipelineSection />
        <AgriculturalImpact />
        <ExhibitionHub />
        <InvestorsShowcaseSection />
        <ProjectCreditsSection />
        <Footer />
      </div>

      {/* Floating Main App Switcher */}
      <button
        type="button"
        onClick={onOpenMobileApp}
        className="no-print fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#14532d] hover:bg-[#13281c] text-white text-xs sm:text-sm font-extrabold shadow-lg border border-[#4a7c5d] cursor-pointer"
      >
        <Smartphone className="w-4 h-4 text-[#f59e0b]" />
        <span>{isUrdu ? 'مین ایپ پر واپس جائیں' : 'Return to Main App'}</span>
      </button>
    </div>
  );
};
