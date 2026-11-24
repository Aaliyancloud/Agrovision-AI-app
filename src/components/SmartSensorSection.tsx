import React, { useCallback, useEffect, useState } from 'react';
import {
  Droplets,
  FlaskConical,
  Globe,
  MapPin,
  RefreshCw,
  RotateCcw,
  ScanLine,
  SlidersHorizontal
} from 'lucide-react';
import { FieldSensorPreset, useSensors } from '../context/SensorContext';
import { useLanguage } from '../context/LanguageContext';
import { useOptionalXP } from '../context/XPContext';

export interface LiveSoilProfile {
  sourceType: 'ISRIC SoilGrids Live' | 'Regional Research Estimate';
  sourceCitation: string;
  labTestRecommended: boolean;
  regionId: string;
  regionNameEn: string;
  regionNameUr: string;
  soilOrder: string;
  textureClassEn: string;
  textureClassUr: string;
  estimatedPh: number;
  phRange: string;
  organicCarbonGkg: number;
  clayPct: number;
  sandPct: number;
  siltPct: number;
  nitrogenGkg: number;
  cecCmolKg: number;
  drainageEn: string;
  drainageUr: string;
  cropAdvisoryEn: string;
  cropAdvisoryUr: string;
}

interface SmartSensorSectionProps {
  onScanClick?: () => void;
  onSoilLoaded?: (profile: LiveSoilProfile) => void;
}

type SoilRegionId = 'punjab_central' | 'punjab_south' | 'sindh_lower' | 'potohar';

export const SmartSensorSection: React.FC<SmartSensorSectionProps> = ({
  onScanClick,
  onSoilLoaded
}) => {
  const { isUrdu, t } = useLanguage();
  const xpCtx = useOptionalXP();
  const {
    moistureEnabled,
    toggleMoisture,
    moisturePercent,
    setMoisturePercent,
    phEnabled,
    togglePh,
    soilPh,
    setSoilPh,
    applyPreset,
    resetSensors,
    activeSensorCount
  } = useSensors();

  const [soilRegion, setSoilRegion] = useState<SoilRegionId>('punjab_central');
  const [soilCoords, setSoilCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [soilProfile, setSoilProfile] = useState<LiveSoilProfile | null>(null);
  const [soilLoading, setSoilLoading] = useState<boolean>(true);
  const [soilError, setSoilError] = useState<string | null>(null);

  const loadSoilProfile = useCallback(
    async (
      region: SoilRegionId,
      coords: { lat: number; lon: number } | null,
      awardMissionOnSuccess: boolean
    ) => {
      setSoilLoading(true);
      setSoilError(null);
      try {
        const params = new URLSearchParams({ region });
        if (coords) {
          params.set('lat', String(coords.lat));
          params.set('lon', String(coords.lon));
        }
        const res = await fetch(`/api/soil?${params.toString()}`);
        const data = await res.json();
        if (!res.ok || !data?.soilOrder) {
          throw new Error(data?.error || 'Soil dataset lookup failed.');
        }
        setSoilProfile(data);
        onSoilLoaded?.(data);
        if (awardMissionOnSuccess) {
          xpCtx?.completeMissionByEvent('check_soil_sensors');
        }
      } catch (err) {
        setSoilError(err instanceof Error ? err.message : 'Unable to reach soil dataset.');
      } finally {
        setSoilLoading(false);
      }
    },
    [onSoilLoaded, xpCtx]
  );

  useEffect(() => {
    void loadSoilProfile(soilRegion, soilCoords, false);
  }, [soilRegion, soilCoords, loadSoilProfile]);

  const handleUseGpsForSoil = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4))
        };
        setSoilCoords(nextCoords);
        void loadSoilProfile(soilRegion, nextCoords, true);
      },
      () => {
        setSoilError(
          isUrdu
            ? 'جی پی ایس کی اجازت نہیں ملی — علاقائی مٹی ڈیٹا استعمال ہو رہا ہے۔'
            : 'Location denied — keeping regional research dataset.'
        );
      },
      { timeout: 6000 }
    );
  };

  const handleCalibratePreset = (presetId: FieldSensorPreset) => {
    applyPreset(presetId);
    xpCtx?.completeMissionByEvent('check_soil_sensors');
  };

  const moistureState =
    moisturePercent >= 75
      ? {
          status: isUrdu ? 'زیادہ نمی (خطرہ)' : 'Saturated',
          tone: 'text-[#b91c1c]',
          barColor: 'bg-[#b91c1c]',
          note: isUrdu
            ? 'جڑوں کے گرد اضافی نمی ارلی اور لیٹ بلائیٹ فنگس کے خطرے کو بڑھا دیتی ہے۔'
            : 'Excess root-zone water accelerates Phytophthora and Alternaria fungal spore spread.'
        }
      : moisturePercent <= 35
      ? {
          status: isUrdu ? 'خشک مٹی' : 'Dry Deficit',
          tone: 'text-[#b45309]',
          barColor: 'bg-[#b45309]',
          note: isUrdu
            ? 'خشک مٹی سے پتے مرجھا سکتے ہیں اور غذائی کمی کی علامات بیماری جیسی لگ سکتی ہیں۔'
            : 'Moisture deficit can induce wilting or margin curl resembling vascular stress.'
        }
      : {
          status: isUrdu ? 'متوازن نمی' : 'Optimal Range',
          tone: 'text-[#166534]',
          barColor: 'bg-[#166534]',
          note: isUrdu
            ? '45% تا 68% نمی ٹماٹر کی جڑوں کی مضبوط نشوونما کے لیے موزوں ہے۔'
            : 'Balanced 45–68% volumetric water content supports steady root uptake without splash.'
        };

  const phState =
    soilPh < 5.8
      ? {
          status: isUrdu ? 'تیزابی مٹی' : 'Acidic Soil',
          tone: 'text-[#b45309]',
          markerPercent: ((soilPh - 4.5) / 4.0) * 100,
          note: isUrdu
            ? 'کم پی ایچ کیلشیم کے جذب کو روکتا ہے جس سے پتے دھبوں اور بیکٹیریا کے لیے کمزور ہو جاتے ہیں۔'
            : 'Low pH limits calcium uptake, weakening cell walls against bacterial and blight lesions.'
        }
      : soilPh > 7.3
      ? {
          status: isUrdu ? 'الکلین مٹی' : 'Alkaline Soil',
          tone: 'text-[#b91c1c]',
          markerPercent: ((soilPh - 4.5) / 4.0) * 100,
          note: isUrdu
            ? 'زیادہ پی ایچ لوہے کی کمی پیدا کر کے پتوں کو پیلا کرتا ہے جو وائرس جیسا لگ سکتا ہے۔'
            : 'High pH locks out iron and manganese, causing interveinal yellowing similar to curl.'
        }
      : {
          status: isUrdu ? 'مثالی پی ایچ' : 'Optimal pH',
          tone: 'text-[#166534]',
          markerPercent: ((soilPh - 4.5) / 4.0) * 100,
          note: isUrdu
            ? '6.0 تا 6.8 پی ایچ ٹماٹر کے پودوں میں مکمل غذائی توازن برقرار رکھتا ہے۔'
            : 'Optimal 6.0–6.8 pH maintains nitrogen, phosphorus, potassium, and calcium availability.'
        };

  const presets: { id: FieldSensorPreset; label: string }[] = [
    { id: 'optimal', label: isUrdu ? 'متوازن کھیت' : 'Balanced Field' },
    { id: 'waterlogged_acidic', label: isUrdu ? 'زیادہ پانی / تیزابی' : 'Waterlogged & Acidic' },
    { id: 'drought_alkaline', label: isUrdu ? 'خشک / الکلین' : 'Dry & Alkaline' }
  ];

  const isPresetActive = (id: FieldSensorPreset) => {
    if (!moistureEnabled || !phEnabled) return false;
    if (id === 'optimal') return moisturePercent === 58 && soilPh === 6.4;
    if (id === 'waterlogged_acidic') return moisturePercent === 86 && soilPh === 5.2;
    return moisturePercent === 24 && soilPh === 7.8;
  };

  return (
    <section id="smart-sensors" className="w-full space-y-4">
      {/* 1. Real Soil Intelligence Lookup (ISRIC SoilGrids + FAO/PARC) */}
      <div className="w-full bg-white border border-[#cbdcd0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-start">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#cbdcd0]/70">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#14532d] font-bold">
              {isUrdu ? 'سائنسی مٹی ڈیٹاسیٹ انٹیلی جنس' : 'Agricultural Soil Classification & Texture'}
            </div>
            <h2 className="font-display text-lg font-extrabold text-[#13281c]">
              {isUrdu ? 'علاقائی مٹی کا تجزیہ (ISRIC / FAO)' : 'Soil Intelligence & Regional Profile'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUseGpsForSoil}
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#edf5ef] hover:bg-[#dcebe1] border border-[#cbdcd0] text-[#14532d] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'جی پی ایس مٹی' : 'Lookup My GPS'}</span>
            </button>
            <button
              type="button"
              onClick={() => void loadSoilProfile(soilRegion, soilCoords, true)}
              disabled={soilLoading}
              aria-label="Refresh soil dataset"
              className="min-h-[34px] min-w-[34px] rounded-lg bg-[#faf8f2] hover:bg-[#edf5ef] border border-[#cbdcd0] text-[#14532d] flex items-center justify-center cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${soilLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Region Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#edf5ef] rounded-xl border border-[#cbdcd0]">
          {([
            { id: 'punjab_central', labelEn: 'Central Punjab', labelUr: 'وسطی پنجاب' },
            { id: 'punjab_south', labelEn: 'Multan / South', labelUr: 'جنوبی پنجاب' },
            { id: 'sindh_lower', labelEn: 'Lower Sindh', labelUr: 'زیریں سندھ' },
            { id: 'potohar', labelEn: 'Potohar Plateau', labelUr: 'پوٹھوہار' }
          ] as const).map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => {
                setSoilCoords(null);
                setSoilRegion(reg.id);
                void loadSoilProfile(reg.id, null, true);
              }}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer truncate ${
                !soilCoords && soilRegion === reg.id
                  ? 'bg-[#14532d] text-white shadow-xs'
                  : 'text-[#2f4739] hover:text-[#13281c]'
              }`}
            >
              {isUrdu ? reg.labelUr : reg.labelEn}
            </button>
          ))}
        </div>

        {soilError && (
          <div className="p-2.5 rounded-xl bg-[#fffbeb] border border-[#fcd34d] text-[11px] text-[#78350f]">
            {soilError}
          </div>
        )}

        {soilLoading && !soilProfile ? (
          <div className="h-32 rounded-xl bg-[#edf5ef] animate-pulse" />
        ) : (
          soilProfile && (
            <div className="space-y-3">
              {/* Source & Lab Disclaimer Metadata Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#3d5947]">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#14532d]">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>{soilProfile.sourceType}</span>
                </span>
                <span>
                  {isUrdu ? 'یقینی پیمائش کے لیے لیب ٹیسٹ تجویز کردہ' : 'Lab Soil Test Recommended for Fertilizer Dosing'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Classification & Metrics */}
                <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] space-y-2.5">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#5b7463]">
                      {isUrdu ? soilProfile.regionNameUr : soilProfile.regionNameEn}
                    </div>
                    <div className="font-display font-bold text-sm text-[#13281c] mt-0.5">
                      {isUrdu ? soilProfile.textureClassUr : soilProfile.textureClassEn}
                    </div>
                    <div className="text-[11px] font-mono text-[#3d5947]">
                      {soilProfile.soilOrder}
                    </div>
                  </div>

                  {/* Sand / Silt / Clay Composition Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#3d5947] tabular-nums">
                      <span>{isUrdu ? `ریت ${soilProfile.sandPct}%` : `Sand ${soilProfile.sandPct}%`}</span>
                      <span>{isUrdu ? `گاد ${soilProfile.siltPct}%` : `Silt ${soilProfile.siltPct}%`}</span>
                      <span>{isUrdu ? `چکنی ${soilProfile.clayPct}%` : `Clay ${soilProfile.clayPct}%`}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden flex border border-[#cbdcd0]">
                      <div className="bg-[#d97706] h-full" style={{ width: `${soilProfile.sandPct}%` }} />
                      <div className="bg-[#5b7463] h-full" style={{ width: `${soilProfile.siltPct}%` }} />
                      <div className="bg-[#14532d] h-full" style={{ width: `${soilProfile.clayPct}%` }} />
                    </div>
                  </div>

                  {/* Key Soil Chemistry Figures */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                    <div className="p-2 rounded-lg bg-white border border-[#cbdcd0]">
                      <div className="text-[9px] font-mono text-[#5b7463]">pH</div>
                      <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c]">
                        {soilProfile.estimatedPh}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#cbdcd0]">
                      <div className="text-[9px] font-mono text-[#5b7463]">SOC</div>
                      <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c]">
                        {soilProfile.organicCarbonGkg}g
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#cbdcd0]">
                      <div className="text-[9px] font-mono text-[#5b7463]">N</div>
                      <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c]">
                        {soilProfile.nitrogenGkg}g
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#cbdcd0]">
                      <div className="text-[9px] font-mono text-[#5b7463]">CEC</div>
                      <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c]">
                        {soilProfile.cecCmolKg}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drainage & Tomato Field Advice */}
                <div className="p-3.5 rounded-xl bg-[#edf5ef] border border-[#cbdcd0] flex flex-col justify-between gap-2.5">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[#14532d]">
                      {isUrdu ? 'نکاسیِ آب اور کھیت کی صلاح' : 'Drainage & Agronomic Guidance'}
                    </div>
                    <p className="text-xs text-[#13281c] leading-relaxed">
                      {isUrdu ? soilProfile.cropAdvisoryUr : soilProfile.cropAdvisoryEn}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#cbdcd0] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#3d5947]">
                      {isUrdu ? soilProfile.drainageUr : soilProfile.drainageEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhEnabledSync();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#cbdcd0] hover:bg-[#faf8f2] text-[#14532d] font-bold cursor-pointer shrink-0"
                    >
                      {isUrdu ? `پی ایچ ${soilProfile.estimatedPh} پروب پر لگائیں` : `Apply pH ${soilProfile.estimatedPh} to Probe`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* 2. Interactive Root-Zone Probe Simulator (Feeds Diagnostic Scanner Context) */}
      <div className="w-full bg-white border border-[#cbdcd0] rounded-2xl p-4 sm:p-5 shadow-xs text-start space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#cbdcd0]/70">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b45309] font-bold">
              {t.sensors.badge} · {isUrdu ? 'انٹرایکٹو فیلڈ سمیولیٹر' : 'Interactive Probe Input'}
            </div>
            <h3 className="font-display text-lg font-extrabold text-[#13281c]">
              {t.sensors.title}
            </h3>
            <p className="text-xs text-[#3d5947] mt-0.5">{t.sensors.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#edf5ef] rounded-xl border border-[#cbdcd0] overflow-x-auto">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleCalibratePreset(preset.id)}
                  className={`min-h-[34px] px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isPresetActive(preset.id)
                      ? 'bg-[#14532d] text-white'
                      : 'text-[#3d5947] hover:text-[#13281c]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={resetSensors}
              className="min-h-[34px] px-2.5 py-1 text-xs font-bold text-[#3d5947] hover:text-[#13281c] bg-[#faf8f2] hover:bg-[#edf5ef] border border-[#cbdcd0] rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ری سیٹ' : 'Reset'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Moisture Probe */}
          <div
            className={`rounded-2xl p-4 border transition-colors ${
              moistureEnabled
                ? 'bg-[#faf8f2] border-[#cbdcd0]'
                : 'bg-[#fcfbf9] border-[#cbdcd0]/60 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    moistureEnabled ? 'bg-[#14532d] text-white' : 'bg-[#e2ece5] text-[#5b7463]'
                  }`}
                >
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-[#13281c]">
                    {t.sensors.moistureLabel}
                  </h4>
                  <p className="text-[11px] text-[#3d5947]">
                    {isUrdu ? 'جڑوں کی نمی (10% – 95% VWC)' : 'Root-zone VWC probe (10% – 95%)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={moistureEnabled}
                onClick={toggleMoisture}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                  moistureEnabled ? 'bg-[#166534] border-[#14532d]' : 'bg-[#cbdcd0] border-[#a3bcae]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                    moistureEnabled
                      ? isUrdu
                        ? '-translate-x-5.5'
                        : 'translate-x-5.5'
                      : isUrdu
                      ? '-translate-x-1'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-mono tabular-nums text-2xl font-extrabold text-[#13281c]">
                  {moistureEnabled ? `${moisturePercent}%` : '--'}
                  <span className="text-xs font-medium text-[#5b7463] ml-1.5">VWC</span>
                </div>
                <span className={`text-xs font-mono font-bold ${moistureEnabled ? moistureState.tone : 'text-[#5b7463]'}`}>
                  {moistureEnabled ? moistureState.status : isUrdu ? 'بند ہے' : 'Disabled'}
                </span>
              </div>

              <input
                type="range"
                min={10}
                max={95}
                step={1}
                disabled={!moistureEnabled}
                value={moisturePercent}
                onChange={(e) => {
                  setMoisturePercent(Number(e.target.value));
                  xpCtx?.completeMissionByEvent('check_soil_sensors');
                }}
                aria-label="Soil moisture probe slider"
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-[#166534] bg-[#e2ece5] disabled:opacity-45"
              />
              <div className="w-full h-1.5 rounded-full bg-[#e2ece5] overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${moistureEnabled ? moistureState.barColor : 'bg-[#94a3b8]'}`}
                  style={{ width: `${moistureEnabled ? moisturePercent : 0}%` }}
                />
              </div>
              <p className="text-[11px] text-[#3d5947] leading-relaxed pt-1">
                {moistureEnabled
                  ? moistureState.note
                  : isUrdu
                  ? 'نمی سینسر بند ہونے پر صرف تصویر سے تشخیص ہوگی۔'
                  : 'Moisture excluded from leaf diagnosis when probe is off.'}
              </p>
            </div>
          </div>

          {/* pH Probe */}
          <div
            className={`rounded-2xl p-4 border transition-colors ${
              phEnabled
                ? 'bg-[#faf8f2] border-[#cbdcd0]'
                : 'bg-[#fcfbf9] border-[#cbdcd0]/60 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    phEnabled ? 'bg-[#b45309] text-white' : 'bg-[#e2ece5] text-[#5b7463]'
                  }`}
                >
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-[#13281c]">
                    {t.sensors.phLabel}
                  </h4>
                  <p className="text-[11px] text-[#3d5947]">
                    {isUrdu ? 'مٹی کی پی ایچ سطح (4.5 – 8.5 pH)' : 'Rhizosphere pH probe (4.5 – 8.5)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={phEnabled}
                onClick={togglePh}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                  phEnabled ? 'bg-[#166534] border-[#14532d]' : 'bg-[#cbdcd0] border-[#a3bcae]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                    phEnabled
                      ? isUrdu
                        ? '-translate-x-5.5'
                        : 'translate-x-5.5'
                      : isUrdu
                      ? '-translate-x-1'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-mono tabular-nums text-2xl font-extrabold text-[#13281c]">
                  {phEnabled ? soilPh.toFixed(1) : '--'}
                  <span className="text-xs font-medium text-[#5b7463] ml-1.5">pH</span>
                </div>
                <span className={`text-xs font-mono font-bold ${phEnabled ? phState.tone : 'text-[#5b7463]'}`}>
                  {phEnabled ? phState.status : isUrdu ? 'بند ہے' : 'Disabled'}
                </span>
              </div>

              <input
                type="range"
                min={4.5}
                max={8.5}
                step={0.1}
                disabled={!phEnabled}
                value={soilPh}
                onChange={(e) => {
                  setSoilPh(Number(e.target.value));
                  xpCtx?.completeMissionByEvent('check_soil_sensors');
                }}
                aria-label="Soil pH probe slider"
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-[#166534] bg-[#e2ece5] disabled:opacity-45"
              />
              <div className="relative w-full h-2 rounded-full bg-[#e2ece5] flex overflow-hidden">
                <div className="h-full w-[32%] bg-[#b45309]" />
                <div className="h-full w-[38%] bg-[#166534]" />
                <div className="h-full w-[30%] bg-[#7f1d1d]" />
                {phEnabled && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#13281c] shadow-xs -translate-x-1/2 transition-all duration-200"
                    style={{ left: `${Math.min(100, Math.max(0, phState.markerPercent))}%` }}
                  />
                )}
              </div>
              <p className="text-[11px] text-[#3d5947] leading-relaxed pt-1">
                {phEnabled
                  ? phState.note
                  : isUrdu
                  ? 'پی ایچ سینسر بند ہونے پر غذائی کمی کا تجزیہ شامل نہیں ہوگا۔'
                  : 'Soil pH excluded from diagnostic reasoning when probe is off.'}
              </p>
            </div>
          </div>
        </div>

        {/* Probe Sync Bar & Scan CTA */}
        <div className="pt-3 border-t border-[#cbdcd0]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#3d5947]">
            <SlidersHorizontal className="w-4 h-4 text-[#14532d] shrink-0" />
            <span>
              {activeSensorCount > 0
                ? isUrdu
                  ? `${activeSensorCount} فعال پروب ریڈنگز اسکینر میں شامل ہیں (${moistureEnabled ? `${moisturePercent}%` : 'OFF'} · ${phEnabled ? `${soilPh.toFixed(1)} pH` : 'OFF'})`
                  : `${activeSensorCount}/2 probe inputs active for Leaf Scanner (${moistureEnabled ? `${moisturePercent}% VWC` : 'Moisture OFF'} · ${phEnabled ? `${soilPh.toFixed(1)} pH` : 'pH OFF'})`
                : isUrdu
                ? 'پروب بند ہیں — اسکینر صرف تصویر دیکھے گا'
                : 'Probes off — Scanner uses vision-only leaf analysis'}
            </span>
          </div>

          {onScanClick && (
            <button
              type="button"
              onClick={onScanClick}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <ScanLine className="w-4 h-4" />
              <span>{t.sensors.applyAndScanBtn}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );

  function setPhEnabledSync() {
    if (!soilProfile) return;
    setSoilPh(soilProfile.estimatedPh);
    xpCtx?.completeMissionByEvent('check_soil_sensors');
  }
};
