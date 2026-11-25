import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  CalendarDays,
  Droplets,
  MapPin,
  RefreshCw,
  Search,
  Sprout,
  Store,
  TrendingDown,
  TrendingUp,
  WifiOff
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  GrowingSystemType,
  PakistanAgriRegion,
  usePreferences
} from '../context/PreferencesContext';

interface MandiMarketItem {
  id: string;
  cityEn: string;
  cityUr: string;
  mandiEn: string;
  mandiUr: string;
  province: string;
  crateKg: number;
  minCratePkr: number;
  maxCratePkr: number;
  avgCratePkr: number;
  changePercent: number;
  grade: string;
  arrivalNoteEn: string;
  arrivalNoteUr: string;
}

interface MandiPayload {
  updatedAt: string;
  dateLabel: string;
  sourceNote: string;
  markets: MandiMarketItem[];
}

const MANDI_CACHE_KEY = 'agrovision_mandi_cache_v1';

const FALLBACK_MANDI_DATA: MandiPayload = {
  updatedAt: new Date().toISOString(),
  dateLabel: new Date().toISOString().slice(0, 10),
  sourceNote: 'Cached Provincial Sabzi Mandi Benchmark',
  markets: [
    {
      id: 'lahore_badami_bagh',
      cityEn: 'Lahore',
      cityUr: 'لاہور',
      mandiEn: 'Badami Bagh Sabzi Mandi',
      mandiUr: 'بادامی باغ سبزی منڈی',
      province: 'Punjab',
      crateKg: 20,
      minCratePkr: 1650,
      maxCratePkr: 2250,
      avgCratePkr: 1950,
      changePercent: 3.4,
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
      minCratePkr: 1520,
      maxCratePkr: 2100,
      avgCratePkr: 1810,
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
      minCratePkr: 1780,
      maxCratePkr: 2420,
      avgCratePkr: 2100,
      changePercent: 4.8,
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
      minCratePkr: 1480,
      maxCratePkr: 2020,
      avgCratePkr: 1750,
      changePercent: 1.5,
      grade: 'Grade A/B · Tunnel Roma',
      arrivalNoteEn: 'High-volume South Punjab tunnel Roma crates active.',
      arrivalNoteUr: 'جنوبی پنجاب ٹنل فارمنگ کے روما ٹماٹروں کی آمد جاری۔'
    },
    {
      id: 'peshawar_mandi',
      cityEn: 'Peshawar',
      cityUr: 'پشاور',
      mandiEn: 'Peshawar Sabzi Mandi (Inqilab Rd)',
      mandiUr: 'پشاور سبزی منڈی (انقلاب روڈ)',
      province: 'KP',
      crateKg: 20,
      minCratePkr: 1680,
      maxCratePkr: 2300,
      avgCratePkr: 1990,
      changePercent: 2.6,
      grade: 'Grade A · KP / Swat Valley',
      arrivalNoteEn: 'Active dispatch from Dargai, Charsadda & Swat hills.',
      arrivalNoteUr: 'درگئی، چارسدہ اور سوات سے تازہ فصل کی فراہمی۔'
    }
  ]
};

interface SprayProductSpec {
  id: string;
  nameEn: string;
  nameUr: string;
  unitEn: string;
  unitUr: string;
  dosePerLiter: number; // ml or g per Liter of water
  waterLitersPerAcre: number;
  phiDays: number;
  intervalDays: number;
  targetEn: string;
  targetUr: string;
}

const SPRAY_PRODUCTS: SprayProductSpec[] = [
  {
    id: 'neem_oil',
    nameEn: 'Cold-Pressed Neem Oil (3000 ppm)',
    nameUr: 'خالص نیم کا تیل (3000 ppm)',
    unitEn: 'ml',
    unitUr: 'ملی لیٹر',
    dosePerLiter: 5,
    waterLitersPerAcre: 160,
    phiDays: 1,
    intervalDays: 6,
    targetEn: 'Whiteflies, aphids, mites & early leaf spots',
    targetUr: 'سفید مکھی، سست تیلا، جوئیں اور ابتدائی دھبے'
  },
  {
    id: 'copper_oxy',
    nameEn: 'Copper Oxychloride (50% WP)',
    nameUr: 'کاپر آکسی کلورائیڈ (50% WP)',
    unitEn: 'g',
    unitUr: 'گرام',
    dosePerLiter: 2.5,
    waterLitersPerAcre: 180,
    phiDays: 5,
    intervalDays: 8,
    targetEn: 'Early/Late Blight & Bacterial Speck shield',
    targetUr: 'ارلی و لیٹ بلائیٹ اور بیکٹیریل دھبوں سے تحفظ'
  },
  {
    id: 'bio_bacillus',
    nameEn: 'Bacillus subtilis Bio-Fungicide',
    nameUr: 'بائیو فنجی سائیڈ (Bacillus)',
    unitEn: 'g',
    unitUr: 'گرام',
    dosePerLiter: 3,
    waterLitersPerAcre: 160,
    phiDays: 0,
    intervalDays: 7,
    targetEn: 'Preventive leaf mold & Septoria defense',
    targetUr: 'لیف مولڈ اور سیپٹوریا سے حفاظتی بچاؤ'
  },
  {
    id: 'potash_calcium_foliar',
    nameEn: 'Soluble Potash + Calcium Foliar',
    nameUr: 'پوٹاش اور کیلشیم فولئیر اسپرے',
    unitEn: 'g',
    unitUr: 'گرام',
    dosePerLiter: 4,
    waterLitersPerAcre: 160,
    phiDays: 0,
    intervalDays: 10,
    targetEn: 'Blossom fruit-set & stopping black fruit bottoms',
    targetUr: 'پھولوں سے بہتر پھل اور نچلا سرا گلنے سے بچاؤ'
  }
];

interface SeasonalRegionPlan {
  id: PakistanAgriRegion;
  labelEn: string;
  labelUr: string;
  openField: {
    nurseryEn: string;
    nurseryUr: string;
    transplantEn: string;
    transplantUr: string;
    harvestEn: string;
    harvestUr: string;
    spacingEn: string;
    spacingUr: string;
    riskNoteEn: string;
    riskNoteUr: string;
  };
  plasticTunnel: {
    nurseryEn: string;
    nurseryUr: string;
    transplantEn: string;
    transplantUr: string;
    harvestEn: string;
    harvestUr: string;
    spacingEn: string;
    spacingUr: string;
    riskNoteEn: string;
    riskNoteUr: string;
  };
}

const SEASONAL_PLANS: SeasonalRegionPlan[] = [
  {
    id: 'punjab_central',
    labelEn: 'Central Punjab (Lahore, Faisalabad, Sahiwal)',
    labelUr: 'وسطی پنجاب (لاہور، فیصل آباد، ساہیوال)',
    openField: {
      nurseryEn: 'Jan 10 – Feb 05 (Spring) · Jul 15 – Aug 10 (Autumn)',
      nurseryUr: '10 جنوری – 5 فروری (بہار) · 15 جولائی – 10 اگست (خزاں)',
      transplantEn: 'Feb 15 – Mar 10 · Aug 20 – Sep 15',
      transplantUr: '15 فروری – 10 مارچ · 20 اگست – 15 ستمبر',
      harvestEn: 'May – Jun (Spring) · Nov – Dec (Autumn)',
      harvestUr: 'مئی تا جون (بہار) · نومبر تا دسمبر (خزاں)',
      spacingEn: '120 cm raised beds · 45 cm plant-to-plant',
      spacingUr: '4 فٹ چوڑی کھیلی · پودے سے پودے کا فاصلہ 1.5 فٹ',
      riskNoteEn: 'Use 30% shade net when May temps cross 38°C; scout whitefly heavily in Aug–Sep.',
      riskNoteUr: 'مئی میں 38°C سے اوپر گرمی پر سبز جالی لگائیں؛ اگست ستمبر میں سفید مکھی چیک کریں۔'
    },
    plasticTunnel: {
      nurseryEn: 'Sep 15 – Oct 10 (50-mesh insect net covered)',
      nurseryUr: '15 ستمبر – 10 اکتوبر (50 میش جالی کے اندر)',
      transplantEn: 'Oct 20 – Nov 15 inside low/walk-in poly tunnel',
      transplantUr: '20 اکتوبر – 15 نومبر پلاسٹک ٹنل میں منتقلی',
      harvestEn: 'Late Jan – May (Early high-price mandi window)',
      harvestUr: 'جنوری کے آخر تا مئی (ابتدائی اچھے منڈی ریٹ)',
      spacingEn: 'Twin-row beds · 40 cm stagger · Bamboo or trellis strings',
      spacingUr: 'دو قطاروں والا بیڈ · بانس اور سوتلی سے سہارا',
      riskNoteEn: 'Roll up tunnel sides daily at 8:00 AM–3:30 PM on sunny days to stop Leaf Mold.',
      riskNoteUr: 'دھوپ والے دنوں میں صبح 8 سے سہ پہر 3:30 تک پردے کھولیں تاکہ لیف مولڈ نہ لگے۔'
    }
  },
  {
    id: 'punjab_south',
    labelEn: 'South Punjab (Multan, Bahawalpur, Muzaffargarh)',
    labelUr: 'جنوبی پنجاب (ملتان، بہاولپور، مظفرگڑھ)',
    openField: {
      nurseryEn: 'Aug 01 – Sep 05 (Autumn) · Jan 01 – Jan 25',
      nurseryUr: 'یکم اگست – 5 ستمبر (خزاں) · یکم تا 25 جنوری',
      transplantEn: 'Sep 10 – Oct 05 · Feb 05 – Feb 25',
      transplantUr: '10 ستمبر – 5 اکتوبر · 5 تا 25 فروری',
      harvestEn: 'Dec – Feb · Apr – late May',
      harvestUr: 'دسمبر تا فروری · اپریل تا مئی آخر',
      spacingEn: '120 cm beds · Drip or furrow base irrigation before 8 AM',
      spacingUr: '4 فٹ کھیلی · صبح 8 بجے سے پہلے جڑوں میں پانی',
      riskNoteEn: 'High midday heat stress in April: mulch heavily with dry wheat straw.',
      riskNoteUr: 'اپریل کی سخت گرمی سے بچاؤ کے لیے پودوں کے نیچے خشک بھوسا بچھائیں۔'
    },
    plasticTunnel: {
      nurseryEn: 'Sep 05 – Sep 30',
      nurseryUr: '5 تا 30 ستمبر',
      transplantEn: 'Oct 10 – Nov 10 (Indeterminate / Roma hybrids)',
      transplantUr: '10 اکتوبر – 10 نومبر (روما یا ٹنل اقسام)',
      harvestEn: 'Dec 25 – Apr 25',
      harvestUr: '25 دسمبر – 25 اپریل',
      spacingEn: 'Drip lines along twin rows · 8,500–10,000 plants/acre',
      spacingUr: 'ڈرپ اریگیشن کے ساتھ 8,500 سے 10,000 پودے فی ایکڑ',
      riskNoteEn: 'Seal poly cover before Jan night frost drops below 4°C; vent excess daytime humidity.',
      riskNoteUr: 'جنوری کی رات کو 4°C سے نیچے پالے میں ٹنل بند رکھیں، دن میں ہوا ضرور گزاریں۔'
    }
  },
  {
    id: 'sindh_lower',
    labelEn: 'Lower Sindh (Thatta, Badin, Mirpurkhas, Hyderabad)',
    labelUr: 'زیریں سندھ (ٹھٹھہ، بدین، میرپورخاص، حیدرآباد)',
    openField: {
      nurseryEn: 'Sep 15 – Oct 20 (Main Winter Supply)',
      nurseryUr: '15 ستمبر – 20 اکتوبر (مرکزی سردیوں کی فصل)',
      transplantEn: 'Oct 20 – Nov 25',
      transplantUr: '20 اکتوبر – 25 نومبر',
      harvestEn: 'Jan – Apr',
      harvestUr: 'جنوری تا اپریل',
      spacingEn: '105–120 cm beds · 40–45 cm spacing',
      spacingUr: '3.5 تا 4 فٹ کھیلی · پودوں کا فاصلہ 1.5 فٹ',
      riskNoteEn: 'Coastal humidity encourages Early Blight & Leaf Curl vectors; use yellow sticky cards from Week 1.',
      riskNoteUr: 'ساحلی نمی میں ارلی بلائیٹ اور سفید مکھی کا خدشہ رہتا ہے—پہلے ہفتے سے پیلے کارڈ لگائیں۔'
    },
    plasticTunnel: {
      nurseryEn: 'Sep 01 – Sep 20',
      nurseryUr: 'یکم تا 20 ستمبر',
      transplantEn: 'Oct 05 – Oct 25 (Insect-screened walk-in house)',
      transplantUr: '5 تا 25 اکتوبر (جالی دار واک ان ٹنل)',
      harvestEn: 'Dec – Mar',
      harvestUr: 'دسمبر تا مارچ',
      spacingEn: 'High-airflow netting on sidewalls instead of sealed poly',
      spacingUr: 'بند پلاسٹک کے بجائے اطراف میں باریک جالی زیادہ کارآمد ہے',
      riskNoteEn: 'Prioritize heat & whitefly exclusion netting—winters stay mild so ventilation prevents mold.',
      riskNoteUr: 'سردی ہلکی ہونے کی وجہ سے ہوا دار جالی پھپھوندی اور وائرس دونوں سے بچاتی ہے۔'
    }
  },
  {
    id: 'potohar',
    labelEn: 'Potohar & Islamabad (Rawalpindi, Chakwal, Attock)',
    labelUr: 'پوٹھوہار و اسلام آباد (راولپنڈی، چکوال، اٹک)',
    openField: {
      nurseryEn: 'Jan 20 – Feb 15 (under low poly cover) · Jul 01 – Jul 25',
      nurseryUr: '20 جنوری – 15 فروری (لو ٹنل میں) · یکم تا 25 جولائی',
      transplantEn: 'Mar 01 – Mar 25 · Aug 05 – Aug 25',
      transplantUr: 'یکم تا 25 مارچ · 5 تا 25 اگست',
      harvestEn: 'May 20 – Jul 15 · Oct 15 – Dec 05',
      harvestUr: '20 مئی – 15 جولائی · 15 اکتوبر – 5 دسمبر',
      spacingEn: '120 cm contoured beds · Wheat straw mulch for barani moisture retention',
      spacingUr: 'بارانی علاقے میں نمی بچانے کے لیے بھوسے کی ملچنگ لازمی کریں',
      riskNoteEn: 'Monsoon showers (Jul–Aug) trigger Late Blight quickly—stake stems 20 cm clear of soil.',
      riskNoteUr: 'جولائی اگست کی برسات میں پودے کو بانس کا سہارا دیں اور نچلے پتے صاف رکھیں۔'
    },
    plasticTunnel: {
      nurseryEn: 'Sep 25 – Oct 15',
      nurseryUr: '25 ستمبر – 15 اکتوبر',
      transplantEn: 'Nov 01 – Nov 20 (Double-layer frost cover for Jan nights)',
      transplantUr: 'یکم تا 20 نومبر (جنوری کے پالے کے لیے دوہری حفاظت)',
      harvestEn: 'Feb 15 – Jun 15',
      harvestUr: '15 فروری – 15 جون',
      spacingEn: 'Trellis staked 1.8 m high',
      spacingUr: '6 فٹ اونچی رسیوں یا بانس پر ٹریننگ',
      riskNoteEn: 'Drain rainwater trenches outside tunnel perimeter to prevent wet root collar rot.',
      riskNoteUr: 'ٹنل کے باہر بارش کے پانی کی نکاسی کی نالی بنائیں تاکہ جڑیں نہ گلیں۔'
    }
  },
  {
    id: 'kp_swat',
    labelEn: 'KP Mid-Hills & Swat (Swat, Mingora, Mansehra)',
    labelUr: 'خیبر پختونخوا و سوات (سوات، مینگورہ، مانسہرہ)',
    openField: {
      nurseryEn: 'Feb 15 – Mar 25 (Protected cold frame)',
      nurseryUr: '15 فروری – 25 مارچ (محفوظ پنیری بیڈ)',
      transplantEn: 'Apr 01 – Apr 30',
      transplantUr: 'یکم تا 30 اپریل',
      harvestEn: 'Jul – Oct (Peak off-season supply across Pakistan)',
      harvestUr: 'جولائی تا اکتوبر (ملک بھر میں آف سیزن اعلیٰ ریٹ)',
      spacingEn: '120 cm raised beds with strong bamboo staking',
      spacingUr: 'اونچی کھیلیاں اور مضبوط بانس کا سہارا',
      riskNoteEn: 'Summer rains in cool mountain nights favor Late Blight—inspect upper leaves after every shower.',
      riskNoteUr: 'ٹھنڈی راتوں کی بارش میں لیٹ بلائیٹ تیزی سے آتا ہے، بارش کے بعد فوری معائنہ کریں۔'
    },
    plasticTunnel: {
      nurseryEn: 'Feb 01 – Feb 20',
      nurseryUr: 'یکم تا 20 فروری',
      transplantEn: 'Mar 05 – Mar 25 (Early highland tunnel)',
      transplantUr: '5 تا 25 مارچ (پہاڑی ٹنل)',
      harvestEn: 'Jun – Nov',
      harvestUr: 'جون تا نومبر',
      spacingEn: 'Prune single/double leader cleanly for sunlit canopy',
      spacingUr: 'پتوں میں ہوا کے گزر کے لیے فالتو شاخیں باقاعدہ کاٹیں',
      riskNoteEn: 'Open roof/side vents on warm afternoons so blossom pollen never overheats inside poly.',
      riskNoteUr: 'گرمی دوپہر میں ٹنل کے پردے کھولیں تاکہ اندر پھول نہ جھڑیں۔'
    }
  }
];

export const MarketAndToolsView: React.FC = () => {
  const { isUrdu } = useLanguage();
  const { preferredRegion, growingSystem, updatePreference, lowDataMode } = usePreferences();

  const [subTab, setSubTab] = useState<'mandi' | 'dosage' | 'seasons'>('mandi');

  // Mandi states
  const [mandiData, setMandiData] = useState<MandiPayload>(() => {
    if (typeof window === 'undefined') return FALLBACK_MANDI_DATA;
    try {
      const raw = window.localStorage.getItem(MANDI_CACHE_KEY);
      if (raw) return JSON.parse(raw) as MandiPayload;
    } catch {
      // ignore
    }
    return FALLBACK_MANDI_DATA;
  });
  const [isLoadingMandi, setIsLoadingMandi] = useState(false);
  const [mandiOfflineNotice, setMandiOfflineNotice] = useState(false);
  const [mandiSearch, setMandiSearch] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('lahore_badami_bagh');
  const [cratesCount, setCratesCount] = useState<string>('25');

  // Tanki dosage calculator states
  const [landArea, setLandArea] = useState<string>('4');
  const [landUnit, setLandUnit] = useState<'acre' | 'kanal' | 'marla'>('kanal');
  const [tankiSize, setTankiSize] = useState<16 | 20>(16);
  const [selectedProductId, setSelectedProductId] = useState<string>('neem_oil');

  const fetchMandiRates = async () => {
    setIsLoadingMandi(true);
    setMandiOfflineNotice(false);
    try {
      const res = await fetch('/api/mandi-rates');
      if (!res.ok) throw new Error('Network error');
      const json = (await res.json()) as MandiPayload & { success?: boolean };
      if (json?.markets && Array.isArray(json.markets)) {
        const cleanPayload: MandiPayload = {
          updatedAt: json.updatedAt,
          dateLabel: json.dateLabel,
          sourceNote: json.sourceNote,
          markets: json.markets
        };
        setMandiData(cleanPayload);
        try {
          window.localStorage.setItem(MANDI_CACHE_KEY, JSON.stringify(cleanPayload));
        } catch {
          // ignore
        }
      }
    } catch {
      setMandiOfflineNotice(true);
    } finally {
      setIsLoadingMandi(false);
    }
  };

  useEffect(() => {
    if (!lowDataMode) {
      void fetchMandiRates();
    }
  }, [lowDataMode]);

  const filteredMarkets = useMemo(() => {
    const q = mandiSearch.trim().toLowerCase();
    if (!q) return mandiData.markets;
    return mandiData.markets.filter(
      (m) =>
        m.cityEn.toLowerCase().includes(q) ||
        m.cityUr.includes(q) ||
        m.mandiEn.toLowerCase().includes(q) ||
        m.province.toLowerCase().includes(q)
    );
  }, [mandiData.markets, mandiSearch]);

  const selectedMarket =
    mandiData.markets.find((m) => m.id === selectedMarketId) || mandiData.markets[0];
  const numericCrates = Math.max(0, Number(cratesCount) || 0);
  const estimatedGrossPkr = Math.round(numericCrates * (selectedMarket?.avgCratePkr || 1850));

  // Tanki Dosage Calculations (1 Acre = 8 Kanal = 160 Marla in Pakistan standard land measurement)
  const numericArea = Math.max(0.1, Number(landArea) || 1);
  const acreEquivalent =
    landUnit === 'acre' ? numericArea : landUnit === 'kanal' ? numericArea / 8 : numericArea / 160;
  const selectedProduct =
    SPRAY_PRODUCTS.find((p) => p.id === selectedProductId) || SPRAY_PRODUCTS[0];

  const totalWaterLiters = Math.max(8, Math.round(acreEquivalent * selectedProduct.waterLitersPerAcre));
  const totalTankis = Math.max(1, Math.ceil(totalWaterLiters / tankiSize));
  const dosePerTanki = Math.round(selectedProduct.dosePerLiter * tankiSize * 10) / 10;
  const totalProductNeeded = Math.round(dosePerTanki * totalTankis);

  const activeRegionPlan =
    SEASONAL_PLANS.find((r) => r.id === preferredRegion) || SEASONAL_PLANS[0];
  const activeSystemDetail =
    growingSystem === 'plastic_tunnel' ? activeRegionPlan.plasticTunnel : activeRegionPlan.openField;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <section className="rounded-2xl bg-[#14532d] p-4 sm:p-5 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#fef3c7] font-bold">
            {isUrdu ? 'پاکستان فیلڈ و مارکیٹ ٹولز' : 'PAKISTAN GROWER UTILITIES'}
          </div>
          <h1 className="font-display text-lg sm:text-xl font-extrabold leading-snug mt-0.5">
            {isUrdu ? 'سبزی منڈی ریٹس، اسپرے حساب اور موسمی کلینڈر' : 'Sabzi Mandi Rates, Spray Calculator & Seasons'}
          </h1>
          <p className="text-xs text-white/85 mt-0.5">
            {isUrdu
              ? 'روزانہ تھوک ٹماٹر ریٹس، 16/20 لیٹر ٹینکی خوراک اور علاقائی کاشت کا وقت دیکھیں۔'
              : 'Wholesale 20 kg crate rates across Pakistani mandis, accurate tanki spray dosages, and regional schedules.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchMandiRates()}
          disabled={isLoadingMandi}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#edf5ef] text-[#14532d] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMandi ? 'animate-spin' : ''}`} />
          <span>{isUrdu ? 'ریٹس اپڈیٹ' : 'Refresh Rates'}</span>
        </button>
      </section>

      {/* Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#edf5ef] border border-[#cbdcd0]">
        {(
          [
            {
              id: 'mandi',
              label: isUrdu ? 'منڈی ریٹس' : 'Mandi Rates',
              icon: Store
            },
            {
              id: 'dosage',
              label: isUrdu ? 'ٹینکی حساب' : 'Tanki Calculator',
              icon: Calculator
            },
            {
              id: 'seasons',
              label: isUrdu ? 'پاکستان موسم' : 'Seasons & Tunnel',
              icon: CalendarDays
            }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                active ? 'bg-[#14532d] text-white shadow-xs' : 'text-[#2f4739] hover:text-[#13281c]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SABZI MANDI WHOLESALE RATES */}
      {subTab === 'mandi' && (
        <div className="space-y-4">
          {mandiOfflineNotice && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#fffbeb] border border-[#fcd34d] text-xs text-[#78350f] flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                {isUrdu
                  ? 'انٹرنیٹ سست ہے — آخری محفوظ شدہ منڈی ریٹس دکھائے جا رہے ہیں۔'
                  : 'Offline or low-signal mode — showing last saved Sabzi Mandi rates.'}
              </span>
            </div>
          )}

          {/* Search & Date Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#5b7463] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={mandiSearch}
                onChange={(e) => setMandiSearch(e.target.value)}
                placeholder={isUrdu ? 'شہر یا منڈی تلاش کریں (لاہور، کراچی، ملتان)...' : 'Filter by city or province (Lahore, Karachi, Multan)...'}
                className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
              />
            </div>

            <div className="text-[11px] font-mono text-[#5b7463] tabular-nums">
              {isUrdu ? `تاریخ: ${mandiData.dateLabel}` : `Date: ${mandiData.dateLabel}`} ·{' '}
              {isUrdu ? '20 کلو پیٹی (PKR)' : '20 kg Crate (PKR)'}
            </div>
          </div>

          {/* Market Rate Rows */}
          <section className="rounded-2xl bg-white border border-[#cbdcd0] divide-y divide-[#cbdcd0]/70 overflow-hidden shadow-xs">
            {filteredMarkets.map((market) => {
              const avgPerKg = Math.round(market.avgCratePkr / market.crateKg);
              const isUp = market.changePercent >= 0;
              return (
                <div
                  key={market.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#faf8f2] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-extrabold text-[#13281c] inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#14532d] shrink-0" />
                        <span>{isUrdu ? market.cityUr : market.cityEn}</span>
                      </span>
                      <span className="text-[11px] text-[#5b7463] font-mono">{market.province}</span>
                      <span className="text-[11px] text-[#3d5947]">· {market.grade}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#14532d]">
                      {isUrdu ? market.mandiUr : market.mandiEn}
                    </div>
                    <p className="text-[11px] text-[#5b7463]">
                      {isUrdu ? market.arrivalNoteUr : market.arrivalNoteEn}
                    </p>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 font-mono tabular-nums">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-[#13281c]">
                        PKR {market.minCratePkr.toLocaleString()} – {market.maxCratePkr.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#3d5947]">
                        {isUrdu
                          ? `اوسط ~${avgPerKg} روپے/کلو`
                          : `Avg ~PKR ${avgPerKg}/kg`}
                      </div>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        isUp ? 'text-[#166534]' : 'text-[#b45309]'
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isUp ? '+' : ''}
                        {market.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Harvest Revenue Estimator */}
          <section className="rounded-2xl bg-[#edf5ef] border border-[#cbdcd0] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#14532d]">
              <Calculator className="w-4 h-4" />
              <span>{isUrdu ? 'فصل آمدنی کا تخمینہ (20 کلو پیٹی)' : 'Harvest Crate Revenue Estimator'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'منڈی منتخب کریں' : 'Target Mandi'}
                </label>
                <select
                  value={selectedMarketId}
                  onChange={(e) => setSelectedMarketId(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
                >
                  {mandiData.markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {isUrdu ? m.cityUr : m.cityEn} (Avg PKR {m.avgCratePkr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'کل 20 کلو پیٹیاں' : 'Number of 20 kg Crates'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={cratesCount}
                  onChange={(e) => setCratesCount(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white border border-[#cbdcd0] text-xs font-mono font-bold text-[#13281c] tabular-nums"
                />
              </div>

              <div className="rounded-xl bg-white border border-[#cbdcd0] px-3.5 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-mono uppercase text-[#5b7463]">
                  {isUrdu ? 'متوقع کل تھوک آمدنی' : 'Estimated Gross Value'}
                </span>
                <span className="font-mono text-base font-extrabold text-[#14532d] tabular-nums">
                  PKR {estimatedGrossPkr.toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 2. SPRAY TANKI & ACRE DOSAGE CALCULATOR */}
      {subTab === 'dosage' && (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white border border-[#cbdcd0] p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="pb-3 border-b border-[#cbdcd0]">
              <h2 className="font-display text-base font-bold text-[#13281c]">
                {isUrdu ? 'اسپرے ٹینکی اور زمین کا درست حساب' : 'Knapsack Tanki & Land Dosage Calculator'}
              </h2>
              <p className="text-xs text-[#3d5947] mt-0.5">
                {isUrdu
                  ? 'مرلہ، کنال یا ایکڑ کے مطابق 16 یا 20 لیٹر پمپ ٹینکی کی صحیح مقدار نکالیں۔'
                  : 'Convert Marla, Kanal, or Acre (Qilla) into exact water tanks and grams/ml per pump.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'رقبہ کی پیمائش' : 'Land Area'}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    className="w-24 min-h-[42px] px-3 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-mono font-bold text-[#13281c] tabular-nums"
                  />
                  <select
                    value={landUnit}
                    onChange={(e) => setLandUnit(e.target.value as 'acre' | 'kanal' | 'marla')}
                    className="flex-1 min-h-[42px] px-2.5 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
                  >
                    <option value="marla">{isUrdu ? 'مرلہ' : 'Marla'}</option>
                    <option value="kanal">{isUrdu ? 'کنال' : 'Kanal'}</option>
                    <option value="acre">{isUrdu ? 'ایکڑ / قلعہ' : 'Acre / Qilla'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'اسپرے ٹینکی سائز' : 'Knapsack Tanki Size'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {([16, 20] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setTankiSize(sz)}
                      className={`min-h-[42px] rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                        tankiSize === sz
                          ? 'bg-[#14532d] text-white border-[#14532d]'
                          : 'bg-[#faf8f2] text-[#13281c] border-[#cbdcd0]'
                      }`}
                    >
                      {sz} L
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'دوا / نامیاتی مرکب' : 'Organic Spray or Nutrient Schedule'}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
                >
                  {SPRAY_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isUrdu ? p.nameUr : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculation Readout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
                <div className="text-[10px] font-mono uppercase text-[#3d5947]">
                  {isUrdu ? 'فی ٹینکی خوراک' : `Dose / ${tankiSize}L Tanki`}
                </div>
                <div className="font-mono text-lg font-extrabold text-[#14532d] mt-0.5 tabular-nums">
                  {dosePerTanki} {isUrdu ? selectedProduct.unitUr : selectedProduct.unitEn}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0]">
                <div className="text-[10px] font-mono uppercase text-[#5b7463]">
                  {isUrdu ? 'کل ٹینکیاں درکار' : 'Total Tankis Needed'}
                </div>
                <div className="font-mono text-lg font-extrabold text-[#13281c] mt-0.5 tabular-nums">
                  {totalTankis} {isUrdu ? 'ٹینکی' : 'Tanks'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0]">
                <div className="text-[10px] font-mono uppercase text-[#5b7463]">
                  {isUrdu ? 'کل پانی' : 'Total Clean Water'}
                </div>
                <div className="font-mono text-lg font-extrabold text-[#13281c] mt-0.5 tabular-nums">
                  {totalWaterLiters} L
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0]">
                <div className="text-[10px] font-mono uppercase text-[#5b7463]">
                  {isUrdu ? 'کل دوا درکار' : 'Total Product Qty'}
                </div>
                <div className="font-mono text-lg font-extrabold text-[#b45309] mt-0.5 tabular-nums">
                  {totalProductNeeded} {isUrdu ? selectedProduct.unitUr : selectedProduct.unitEn}
                </div>
              </div>
            </div>

            {/* Agronomic Safety Metadata */}
            <div className="p-3.5 rounded-xl bg-[#fffbeb] border border-[#fcd34d] text-xs text-[#78350f] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">
                  {isUrdu ? selectedProduct.targetUr : selectedProduct.targetEn}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isUrdu
                    ? `اسپرے کے بعد تڑائی کا وقفہ (PHI): ${selectedProduct.phiDays} دن · دوبارہ وقفہ: ${selectedProduct.intervalDays} دن۔ تیز دوپہر (>34°C) یا بارش سے پہلے اسپرے ہرگز نہ کریں۔ اصلی دوا کی تصدیق کورسز ٹیب میں دیکھیں۔`
                    : `Pre-harvest waiting period (PHI): ${selectedProduct.phiDays} day(s) · Re-application interval: every ${selectedProduct.intervalDays} days. Spray only in calm early morning or late afternoon (<32°C), and verify sealed batch labels before mixing.`}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 3. PAKISTAN SEASONAL & PLASTIC TUNNEL PLANNER */}
      {subTab === 'seasons' && (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white border border-[#cbdcd0] p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#cbdcd0]">
              <div>
                <label className="block text-xs font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'پاکستان کا زرعی علاقہ' : 'Select Pakistan Region'}
                </label>
                <select
                  value={preferredRegion}
                  onChange={(e) =>
                    updatePreference('preferredRegion', e.target.value as PakistanAgriRegion)
                  }
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
                >
                  {SEASONAL_PLANS.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {isUrdu ? reg.labelUr : reg.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13281c] mb-1">
                  {isUrdu ? 'کاشت کا طریقہ' : 'Cultivation System'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'open_field', en: 'Open Field', ur: 'کھلا کھیت' },
                      { id: 'plastic_tunnel', en: 'Plastic Tunnel', ur: 'پلاسٹک ٹنل' }
                    ] as const
                  ).map((sys) => (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() =>
                        updatePreference('growingSystem', sys.id as GrowingSystemType)
                      }
                      className={`min-h-[42px] rounded-xl text-xs font-bold border cursor-pointer ${
                        growingSystem === sys.id
                          ? 'bg-[#14532d] text-white border-[#14532d]'
                          : 'bg-[#faf8f2] text-[#13281c] border-[#cbdcd0]'
                      }`}
                    >
                      {isUrdu ? sys.ur : sys.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#5b7463] inline-flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-[#14532d]" />
                  <span>{isUrdu ? 'پنیری بوائی کا وقت' : 'Nursery Sowing Window'}</span>
                </div>
                <div className="text-xs font-bold text-[#13281c]">
                  {isUrdu ? activeSystemDetail.nurseryUr : activeSystemDetail.nurseryEn}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#5b7463] inline-flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-[#14532d]" />
                  <span>{isUrdu ? 'کھیت میں منتقلی' : 'Transplanting Window'}</span>
                </div>
                <div className="text-xs font-bold text-[#13281c]">
                  {isUrdu ? activeSystemDetail.transplantUr : activeSystemDetail.transplantEn}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#edf5ef] border border-[#cbdcd0] space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#14532d] inline-flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'تڑائی اور منڈی کا وقت' : 'Harvest & Mandi Window'}</span>
                </div>
                <div className="text-xs font-bold text-[#14532d]">
                  {isUrdu ? activeSystemDetail.harvestUr : activeSystemDetail.harvestEn}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#5b7463] inline-flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-[#14532d]" />
                  <span>{isUrdu ? 'پودوں کا فاصلہ و ترتیب' : 'Bed Width & Plant Spacing'}</span>
                </div>
                <div className="text-xs font-bold text-[#13281c]">
                  {isUrdu ? activeSystemDetail.spacingUr : activeSystemDetail.spacingEn}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fffbeb] border border-[#fcd34d] text-xs text-[#78350f]">
              <strong className="font-bold block mb-0.5">
                {isUrdu ? 'موسمی اور حفاظتی ہدایت:' : 'Regional Risk & Field Note:'}
              </strong>
              <span>{isUrdu ? activeSystemDetail.riskNoteUr : activeSystemDetail.riskNoteEn}</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
