import express from 'express';
import compression from 'compression';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
  const msg = typeof err?.message === 'string' ? err.message : '';
  return (
    status === 429 ||
    status === 503 ||
    status === 'UNAVAILABLE' ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('429')
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
      const delayMs = 600 * Math.pow(2, attempt);
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

    const prompt = `You are the lead botanical computer-vision pathologist for AgroVision AI.
Analyze this image with extreme scientific precision. Follow these strict rules:

1. FIRST GATEKEEPER - LEAF VERIFICATION:
Determine if this image actually contains a botanical plant leaf.
If the image shows a human person, clothing, skin, room, furniture, an animal, or non-plant object:
- is_plant_leaf: false
- non_plant_reason: Clearly describe what you see.
- is_tomato_leaf: false
- disease_id: "none"
- disease_name: "Non-Plant Detected"

2. SECOND GATEKEEPER - SPECIES IDENTIFICATION:
If it IS a plant leaf, verify if it belongs to tomato (Solanum lycopersicum):
- If Mango, Neem, or another non-tomato plant: set is_tomato_leaf: false, plant_species, species_scientific.
- If Tomato leaf: set is_tomato_leaf: true, plant_species: "Tomato Leaf", species_scientific: "Solanum lycopersicum".

3. THIRD STAGE - PATHOLOGY CLASSIFICATION (Only if is_tomato_leaf is true):
Classify into one of:
"healthy" | "early_blight" | "late_blight" | "bacterial_spot" | "septoria_leaf_spot" | "yellow_leaf_curl" | "leaf_mold" | "mosaic_virus" | "target_spot" | "spider_mites"${sensorContextPrompt}

Return ONLY valid JSON:
{
  "is_plant_leaf": boolean,
  "non_plant_reason": string or null,
  "is_tomato_leaf": boolean,
  "plant_species": string,
  "species_scientific": string,
  "disease_id": string,
  "disease_name": string,
  "pathogen_type": "Fungal" | "Bacterial" | "Viral" | "Pest" | "Healthy" | "None",
  "confidence": number,
  "severity": "None" | "Mild" | "Moderate" | "Severe",
  "lesion_coverage_percent": number,
  "primary_symptoms": string[],
  "organic_treatment": string[],
  "chemical_treatment": string[],
  "cultural_prevention": string[],
  "lesion_boxes": [
    { "x": number, "y": number, "width": number, "height": number, "label": string, "confidence": number }
  ]
}`;

    let usedModel = 'gemini-4-hydrogen';
    let response;
    try {
      response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
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
            responseMimeType: 'application/json'
          }
        })
      );
    } catch (primaryErr: any) {
      if (!isTransientHighDemandError(primaryErr)) throw primaryErr;
      usedModel = 'gemini-3.1-flash-lite';
      response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
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
            responseMimeType: 'application/json'
          }
        })
      , 1);
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
    return res.status(502).json({
      error: extractGeminiErrorMessage(error, 'Failed to process leaf with Gemini vision model'),
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
