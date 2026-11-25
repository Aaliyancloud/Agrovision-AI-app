import { TOMATO_DISEASES } from '../data/tomatoDiseases';
import type { GrowingSystemType, PakistanAgriRegion } from '../context/PreferencesContext';

export interface AdvisorInputContext {
  question: string;
  language: 'en' | 'ur';
  growerName?: string;
  latestScan?: {
    diseaseId?: string;
    diseaseName: string;
    confidence: number;
    severity: string;
    summary: string;
    organicTreatment?: string[];
  };
  soilContext?: {
    moistureEnabled: boolean;
    moisturePercent: number;
    phEnabled: boolean;
    soilPh: number;
    regionName?: string;
  };
  weatherContext?: {
    location: string;
    tempC: number;
    humidity: number;
    riskLevel: string;
    watchCondition: string;
  };
  activePlant?: {
    name: string;
    stage: string;
    healthStatus: string;
    cultivar: string;
  };
  preferredRegion?: PakistanAgriRegion;
  growingSystem?: GrowingSystemType;
}

interface AdvisoryTopic {
  id: string;
  keywords: string[];
  replyEn: (ctx: AdvisorInputContext) => string;
  replyUr: (ctx: AdvisorInputContext) => string;
}

function buildContextBanner(ctx: AdvisorInputContext): string {
  const lines: string[] = [];
  if (ctx.language === 'ur') {
    if (ctx.latestScan) {
      lines.push(
        `آخری اسکین: ${ctx.latestScan.diseaseName} (${ctx.latestScan.confidence}% · شدت: ${ctx.latestScan.severity})`
      );
    }
    if (ctx.soilContext) {
      const m = ctx.soilContext.moistureEnabled ? `${ctx.soilContext.moisturePercent}%` : 'بند';
      const p = ctx.soilContext.phEnabled ? ctx.soilContext.soilPh.toFixed(1) : 'بند';
      lines.push(`مٹی کی صورتحال: نمی ${m} · پی ایچ ${p}`);
    }
    if (ctx.weatherContext) {
      lines.push(
        `موسم (${ctx.weatherContext.location}): ${ctx.weatherContext.tempC}°C · نمی ${ctx.weatherContext.humidity}%`
      );
    }
  } else {
    if (ctx.latestScan) {
      lines.push(
        `Latest Scan: ${ctx.latestScan.diseaseName} (${ctx.latestScan.confidence}% · ${ctx.latestScan.severity})`
      );
    }
    if (ctx.soilContext) {
      const m = ctx.soilContext.moistureEnabled ? `${ctx.soilContext.moisturePercent}%` : 'Probe off';
      const p = ctx.soilContext.phEnabled ? ctx.soilContext.soilPh.toFixed(1) : 'Probe off';
      lines.push(`Soil Context: Moisture ${m} · pH ${p}`);
    }
    if (ctx.weatherContext) {
      lines.push(
        `Weather (${ctx.weatherContext.location}): ${ctx.weatherContext.tempC}°C · ${ctx.weatherContext.humidity}% RH`
      );
    }
  }
  return lines.length > 0 ? lines.join('\n') : '';
}

function formatDiseaseSteps(diseaseIdOrName: string, isUrdu: boolean): string | null {
  const lower = diseaseIdOrName.toLowerCase();
  const matched = TOMATO_DISEASES.find(
    (d) =>
      d.id === lower ||
      d.name.toLowerCase().includes(lower) ||
      lower.includes(d.id.replace(/_/g, ' '))
  );
  if (!matched) return null;

  if (isUrdu) {
    return [
      `تشخیص: ${matched.name} (${matched.scientificName})`,
      `خلاصہ: ${matched.description}`,
      `اہم عملی اقدامات:`,
      ...matched.treatment.organic.slice(0, 3).map((s, idx) => `${idx + 1}. ${s}`),
      `حفاظتی احتیاط: ${matched.treatment.cultural[0] || matched.treatment.prevention[0] || 'پتوں کے درمیان ہوا کا گزر رکھیں۔'}`
    ].join('\n');
  }

  return [
    `Condition: ${matched.name} (${matched.scientificName})`,
    `Overview: ${matched.description}`,
    `Field Action Plan:`,
    ...matched.treatment.organic.slice(0, 3).map((s, idx) => `${idx + 1}. ${s}`),
    `Cultural Prevention: ${matched.treatment.cultural[0] || matched.treatment.prevention[0] || 'Improve spacing and water at root level before 10 AM.'}`
  ].join('\n');
}

const REGION_NAMES: Record<PakistanAgriRegion, { en: string; ur: string; windowEn: string; windowUr: string }> = {
  punjab_central: {
    en: 'Central Punjab (Lahore / Faisalabad / Sahiwal)',
    ur: 'وسطی پنجاب (لاہور / فیصل آباد / ساہیوال)',
    windowEn: 'Spring open-field transplant: Feb–Mar; Autumn crop: Aug–Sep; Walk-in plastic tunnel: Nov–Jan.',
    windowUr: 'موسم بہار کھلا کھیت: فروری تا مارچ؛ خزاں: اگست تا ستمبر؛ پلاسٹک ٹنل: نومبر تا جنوری۔'
  },
  punjab_south: {
    en: 'South Punjab (Multan / Bahawalpur / Muzaffargarh)',
    ur: 'جنوبی پنجاب (ملتان / بہاولپور / مظفرگڑھ)',
    windowEn: 'Tunnel nursery: Sep–Oct for Nov–Apr harvest; shade net essential after April above 36°C.',
    windowUr: 'ٹنل پنیری: ستمبر تا اکتوبر؛ اپریل کے بعد 36°C سے زیادہ گرمی میں سبز جالی کا سایہ ضروری ہے۔'
  },
  sindh_lower: {
    en: 'Lower Sindh (Thatta / Badin / Mirpurkhas / Hyderabad)',
    ur: 'زیریں سندھ (ٹھٹھہ / بدین / میرپورخاص / حیدرآباد)',
    windowEn: 'Main winter crop transplant: Oct–Nov for Jan–Apr mandi supply; watch whitefly early.',
    windowUr: 'اہم سردیوں کی فصل: اکتوبر تا نومبر منتقلی؛ سفید مکھی کی نگرانی شروع دنوں میں رکھیں۔'
  },
  potohar: {
    en: 'Potohar & Islamabad (Rawalpindi / Chakwal / Attock)',
    ur: 'پوٹھوہار اور اسلام آباد (راولپنڈی / چکوال / اٹک)',
    windowEn: 'Spring transplant: late Feb–Mar; Frost cover needed Dec–Jan.',
    windowUr: 'بہار کی منتقلی: فروری کے آخر تا مارچ؛ دسمبر جنوری میں پالے سے بچاؤ ضروری ہے۔'
  },
  kp_swat: {
    en: 'KP Mid-Hills & Swat (Swat / Mingora / Mansehra)',
    ur: 'خیبر پختونخوا و سوات (سوات / مینگورہ / مانسہرہ)',
    windowEn: 'Off-season summer crop: Mar–Apr nursery, harvest Jul–Oct when plains fetch peak mandi rates.',
    windowUr: 'آف سیزن گرمیوں کی فصل: مارچ اپریل پنیری، جولائی تا اکتوبر تڑائی جب منڈی ریٹ عروج پر ہوتے ہیں۔'
  }
};

const ADVISORY_TOPICS: AdvisoryTopic[] = [
  {
    id: 'latest_scan',
    keywords: [
      'latest scan',
      'my scan',
      'explain my scan',
      'last result',
      'report',
      'اسکین',
      'نتیجہ',
      'رپورٹ',
      'آخری',
      'explain'
    ],
    replyEn: (ctx) => {
      if (!ctx.latestScan) {
        return 'You do not have a recent leaf scan attached yet. Open the Scanner tab, capture or upload a clear daylight photo of the affected leaf, and I will break down the exact care steps.';
      }
      const matchedText = formatDiseaseSteps(
        ctx.latestScan.diseaseId || ctx.latestScan.diseaseName,
        false
      );
      const customSteps =
        ctx.latestScan.organicTreatment && ctx.latestScan.organicTreatment.length > 0
          ? ctx.latestScan.organicTreatment.map((s, i) => `${i + 1}. ${s}`).join('\n')
          : null;
      return [
        `Scan Summary: ${ctx.latestScan.diseaseName} (${ctx.latestScan.confidence}% match · ${ctx.latestScan.severity} severity).`,
        ctx.latestScan.summary,
        customSteps ? `Recommended Steps:\n${customSteps}` : matchedText || '',
        ctx.soilContext?.moistureEnabled && ctx.soilContext.moisturePercent > 72
          ? `Soil Note: Moisture is currently high (${ctx.soilContext.moisturePercent}%). Hold irrigation for 24–36 hours to slow fungal spread.`
          : 'Field Tip: Remove severely spotted bottom leaves into a sealed bag and avoid overhead evening watering.'
      ]
        .filter(Boolean)
        .join('\n\n');
    },
    replyUr: (ctx) => {
      if (!ctx.latestScan) {
        return 'ابھی کوئی حالیہ اسکین منسلک نہیں ہے۔ اسکینر کھول کر دن کی روشنی میں متاثرہ پتے کی صاف تصویر لیں، پھر میں مکمل رہنمائی دوں گا۔';
      }
      const customSteps =
        ctx.latestScan.organicTreatment && ctx.latestScan.organicTreatment.length > 0
          ? ctx.latestScan.organicTreatment.map((s, i) => `${i + 1}. ${s}`).join('\n')
          : formatDiseaseSteps(ctx.latestScan.diseaseId || ctx.latestScan.diseaseName, true) || '';
      return [
        `آخری اسکین کا خلاصہ: ${ctx.latestScan.diseaseName} (${ctx.latestScan.confidence}% مطابقت · شدت: ${ctx.latestScan.severity})۔`,
        ctx.latestScan.summary,
        customSteps ? `فوری اقدامات:\n${customSteps}` : '',
        ctx.soilContext?.moistureEnabled && ctx.soilContext.moisturePercent > 72
          ? `مٹی الرٹ: اس وقت نمی زیادہ (${ctx.soilContext.moisturePercent}%) ہے۔ 1 سے 2 دن پانی روک دیں۔`
          : 'فیلڈ مشورہ: شدید متاثرہ نچلے پتے توڑ کر کھیت سے دور تلف کریں اور شام کو پتوں پر پانی نہ ڈالیں۔'
      ]
        .filter(Boolean)
        .join('\n\n');
    }
  },
  {
    id: 'early_late_blight',
    keywords: [
      'blight',
      'alternaria',
      'phytophthora',
      'brown spot',
      'bullseye',
      'target ring',
      'jhulsa',
      'jhulsao',
      'بلائیٹ',
      'جھلساؤ',
      'بھورے دھبے',
      'دھبے',
      'سیاہ داغ'
    ],
    replyEn: (ctx) => {
      const humidAlert =
        ctx.weatherContext && ctx.weatherContext.humidity >= 75
          ? `Current humidity (${ctx.weatherContext.humidity}%) favors blight spores—treat within 24 hours.`
          : 'Scout lower leaves every 48 hours after morning dew dries.';
      return [
        'Early vs. Late Blight Field Guide:',
        '• Early Blight: Dry dark-brown target-board rings with a yellow halo starting on oldest bottom leaves.',
        '• Late Blight: Dark bruised wet patches on upper leaves/stems with pale cottony mold underneath after damp nights.',
        'Action Plan:',
        '1. Snip infected bottom leaves into a sealed bag (never leave on soil or compost).',
        '2. Mix 5 ml Neem Oil + 2 ml mild soap per 1 Liter water for mild Early Blight, or 2–2.5 g Copper Oxychloride per Liter before wet weather.',
        '3. Spread 5 cm dry wheat straw mulch so root irrigation never splashes mud onto leaves.',
        humidAlert
      ].join('\n');
    },
    replyUr: (ctx) => {
      const humidAlert =
        ctx.weatherContext && ctx.weatherContext.humidity >= 75
          ? `اس وقت ہوا میں نمی (${ctx.weatherContext.humidity}%) زیادہ ہے جو جھلساؤ پھیلا سکتی ہے—آج ہی احتیاطی اسپرے کریں۔`
          : 'صبح شبنم سوکھنے کے بعد ہر دوسرے دن نچلے پتے ضرور دیکھیں۔';
      return [
        'ارلی اور لیٹ بلائیٹ (جھلساؤ) کی پہچان و علاج:',
        '• ارلی بلائیٹ: نچلے پرانے پتوں پر گول خشک بھورے دائرے جن کے گرد پیلا ہالہ ہوتا ہے۔',
        '• لیٹ بلائیٹ: اوپری پتوں اور تنے پر گیلے سیاہ دھبے اور نیچے سفید روئی جیسی تہہ۔',
        'عملی اقدامات:',
        '1. خراب نچلے پتے توڑ کر شاپر میں بند کر کے کھیت سے دور تلف کریں۔',
        '2. فی لیٹر پانی میں 5 ملی لیٹر نیم کا تیل + چند قطرے صابن (یا شدید نمی میں 2.5 گرام کاپر آکسی کلورائیڈ فی لیٹر) صبح اسپرے کریں۔',
        '3. جڑوں کے گرد خشک بھوسا بچھائیں تاکہ پانی کے چھینٹے پتوں پر نہ لگیں۔',
        humidAlert
      ].join('\n');
    }
  },
  {
    id: 'yellow_leaves',
    keywords: [
      'yellow',
      'peela',
      'pila',
      'chlorosis',
      'pale',
      'پیلے',
      'پیلا',
      'پیلاہٹ',
      'نچلے پتے'
    ],
    replyEn: (ctx) => {
      const phNote =
        ctx.soilContext?.phEnabled && (ctx.soilContext.soilPh < 5.8 || ctx.soilContext.soilPh > 7.2)
          ? `Note: Your soil probe shows pH ${ctx.soilContext.soilPh.toFixed(1)}, outside the 6.0–6.8 range—nutrients lock up quickly in alkaline soil.`
          : 'Target soil pH is 6.0–6.8 for smooth nutrient uptake.';
      return [
        'Why Lower Tomato Leaves Turn Yellow:',
        '1. Overwatering / Poor Drainage (most common): Uniform yellowing with soft drooping stems—pause watering until topsoil (3–4 cm deep) feels just moist.',
        '2. Early Blight or Septoria: Yellow patches containing tiny dark or gray-centered dots—prune affected leaves and apply protective neem/copper spray.',
        '3. Nitrogen or Magnesium Deficiency: Bottom leaves fade evenly pale green/yellow while top leaves remain small—top-dress 2 handfuls well-rotted cow-dung compost or balanced NPK foliar.',
        phNote
      ].join('\n');
    },
    replyUr: () =>
      [
        'ٹماٹر کے نچلے پتے پیلے ہونے کی 3 بڑی وجوہات اور حل:',
        '1. زیادہ پانی یا سخت زمین: اگر پورا پتا نرم ہو کر پیلا پڑ رہا ہے تو 2 دن پانی روکیں اور جڑوں کے گرد ہلکی گوڈی کریں۔',
        '2. ارلی بلائیٹ / سیپٹوریا: اگر پیلے دھبے کے اندر سیاہ یا سرمئی نقطے ہوں تو متاثرہ پتے اتار کر نیم یا کاپر اسپرے کریں۔',
        '3. نائٹروجن یا خوراک کی کمی: پرانی گلی سڑی گوبر کھاد یا متوازن این پی کے کا ہلکا استعمال کریں۔ مٹی کا پی ایچ 6.0 تا 6.8 کے درمیان رکھیں۔'
      ].join('\n')
  },
  {
    id: 'whitefly_curl_virus',
    keywords: [
      'curl',
      'virus',
      'whitefly',
      'makhi',
      'safed',
      'tylcv',
      'maror',
      'پتہ مروڑ',
      'مڑ',
      'مروڑ',
      'سفید مکھی',
      'وائرس',
      'کیڑے'
    ],
    replyEn: () =>
      [
        'Tomato Leaf Curl Virus & Whitefly Control:',
        '• Important Fact: Once viral curl enters plant sap, fungicides cannot reverse infected leaves—stopping whiteflies early protects every healthy plant around it.',
        '1. Hang bright yellow sticky traps 10 cm above the canopy (12–15 traps/acre) to monitor and catch whiteflies.',
        '2. Spray leaf undersides early morning with 5 ml cold-pressed neem oil + 2 ml soap per 1 Liter water every 5–7 days.',
        '3. Keep field borders clean of broadleaf weeds for 3 meters and rogue/bag severely stunted early seedlings immediately.',
        '4. For next nursery cycle, cover beds with 50-mesh insect net.'
      ].join('\n'),
    replyUr: () =>
      [
        'پتہ مروڑ وائرس (TYLCV) اور سفید مکھی کا کنٹرول:',
        '• اہم اصول: وائرس کا کوئی فنگس اسپرے نہیں ہوتا—سفید مکھی کو روکنا ہی فصل بچانے کا اصل حل ہے۔',
        '1. پودوں کی اونچائی پر پیلے چپچپے کارڈ (Yellow Sticky Traps) لگائیں۔',
        '2. ہر 5 سے 7 دن بعد صبح سویرے پتوں کے نیچے 5 ملی لیٹر نیم کا تیل + چند قطرے صابن فی لیٹر پانی اسپرے کریں۔',
        '3. کھیت کی منڈیروں سے جڑی بوٹیاں صاف رکھیں اور بالکل شروع میں شدید مڑے ہوئے پودے شاپر میں نکال دیں۔',
        '4. اگلی پنیری کے لیے 50 میش باریک جالی ضرور استعمال کریں۔'
      ].join('\n')
  },
  {
    id: 'spray_tanki_neem_copper',
    keywords: [
      'spray',
      'tanki',
      'neem',
      'copper',
      'dose',
      'dosage',
      'fungicide',
      'pesticide',
      'fake',
      'asl',
      'nakli',
      'اسپرے',
      'ٹینکی',
      'خوراک',
      'نیم',
      'کاپر',
      'دوائی',
      'نقلی'
    ],
    replyEn: () =>
      [
        'Standard Knapsack Tanki Guide & Spray Safety:',
        '• 16L Tanki (Standard Pump): 80 ml Cold-Pressed Neem Oil (5 ml/L) + 30 ml mild surfactant, OR 35–40 g Copper Oxychloride (2–2.5 g/L).',
        '• 20L Tanki: 100 ml Neem Oil + 40 ml surfactant, OR 45–50 g Copper Oxychloride.',
        '• Timing: Always spray between 6:30–9:30 AM or 5:00–6:30 PM—never in blazing midday sun (>34°C).',
        '• Anti-Fake Check: Buy only from registered dealers with a printed bill, verify intact foil seal under the cap, check batch/expiry, and scan Pest Warning QR codes.',
        'Need exact Kanal/Acre calculations? Open the Market & Tools tab -> Spray Tanki Calculator.'
      ].join('\n'),
    replyUr: () =>
      [
        'اسپرے ٹینکی خوراک اور اصلی دوا کی تصدیق:',
        '• 16 لیٹر ٹینکی: 80 ملی لیٹر خالص نیم کا تیل + 30 ملی لیٹر نرم صابن، یا حفاظتی اسپرے کے لیے 35–40 گرام کاپر آکسی کلورائیڈ۔',
        '• 20 لیٹر ٹینکی: 100 ملی لیٹر نیم کا تیل، یا 45–50 گرام کاپر آکسی کلورائیڈ۔',
        '• وقت: صرف صبح سویرے (6:30 تا 9:30) یا شام (5:00 تا 6:30) ہلکی ہوا میں اسپرے کریں—تیز دھوپ میں اسپرے سے پتے جل سکتے ہیں۔',
        '• نقلی دوا سے بچاؤ: ہمیشہ رجسٹرڈ ڈیلر سے پکی رسید لیں، ڈھکن کے نیچے اصل مہر، بیچ نمبر اور زائد المیعاد تاریخ چیک کریں۔ تفصیلی حساب کے لیے Market & Tools ٹیب میں ٹینکی کیلکولیٹر کھولیں۔'
      ].join('\n')
  },
  {
    id: 'soil_water_ber',
    keywords: [
      'water',
      'irrigation',
      'soil',
      'ph',
      'moisture',
      'fertilizer',
      'compost',
      'calcium',
      'blossom',
      'black bottom',
      'paani',
      'matti',
      'khaad',
      'پانی',
      'آبپاشی',
      'مٹی',
      'کھاد',
      'نمی',
      'پی ایچ',
      'کیلشیم',
      'نچلا سرا'
    ],
    replyEn: (ctx) => {
      const mVal = ctx.soilContext?.moistureEnabled
        ? `${ctx.soilContext.moisturePercent}%`
        : 'not probed';
      const pVal = ctx.soilContext?.phEnabled ? ctx.soilContext.soilPh.toFixed(1) : 'not probed';
      return [
        `Soil, Irrigation & Calcium Care (Current Moisture: ${mVal}, Soil pH: ${pVal}):`,
        '• Best Irrigation Window: Water slowly at soil ridges before 10:00 AM—target 45–65% moisture like a wrung sponge.',
        '• Preventing Black Fruit Bottoms (Blossom End Rot): Uneven drought-then-flood cycles block calcium from reaching green tomatoes. Lay 5 cm dry straw mulch to stabilize moisture.',
        '• Balanced Feeding: Use aged cow-dung compost every 3 weeks; once first yellow flowers open, avoid excess urea/nitrogen and prioritize potash & calcium.'
      ].join('\n');
    },
    replyUr: (ctx) => {
      const mVal = ctx.soilContext?.moistureEnabled
        ? `${ctx.soilContext.moisturePercent}%`
        : 'بند';
      const pVal = ctx.soilContext?.phEnabled ? ctx.soilContext.soilPh.toFixed(1) : 'بند';
      return [
        `مٹی، آبپاشی اور کھاد کی رہنمائی (حالیہ نمی: ${mVal} · پی ایچ: ${pVal}):`,
        '• پانی کا بہترین وقت: صبح 10 بجے سے پہلے کھیلیوں کی نالی میں آہستہ پانی دیں (ہدف نمی 45–65%)۔ شام کو پتوں پر پانی بالکل نہ ڈالیں۔',
        '• ٹماٹر کا نچلا سرا کالا ہونے سے بچاؤ: کبھی زمین بالکل خشک اور کبھی سیلاب جیسا پانی دینے سے پھل تک کیلشیم نہیں پہنچتا۔ پودوں کے گرد خشک بھوسے کی ملچنگ کریں۔',
        '• کھاد کا توازن: پھول آنے پر زیادہ یوریا روک کر پوٹاش اور کیلشیم والی متوازن کھاد استعمال کریں۔'
      ].join('\n');
    }
  },
  {
    id: 'pakistan_mandi_season',
    keywords: [
      'mandi',
      'rate',
      'price',
      'market',
      'crate',
      'peti',
      'tunnel',
      'season',
      'heat',
      'frost',
      'lahore',
      'karachi',
      'multan',
      'swat',
      'sindh',
      'punjab',
      'منڈی',
      'ریٹ',
      'قیمت',
      'ٹنل',
      'موسم',
      'گرمی',
      'پیٹی'
    ],
    replyEn: (ctx) => {
      const reg = REGION_NAMES[ctx.preferredRegion || 'punjab_central'];
      return [
        `Pakistan Seasonal & Mandi Advisory (${reg.en}):`,
        `• Regional Window: ${reg.windowEn}`,
        '• Heatwave Protection (>35°C): Pollen becomes sticky and flowers drop—irrigate before 7:30 AM and drape 30% green shade net during afternoon heat.',
        '• Mandi Grading Tip: Harvest tomatoes at pink-red breaker stage before 9 AM with stems attached and pack firm Grade-A fruit separately in 20 kg crates for 15–20% better wholesale price.',
        'Check today’s city-by-city Sabzi Mandi rates in the Market & Tools tab.'
      ].join('\n');
    },
    replyUr: (ctx) => {
      const reg = REGION_NAMES[ctx.preferredRegion || 'punjab_central'];
      return [
        `پاکستان موسمی اور منڈی رہنمائی (${reg.ur}):`,
        `• کاشت کا وقت: ${reg.windowUr}`,
        '• شدید گرمی (35°C+) میں حفاظت: صبح 7:30 سے پہلے پانی دیں اور دوپہر کو 30% سبز جالی کا سایہ فراہم کریں تاکہ پھول نہ گریں۔',
        '• منڈی میں بہتر ریٹ کا اصول: صبح ٹھنڈے وقت گلابی-سرخ مرحلے پر تڑائی کریں اور 20 کلو پیٹی میں گریڈ اے الگ پیک کریں۔',
        'تازہ ترین شہر وار سبزی منڈی ریٹس کے لیے Market & Tools ٹیب کھولیں۔'
      ].join('\n')
    }
  },
  {
    id: 'helpline_contact',
    keywords: ['helpline', 'number', 'phone', 'officer', 'parc', 'narc', 'ہیلپ لائن', 'نمبر', 'فون', 'زرعی افسر'],
    replyEn: () =>
      [
        'Verified Pakistan Agricultural Extension Helplines:',
        '• Punjab Agriculture Helpline (Toll-Free): 0800-17000',
        '• PARC / NARC Islamabad Information: +92 51 90733800',
        '• Emergency Pest Warning: Visit your nearest Tehsil Agriculture Extension / Pest Warning office with a fresh leaf sample and sealed chemical bottle if verifying counterfeit inputs.',
        'See the full directory and Anti-Fake Verification checklist inside Learn & Atlas.'
      ].join('\n'),
    replyUr: () =>
      [
        'پاکستان کے تصدیق شدہ زرعی ہیلپ لائن نمبرز:',
        '• محکمہ زراعت پنجاب ہیلپ لائن (مفت کال): 0800-17000',
        '• این اے آر سی / پی اے آر سی اسلام آباد: 90733800-051',
        '• قریبی تحصیل زرعی آفس: شدید وبائی علامات یا جعلی زرعی دوا کے شک پر متاثرہ پتا اور دوا کی رسید لے کر محکمہ پیسٹ وارننگ سے رابطہ کریں۔',
        'مکمل فہرست Learn & Atlas ٹیب میں دستیاب ہے۔'
      ].join('\n')
  },
  {
    id: 'greeting',
    keywords: ['salam', 'assalam', 'hello', 'hi', 'hey', 'slam', 'اسلام', 'سلام', 'کیسے', 'ہائے'],
    replyEn: (ctx) =>
      `Wa-Alaikum-Assalam${ctx.growerName ? ` ${ctx.growerName}` : ''}! Ready to help with your tomato field. Ask me about yellow leaves, early/late blight, whiteflies, spray tanki dosage, soil pH/watering, or Pakistan Sabzi Mandi rates.`,
    replyUr: (ctx) =>
      `وعلیکم السلام${ctx.growerName ? ` ${ctx.growerName}` : ''}! میں آپ کے ٹماٹر کھیت کی رہنمائی کے لیے حاضر ہوں۔ آپ مجھ سے پیلے پتوں، جھلساؤ، سفید مکھی، اسپرے ٹینکی خوراک، مٹی کی نمی یا منڈی ریٹس کے بارے میں پوچھ سکتے ہیں۔`
  }
];

export function generateAgronomicReply(ctx: AdvisorInputContext): string {
  const q = ctx.question.trim().toLowerCase();
  const isUrdu = ctx.language === 'ur' || /[\u0600-\u06FF]/.test(ctx.question);
  const effectiveCtx: AdvisorInputContext = { ...ctx, language: isUrdu ? 'ur' : 'en' };

  const contextBanner = buildContextBanner(effectiveCtx);

  // 1. Score all matching topics by keyword hits
  let bestTopic: AdvisoryTopic | null = null;
  let bestScore = 0;

  for (const topic of ADVISORY_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (q.includes(kw)) {
        score += kw.length > 5 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  if (bestTopic && bestScore > 0) {
    const body = effectiveCtx.language === 'ur' ? bestTopic.replyUr(effectiveCtx) : bestTopic.replyEn(effectiveCtx);
    return contextBanner && bestTopic.id !== 'greeting'
      ? `${body}\n\n[${contextBanner}]`
      : body;
  }

  // 2. Check specific disease names directly
  const directDisease = TOMATO_DISEASES.find(
    (d) =>
      q.includes(d.id.replace(/_/g, ' ')) ||
      q.includes(d.name.toLowerCase()) ||
      q.includes(d.scientificName.toLowerCase())
  );
  if (directDisease) {
    const details = formatDiseaseSteps(directDisease.id, effectiveCtx.language === 'ur');
    if (details) {
      return contextBanner ? `${details}\n\n[${contextBanner}]` : details;
    }
  }

  // 3. Smart contextual fallback grounded in latest scan + soil + weather (never returns an error!)
  if (effectiveCtx.language === 'ur') {
    const scanAdvice = effectiveCtx.latestScan
      ? `آپ کے آخری اسکین (${effectiveCtx.latestScan.diseaseName}) کے مطابق متاثرہ نچلے پتے صاف کر کے صبح کے وقت نیم یا حفاظتی کاپر اسپرے کریں۔`
      : 'بہتر تشخیص کے لیے متاثرہ پتے کی دن کی روشنی میں تصویر لے کر لیف اسکینر میں چیک کریں۔';

    return [
      `آپ کے سوال کے لیے فوری زرعی رہنمائی:`,
      scanAdvice,
      `• روزانہ معائنہ: صبح 7 سے 10 بجے کے درمیان نیچے کے پرانے 3 پتے پلٹ کر دیکھیں۔`,
      `• آبپاشی اصول: پانی ہمیشہ صبح جڑوں میں دیں تاکہ رات تک پتے خشک رہیں۔`,
      `مزید واضح جواب کے لیے بیماری کا نام یا علامت لکھیں (مثلاً: سفید مکھی، جھلساؤ، ٹینکی خوراک، پیلے پتے، منڈی ریٹ)۔`,
      contextBanner ? `[${contextBanner}]` : ''
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  const scanAdviceEn = effectiveCtx.latestScan
    ? `Based on your attached scan (${effectiveCtx.latestScan.diseaseName}, ${effectiveCtx.latestScan.confidence}%), remove heavily spotted bottom leaves into a bag and apply morning neem or protective copper spray.`
    : 'For exact visual diagnosis, capture a crisp daylight close-up of a single affected leaf in the Leaf Scanner tab.';

  return [
    `Practical Tomato Agronomy Guidance:`,
    scanAdviceEn,
    `• Morning Check: Inspect the bottom 2–3 leaves between 7–10 AM when spots first appear.`,
    `• Irrigation Rule: Water slowly at root soil before 10 AM and keep foliage dry overnight.`,
    `Ask specifically about blight spots, yellowing leaves, whitefly curl, blossom-end rot, spray tanki dosage, or Pakistan mandi rates for tailored numbers.`,
    contextBanner ? `[${contextBanner}]` : ''
  ]
    .filter(Boolean)
    .join('\n\n');
}
