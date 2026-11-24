import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudSun,
  Compass,
  Droplets,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Wind
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type WeatherZoneKey = 'punjab' | 'multan' | 'sindh' | 'potohar' | 'gps';

export interface LiveWeatherSnapshot {
  source: string;
  zone: string;
  locationEn: string;
  locationUr: string;
  fetchedAt: string;
  current: {
    tempC: number;
    tempF: number;
    humidity: number;
    dewPointC: number;
    precipitationMm: number;
    windKmh: number;
    weatherCode: number;
  };
  forecast: {
    date: string;
    tempMaxC: number;
    tempMinC: number;
    precipProb: number;
    precipMm: number;
    weatherCode: number;
  }[];
  risk: {
    level: 'Low' | 'Moderate' | 'High';
    summaryEn: string;
    summaryUr: string;
    watchCondition: string;
  };
}

interface WeatherAlertCardProps {
  onWeatherLoaded?: (snapshot: LiveWeatherSnapshot) => void;
  compact?: boolean;
}

const WEATHER_STORAGE_KEY = 'agrovision_last_live_weather_v1';

function readCachedWeather(): LiveWeatherSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.current ? parsed : null;
  } catch {
    return null;
  }
}

export const WeatherAlertCard: React.FC<WeatherAlertCardProps> = ({
  onWeatherLoaded,
  compact = false
}) => {
  const { t, isUrdu } = useLanguage();
  const [selectedZone, setSelectedZone] = useState<WeatherZoneKey>('punjab');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [weather, setWeather] = useState<LiveWeatherSnapshot | null>(() => readCachedWeather());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const fetchWeather = useCallback(
    async (zone: WeatherZoneKey, gpsCoords: { lat: number; lon: number } | null) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (zone === 'gps' && gpsCoords) {
          params.set('lat', String(gpsCoords.lat));
          params.set('lon', String(gpsCoords.lon));
        } else {
          params.set('zone', zone === 'gps' ? 'punjab' : zone);
        }

        const res = await fetch(`/api/weather?${params.toString()}`);
        const json = await res.json();
        if (!res.ok || !json?.current) {
          throw new Error(json?.error || `Weather service returned HTTP ${res.status}`);
        }

        setWeather(json);
        onWeatherLoaded?.(json);
        try {
          localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(json));
        } catch {
          // Ignore quota issues
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to fetch live weather data.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [onWeatherLoaded]
  );

  useEffect(() => {
    void fetchWeather(selectedZone, coords);
  }, [selectedZone, coords, fetchWeather]);

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus(
        isUrdu
          ? 'اس براؤزر میں لوکیشن دستیاب نہیں — پنجاب زون منتخب ہے۔'
          : 'Geolocation unavailable on this device — showing regional feed.'
      );
      return;
    }
    setGpsStatus(isUrdu ? 'جی پی ایس لوکیشن حاصل کی جا رہی ہے...' : 'Locating field coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4))
        };
        setCoords(nextCoords);
        setSelectedZone('gps');
        setGpsStatus(null);
      },
      () => {
        setGpsStatus(
          isUrdu
            ? 'لوکیشن کی اجازت نہیں ملی — علاقائی زون استعمال کریں۔'
            : 'Location permission declined — using regional preset.'
        );
      },
      { timeout: 6000 }
    );
  };

  const riskLevel = weather?.risk?.level || 'Moderate';
  const riskBadgeStyle =
    riskLevel === 'High'
      ? 'bg-[#b91c1c] text-white'
      : riskLevel === 'Moderate'
      ? 'bg-[#b45309] text-white'
      : 'bg-[#166534] text-white';

  const riskLabel =
    riskLevel === 'High'
      ? isUrdu
        ? 'زیادہ ماحولیاتی خطرہ'
        : 'High Env. Risk'
      : riskLevel === 'Moderate'
      ? isUrdu
        ? 'درمیانہ ماحولیاتی خطرہ'
        : 'Moderate Env. Risk'
      : isUrdu
      ? 'کم ماحولیاتی خطرہ'
      : 'Low Env. Risk';

  const updatedLabel = weather?.fetchedAt
    ? new Date(weather.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <section
      id="weather"
      className="w-full bg-white border border-[#cbdcd0] rounded-2xl p-4 shadow-xs space-y-3 text-start"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#14532d] font-bold truncate">
            {t.weather.badge} · Open-Meteo
          </div>
          <h2 className="font-display text-base font-extrabold text-[#13281c] truncate leading-tight">
            {weather ? (isUrdu ? weather.locationUr : weather.locationEn) : t.weather.title}
          </h2>
          <div className="text-[11px] font-mono text-[#5b7463] tabular-nums">
            {isUrdu ? `اپ ڈیٹ: ${updatedLabel}` : `Updated ${updatedLabel}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void fetchWeather(selectedZone, coords)}
            disabled={loading}
            aria-label={isUrdu ? 'موسم تازہ کریں' : 'Refresh weather'}
            className="min-h-[34px] min-w-[34px] rounded-lg bg-[#edf5ef] hover:bg-[#dcebe1] border border-[#cbdcd0] text-[#14532d] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase whitespace-nowrap ${riskBadgeStyle}`}
          >
            {riskLabel}
          </span>
        </div>
      </div>

      {/* Zone Selector + GPS Button */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex-1 grid grid-cols-4 gap-1 p-1 bg-[#edf5ef] rounded-xl border border-[#cbdcd0] min-w-[220px]">
          {([
            { id: 'punjab', labelEn: 'Punjab', labelUr: 'پنجاب' },
            { id: 'multan', labelEn: 'Multan', labelUr: 'ملتان' },
            { id: 'sindh', labelEn: 'Sindh', labelUr: 'سندھ' },
            { id: 'potohar', labelEn: 'Potohar', labelUr: 'پوٹھوہار' }
          ] as const).map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => {
                setGpsStatus(null);
                setSelectedZone(z.id);
              }}
              className={`min-h-[32px] px-1.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate ${
                selectedZone === z.id
                  ? 'bg-[#14532d] text-white shadow-xs'
                  : 'text-[#2f4739] hover:text-[#13281c]'
              }`}
            >
              {isUrdu ? z.labelUr : z.labelEn}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleUseGps}
          className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
            selectedZone === 'gps'
              ? 'bg-[#14532d] text-white border-[#14532d]'
              : 'bg-[#faf8f2] hover:bg-[#edf5ef] text-[#14532d] border-[#cbdcd0]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{isUrdu ? 'میرا جی پی ایس' : 'My GPS'}</span>
        </button>
      </div>

      {gpsStatus && (
        <div className="px-3 py-1.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-[11px] text-[#3d5947] flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
          <span>{gpsStatus}</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] text-[11px] flex items-center justify-between gap-2">
          <span>
            {weather
              ? isUrdu
                ? `تازہ ڈیٹا دستیاب نہیں (${error}) — آخری محفوظ ریڈنگ دکھائی جا رہی ہے۔`
                : `Live refresh failed (${error}). Showing cached reading.`
              : error}
          </span>
          <button
            type="button"
            onClick={() => void fetchWeather(selectedZone, coords)}
            className="px-2 py-1 rounded-lg bg-white border border-[#fca5a5] font-bold shrink-0 cursor-pointer"
          >
            {isUrdu ? 'دوبارہ' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading Skeleton when no data cached yet */}
      {loading && !weather ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]" />
          ))}
        </div>
      ) : (
        weather && (
          <>
            {/* 4-Metric Weather Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="px-2.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#b45309] text-white flex items-center justify-center shrink-0">
                  <Thermometer className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-[#3d5947] truncate">
                    {t.weather.tempLabel}
                  </div>
                  <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c]">
                    {weather.current.tempC}°C
                  </div>
                </div>
              </div>

              <div className="px-2.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#166534] text-white flex items-center justify-center shrink-0">
                  <Droplets className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-[#3d5947] truncate">
                    {t.weather.humidityLabel}
                  </div>
                  <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c]">
                    {weather.current.humidity}%
                  </div>
                </div>
              </div>

              <div className="px-2.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#14532d] text-white flex items-center justify-center shrink-0">
                  <CloudSun className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-[#3d5947] truncate">
                    {t.weather.dewLabel}
                  </div>
                  <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c]">
                    {weather.current.dewPointC}°C
                  </div>
                </div>
              </div>

              <div className="px-2.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#3d5947] text-white flex items-center justify-center shrink-0">
                  <Wind className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-[#3d5947] truncate">
                    {isUrdu ? 'ہوا / بارش' : 'Wind · Rain'}
                  </div>
                  <div className="font-mono tabular-nums text-xs font-extrabold text-[#13281c] truncate">
                    {weather.current.windKmh}km/h · {weather.current.precipitationMm}mm
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Day Forecast Strip */}
            {!compact && weather.forecast?.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {weather.forecast.slice(0, 3).map((day, idx) => {
                  const dayLabel =
                    idx === 0
                      ? isUrdu
                        ? 'آج'
                        : 'Today'
                      : new Date(`${day.date}T12:00:00`).toLocaleDateString(
                          isUrdu ? 'ur-PK' : 'en-US',
                          { weekday: 'short' }
                        );
                  return (
                    <div
                      key={day.date}
                      className="px-2.5 py-1.5 rounded-xl bg-[#edf5ef] border border-[#cbdcd0] text-[11px] flex items-center justify-between gap-1"
                    >
                      <span className="font-bold text-[#13281c]">{dayLabel}</span>
                      <span className="font-mono tabular-nums text-[#3d5947]">
                        {day.tempMaxC}°/{day.tempMinC}°
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Environmental Disease-Favoring Risk Notice (Explicitly NOT a leaf diagnosis) */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                riskLevel === 'High'
                  ? 'bg-[#fef2f2] border-[#fca5a5] text-[#7f1d1d]'
                  : riskLevel === 'Moderate'
                  ? 'bg-[#fffbeb] border-[#fcd34d] text-[#78350f]'
                  : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#14532d]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {riskLevel === 'High' ? (
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                ) : riskLevel === 'Moderate' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{weather.risk.watchCondition}</span>
              </div>
              <p className="text-[11px] leading-snug">
                {isUrdu ? weather.risk.summaryUr : weather.risk.summaryEn}
              </p>
              <p className="text-[10px] font-mono opacity-85 pt-0.5">
                {isUrdu
                  ? 'صرف ماحولیاتی خطرہ — حقیقی انفیکشن کی تصدیق کے لیے پتے کو اسکین کریں۔'
                  : 'Environmental risk only — scan a leaf to confirm infection.'}
              </p>
            </div>
          </>
        )
      )}
    </section>
  );
};
