import express from 'express';
import compression from 'compression';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Enable Gzip/Deflate compression for fast loading and reduced transfer sizes
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6
}));

// CDN and Browser Caching Headers Middleware
app.use((req, res, next) => {
  const normalizedPath = req.path.replace(/\/+$/, '') || '/';
  if (
    normalizedPath === '/sw.js' ||
    normalizedPath === '/dev-sw.js' ||
    normalizedPath === '/registerSW.js' ||
    normalizedPath.startsWith('/workbox-') ||
    normalizedPath === '/manifest.webmanifest'
  ) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (
    isProduction &&
    (normalizedPath.startsWith('/assets/') ||
      normalizedPath.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?)$/))
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (normalizedPath === '/sitemap.xml' || normalizedPath === '/robots.txt') {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Support base64 leaf image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const DEFAULT_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aagrovision-ai.ai.studio/</loc>
    <lastmod>2026-11-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://aagrovision-ai.ai.studio/sitemap.xml
`;

function resolveStaticSeoFile(filename: string): string | null {
  const candidates = [
    path.resolve(__dirname, 'public', filename),
    path.resolve(__dirname, 'dist', filename),
    path.resolve(__dirname, 'docs', filename)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }
  return null;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function extractGeminiErrorMessage(err: any, fallback: string): string {
  const raw = typeof err?.message === 'string' ? err.message : '';
  if (raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) return String(parsed.error.message);
      if (parsed?.message) return String(parsed.message);
    } catch {
      // ignore parse failure
    }
  }
  return raw || fallback;
}

function isTransientHighDemandError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = (typeof err?.message === 'string' ? err.message : '').toLowerCase();
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('429') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('resource_exhausted') ||
    msg.includes('timed out')
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (!isTransientHighDemandError(err) || attempt >= maxRetries) {
        throw err;
      }
      const delayMs = 700 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
    }
  }
  throw lastError;
}

// SEO Routes
app.get(['/sitemap.xml', '/sitemap.xml/'], (_req, res) => {
  const xml = resolveStaticSeoFile('sitemap.xml') ?? DEFAULT_SITEMAP_XML;
  res.status(200);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

app.get(['/robots.txt', '/robots.txt/'], (_req, res) => {
  const txt = resolveStaticSeoFile('robots.txt') ?? DEFAULT_ROBOTS_TXT;
  res.status(200);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(txt);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// ---------------------------------------------------------------------------
// 1. Live Agricultural Weather & Disease Risk API (Open-Meteo Proxy)
// ---------------------------------------------------------------------------
interface WeatherCacheEntry {
  expiresAt: number;
  payload: any;
}
const weatherCache = new Map<string, WeatherCacheEntry>();

const WEATHER_ZONES: Record<string, { lat: number; lon: number; labelEn: string; labelUr: string }> = {
  punjab: { lat: 31.5204, lon: 74.3587, labelEn: 'Lahore · Central Punjab', labelUr: 'لاہور · وسطی پنجاب' },
  multan: { lat: 30.1575, lon: 71.5249, labelEn: 'Multan · South Punjab', labelUr: 'ملتان · جنوبی پنجاب' },
  sindh: { lat: 25.396, lon: 68.3578, labelEn: 'Hyderabad · Lower Sindh', labelUr: 'حیدرآباد · زیریں سندھ' },
  potohar: { lat: 33.6844, lon: 73.0479, labelEn: 'Islamabad · Potohar', labelUr: 'اسلام آباد · پوٹھوہار' }
};

function computeEnvironmentalRisk(tempC: number, humidity: number, precipMm: number) {
  const favorsLateBlight = humidity >= 75 && tempC >= 12 && tempC <= 26;
  const favorsEarlyBlight = humidity >= 65 && tempC >= 22 && tempC <= 32;
  const favorsMites = humidity <= 42 && tempC >= 29;

  if (favorsLateBlight || (humidity >= 80 && precipMm > 0.2)) {
    return {
      level: 'High' as const,
      summaryEn: 'Cool-to-mild damp air strongly favors Late Blight spore spread if leaves remain wet.',
      summaryUr: 'زیادہ نمی اور معتدل درجہ حرارت لیٹ بلائیٹ پھپھوندی کے پھیلاؤ کے لیے سازگار ہے۔',
      watchCondition: 'Late Blight / Septoria Environmental Risk'
    };
  }
  if (favorsEarlyBlight || humidity >= 65) {
    return {
      level: 'Moderate' as const,
      summaryEn: 'Warm, moderately humid conditions can favor Early Blight or Bacterial Spot on dense foliage.',
      summaryUr: 'گرم اور مرطوب فضا ارلی بلائیٹ یا بیکٹیریل دھبوں کے خطرے کو بڑھا سکتی ہے۔',
      watchCondition: 'Early Blight / Foliar Wetness Watch'
    };
  }
  if (favorsMites) {
    return {
      level: 'Moderate' as const,
      summaryEn: 'Hot, dry air stresses tomato foliage and favors Two-Spotted Spider Mites and curl vectors.',
      summaryUr: 'گرم اور خشک ہوا لال مکڑی اور سفید مکھی کے حملے کا خطرہ بڑھا سکتی ہے۔',
      watchCondition: 'Heat Stress & Spider Mite Watch'
    };
  }
  return {
    level: 'Low' as const,
    summaryEn: 'Balanced daylight temperature and moderate humidity minimize foliar pathogen pressure.',
    summaryUr: 'متوازن درجہ حرارت اور اعتدال پسند نمی ٹماٹر کے پتوں کی صحت کے لیے موزوں ہے۔',
    watchCondition: 'Favorable Tomato Growing Microclimate'
  };
}

app.get('/api/weather', async (req, res) => {
  try {
    const zoneParam = typeof req.query.zone === 'string' ? req.query.zone.toLowerCase() : 'punjab';
    const rawLat = req.query.lat !== undefined ? Number(req.query.lat) : null;
    const rawLon = req.query.lon !== undefined ? Number(req.query.lon) : null;

    let lat: number;
    let lon: number;
    let locationEn: string;
    let locationUr: string;
    let resolvedZone = zoneParam;

    if (
      rawLat !== null &&
      rawLon !== null &&
      Number.isFinite(rawLat) &&
      Number.isFinite(rawLon) &&
      rawLat >= -90 &&
      rawLat <= 90 &&
      rawLon >= -180 &&
      rawLon <= 180
    ) {
      lat = Number(rawLat.toFixed(4));
      lon = Number(rawLon.toFixed(4));
      resolvedZone = 'gps';
      locationEn = `Field GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
      locationUr = `کھیت کا مقام (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
    } else {
      const preset = WEATHER_ZONES[zoneParam] || WEATHER_ZONES.punjab;
      lat = preset.lat;
      lon = preset.lon;
      locationEn = preset.labelEn;
      locationUr = preset.labelUr;
      resolvedZone = WEATHER_ZONES[zoneParam] ? zoneParam : 'punjab';
    }

    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ ...cached.payload, locationEn, locationUr, zone: resolvedZone, cached: true });
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,wind_speed_10m,weather_code'
    );
    url.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum'
    );
    url.searchParams.set('forecast_days', '3');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(6500),
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      return res.status(502).json({
        error: `Live weather provider returned HTTP ${response.status}.`
      });
    }

    const data: any = await response.json();
    const cur = data?.current;
    if (!cur || typeof cur.temperature_2m !== 'number') {
      return res.status(502).json({ error: 'Weather provider returned incomplete telemetry.' });
    }

    const tempC = Number(cur.temperature_2m.toFixed(1));
    const humidity = Math.round(Number(cur.relative_humidity_2m ?? 55));
    const dewPointC =
      typeof cur.dew_point_2m === 'number'
        ? Number(cur.dew_point_2m.toFixed(1))
        : Number((tempC - (100 - humidity) / 5).toFixed(1));
    const precipitationMm = Number((cur.precipitation ?? 0).toFixed(1));
    const windKmh = Math.round(Number(cur.wind_speed_10m ?? 0));
    const weatherCode = Number(cur.weather_code ?? 0);

    const dailyTimes: string[] = Array.isArray(data?.daily?.time) ? data.daily.time : [];
    const forecast = dailyTimes.slice(0, 3).map((date: string, i: number) => ({
      date,
      tempMaxC: Math.round(Number(data.daily.temperature_2m_max?.[i] ?? tempC)),
      tempMinC: Math.round(Number(data.daily.temperature_2m_min?.[i] ?? tempC - 7)),
      precipProb: Math.round(Number(data.daily.precipitation_probability_max?.[i] ?? 0)),
      precipMm: Number((data.daily.precipitation_sum?.[i] ?? 0).toFixed(1)),
      weatherCode: Number(data.daily.weather_code?.[i] ?? weatherCode)
    }));

    const risk = computeEnvironmentalRisk(tempC, humidity, precipitationMm);
    const payload = {
      success: true,
      source: 'Open-Meteo Live Weather API',
      isEnvironmentalRiskOnly: true,
      zone: resolvedZone,
      locationEn,
      locationUr,
      coordinates: { lat, lon },
      fetchedAt: new Date().toISOString(),
      current: {
        tempC,
        tempF: Math.round((tempC * 9) / 5 + 32),
        humidity,
        dewPointC,
        precipitationMm,
        windKmh,
        weatherCode
      },
      forecast,
      risk
    };

    weatherCache.set(cacheKey, {
      expiresAt: Date.now() + 10 * 60 * 1000,
      payload
    });

    return res.json({ ...payload, cached: false });
  } catch (error: any) {
    console.error('Error fetching Open-Meteo weather:', error);
    return res.status(504).json({
      error: error?.message || 'Unable to reach live weather service.'
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Real Soil Classification & Regional Research Dataset Proxy (ISRIC SoilGrids)
// ---------------------------------------------------------------------------
interface RegionalSoilFallback {
  regionId: string;
  regionNameEn: string;
  regionNameUr: string;
  lat: number;
  lon: number;
  soilOrder: string;
  textureClassEn: string;
  textureClassUr: string;
  phRange: string;
  estimatedPh: number;
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

const REGIONAL_SOIL_PROFILES: Record<string, RegionalSoilFallback> = {
  punjab_central: {
    regionId: 'punjab_central',
    regionNameEn: 'Central Punjab Alluvial Plain (Lahore / Sheikhupura)',
    regionNameUr: 'وسطی پنجاب کا زرخیز میدانی علاقہ (لاہور / شیخوپورہ)',
    lat: 31.5204,
    lon: 74.3587,
    soilOrder: 'Calcaric Cambisols / Fluvisols (FAO/ISRIC)',
    textureClassEn: 'Silty Clay Loam to Loam',
    textureClassUr: 'گاد اور چکنی مٹی کی آمیزش (Loam)',
    phRange: '7.4 – 8.1',
    estimatedPh: 7.7,
    organicCarbonGkg: 5.8,
    clayPct: 24,
    sandPct: 33,
    siltPct: 43,
    nitrogenGkg: 0.72,
    cecCmolKg: 14.5,
    drainageEn: 'Moderate drainage; crusting can occur after flood irrigation',
    drainageUr: 'معتدل نکاسیِ آب؛ کھلے پانی کے بعد اوپری تہہ سخت ہو سکتی ہے',
    cropAdvisoryEn:
      'Calcareous Punjab soils tend toward mild alkalinity (pH 7.4–8.1). Incorporate aged farmyard manure and elemental sulfur or humic acid near roots to keep iron and phosphorus soluble for tomatoes.',
    cropAdvisoryUr:
      'پنجاب کی چونے دار مٹی ہلکی الکلین (pH 7.4–8.1) ہوتی ہے۔ ٹماٹر کے لیے گلی سڑی گوبر کی کھاد اور ہیومک ایسڈ شامل کریں تاکہ فاسفورس اور آئرن دستیاب رہیں۔'
  },
  punjab_south: {
    regionId: 'punjab_south',
    regionNameEn: 'South Punjab Arid Basin (Multan / Bahawalpur)',
    regionNameUr: 'جنوبی پنجاب کا گرم زرعی خطہ (ملتان / بہاولپور)',
    lat: 30.1575,
    lon: 71.5249,
    soilOrder: 'Calcisols / Aridic Fluvisols (FAO/PARC)',
    textureClassEn: 'Sandy Loam to Silt Loam',
    textureClassUr: 'ریتلی گاد والی مٹی (Sandy Loam)',
    phRange: '7.7 – 8.3',
    estimatedPh: 7.9,
    organicCarbonGkg: 4.1,
    clayPct: 16,
    sandPct: 49,
    siltPct: 35,
    nitrogenGkg: 0.52,
    cecCmolKg: 11.2,
    drainageEn: 'Fast drainage; low organic matter increases moisture evaporation',
    drainageUr: 'تیز نکاسی؛ نامیاتی مادے کی کمی کی وجہ سے نمی جلدی خشک ہوتی ہے',
    cropAdvisoryEn:
      'Low organic carbon and sandy loam drainage demand organic straw mulching and split drip fertigation so blossom-end rot does not appear during dry heat.',
    cropAdvisoryUr:
      'کم نامیاتی مادے والی ریتلی مٹی میں تنوں کے گرد ملچنگ کریں اور وقفے وقفے سے ڈرپ آبپاشی دیں تاکہ پھل کا نچلا سرا نہ گلے۔'
  },
  sindh_lower: {
    regionId: 'sindh_lower',
    regionNameEn: 'Lower Indus Delta & Sindh Belt (Hyderabad / Thatta)',
    regionNameUr: 'زیریں سندھ و ڈیلٹا بیلٹ (حیدرآباد / ٹھٹھہ)',
    lat: 25.396,
    lon: 68.3578,
    soilOrder: 'Salic Fluvisols / Gleyic Cambisols (FAO)',
    textureClassEn: 'Silty Clay to Heavy Loam',
    textureClassUr: 'بھاری چکنی اور گاد والی مٹی',
    phRange: '7.5 – 8.2',
    estimatedPh: 7.8,
    organicCarbonGkg: 6.4,
    clayPct: 32,
    sandPct: 22,
    siltPct: 46,
    nitrogenGkg: 0.68,
    cecCmolKg: 18.4,
    drainageEn: 'Slower internal drainage; raised beds strongly recommended',
    drainageUr: 'سست نکاسیِ آب؛ کھیلیوں (Raised Beds) پر کاشت انتہائی مفید ہے',
    cropAdvisoryEn:
      'Higher clay fraction retains surface water longer in humid Sindh weather. Plant tomatoes on raised 25cm ridges and mulch with rice straw to shield lower foliage from splash.',
    cropAdvisoryUr:
      'سندھ کی چکنی مٹی میں نمی دیر تک ٹھہرتی ہے۔ ٹماٹر 25 سینٹی میٹر اونچی کھیلیوں پر لگائیں تاکہ جڑوں کے گرد پانی کھڑا ہو کر جھلساؤ نہ پھیلائے۔'
  },
  potohar: {
    regionId: 'potohar',
    regionNameEn: 'Potohar Rainfed Plateau (Islamabad / Chakwal)',
    regionNameUr: 'پوٹھوہار کا بارانی خطہ (اسلام آباد / چکوال)',
    lat: 33.6844,
    lon: 73.0479,
    soilOrder: 'Calcaric Regosols / Luvisols (FAO/PARC)',
    textureClassEn: 'Loam to Sandy Clay Loam',
    textureClassUr: 'درمیانی دو مٹ (Loam)',
    phRange: '6.8 – 7.6',
    estimatedPh: 7.2,
    organicCarbonGkg: 7.4,
    clayPct: 21,
    sandPct: 41,
    siltPct: 38,
    nitrogenGkg: 0.81,
    cecCmolKg: 15.8,
    drainageEn: 'Well-drained rolling loam suitable for early spring tomatoes',
    drainageUr: 'عمدہ نکاسی والی دو مٹ مٹی جو موسمِ بہار کے ٹماٹر کے لیے بہترین ہے',
    cropAdvisoryEn:
      'Near-neutral loam allows balanced calcium uptake. Top-dress with compost before monsoon showers to boost soil biological suppression of foliar blights.',
    cropAdvisoryUr:
      'متوازن پی ایچ کیلشیم کے جذب میں مددگار ہے۔ بارشوں سے پہلے کمپوسٹ شامل کریں تاکہ جڑیں مضبوط اور پتے بیماری سے محفوظ رہیں۔'
  }
};

function extractSoilGridsLayerMean(layers: any[], propName: string): number | null {
  const layer = layers?.find((l: any) => l?.name === propName);
  const depths = Array.isArray(layer?.depths) ? layer.depths : [];
  const d0 = depths.find((d: any) => d?.label === '0-5cm')?.values?.mean;
  const d1 = depths.find((d: any) => d?.label === '5-15cm')?.values?.mean;
  const nums = [d0, d1].filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

app.get('/api/soil', async (req, res) => {
  const regionParam = typeof req.query.region === 'string' ? req.query.region : 'punjab_central';
  const fallback = REGIONAL_SOIL_PROFILES[regionParam] || REGIONAL_SOIL_PROFILES.punjab_central;

  const rawLat = req.query.lat !== undefined ? Number(req.query.lat) : fallback.lat;
  const rawLon = req.query.lon !== undefined ? Number(req.query.lon) : fallback.lon;

  const lat = Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : fallback.lat;
  const lon = Number.isFinite(rawLon) && rawLon >= -180 && rawLon <= 180 ? rawLon : fallback.lon;

  try {
    const sgUrl = new URL('https://rest.isric.org/soilgrids/v2.0/properties/query');
    sgUrl.searchParams.set('lon', lon.toFixed(4));
    sgUrl.searchParams.set('lat', lat.toFixed(4));
    ['phh2o', 'soc', 'clay', 'sand', 'silt', 'nitrogen', 'cec'].forEach((p) =>
      sgUrl.searchParams.append('property', p)
    );
    sgUrl.searchParams.append('depth', '0-5cm');
    sgUrl.searchParams.append('depth', '5-15cm');
    sgUrl.searchParams.set('value', 'mean');

    const sgRes = await fetch(sgUrl.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' }
    });

    if (sgRes.ok) {
      const sgJson: any = await sgRes.json();
      const layers: any[] = sgJson?.properties?.layers || [];
      const phRaw = extractSoilGridsLayerMean(layers, 'phh2o');
      const socRaw = extractSoilGridsLayerMean(layers, 'soc');
      const clayRaw = extractSoilGridsLayerMean(layers, 'clay');
      const sandRaw = extractSoilGridsLayerMean(layers, 'sand');
      const siltRaw = extractSoilGridsLayerMean(layers, 'silt');
      const nitRaw = extractSoilGridsLayerMean(layers, 'nitrogen');
      const cecRaw = extractSoilGridsLayerMean(layers, 'cec');

      if (phRaw !== null && clayRaw !== null && sandRaw !== null) {
        const ph = Number((phRaw / 10).toFixed(1));
        const clayPct = Math.round(clayRaw / 10);
        const sandPct = Math.round(sandRaw / 10);
        const siltPct = siltRaw !== null ? Math.round(siltRaw / 10) : Math.max(0, 100 - clayPct - sandPct);
        const organicCarbonGkg = socRaw !== null ? Number((socRaw / 10).toFixed(1)) : fallback.organicCarbonGkg;
        const nitrogenGkg = nitRaw !== null ? Number((nitRaw / 100).toFixed(2)) : fallback.nitrogenGkg;
        const cecCmolKg = cecRaw !== null ? Number((cecRaw / 10).toFixed(1)) : fallback.cecCmolKg;

        return res.json({
          success: true,
          sourceType: 'ISRIC SoilGrids Live',
          sourceCitation: 'ISRIC World Soil Information (SoilGrids v2.0, 250m grid, 0–15cm topsoil)',
          labTestRecommended: true,
          coordinates: { lat, lon },
          regionId: fallback.regionId,
          regionNameEn: req.query.lat ? `Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)` : fallback.regionNameEn,
          regionNameUr: req.query.lat ? `مقام (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)` : fallback.regionNameUr,
          soilOrder: fallback.soilOrder,
          textureClassEn:
            clayPct >= 30
              ? 'Clay-Rich Loam'
              : sandPct >= 50
              ? 'Sandy Loam'
              : 'Balanced Silt Loam',
          textureClassUr:
            clayPct >= 30
              ? 'چکنی دو مٹ مٹی'
              : sandPct >= 50
              ? 'ریتلی دو مٹ مٹی'
              : 'متوازن گاد والی دو مٹ',
          estimatedPh: ph,
          phRange: `${Math.max(4.5, ph - 0.3).toFixed(1)} – ${Math.min(8.5, ph + 0.3).toFixed(1)}`,
          organicCarbonGkg,
          clayPct,
          sandPct,
          siltPct,
          nitrogenGkg,
          cecCmolKg,
          drainageEn: fallback.drainageEn,
          drainageUr: fallback.drainageUr,
          cropAdvisoryEn: fallback.cropAdvisoryEn,
          cropAdvisoryUr: fallback.cropAdvisoryUr,
          fetchedAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.warn('ISRIC SoilGrids lookup fell back to regional FAO/PARC dataset:', err);
  }

  return res.json({
    success: true,
    sourceType: 'Regional Research Estimate',
    sourceCitation: 'FAO World Reference Base & PARC Pakistan Regional Soil Dataset (0–15cm)',
    labTestRecommended: true,
    coordinates: { lat, lon },
    ...fallback,
    fetchedAt: new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// 3. Gemini 4 Hydrogen Two-Stage Leaf Pathology Analysis
// ---------------------------------------------------------------------------
app.post('/api/analyze-leaf', async (req, res) => {
  try {
    const { imageBase64, sensorContext } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image data is required in base64 format.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        fallbackRequired: true
      });
    }

    const sensorLines: string[] = [];
    if (sensorContext && typeof sensorContext === 'object') {
      if (sensorContext.moistureEnabled && typeof sensorContext.moisturePercent === 'number') {
        const clampedMoisture = Math.min(100, Math.max(0, Math.round(sensorContext.moisturePercent)));
        sensorLines.push(`- Root-Zone Soil Moisture Input: ${clampedMoisture}% VWC (optimal tomato range: 45-68%)`);
      }
      if (sensorContext.phEnabled && typeof sensorContext.soilPh === 'number') {
        const clampedPh = Math.min(10, Math.max(3, Number(sensorContext.soilPh.toFixed(1))));
        sensorLines.push(`- Root-Zone Soil pH Input: ${clampedPh} pH (optimal tomato range: 6.0-6.8 pH)`);
      }
    }

    const sensorContextPrompt =
      sensorLines.length > 0
        ? `\n\n4. OPTIONAL ROOT-ZONE CONTEXT:\n${sensorLines.join('\n')}\nFactor these values ONLY into Stage 2 once confirmed as a tomato leaf. Never bypass Stage 1 rejection rules.`
        : '';

    let mimeType = 'image/jpeg';
    let cleanBase64 = imageBase64;
    const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      cleanBase64 = matches[2];
    }

    const prompt = `You are AgroVision AI, an expert computer-vision plant pathologist and agronomist specializing in tomato crops (Solanum lycopersicum).
Analyze this uploaded image carefully:

1. CHECK IF THE IMAGE IS A PLANT LEAF / TOMATO LEAF:
- If the image is a person, human face, selfie, animal, inanimate object, indoor room, vehicle, or random non-plant subject with no botanical plant leaf present:
  - is_plant_leaf: false
  - subject_category: "non_plant"
  - non_plant_reason: "This is not a plant leaf."
  - is_tomato_leaf: false
  - plant_species: "Not a Plant"
  - disease_id: "not_a_plant"
  - disease_name: "Not a Plant"
  - confidence: 99
  - severity: "None"
  - disease_definition: "This image does not show a botanical plant leaf. Please upload a clear photo of a tomato leaf for disease diagnosis."
  - summary_ur: "یہ تصویر پودے کے پتے کی نہیں ہے۔ براہ کرم ٹماٹر کے پتے کی واضح تصویر اپ لوڈ کریں۔"
  - primary_symptoms: ["No plant foliage detected", "Non-botanical subject"]
  - organic_treatment: ["Please capture a well-lit photo of a tomato leaf."]
  - chemical_treatment: ["None required"]
  - cultural_prevention: ["Ensure camera focuses closely on crop leaves."]
  - care_routine: [{"phase": "Action", "title": "Upload Plant Leaf", "instruction": "Take a clear, close-up photo of a tomato leaf in natural daylight."}]
  - lesion_boxes: []

- If the image is a plant leaf of another species (e.g. Mango, Neem, Potato, Chili, etc.):
  - is_plant_leaf: true
  - subject_category: "other_plant"
  - is_tomato_leaf: false
  - plant_species: "Other Plant Leaf"
  - disease_id: "not_tomato"
  - disease_name: "Not a Tomato Leaf"
  - confidence: 95
  - severity: "None"
  - disease_definition: "This is a real plant leaf, but it does not appear to be a tomato (Solanum lycopersicum) leaf."
  - summary_ur: "یہ ایک پودے کا پتہ ہے، مگر یہ ٹماٹر کا پتہ نہیں ہے۔"
  - primary_symptoms: ["Non-tomato leaf morphology"]
  - organic_treatment: ["Upload a tomato crop leaf for precise disease detection."]
  - chemical_treatment: ["None"]
  - cultural_prevention: ["Check crop variety."]
  - care_routine: [{"phase": "Action", "title": "Tomato Leaf Required", "instruction": "Please provide a tomato crop leaf image."}]
  - lesion_boxes: []

- If the image IS a Tomato (Solanum lycopersicum) leaf (healthy or diseased):
  - is_plant_leaf: true
  - subject_category: "tomato_leaf"
  - is_tomato_leaf: true
  - plant_species: "Tomato Leaf"
  - species_scientific: "Solanum lycopersicum"
  - Accurately classify the condition into ONE of: "healthy" | "early_blight" | "late_blight" | "bacterial_spot" | "septoria_leaf_spot" | "yellow_leaf_curl" | "leaf_mold" | "mosaic_virus" | "target_spot" | "spider_mites"
  - Provide realistic confidence (70-99), exact disease name, definition, Urdu summary, primary symptoms, organic treatment, chemical treatment, cultural prevention, a 4-step care_routine, and lesion bounding boxes.`;

    const leafResponseSchema = {
      type: Type.OBJECT,
      properties: {
        is_plant_leaf: { type: Type.BOOLEAN },
        subject_category: { type: Type.STRING },
        non_plant_reason: { type: Type.STRING, nullable: true },
        is_tomato_leaf: { type: Type.BOOLEAN },
        plant_species: { type: Type.STRING },
        species_scientific: { type: Type.STRING },
        disease_id: { type: Type.STRING },
        disease_name: { type: Type.STRING },
        pathogen_type: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        severity: { type: Type.STRING },
        lesion_coverage_percent: { type: Type.NUMBER },
        disease_definition: { type: Type.STRING },
        summary_ur: { type: Type.STRING },
        primary_symptoms: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        organic_treatment: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        chemical_treatment: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        cultural_prevention: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        care_routine: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              title: { type: Type.STRING },
              instruction: { type: Type.STRING }
            },
            required: ['phase', 'title', 'instruction']
          }
        },
        lesion_boxes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              label: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            },
            required: ['x', 'y', 'width', 'height', 'label', 'confidence']
          }
        }
      },
      required: [
        'is_plant_leaf',
        'subject_category',
        'is_tomato_leaf',
        'plant_species',
        'species_scientific',
        'disease_id',
        'disease_name',
        'pathogen_type',
        'confidence',
        'severity',
        'lesion_coverage_percent',
        'disease_definition',
        'primary_symptoms',
        'organic_treatment',
        'chemical_treatment',
        'cultural_prevention',
        'care_routine',
        'lesion_boxes'
      ]
    };

    const callVisionModel = (modelName: string) =>
      ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: leafResponseSchema
        }
      });

    let usedModel = 'gemini-3.5-flash-lite';
    let response;
    try {
      response = await withRetry(() => callVisionModel('gemini-3.5-flash-lite'), 2);
    } catch (primaryErr: any) {
      if (!isTransientHighDemandError(primaryErr)) throw primaryErr;
      usedModel = 'gemini-2.5-flash';
      response = await withRetry(() => callVisionModel('gemini-2.5-flash'), 2);
    }

    const responseText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      data: parsedData,
      source: usedModel
    });
  } catch (error: any) {
    console.error('Error during Gemini leaf analysis:', error);
    const isTransient = isTransientHighDemandError(error);
    return res.status(isTransient ? 503 : 502).json({
      error: extractGeminiErrorMessage(error, 'Failed to process leaf with Gemini vision model'),
      transient: isTransient,
      fallbackRequired: true
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Real Multi-Turn AI Plant Health Assistant (/api/assistant)
// ---------------------------------------------------------------------------
app.post('/api/assistant', async (req, res) => {
  try {
    const {
      messages,
      language = 'en',
      growerName = null,
      latestScan = null,
      soilContext = null,
      weatherContext = null,
      activePlant = null
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Conversation messages array is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. AI Assistant requires a server Gemini API key.'
      });
    }

    const sanitizedHistory = messages
      .slice(-16)
      .filter((m: any) => m && typeof m.text === 'string' && m.text.trim().length > 0)
      .map((m: any) => ({
        role: m.isMe ? ('user' as const) : ('model' as const),
        parts: [{ text: String(m.text).slice(0, 2000) }]
      }));

    if (sanitizedHistory.length === 0) {
      return res.status(400).json({ error: 'At least one non-empty message is required.' });
    }

    const contextSections: string[] = [];
    if (latestScan && typeof latestScan === 'object') {
      contextSections.push(
        `LATEST LEAF SCAN: Condition="${String(latestScan.diseaseName || 'Unknown').slice(0, 120)}", Confidence=${Number(latestScan.confidence || 0)}%, Severity="${String(latestScan.severity || 'Unknown')}", Summary="${String(latestScan.summary || '').slice(0, 350)}"`
      );
    }
    if (soilContext && typeof soilContext === 'object') {
      contextSections.push(
        `SOIL PROFILE & PROBE CONTEXT: Moisture=${soilContext.moistureEnabled ? `${soilContext.moisturePercent}% VWC` : 'Disabled'}, pH=${soilContext.phEnabled ? soilContext.soilPh : 'Disabled'}, RegionSoil="${String(soilContext.regionName || 'Unspecified').slice(0, 120)}", Source="${String(soilContext.sourceType || 'Interactive Input')}"`
      );
    }
    if (weatherContext && typeof weatherContext === 'object') {
      contextSections.push(
        `LIVE WEATHER CONTEXT: Location="${String(weatherContext.location || 'Field').slice(0, 100)}", Temp=${weatherContext.tempC}°C, Humidity=${weatherContext.humidity}%, EnvRisk=${weatherContext.riskLevel} (${String(weatherContext.watchCondition || '')})`
      );
    }
    if (activePlant && typeof activePlant === 'object') {
      contextSections.push(
        `TRACKED TOMATO PLANT: Name="${String(activePlant.name || 'Tomato').slice(0, 80)}", Stage="${String(activePlant.stage || 'flowering')}", Health="${String(activePlant.healthStatus || 'thriving')}", Cultivar="${String(activePlant.cultivar || 'Standard')}"`
      );
    }
    if (growerName && typeof growerName === 'string' && growerName.trim()) {
      contextSections.push(`GROWER PROFILE: Name="${growerName.trim()}". Greet or address the grower respectfully by their profile name ("${growerName.trim()}").`);
    }

    const systemInstruction = `You are AgroVision AI Plant Health Assistant, an agricultural extension and tomato pathology specialist.
Reply in clear, practical, accurate ${language === 'ur' ? 'Urdu (اردو script, natural Pakistani agricultural terminology)' : 'English'}.
Rules:
1. Ground your advice in the provided scan, soil, weather, and plant stage context when relevant, without inventing sensor readings or weather values not listed below.
2. Distinguish clearly between: (a) confirmed leaf symptoms from an image scan, (b) environmental weather risk (which favors disease spread but does not diagnose an infection by itself), and (c) root-zone water/pH nutrient lockouts.
3. Give actionable organic-first steps (sanitation, airflow, drip irrigation timing, neem/copper/Bacillus options) plus clear signs for when to escalate to a local agricultural officer.
4. Keep responses crisp, structured with short bullet points when listing steps, and warm toward growers.

CURRENT GROWER CONTEXT:
${contextSections.length > 0 ? contextSections.join('\n') : 'No scan, live weather, or plant profile attached yet.'}`;

    let usedModel = 'gemini-4-hydrogen';
    let response;
    try {
      response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: sanitizedHistory,
          config: {
            systemInstruction
          }
        })
      );
    } catch (primaryErr: any) {
      if (!isTransientHighDemandError(primaryErr)) throw primaryErr;
      usedModel = 'gemini-3.1-flash-lite';
      response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: sanitizedHistory,
          config: {
            systemInstruction
          }
        })
      , 1);
    }

    const replyText = response.text?.trim();
    if (!replyText) {
      return res.status(502).json({ error: 'Assistant returned an empty response. Please try again.' });
    }

    return res.json({
      success: true,
      reply: replyText,
      model: usedModel
    });
  } catch (error: any) {
    console.error('Error in /api/assistant:', error);
    return res.status(502).json({
      error: extractGeminiErrorMessage(error, 'Unable to reach AI Plant Health Assistant right now.')
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Real Native Spoken Urdu / English TTS Audio Endpoint
// ---------------------------------------------------------------------------
const audioTtsCache = new Map<string, string>();

app.post('/api/tts-urdu', async (req, res) => {
  try {
    const { text, diseaseId, isUrdu = true } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required for audio synthesis.' });
    }

    const cleanText = text.trim().slice(0, 1200);
    const cacheKey = `${diseaseId || 'custom'}_${isUrdu ? 'ur' : 'en'}_${cleanText.slice(0, 60)}`;
    if (audioTtsCache.has(cacheKey)) {
      return res.json({
        success: true,
        audioBase64: audioTtsCache.get(cacheKey),
        format: 'audio/wav',
        cached: true,
        source: 'cache'
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        fallbackRequired: true
      });
    }

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: isUrdu
                    ? 'Clear, caring agricultural extension officer speaking fluent native Urdu with proper pronunciation'
                    : 'Clear, encouraging agricultural advisor'
                }
              }
            ]
          }
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          }
        }
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(502).json({
        error: 'Model did not return audio data.',
        fallbackRequired: true
      });
    }

    if (audioTtsCache.size > 40) {
      const oldestKey = audioTtsCache.keys().next().value;
      if (oldestKey) audioTtsCache.delete(oldestKey);
    }
    audioTtsCache.set(cacheKey, base64Audio);

    return res.json({
      success: true,
      audioBase64: base64Audio,
      format: 'audio/wav',
      cached: false,
      source: 'gemini-3.8-flash-lite-tts'
    });
  } catch (error: any) {
    console.error('Error in /api/tts-urdu audio synthesis:', error);
    return res.status(502).json({
      error: error?.message || 'Failed to synthesize speech audio.',
      fallbackRequired: true
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Server-Side Persistent Store: Grower Logins, Telemetry, Scan Reports & Admin
// ---------------------------------------------------------------------------
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'yousaaf.awan56@gmail.com').trim().toLowerCase();
const SESSION_SIGNING_SECRET =
  process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DATA_DIR = path.resolve(__dirname, '.data');
const STORE_PATH = path.resolve(DATA_DIR, 'agrovision-store.json');

interface SyncedUserRecord {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
  provider: 'google' | 'email' | 'device';
  emailVerified: boolean;
  xp: number;
  level: number;
  dailyStreak: number;
  scansCount: number;
  plantsCount: number;
  recentScans: {
    id: string;
    diseaseName: string;
    confidence: number;
    isTomatoLeaf: boolean;
    createdAt: string;
  }[];
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
}

interface ScanReportRecord {
  id: string;
  reporterUid: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  authMode: 'firebase' | 'device' | 'guest';
  issueType: 'wrong_disease' | 'false_rejection' | 'human_or_object_error' | 'blur_quality' | 'other';
  diagnosisId: string;
  diagnosisName: string;
  stage1Status: string;
  confidence: number;
  sourceType: 'upload' | 'camera' | 'sample';
  aiEngineUsed: string;
  notes: string;
  status: 'open' | 'reviewed' | 'resolved';
  adminNote: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface SignInEventRecord {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  provider: 'google' | 'email' | 'device';
  timestamp: string;
}

interface AgroVisionServerStore {
  users: Record<string, SyncedUserRecord>;
  reports: ScanReportRecord[];
  signInEvents: SignInEventRecord[];
  adminCredential?: {
    salt: string;
    hash: string;
    claimedAt: string;
  } | null;
}

function readServerStore(): AgroVisionServerStore {
  const empty: AgroVisionServerStore = {
    users: {},
    reports: [],
    signInEvents: [],
    adminCredential: null
  };
  try {
    if (!fs.existsSync(STORE_PATH)) return empty;
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed?.users && typeof parsed.users === 'object' ? parsed.users : {},
      reports: Array.isArray(parsed?.reports) ? parsed.reports : [],
      signInEvents: Array.isArray(parsed?.signInEvents) ? parsed.signInEvents : [],
      adminCredential: parsed?.adminCredential || null
    };
  } catch {
    return empty;
  }
}

function writeServerStore(store: AgroVisionServerStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (err) {
    console.error('Failed saving AgroVision server store:', err);
  }
}

function loadFirebaseApiKey(): string {
  try {
    const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (typeof cfg?.apiKey === 'string') return cfg.apiKey;
    }
  } catch {
    // ignore
  }
  return '';
}

const FIREBASE_WEB_API_KEY = loadFirebaseApiKey();

function hashPasscodeWithSalt(passcode: string, salt: string): string {
  return crypto.scryptSync(passcode, salt, 64).toString('hex');
}

function verifyPasscodeConstantTime(candidate: string, expectedHash: string, salt: string): boolean {
  const candidateHash = Buffer.from(hashPasscodeWithSalt(candidate, salt), 'hex');
  const storedBuf = Buffer.from(expectedHash, 'hex');
  if (candidateHash.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidateHash, storedBuf);
}

function verifyEnvPasscodeConstantTime(candidate: string, envCode: string): boolean {
  const h1 = crypto.createHash('sha256').update(candidate).digest();
  const h2 = crypto.createHash('sha256').update(envCode).digest();
  return crypto.timingSafeEqual(h1, h2);
}

function createSignedAdminToken(emailOrRole: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
  const payload = Buffer.from(JSON.stringify({ sub: emailOrRole, exp })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof decoded?.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

async function verifyAdminRequest(
  req: express.Request
): Promise<{ authorized: boolean; method?: string }> {
  const adminToken = typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'] : '';
  if (adminToken && verifySignedAdminToken(adminToken)) {
    return { authorized: true, method: 'admin-session' };
  }

  const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch && FIREBASE_WEB_API_KEY) {
    try {
      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: bearerMatch[1].trim() })
        }
      );
      if (lookupRes.ok) {
        const lookupJson: any = await lookupRes.json();
        const fbUser = lookupJson?.users?.[0];
        const email = typeof fbUser?.email === 'string' ? fbUser.email.trim().toLowerCase() : '';
        if (email === ADMIN_EMAIL && fbUser?.emailVerified === true) {
          return { authorized: true, method: 'firebase-id-token' };
        }
      }
    } catch {
      // ignore network errors
    }
  }

  return { authorized: false };
}

function cleanStr(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function sanitizeSafePhotoUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('https://')) {
    return trimmed.slice(0, 150000);
  }
  return undefined;
}

function upsertSyncedUser(store: AgroVisionServerStore, body: any): SyncedUserRecord | null {
  const uid = cleanStr(body?.uid, 128);
  if (!uid || !/^[a-zA-Z0-9._-]+$/.test(uid)) {
    return null;
  }

  const existing = store.users[uid];
  const rawDisplayName = cleanStr(body.displayName, 120);
  const displayName = rawDisplayName || existing?.displayName || 'Grower';
  const email = cleanStr(body.email, 320).toLowerCase();
  const phoneNumber = cleanStr(body.phoneNumber, 32);
  const provider: 'google' | 'email' | 'device' =
    body.provider === 'google' || body.provider === 'email' || body.provider === 'device'
      ? body.provider
      : existing?.provider || 'device';
  const emailVerified = Boolean(body.emailVerified);

  const hasXp = body.xp !== undefined && Number.isFinite(Number(body.xp));
  const hasLevel = body.level !== undefined && Number.isFinite(Number(body.level));
  const hasStreak = body.dailyStreak !== undefined && Number.isFinite(Number(body.dailyStreak));
  const hasScansCount = body.scansCount !== undefined && Number.isFinite(Number(body.scansCount));
  const hasPlantsCount = body.plantsCount !== undefined && Number.isFinite(Number(body.plantsCount));

  const incomingXp = hasXp ? Math.min(100000, Math.max(0, Number(body.xp))) : 0;
  const incomingLevel = hasLevel ? Math.min(1000, Math.max(1, Number(body.level))) : 1;
  const incomingStreak = hasStreak ? Math.min(3650, Math.max(0, Number(body.dailyStreak))) : 0;
  const incomingScansCount = hasScansCount
    ? Math.min(100000, Math.max(0, Number(body.scansCount)))
    : 0;
  const incomingPlantsCount = hasPlantsCount
    ? Math.min(10000, Math.max(0, Number(body.plantsCount)))
    : 0;

  const incomingScans = Array.isArray(body.recentScans)
    ? body.recentScans
        .slice(0, 10)
        .filter((s: any) => s && typeof s === 'object')
        .map((s: any) => ({
          id: cleanStr(s?.id, 80),
          diseaseName: cleanStr(s?.diseaseName, 140),
          confidence: Number.isFinite(Number(s?.confidence))
            ? Math.min(100, Math.max(0, Number(s.confidence)))
            : 0,
          isTomatoLeaf: Boolean(s?.isTomatoLeaf),
          createdAt: cleanStr(s?.createdAt, 64)
        }))
    : [];

  const mergedScanMap = new Map<
    string,
    { id: string; diseaseName: string; confidence: number; isTomatoLeaf: boolean; createdAt: string }
  >();
  for (const s of [...incomingScans, ...(existing?.recentScans || [])]) {
    const key = s.id || `${s.diseaseName}_${s.createdAt}`;
    if (key && !mergedScanMap.has(key)) {
      mergedScanMap.set(key, s);
    }
  }
  const recentScans = Array.from(mergedScanMap.values()).slice(0, 10);

  const sanitizedPhoto = sanitizeSafePhotoUrl(body.photoURL);
  const nextPhoto =
    body.clearPhoto === true
      ? ''
      : sanitizedPhoto && sanitizedPhoto.length > 0
      ? sanitizedPhoto
      : existing?.photoURL || '';

  const now = new Date().toISOString();
  const explicitCreatedAt = cleanStr(body.createdAt, 64);
  const explicitLastLoginAt = cleanStr(body.lastLoginAt, 64);

  const record: SyncedUserRecord = {
    uid,
    displayName,
    email: email || existing?.email || '',
    phoneNumber: phoneNumber || existing?.phoneNumber || '',
    ...(nextPhoto ? { photoURL: nextPhoto } : {}),
    provider,
    emailVerified: emailVerified || Boolean(existing?.emailVerified),
    xp: hasXp ? Math.max(incomingXp, existing?.xp || 0) : existing?.xp || 0,
    level: hasLevel ? Math.max(incomingLevel, existing?.level || 1) : existing?.level || 1,
    dailyStreak: hasStreak
      ? Math.max(incomingStreak, existing?.dailyStreak || 0)
      : existing?.dailyStreak || 0,
    scansCount: hasScansCount
      ? Math.max(incomingScansCount, existing?.scansCount || 0)
      : existing?.scansCount || 0,
    plantsCount: hasPlantsCount
      ? Math.max(incomingPlantsCount, existing?.plantsCount || 0)
      : existing?.plantsCount || 0,
    recentScans,
    createdAt: existing?.createdAt || explicitCreatedAt || now,
    lastLoginAt: body.isLoginEvent
      ? explicitLastLoginAt || now
      : existing?.lastLoginAt || explicitLastLoginAt || now,
    updatedAt: now
  };

  store.users[uid] = record;

  if (body.isLoginEvent) {
    const latestSameUser = store.signInEvents.find((ev) => ev.uid === uid);
    const latestMs = latestSameUser ? new Date(latestSameUser.timestamp).getTime() : 0;
    if (!latestMs || Date.now() - latestMs > 15000) {
      store.signInEvents.unshift({
        id: `signin_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        uid,
        displayName: record.displayName,
        email: record.email,
        phoneNumber: record.phoneNumber,
        provider: record.provider,
        timestamp: explicitLastLoginAt || now
      });
      store.signInEvents = store.signInEvents.slice(0, 500);
    }
  }

  return record;
}

// Public telemetry/login upsert for signed-in growers
app.post('/api/users/sync', (req, res) => {
  try {
    const store = readServerStore();
    const record = upsertSyncedUser(store, req.body || {});
    if (!record) {
      return res.status(400).json({ error: 'Valid grower uid is required.' });
    }
    writeServerStore(store);
    return res.json({ success: true, user: record });
  } catch (err) {
    console.error('Error in /api/users/sync:', err);
    return res.status(500).json({ error: 'Unable to sync grower profile right now.' });
  }
});

// Batch upsert for local device accounts or cloud backfill
app.post('/api/users/sync-batch', (req, res) => {
  try {
    const items = Array.isArray(req.body?.users) ? req.body.users.slice(0, 100) : [];
    const store = readServerStore();
    let syncedCount = 0;
    for (const item of items) {
      if (upsertSyncedUser(store, item)) {
        syncedCount += 1;
      }
    }
    if (syncedCount > 0) {
      writeServerStore(store);
    }
    return res.json({ success: true, syncedCount });
  } catch (err) {
    console.error('Error in /api/users/sync-batch:', err);
    return res.status(500).json({ error: 'Unable to batch sync grower profiles.' });
  }
});

// Submit AI Scanner bug / misdiagnosis report
app.post('/api/scan-reports', (req, res) => {
  try {
    const body = req.body || {};
    const reporterName = cleanStr(body.reporterName, 120);
    const diagnosisId = cleanStr(body.diagnosisId, 80);
    const diagnosisName = cleanStr(body.diagnosisName, 140);
    if (!reporterName || !diagnosisId || !diagnosisName) {
      return res.status(400).json({ error: 'Reporter name and scan diagnosis details are required.' });
    }

    const allowedIssues = new Set([
      'wrong_disease',
      'false_rejection',
      'human_or_object_error',
      'blur_quality',
      'other'
    ]);
    const issueType = allowedIssues.has(body.issueType) ? body.issueType : 'other';
    const authMode =
      body.authMode === 'firebase' || body.authMode === 'device' ? body.authMode : 'guest';
    const sourceType =
      body.sourceType === 'camera' || body.sourceType === 'upload' ? body.sourceType : 'sample';

    const now = new Date().toISOString();
    const id =
      cleanStr(body.id, 128).replace(/[^a-zA-Z0-9_-]/g, '') ||
      `rep_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const rawThumb = typeof body.thumbnailUrl === 'string' ? body.thumbnailUrl : '';
    const safeThumb =
      rawThumb.startsWith('data:image/') || rawThumb.startsWith('/') || rawThumb.startsWith('https://')
        ? rawThumb.slice(0, 180000)
        : undefined;

    const record: ScanReportRecord = {
      id,
      reporterUid: cleanStr(body.reporterUid, 128) || 'guest',
      reporterName,
      reporterEmail: cleanStr(body.reporterEmail, 320).toLowerCase(),
      reporterPhone: cleanStr(body.reporterPhone, 32),
      authMode,
      issueType,
      diagnosisId,
      diagnosisName,
      stage1Status: cleanStr(body.stage1Status, 40) || 'unknown',
      confidence: Number.isFinite(Number(body.confidence))
        ? Math.min(100, Math.max(0, Number(body.confidence)))
        : 0,
      sourceType,
      aiEngineUsed: cleanStr(body.aiEngineUsed, 80) || 'AgroVision AI',
      notes: cleanStr(body.notes, 1200),
      status: 'open',
      adminNote: '',
      ...(safeThumb ? { thumbnailUrl: safeThumb } : {}),
      createdAt: now,
      updatedAt: now
    };

    const store = readServerStore();
    store.reports.unshift(record);
    store.reports = store.reports.slice(0, 400);
    writeServerStore(store);

    return res.json({ success: true, report: record });
  } catch (err) {
    console.error('Error in /api/scan-reports:', err);
    return res.status(500).json({ error: 'Failed to submit scanner feedback report.' });
  }
});

// Check how admin panel should unlock in the current environment
app.get('/api/admin/status', (_req, res) => {
  const envPasscodeSet = Boolean((process.env.ADMIN_ACCESS_CODE || '').trim());
  const store = readServerStore();
  const claimedSet = Boolean(store.adminCredential?.hash);
  res.json({
    adminEmail: ADMIN_EMAIL,
    passcodeMode: envPasscodeSet ? 'env' : claimedSet ? 'claimed' : 'unclaimed'
  });
});

// One-time first-run admin setup when ADMIN_ACCESS_CODE is unset in preview
app.post('/api/admin/setup', (req, res) => {
  const envPasscode = (process.env.ADMIN_ACCESS_CODE || '').trim();
  if (envPasscode) {
    return res.status(409).json({
      error: 'Server ADMIN_ACCESS_CODE is already configured. Use Unlock with Passcode instead.'
    });
  }
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
  if (passcode.length < 6 || passcode.length > 120) {
    return res.status(400).json({ error: 'Choose an admin passcode between 6 and 120 characters.' });
  }
  const store = readServerStore();
  if (store.adminCredential?.hash) {
    return res.status(409).json({
      error: 'Admin passcode is already claimed. Please enter the configured passcode to unlock.'
    });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPasscodeWithSalt(passcode, salt);
  store.adminCredential = { salt, hash, claimedAt: new Date().toISOString() };
  writeServerStore(store);

  const token = createSignedAdminToken(`passcode:${ADMIN_EMAIL}`);
  return res.json({ success: true, token });
});

// Verify admin passcode and issue short-lived signed Bearer/x-admin-token
app.post('/api/admin/unlock', (req, res) => {
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
  if (!passcode) {
    return res.status(400).json({ error: 'Admin passcode is required.' });
  }

  const envPasscode = (process.env.ADMIN_ACCESS_CODE || '').trim();
  if (envPasscode) {
    if (!verifyEnvPasscodeConstantTime(passcode, envPasscode)) {
      return res.status(401).json({ error: 'Incorrect admin passcode.' });
    }
    const token = createSignedAdminToken(`env:${ADMIN_EMAIL}`);
    return res.json({ success: true, token });
  }

  const store = readServerStore();
  if (!store.adminCredential?.hash || !store.adminCredential?.salt) {
    return res.status(403).json({
      error: 'Admin passcode has not been claimed yet. Complete first-run setup first.'
    });
  }

  if (!verifyPasscodeConstantTime(passcode, store.adminCredential.hash, store.adminCredential.salt)) {
    return res.status(401).json({ error: 'Incorrect admin passcode.' });
  }

  const token = createSignedAdminToken(`claimed:${ADMIN_EMAIL}`);
  return res.json({ success: true, token });
});

// Protected Admin Dashboard aggregate payload
app.get('/api/admin/dashboard', async (req, res) => {
  const authCheck = await verifyAdminRequest(req);
  if (!authCheck.authorized) {
    return res.status(401).json({ error: 'Admin authorization required.' });
  }

  const store = readServerStore();
  const users = Object.values(store.users).sort(
    (a, b) => new Date(b.lastLoginAt || b.updatedAt).getTime() - new Date(a.lastLoginAt || a.updatedAt).getTime()
  );
  const reports = store.reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const stats = {
    totalUsers: users.length,
    usersWithPhone: users.filter((u) => Boolean(u.phoneNumber)).length,
    totalScansReported: users.reduce((acc, u) => acc + (u.scansCount || 0), 0),
    totalPlantsTracked: users.reduce((acc, u) => acc + (u.plantsCount || 0), 0),
    totalReports: reports.length,
    openReports: reports.filter((r) => r.status === 'open').length,
    signInEventsCount: store.signInEvents.length
  };

  return res.json({
    success: true,
    stats,
    users,
    reports,
    signInEvents: store.signInEvents
  });
});

// Protected Admin report triage endpoint
app.patch('/api/admin/reports/:id', async (req, res) => {
  const authCheck = await verifyAdminRequest(req);
  if (!authCheck.authorized) {
    return res.status(401).json({ error: 'Admin authorization required.' });
  }

  const reportId = cleanStr(req.params.id, 128);
  const nextStatus = req.body?.status;
  const adminNote = cleanStr(req.body?.adminNote, 600);

  const store = readServerStore();
  const target = store.reports.find((r) => r.id === reportId);
  if (!target) {
    return res.status(404).json({ error: 'Scan report not found.' });
  }

  if (nextStatus === 'open' || nextStatus === 'reviewed' || nextStatus === 'resolved') {
    target.status = nextStatus;
  }
  if (typeof req.body?.adminNote === 'string') {
    target.adminNote = adminNote;
  }
  target.updatedAt = new Date().toISOString();
  writeServerStore(store);

  return res.json({ success: true, report: target });
});

// Daily Pakistan Sabzi Mandi Tomato Wholesale Benchmark Rates
app.get('/api/mandi-rates', (_req, res) => {
  const now = new Date();
  const dateIso = now.toISOString().slice(0, 10);
  // Deterministic slight daily market fluctuation seeded by date so numbers stay consistent throughout a day
  const daySeed = Number(dateIso.replace(/-/g, '')) % 17;

  const markets = [
    {
      id: 'lahore_badami_bagh',
      cityEn: 'Lahore',
      cityUr: 'لاہور',
      mandiEn: 'Badami Bagh Sabzi Mandi',
      mandiUr: 'بادامی باغ سبزی منڈی',
      province: 'Punjab',
      crateKg: 20,
      minCratePkr: 1550 + daySeed * 25,
      maxCratePkr: 2150 + daySeed * 30,
      avgCratePkr: 1850 + daySeed * 25,
      changePercent: daySeed % 2 === 0 ? 4.2 : -2.1,
      grade: 'Grade A · Tunnel & Open Field',
      arrivalNoteEn: 'Steady arrivals from Sheikhupura, Gujranwala & Swat.',
      arrivalNoteUr: 'شیخوپورہ، گوجرانوالہ اور سوات سے متوازن آمد۔'
    },
    {
      id: 'karachi_super_highway',
      cityEn: 'Karachi',
      cityUr: 'کراچی',
      mandiEn: 'New Sabzi Mandi Super Highway',
      mandiUr: 'نئی سبزی منڈی سپر ہائی وے',
      province: 'Sindh',
      crateKg: 20,
      minCratePkr: 1450 + daySeed * 20,
      maxCratePkr: 2050 + daySeed * 25,
      avgCratePkr: 1750 + daySeed * 20,
      changePercent: -1.8,
      grade: 'Grade A · Lower Sindh Red',
      arrivalNoteEn: 'Strong supply from Thatta, Badin & Mirpurkhas.',
      arrivalNoteUr: 'ٹھٹھہ، بدین اور میرپورخاص سے وافر ترسیل۔'
    },
    {
      id: 'isb_rwp_i11',
      cityEn: 'Islamabad / Rwp',
      cityUr: 'اسلام آباد / راولپنڈی',
      mandiEn: 'I-11 Wholesale Fruit & Veg Market',
      mandiUr: 'آئی-11 ہول سیل سبزی منڈی',
      province: 'ICT / Punjab',
      crateKg: 20,
      minCratePkr: 1700 + daySeed * 25,
      maxCratePkr: 2350 + daySeed * 35,
      avgCratePkr: 2020 + daySeed * 30,
      changePercent: 5.4,
      grade: 'Grade A · Potohar & KP Hills',
      arrivalNoteEn: 'Firm buyer demand for firm breaker-stage crates.',
      arrivalNoteUr: 'مضبوط اور تازہ گلابی ٹماٹر پیٹیوں کی اچھی مانگ۔'
    },
    {
      id: 'multan_mandi',
      cityEn: 'Multan',
      cityUr: 'ملتان',
      mandiEn: 'Multan Sabzi Mandi',
      mandiUr: 'ملتان سبزی منڈی',
      province: 'South Punjab',
      crateKg: 20,
      minCratePkr: 1400 + daySeed * 20,
      maxCratePkr: 1950 + daySeed * 25,
      avgCratePkr: 1680 + daySeed * 20,
      changePercent: 1.5,
      grade: 'Grade A/B · Tunnel Roma',
      arrivalNoteEn: 'High-volume South Punjab tunnel Roma crates active.',
      arrivalNoteUr: 'جنوبی پنجاب ٹنل فارمنگ کے روما ٹماٹروں کی آمد جاری۔'
    },
    {
      id: 'faisalabad_mandi',
      cityEn: 'Faisalabad',
      cityUr: 'فیصل آباد',
      mandiEn: 'Ghulam Muhammad Abad Mandi',
      mandiUr: 'غلام محمد آباد سبزی منڈی',
      province: 'Central Punjab',
      crateKg: 20,
      minCratePkr: 1500 + daySeed * 20,
      maxCratePkr: 2080 + daySeed * 25,
      avgCratePkr: 1790 + daySeed * 20,
      changePercent: 2.8,
      grade: 'Grade A · Local Fresh',
      arrivalNoteEn: 'Morning auction stable for sorted 20 kg wooden crates.',
      arrivalNoteUr: 'صبح کی بولی میں صاف 20 کلو پیٹی کے ریٹ مستحکم رہے۔'
    },
    {
      id: 'peshawar_mandi',
      cityEn: 'Peshawar',
      cityUr: 'پشاور',
      mandiEn: 'Peshawar Sabzi Mandi (Inqilab Rd)',
      mandiUr: 'پشاور سبزی منڈی (انقلاب روڈ)',
      province: 'KP',
      crateKg: 20,
      minCratePkr: 1600 + daySeed * 25,
      maxCratePkr: 2220 + daySeed * 30,
      avgCratePkr: 1910 + daySeed * 25,
      changePercent: 3.1,
      grade: 'Grade A · KP / Swat Valley',
      arrivalNoteEn: 'Active dispatch from Dargai, Charsadda & Swat hills.',
      arrivalNoteUr: 'درگئی، چارسدہ اور سوات سے تازہ فصل کی فراہمی۔'
    },
    {
      id: 'quetta_mandi',
      cityEn: 'Quetta',
      cityUr: 'کوئٹہ',
      mandiEn: 'Quetta Hazar Ganji Sabzi Mandi',
      mandiUr: 'کوئٹہ ہزار گنجی سبزی منڈی',
      province: 'Balochistan',
      crateKg: 20,
      minCratePkr: 1500 + daySeed * 20,
      maxCratePkr: 2100 + daySeed * 30,
      avgCratePkr: 1800 + daySeed * 25,
      changePercent: -0.9,
      grade: 'Grade A · Upland Balochistan',
      arrivalNoteEn: 'Cool-climate upland crates holding longer shelf life.',
      arrivalNoteUr: 'ٹھنڈے علاقے کے ٹماٹر لمبی شیلف لائف کے باعث پسند کیے جا رہے ہیں۔'
    }
  ];

  res.json({
    success: true,
    updatedAt: now.toISOString(),
    dateLabel: dateIso,
    currency: 'PKR',
    unit: '20 kg Wholesale Crate',
    sourceNote: 'AMIS / Provincial Sabzi Mandi Benchmark Advisory',
    markets
  });
});

// Mount Vite middleware in development or serve static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))
      ? path.resolve(__dirname, 'dist')
      : path.resolve(__dirname, 'docs');

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgroVision AI server active at http://0.0.0.0:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting AgroVision server:', err);
  process.exit(1);
});
