// Bilingual Translation Dictionary (English and Urdu)
// Designed for clean UI and accessibility for Pakistan & global users

export type Language = 'en' | 'ur';

export interface Translations {
  nav: {
    brandSubtitle: string;
    whyLeaves: string;
    insideLeaf: string;
    howAiWorks: string;
    leafScanner: string;
    careLibrary: string;
    exhibition: string;
    checkLeafBtn: string;
    weather: string;
    smartSensors: string;
    credits: string;
  };
  hero: {
    kickerDomain: string;
    headlineStart: string;
    headlineHighlight: string;
    description: string;
    scanBtn: string;
    techBtn: string;
    videoGuideBtn: string;
    accuracyLabel: string;
    accuracySub: string;
    diseasesLabel: string;
    diseasesSub: string;
    instantLabel: string;
    instantSub: string;
    scrollPrompt: string;
  };
  plant3d: {
    badge: string;
    wholePlant: string;
    tomatoes: string;
    leaves: string;
    pauseSpin: string;
    spinPlant: string;
    checkLeaf: string;
    dragHint: string;
    clickTomatoHint: string;
    resetView: string;
    healthyMode: string;
    blightedMode: string;
    healSimulationBtn: string;
    healingToast: string;
  };
  weather: {
    badge: string;
    title: string;
    subtitle: string;
    tempLabel: string;
    humidityLabel: string;
    dewLabel: string;
    blightRiskLabel: string;
    blightRiskWarning: string;
    conditionSunny: string;
    conditionHumid: string;
    microclimatePunjab: string;
    microclimateSindh: string;
    microclimateGreenhouse: string;
  };
  sensors: {
    badge: string;
    title: string;
    subtitle: string;
    moistureLabel: string;
    phLabel: string;
    applyAndScanBtn: string;
  };
  architecture: {
    badge: string;
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
    step5Title: string;
    step5Desc: string;
    step6Title: string;
    step6Desc: string;
  };
  scanner: {
    badge: string;
    title: string;
    subtitle: string;
    tabSamples: string;
    tabUpload: string;
    tabCamera: string;
    quickVideoBtn: string;
    videoTutorialTitle: string;
    videoTutorialDesc: string;
    dragDropText: string;
    orBrowse: string;
    selectFileBtn: string;
    cameraPrompt: string;
    startCameraBtn: string;
    captureBtn: string;
    retakeBtn: string;
    analyzingTitle: string;
    notLeafTitle: string;
    notLeafAdvice: string;
    stage1Badge: string;
    stage2Badge: string;
    stage1Passed: string;
    notTomatoTitle: string;
    notTomatoAdvice: string;
    blurryTitle: string;
    blurryAdvice: string;
    unknownPlantTitle: string;
    unknownPlantAdvice: string;
    nonTomatoNotice: string;
    stage1VerifyTitle: string;
    successToastTitle: string;
    successToastDesc: string;
    reportTitle: string;
    confidenceLabel: string;
    damagedAreaLabel: string;
    riskLevelLabel: string;
    lowRisk: string;
    moderateRisk: string;
    highRisk: string;
    urgencyHigh: string;
    urgencyModerate: string;
    urgencyRoutine: string;
    whatHappening: string;
    symptomsTitle: string;
    treatmentTitle: string;
    printReportBtn: string;
    testAnotherBtn: string;
  };
  impact: {
    badge: string;
    title: string;
    subtitle: string;
    backboneTitle: string;
    backboneDesc: string;
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
    card3Title: string;
    card3Desc: string;
  };
  anatomy: {
    badge: string;
    title: string;
    subtitle: string;
  };
  pipeline: {
    badge: string;
    title: string;
    subtitle: string;
  };
  library: {
    badge: string;
    title: string;
    subtitle: string;
    allFilter: string;
    fungalFilter: string;
    bacterialFilter: string;
    viralFilter: string;
    healthyFilter: string;
    testThisLeafBtn: string;
  };
  qa: {
    badge: string;
    title: string;
    subtitle: string;
  };
  footer: {
    tagline: string;
    datasetLabel: string;
    exhibitionYear: string;
    safeAgri: string;
    pakistanBackbone: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      brandSubtitle: 'Tomato Plant Wellness AI',
      whyLeaves: 'Why Leaves Matter',
      insideLeaf: 'Inside the Leaf',
      howAiWorks: 'How AI Works',
      leafScanner: 'Leaf Scanner',
      careLibrary: 'Plant Care Guide',
      exhibition: 'Plant Care & Q&A',
      checkLeafBtn: 'Check a Tomato Leaf',
      weather: 'Garden Weather',
      smartSensors: 'Smart Sensors',
      credits: 'Credits'
    },
    hero: {
      kickerDomain: 'Smart Farming · Plant Wellness AI · Botanical Care',
      headlineStart: 'Smarter Care. ',
      headlineHighlight: 'Thriving Plants.',
      description: 'Discover a calm, mindful way to understand tomato plant wellness. AgroVision AI reads leaf photos gently and guides you with natural, earth-friendly care steps.',
      scanBtn: 'Scan a Tomato Leaf',
      techBtn: 'See How It Works',
      videoGuideBtn: 'Watch Video Guide',
      accuracyLabel: '89.2%',
      accuracySub: 'Field Accuracy (96.5% Lab)',
      diseasesLabel: '10 Care Guides',
      diseasesSub: 'Leaf Wellness & Natural Care',
      instantLabel: '< 1 Second',
      instantSub: 'Rapid Response',
      scrollPrompt: 'Explore living leaf science'
    },
    plant3d: {
      badge: 'Interactive 3D Tomato Plant',
      wholePlant: 'Whole Plant',
      tomatoes: 'Focus on Tomatoes',
      leaves: 'Inspect Leaves',
      pauseSpin: 'Pause Spin',
      spinPlant: 'Spin Plant',
      checkLeaf: 'Check a Leaf',
      dragHint: 'Drag to rotate 360°',
      clickTomatoHint: 'Click red tomato to zoom in',
      resetView: 'Reset View',
      healthyMode: 'Vigorous Green',
      blightedMode: 'Blighted Leaf Spots',
      healSimulationBtn: 'Simulate AI Scan & Recovery',
      healingToast: 'AI scanning plant... Healing blighted lesions into healthy emerald leaves!'
    },
    weather: {
      badge: 'Agricultural Microclimate',
      title: 'Tomato Garden Weather & Blight Risk',
      subtitle: 'Environmental humidity and leaf moisture determine whether fungal spores germinate. Monitor your microclimate to take preventative action.',
      tempLabel: 'Air Temperature',
      humidityLabel: 'Relative Humidity',
      dewLabel: 'Leaf Wetness / Dew',
      blightRiskLabel: 'Fungal Blight Risk',
      blightRiskWarning: 'Warning: Relative humidity > 68% promotes Alternaria and late blight spores. Water at the base and prune lower foliage.',
      conditionSunny: 'Optimal Daylight',
      conditionHumid: 'Humid & Overcast',
      microclimatePunjab: 'Punjab Agricultural Plains',
      microclimateSindh: 'Sindh Tomato Belt',
      microclimateGreenhouse: 'Protected Greenhouse / Tunnel'
    },
    sensors: {
      badge: 'Smart Sensor Integration',
      title: 'Virtual Soil Moisture & pH Telemetry',
      subtitle: 'Toggle simulated root-zone probes and tune field values to enrich tomato leaf disease diagnosis, separate fungal risk from abiotic nutrient stress, and tailor agronomic recovery.',
      moistureLabel: 'Soil Moisture Sensor',
      phLabel: 'Soil pH Sensor',
      applyAndScanBtn: 'Open Leaf Scanner with Sensors'
    },
    architecture: {
      badge: 'End-to-End System Pipeline',
      title: 'How AgroVision AI Processes a Leaf',
      subtitle: 'From local browser image capture through neural feature extraction to verified organic treatment prescriptions.',
      step1Title: 'User & Device Input',
      step1Desc: 'Farmer, gardener, or student points phone camera or uploads a leaf photo.',
      step2Title: 'Chlorophyll Validation',
      step2Desc: 'Filters non-leaf images and checks for green plant pigment.',
      step3Title: 'Color & Texture Normalization',
      step3Desc: 'Compensates for outdoor lighting, direct sunlight, and shadows.',
      step4Title: 'Neural Feature Extraction',
      step4Desc: 'Vision model traces spot geometries, concentric rings, and margin curling.',
      step5Title: 'Pathogen Classification',
      step5Desc: 'Maps features against 10 verified tomato disease classes with confidence scores.',
      step6Title: 'Bilingual Care Prescription',
      step6Desc: 'Delivers tailored organic remedies, neem spray guidance, and pruning advice.'
    },
    scanner: {
      badge: 'Leaf Scanner',
      title: 'Check Your Tomato Leaf',
      subtitle: 'Upload a leaf photo, use your smartphone camera, or click one of our test leaves below to see instant disease identification!',
      tabSamples: 'Test Leaves',
      tabUpload: 'Upload Photo',
      tabCamera: 'Live Camera',
      quickVideoBtn: 'Watch How to Scan (Video Guide)',
      videoTutorialTitle: 'Field Guide: How to Scan Leaves',
      videoTutorialDesc: 'Watch how our mobile leaf scanner helps detect plant sickness directly in the tomato garden.',
      dragDropText: 'Drag and drop your leaf photo here',
      orBrowse: 'or click to browse from your device',
      selectFileBtn: 'Choose Leaf Image',
      cameraPrompt: 'Point your camera closely at a tomato leaf with good natural lighting.',
      startCameraBtn: 'Open Camera',
      captureBtn: 'Capture & Scan Leaf',
      retakeBtn: 'Change Photo',
      analyzingTitle: 'Analyzing Leaf Pattern...',
      notLeafTitle: 'No Plant Leaf Detected',
      notLeafAdvice: "We couldn't find a plant leaf in this photo. Please upload a clear image of a leaf.",
      stage1Badge: 'Stage 1: Plant & Leaf Verification',
      stage2Badge: 'Stage 2: Tomato Pathogen Diagnosis',
      stage1Passed: 'Stage 1 Verified: Solanum lycopersicum (Tomato Leaf)',
      notTomatoTitle: 'This is not a tomato leaf.',
      notTomatoAdvice: 'This is not a tomato leaf. Please upload a clear image of a tomato leaf.',
      blurryTitle: 'The image is too blurry.',
      blurryAdvice: 'The image is too blurry. Please upload a clearer image.',
      unknownPlantTitle: 'Uncertain plant identification.',
      unknownPlantAdvice: 'Uncertain plant identification. This does not appear to be a tomato leaf. Please upload a clear image of a tomato leaf.',
      nonTomatoNotice: 'AgroVision AI enforces a strict plant-specific identification gatekeeper before disease prediction. Leaves of other species (such as mango or neem) are rejected to prevent inaccurate tomato disease diagnostics.',
      stage1VerifyTitle: 'Plant Identification Verification Protocol',
      successToastTitle: 'Analysis Completed Successfully!',
      successToastDesc: 'Leaf health and disease diagnosis report is ready below.',
      reportTitle: 'Diagnosis Report',
      confidenceLabel: 'Model Confidence',
      damagedAreaLabel: 'Affected Area',
      riskLevelLabel: 'Risk Level',
      lowRisk: 'Low Risk',
      moderateRisk: 'Moderate Risk',
      highRisk: 'High Risk',
      urgencyHigh: 'Immediate Action Needed',
      urgencyModerate: 'Treatment Recommended',
      urgencyRoutine: 'Routine Maintenance',
      whatHappening: 'Plant Health Summary',
      symptomsTitle: 'Visible Symptoms',
      treatmentTitle: 'Organic Care & Treatment Steps',
      printReportBtn: 'Print / Save Report',
      testAnotherBtn: 'Test Another Leaf'
    },
    impact: {
      badge: 'Agricultural Importance',
      title: 'Why Checking Tomato Leaves Matters',
      subtitle: 'Agriculture is the economic backbone of Pakistan. Early detection saves crops, protects livelihoods, and ensures clean harvests.',
      backboneTitle: 'Pakistan’s Agricultural Lifeline',
      backboneDesc: 'Over 65% of the rural population depends directly on farming. Tomato crops face devastating losses from blights each season. By catching symptoms within 48 hours, farmers protect their income without expensive chemical pesticides.',
      card1Title: 'Protect Harvests Early',
      card1Desc: 'Identifying leaf spots before spores spread across the stem protects the whole garden before tomatoes spoil.',
      card2Title: 'Save Water & Reduce Chemicals',
      card2Desc: 'Targeted organic treatments like neem spray prevent blanket chemical spraying, saving groundwater and soil quality.',
      card3Title: 'Empower Everyday Growers',
      card3Desc: 'Accessible tools turn any basic mobile device into an intelligent botanical diagnostic lab right in the field.'
    },
    anatomy: {
      badge: 'Plant Biology',
      title: 'Inside the Tomato Leaf',
      subtitle: 'Understanding leaf layers reveals how fungi penetrate tissues and how natural defenses fight back.'
    },
    pipeline: {
      badge: 'Computer Vision',
      title: 'How AI Analyzes Plant Health',
      subtitle: 'From pixel color analysis to neural spot detection, explore how machine learning classifies leaf conditions.'
    },
    library: {
      badge: 'Botanical Reference',
      title: 'Botanical Care Library',
      subtitle: 'Explore 10 essential tomato leaf profiles, natural patterns, and gentle organic care rituals.',
      allFilter: 'All Conditions',
      fungalFilter: 'Fungi / Molds',
      bacterialFilter: 'Bacteria',
      viralFilter: 'Viruses',
      healthyFilter: 'Healthy Leaves',
      testThisLeafBtn: 'Test in Scanner'
    },
    qa: {
      badge: 'Community Knowledge',
      title: 'Questions & Answers',
      subtitle: 'Practical explanations on leaf diagnosis, offline browser capability, and safe agriculture.'
    },
    footer: {
      tagline: 'Smarter Detection. Healthier Plants.',
      datasetLabel: 'PlantVillage Dataset & AgroVision Model',
      exhibitionYear: 'Exhibition 2026',
      safeAgri: 'Safe and clean agriculture built to make an impact',
      pakistanBackbone: 'Agriculture is the backbone of Pakistan. AgroVision was built to put practical botanical science directly into the hands of farmers, students, and communities.'
    }
  },
  ur: {
    nav: {
      brandSubtitle: 'ٹماٹر کے پودوں کی دیکھ بھال',
      whyLeaves: 'پتے کیوں اہم ہیں',
      insideLeaf: 'پتے کے اندر کیا ہے',
      howAiWorks: 'اے آئی کیسے کام کرتا ہے',
      leafScanner: 'پتے کا اسکینر',
      careLibrary: 'پودوں کی نگہداشت',
      exhibition: 'سوالات و رہنمائی',
      checkLeafBtn: 'پتا چیک کریں',
      weather: 'کھیت کا موسم',
      smartSensors: 'اسمارٹ سینسر',
      credits: 'ٹیم'
    },
    hero: {
      kickerDomain: 'جدید زراعت · ٹماٹر کی دیکھ بھال',
      headlineStart: 'بہتر دیکھ بھال۔ ',
      headlineHighlight: 'صحت مند پودے۔',
      description: 'ٹماٹر کے پودوں کی حفاظت کا آسان اور جدید طریقہ۔ بس پتے کی تصویر اپلوڈ کریں اور فوراً بیماری اور آسان قدرتی علاج دیکھیں۔',
      scanBtn: 'پتا اسکین کریں',
      techBtn: 'طریقہ دیکھیں',
      videoGuideBtn: 'ویڈیو دیکھیں',
      accuracyLabel: '89.2%',
      accuracySub: 'کھیت میں درستگی (96.5% لیب)',
      diseasesLabel: '10 بیماریاں',
      diseasesSub: 'پتوں کی صحت اور قدرتی علاج',
      instantLabel: '1 سیکنڈ میں',
      instantSub: 'فوری نتیجہ',
      scrollPrompt: 'پودے کی دنیا دیکھیں'
    },
    plant3d: {
      badge: 'تھری ڈی ٹماٹر پودا',
      wholePlant: 'پورا پودا',
      tomatoes: 'ٹماٹر دیکھیں',
      leaves: 'پتے دیکھیں',
      pauseSpin: 'روکیں',
      spinPlant: 'گھمائیں',
      checkLeaf: 'پتا چیک کریں',
      dragHint: 'ہر طرف سے دیکھنے کے لیے انگلی سے گھمائیں',
      clickTomatoHint: 'ٹماٹر قریب سے دیکھنے کے لیے کلک کریں',
      resetView: 'اصل حالت',
      healthyMode: 'صحت مند پتے',
      blightedMode: 'بیمار اور دھبے دار پتے',
      healSimulationBtn: 'اسکین اور صحت یابی دیکھیں',
      healingToast: 'اسکین جاری ہے... بیمار پتوں کو صحت مند سبز رنگ میں بدلا جا رہا ہے!'
    },
    weather: {
      badge: 'کھیت کا موسم',
      title: 'موسم اور بیماری کا خطرہ',
      subtitle: 'ہوا میں زیادہ نمی اور پتوں پر اوس فنگس پھیلنے کی بڑی وجہ ہیں۔ موسم دیکھ کر پودوں کو بچائیں۔',
      tempLabel: 'درجہ حرارت',
      humidityLabel: 'ہوا میں نمی',
      dewLabel: 'پتے پر اوس',
      blightRiskLabel: 'فنگس کا خطرہ',
      blightRiskWarning: 'احتیاط: نمی 68% سے زیادہ ہو تو جھلساؤ تیزی سے پھیلتا ہے۔ پانی صرف جڑوں کے پاس دیں، پتوں پر نہ ڈالیں۔',
      conditionSunny: 'ہلکی دھوپ',
      conditionHumid: 'نم موسم',
      microclimatePunjab: 'پنجاب کا علاقہ',
      microclimateSindh: 'سندھ کا علاقہ',
      microclimateGreenhouse: 'گرین ہاؤس / ٹنل'
    },
    sensors: {
      badge: 'اسمارٹ سینسر',
      title: 'مٹی کی نمی اور پی ایچ سینسر',
      subtitle: 'مٹی کی نمی اور پی ایچ سیٹ کریں تاکہ بیماری اور خوراک کی کمی میں صحیح فرق معلوم ہو سکے۔',
      moistureLabel: 'مٹی کی نمی',
      phLabel: 'مٹی کا پی ایچ',
      applyAndScanBtn: 'سینسر کے ساتھ پتا اسکین کریں'
    },
    architecture: {
      badge: 'خودکار نظام',
      title: 'اے آئی پتے کی جانچ کیسے کرتا ہے؟',
      subtitle: 'کیمرے کی تصویر سے لے کر قدرتی علاج بتانے تک کا آسان سفر۔',
      step1Title: 'تصویر کھینچیں',
      step1Desc: 'فون کیمرے سے ٹماٹر کے پتے کی صاف تصویر لیں۔',
      step2Title: 'پتے کی تصدیق',
      step2Desc: 'نظام چیک کرتا ہے کہ تصویر واقعی ٹماٹر کے پتے کی ہے۔',
      step3Title: 'روشنی اور رنگ کی جانچ',
      step3Desc: 'دھوپ اور سائے کو متوازن کر کے پتے کے دھبے دیکھتا ہے۔',
      step4Title: 'دھبوں کی پیمائش',
      step4Desc: 'ماڈل دھبوں کے گول نشان اور کناروں کا جائزہ لیتا ہے۔',
      step5Title: 'بیماری کی پہچان',
      step5Desc: '10 بیماریوں کے ڈیٹا سے ملا کر درست نتیجہ بتاتا ہے۔',
      step6Title: 'آسان قدرتی علاج',
      step6Desc: 'نیم کا اسپرے، پتے کاٹنا اور دیسی علاج بتاتا ہے۔'
    },
    scanner: {
      badge: 'لیف اسکینر',
      title: 'ٹماٹر کا پتا چیک کریں',
      subtitle: 'تصویر اپلوڈ کریں، کیمرہ استعمال کریں، یا نیچے دیے گئے پتے آزمائیں!',
      tabSamples: 'نمونے',
      tabUpload: 'اپلوڈ',
      tabCamera: 'کیمرہ',
      quickVideoBtn: 'ویڈیو گائیڈ',
      videoTutorialTitle: 'ویڈیو گائیڈ: پتا کیسے اسکین کریں',
      videoTutorialDesc: 'دیکھیں کہ موبائل سے کھیت میں پودے کی بیماری فوراً کیسے چیک کرتے ہیں۔',
      dragDropText: 'پتے کی تصویر یہاں رکھیں',
      orBrowse: 'یا گیلری سے چنیں',
      selectFileBtn: 'تصویر منتخب کریں',
      cameraPrompt: 'کیمرہ ٹماٹر کے پتے کے سامنے صاف روشنی میں رکھیں۔',
      startCameraBtn: 'کیمرہ چلائیں',
      captureBtn: 'تصویر لیں اور چیک کریں',
      retakeBtn: 'دوبارہ تصویر لیں',
      analyzingTitle: 'پتے کے رنگ اور دھبوں کی جانچ ہو رہی ہے...',
      notLeafTitle: 'پتے کی تصویر نہیں ملی',
      notLeafAdvice: 'اس تصویر میں پودے کا پتہ نظر نہیں آیا۔ براہِ کرم پتے کی صاف تصویر لگائیں۔',
      stage1Badge: 'مرحلہ 1: پتے کی تصدیق',
      stage2Badge: 'مرحلہ 2: بیماری کی تشخیص',
      stage1Passed: 'پتہ تصدیق ہو گیا: یہ ٹماٹر کا پتہ ہے',
      notTomatoTitle: 'یہ ٹماٹر کا پتہ نہیں ہے',
      notTomatoAdvice: 'یہ ٹماٹر کا پتہ نہیں لگتا۔ براہِ کرم ٹماٹر کے پتے کی صاف تصویر اپلوڈ کریں۔',
      blurryTitle: 'تصویر دھندلی ہے',
      blurryAdvice: 'تصویر بہت دھندلی ہے۔ براہِ کرم صاف تصویر اپلوڈ کریں۔',
      unknownPlantTitle: 'پودا پہچانا نہیں گیا',
      unknownPlantAdvice: 'پودے کی پہچان صاف نہیں ہوئی۔ براہِ کرم ٹماٹر کے پتے کی واضح تصویر لگائیں۔',
      nonTomatoNotice: 'اے آئی پہلے تصدیق کرتا ہے کہ پتہ ٹماٹر کا ہے یا نہیں، تاکہ غلط نتیجہ نہ نکلے۔',
      stage1VerifyTitle: 'پتے کی تصدیق کا نظام',
      successToastTitle: 'پتے کی جانچ مکمل ہو گئی!',
      successToastDesc: 'مکمل رپورٹ اور آسان علاج نیچے موجود ہے۔',
      reportTitle: 'تشخیصی رپورٹ',
      confidenceLabel: 'یقین کی شرح',
      damagedAreaLabel: 'متاثرہ حصہ',
      riskLevelLabel: 'خطرے کی سطح',
      lowRisk: 'کم خطرہ',
      moderateRisk: 'درمیانہ خطرہ',
      highRisk: 'زیادہ خطرہ',
      urgencyHigh: 'فوری علاج کریں',
      urgencyModerate: 'علاج ضروری ہے',
      urgencyRoutine: 'معمول کی دیکھ بھال',
      whatHappening: 'پودے میں کیا مسئلہ ہے؟',
      symptomsTitle: 'ظاہری علامات',
      treatmentTitle: 'آسان قدرتی علاج',
      printReportBtn: 'پرنٹ / محفوظ کریں',
      testAnotherBtn: 'دوسرا پتا چیک کریں'
    },
    impact: {
      badge: 'زرعی اہمیت',
      title: 'پتوں کا وقت پر معائنہ کیوں ضروری ہے؟',
      subtitle: 'پاکستان میں زراعت معیشت کی ریڑھ کی ہڈی ہے۔ بیماری کی وقت پر پہچان کسان کی فصل اور محنت بچاتی ہے۔',
      backboneTitle: 'پاکستان کی زراعت: کسان کی طاقت',
      backboneDesc: 'اگر ٹماٹر کی بیماری ابتدائی 2 دن میں پکڑ لی جائے تو کسان مہنگی کیمیائی دواؤں کے بغیر اپنی فصل بچا سکتے ہیں۔',
      card1Title: 'پھیلاؤ سے پہلے بچاؤ',
      card1Desc: 'فنگس پھیلنے سے پہلے بیمار پتے ہٹا کر پورا پودا بچایا جا سکتا ہے۔',
      card2Title: 'کم زہر، صاف ماحول',
      card2Desc: 'نیم کا اسپرے اور قدرتی دیکھ بھال زہریلے اسپرے کی ضرورت کو بہت کم کر دیتی ہے۔',
      card3Title: 'ہر موبائل پر لیبارٹری',
      card3Desc: 'یہ آسان ایپ ہر عام موبائل فون کو کھیت میں کسان کا مددگار بنا دیتی ہے۔'
    },
    anatomy: {
      badge: 'تھری ڈی پتا لیب',
      title: 'ٹماٹر کے پتے کے اندر کیا ہوتا ہے؟',
      subtitle: 'پتے کی 4 پرتیں دیکھیں اور سمجھیں کہ بیماری پتے پر کیسے اثر کرتی ہے۔'
    },
    pipeline: {
      badge: 'کمپیوٹر وژن',
      title: 'اے آئی بیماری کیسے پہچانتا ہے؟',
      subtitle: 'تصویر کے رنگ اور نشان دیکھ کر بیماری معلوم کرنے کا آسان طریقہ۔'
    },
    library: {
      badge: 'بیماریوں کی رہنمائی',
      title: 'بیماریوں کا اٹلس',
      subtitle: 'ٹماٹر کے پتوں کی 10 اہم بیماریاں، ان کی نشانیاں اور آسان قدرتی علاج۔',
      allFilter: 'تمام بیماریاں',
      fungalFilter: 'فنگس',
      bacterialFilter: 'بیکٹیریا',
      viralFilter: 'وائرس',
      healthyFilter: 'صحت مند پتے',
      testThisLeafBtn: 'اسکینر میں چیک کریں'
    },
    qa: {
      badge: 'سوال و جواب',
      title: 'عام سوالات',
      subtitle: 'پودوں کی جانچ اور محفوظ کاشتکاری کے بارے میں آسان معلومات۔'
    },
    footer: {
      tagline: 'بہتر تشخیص۔ صحت مند پودے۔',
      datasetLabel: 'پلانٹ ولیج ڈیٹا سیٹ اور ایگرو وژن ماڈل',
      exhibitionYear: 'نمائش 2026',
      safeAgri: 'محفوظ اور سرسبز زراعت',
      pakistanBackbone: 'ایگرو وژن کا مقصد جدید زرعی علم کو آسان الفاظ میں کسانوں اور طلبہ تک پہنچانا ہے۔'
    }
  }
};
