export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'fruiting';

export type GrowthAlertSeverity = 'action' | 'watch' | 'optimal';

export type GrowthAlertTarget = 'sensors' | 'scan' | 'library';

export interface GrowthStageConfig {
  id: GrowthStage;
  labelEn: string;
  labelUr: string;
  daysEn: string;
  daysUr: string;
  moistureMin: number;
  moistureMax: number;
  phMin: number;
  phMax: number;
  optimalHeadlineEn: string;
  optimalHeadlineUr: string;
  optimalTipEn: string;
  optimalTipUr: string;
  careFocusEn: string;
  careFocusUr: string;
  diseaseWatchEn: string;
  diseaseWatchUr: string;
}

export interface GrowthStageAlert {
  stage: GrowthStageConfig;
  severity: GrowthAlertSeverity;
  statusLabelEn: string;
  statusLabelUr: string;
  headlineEn: string;
  headlineUr: string;
  messageEn: string;
  messageUr: string;
  careFocusEn: string;
  careFocusUr: string;
  diseaseWatchEn: string;
  diseaseWatchUr: string;
  actionTarget: GrowthAlertTarget;
  actionLabelEn: string;
  actionLabelUr: string;
}

export const GROWTH_STAGE_CONFIGS: Record<GrowthStage, GrowthStageConfig> = {
  seedling: {
    id: 'seedling',
    labelEn: 'Seedling',
    labelUr: 'ننھا پودا',
    daysEn: 'Days 1–20',
    daysUr: 'دن 1–20',
    moistureMin: 55,
    moistureMax: 68,
    phMin: 6.0,
    phMax: 6.6,
    optimalHeadlineEn: 'Protect tender stems & roots',
    optimalHeadlineUr: 'نازک تنے اور جڑوں کی حفاظت کریں',
    optimalTipEn:
      'Keep topsoil lightly damp (55–68%) and give bright morning sun so young stems stay strong and don’t rot.',
    optimalTipUr:
      'اوپری مٹی کو ہلکا نم (55–68%) رکھیں اور روزانہ اچھی دھوپ دیں تاکہ تنا مضبوط رہے۔',
    careFocusEn: 'Water lightly in the morning; never leave roots soaking overnight.',
    careFocusUr: 'صبح کے وقت ہلکا پانی دیں؛ رات بھر مٹی کو زیادہ گیلا نہ چھوڑیں۔',
    diseaseWatchEn: 'Check baby leaves for stem rot or curling.',
    diseaseWatchUr: 'ابتدائی پتوں پر تنے کے گلنے یا مروڑ کی علامات چیک کریں۔'
  },
  vegetative: {
    id: 'vegetative',
    labelEn: 'Leaf Growing',
    labelUr: 'پتوں کی بڑھوتری',
    daysEn: 'Days 21–42',
    daysUr: 'دن 21–42',
    moistureMin: 50,
    moistureMax: 65,
    phMin: 6.0,
    phMax: 6.8,
    optimalHeadlineEn: 'Keep lower leaves dry & airy',
    optimalHeadlineUr: 'نچلے پتوں میں ہوا کا گزر بہتر بنائیں',
    optimalTipEn:
      'Trim touching bottom shoots and tie stems to sticks so breeze and sunlight dry leaves fast.',
    optimalTipUr:
      'نیچے کی فالتو شاخیں صاف کریں اور سہارا لگائیں تاکہ دھوپ اور ہوا نچلے پتوں کو خشک رکھیں۔',
    careFocusEn: 'Water slowly at the soil base 2–3 times a week.',
    careFocusUr: 'ہفتے میں 2–3 بار صرف جڑوں کے قریب گہرا پانی دیں۔',
    diseaseWatchEn: 'Check bottom leaves for brown rings or black spots.',
    diseaseWatchUr: 'نچلے پتوں پر بھورے حلقے یا سیاہ دھبے دیکھیں۔'
  },
  flowering: {
    id: 'flowering',
    labelEn: 'Flowering',
    labelUr: 'پھول آنا',
    daysEn: 'Days 43–65',
    daysUr: 'دن 43–65',
    moistureMin: 50,
    moistureMax: 65,
    phMin: 6.2,
    phMax: 6.8,
    optimalHeadlineEn: 'Help yellow blossoms turn into fruit',
    optimalHeadlineUr: 'پھولوں سے بہتر پھل بننے میں مدد کریں',
    optimalTipEn:
      'Keep watering steady at soil level, tap flower stems gently at noon for pollen, and keep leaves dry.',
    optimalTipUr:
      'پانی متوازن رکھیں، دوپہر کو پھولوں کو ہلکا ہلائیں اور پتوں کو گیلا نہ ہونے دیں۔',
    careFocusEn: 'Do not splash water onto open yellow flowers.',
    careFocusUr: 'پھول کھلنے کے دوران اوپر سے پانی ڈالنے سے پرہیز کریں۔',
    diseaseWatchEn: 'Watch middle leaves for yellow halos and brown spots.',
    diseaseWatchUr: 'درمیانی پتوں پر پیلے اور بھورے دھبوں کا معائنہ کریں۔'
  },
  fruiting: {
    id: 'fruiting',
    labelEn: 'Red Harvest',
    labelUr: 'پھل اور کٹائی',
    daysEn: 'Days 66+',
    daysUr: 'دن 66+',
    moistureMin: 48,
    moistureMax: 62,
    phMin: 6.0,
    phMax: 6.8,
    optimalHeadlineEn: 'Steady water prevents cracked fruit',
    optimalHeadlineUr: 'متوازن پانی پھل پھٹنے سے روکتا ہے',
    optimalTipEn:
      'Spread dry straw mulch under plants and water evenly so tomatoes ripen red without bottom black rot.',
    optimalTipUr:
      'تنے کے گرد خشک گھاس بچھائیں اور باقاعدہ پانی دیں تاکہ پکتے ٹماٹر خراب نہ ہوں۔',
    careFocusEn: 'Pick ripe red tomatoes quickly so smaller ones grow faster.',
    careFocusUr: 'پکے ہوئے ٹماٹر فوراً توڑ لیں تاکہ نئے پھلوں کو پوری طاقت ملے۔',
    diseaseWatchEn: 'Check damp leaves for dark, wet blight patches.',
    diseaseWatchUr: 'نمی والے پتوں پر گہرے گیلے دھبے فوراً اسکین کریں۔'
  }
};

export function evaluateGrowthStageAlert(
  stageId: GrowthStage,
  sensors: {
    moistureEnabled: boolean;
    moisturePercent: number;
    phEnabled: boolean;
    soilPh: number;
  }
): GrowthStageAlert {
  const stage = GROWTH_STAGE_CONFIGS[stageId];
  const { moistureEnabled, moisturePercent, phEnabled, soilPh } = sensors;

  if (moistureEnabled && moisturePercent > stage.moistureMax + 7) {
    return {
      stage,
      severity: 'action',
      statusLabelEn: 'Moisture Alert',
      statusLabelUr: 'نمی الرٹ',
      headlineEn:
        stageId === 'seedling'
          ? `Too wet for Seedlings (${moisturePercent}%)`
          : stageId === 'fruiting'
          ? `Late Blight & Split Risk (${moisturePercent}%)`
          : `Fungal Humidity Alert (${moisturePercent}%)`,
      headlineUr:
        stageId === 'seedling'
          ? `ننھے پودے کے لیے زیادہ نمی (${moisturePercent}%)`
          : stageId === 'fruiting'
          ? `لیٹ بلائیٹ اور پھل پھٹنے کا خطرہ (${moisturePercent}%)`
          : `فنگل بیماری کی زیادہ نمی (${moisturePercent}%)`,
      messageEn:
        stageId === 'seedling'
          ? `Soil moisture (${moisturePercent}%) exceeds the ${stage.moistureMin}–${stage.moistureMax}% seedling safe band. Pause watering to prevent root damping-off.`
          : `Moisture at ${moisturePercent}% is above the ${stage.moistureMin}–${stage.moistureMax}% target for ${stage.labelEn}. Hold irrigation and improve airflow.`,
      messageUr:
        stageId === 'seedling'
          ? `مٹی کی نمی (${moisturePercent}%) محفوظ حد ${stage.moistureMin}–${stage.moistureMax}% سے زیادہ ہے۔ جڑ گلنے سے بچانے کے لیے پانی روک دیں۔`
          : `نمی ${moisturePercent}% اس مرحلے کی حد ${stage.moistureMin}–${stage.moistureMax}% سے زیادہ ہے۔ پانی روکیں اور ہوا کا گزر بڑھائیں۔`,
      careFocusEn: stage.careFocusEn,
      careFocusUr: stage.careFocusUr,
      diseaseWatchEn: stage.diseaseWatchEn,
      diseaseWatchUr: stage.diseaseWatchUr,
      actionTarget: 'sensors',
      actionLabelEn: 'Adjust Sensors',
      actionLabelUr: 'سینسر درست کریں'
    };
  }

  if (moistureEnabled && moisturePercent < stage.moistureMin - 8) {
    return {
      stage,
      severity: 'action',
      statusLabelEn: 'Dry Stress Alert',
      statusLabelUr: 'خشکی الرٹ',
      headlineEn:
        stageId === 'flowering'
          ? `Dry Stress May Drop Blossoms (${moisturePercent}%)`
          : stageId === 'fruiting'
          ? `Blossom-End Rot Moisture Deficit (${moisturePercent}%)`
          : `Low Soil Moisture (${moisturePercent}%)`,
      headlineUr:
        stageId === 'flowering'
          ? `خشکی سے پھول جھڑنے کا خدشہ (${moisturePercent}%)`
          : stageId === 'fruiting'
          ? `پھل سڑنے اور خشکی کا خطرہ (${moisturePercent}%)`
          : `مٹی میں نمی کی کمی (${moisturePercent}%)`,
      messageEn: `Moisture dropped to ${moisturePercent}% (target ${stage.moistureMin}–${stage.moistureMax}%). Water slowly at the root zone to protect ${stage.labelEn.toLowerCase()} growth.`,
      messageUr: `مٹی کی نمی ${moisturePercent}% رہ گئی ہے (ہدف ${stage.moistureMin}–${stage.moistureMax}%)۔ ${stage.labelUr} کے مرحلے کے لیے جڑوں میں آہستہ پانی دیں۔`,
      careFocusEn: stage.careFocusEn,
      careFocusUr: stage.careFocusUr,
      diseaseWatchEn: stage.diseaseWatchEn,
      diseaseWatchUr: stage.diseaseWatchUr,
      actionTarget: 'sensors',
      actionLabelEn: 'Check Moisture',
      actionLabelUr: 'نمی چیک کریں'
    };
  }

  if (phEnabled && (soilPh < stage.phMin - 0.2 || soilPh > stage.phMax + 0.3)) {
    const isAcidic = soilPh < stage.phMin;
    return {
      stage,
      severity: 'watch',
      statusLabelEn: 'Soil pH Watch',
      statusLabelUr: 'پی ایچ الرٹ',
      headlineEn: isAcidic
        ? `Acidic Soil Limits Calcium (pH ${soilPh.toFixed(1)})`
        : `Alkaline Lockout Risk (pH ${soilPh.toFixed(1)})`,
      headlineUr: isAcidic
        ? `تیزابی مٹی میں کیلشیم کی کمی (pH ${soilPh.toFixed(1)})`
        : `زیادہ پی ایچ سے غذائی کمی (pH ${soilPh.toFixed(1)})`,
      messageEn: isAcidic
        ? `pH ${soilPh.toFixed(1)} is below the ${stage.phMin.toFixed(1)}–${stage.phMax.toFixed(1)} range for ${stage.labelEn}. Add agricultural lime or crushed eggshell compost.`
        : `pH ${soilPh.toFixed(1)} is above the ${stage.phMin.toFixed(1)}–${stage.phMax.toFixed(1)} band. Top-dress with acidic peat or elemental sulfur.`,
      messageUr: isAcidic
        ? `پی ایچ ${soilPh.toFixed(1)} اس مرحلے کی حد ${stage.phMin.toFixed(1)}–${stage.phMax.toFixed(1)} سے کم ہے۔ زرعی چونا یا کمپوسٹ شامل کریں۔`
        : `پی ایچ ${soilPh.toFixed(1)} مقررہ حد ${stage.phMin.toFixed(1)}–${stage.phMax.toFixed(1)} سے زیادہ ہے۔ نامیاتی کھاد یا سلفر استعمال کریں۔`,
      careFocusEn: stage.careFocusEn,
      careFocusUr: stage.careFocusUr,
      diseaseWatchEn: stage.diseaseWatchEn,
      diseaseWatchUr: stage.diseaseWatchUr,
      actionTarget: 'sensors',
      actionLabelEn: 'Tune Soil pH',
      actionLabelUr: 'پی ایچ درست کریں'
    };
  }

  return {
    stage,
    severity: 'optimal',
    statusLabelEn: 'On Track',
    statusLabelUr: 'مثالی حالت',
    headlineEn: stage.optimalHeadlineEn,
    headlineUr: stage.optimalHeadlineUr,
    messageEn: stage.optimalTipEn,
    messageUr: stage.optimalTipUr,
    careFocusEn: stage.careFocusEn,
    careFocusUr: stage.careFocusUr,
    diseaseWatchEn: stage.diseaseWatchEn,
    diseaseWatchUr: stage.diseaseWatchUr,
    actionTarget: 'scan',
    actionLabelEn: 'Check Leaf',
    actionLabelUr: 'پتا اسکین کریں'
  };
}
