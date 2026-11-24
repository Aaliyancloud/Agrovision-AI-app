export type CourseId = 'basics' | 'diseases' | 'soil_climate';

export interface CourseGroup {
  id: CourseId;
  badgeEn: string;
  badgeUr: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  overviewVideoTitleEn?: string;
  overviewVideoTitleUr?: string;
  overviewYoutubeQuery?: string;
}

export const COURSE_GROUPS: CourseGroup[] = [
  {
    id: 'basics',
    badgeEn: 'Course 1',
    badgeUr: 'کورس 1',
    titleEn: 'Healthy Tomato Basics',
    titleUr: 'صحت مند ٹماٹر کے بنیادی اصول',
    descEn: 'Morning leaf checks, deep planting, clean pruning, staking, and blossom pollination.',
    descUr: 'صبح کا معائنہ، گہری پیوند کاری، شاخ تراشی، سہارا اور پھولوں سے بہتر پھل۔',
    overviewVideoTitleEn: 'Complete Tomato Pruning, Staking & Care Walkthrough',
    overviewVideoTitleUr: 'ٹماٹر کی دیکھ بھال، کٹائی اور سہارا لگانے کی مکمل ویڈیو رہنمائی',
    overviewYoutubeQuery: 'how to grow healthy tomatoes pruning staking beginners'
  },
  {
    id: 'diseases',
    badgeEn: 'Course 2',
    badgeUr: 'کورس 2',
    titleEn: 'Spot & Stop Leaf Diseases',
    titleUr: 'پتوں کی بیماریوں کی پہچان اور روک تھام',
    descEn: 'Step-by-step field ID for Early/Late Blight, Septoria, Leaf Mold, Bacteria, and Leaf Curl Virus.',
    descUr: 'ارلی و لیٹ بلائیٹ، سیپٹوریا، پھپھوندی، بیکٹیریا اور پتہ مروڑ وائرس کی مکمل پہچان و علاج۔',
    overviewVideoTitleEn: 'Identify & Treat Common Tomato Leaf Diseases Step by Step',
    overviewVideoTitleUr: 'ٹماٹر کے پتوں کی عام بیماریوں کی پہچان اور نامیاتی علاج',
    overviewYoutubeQuery: 'tomato leaf diseases identification early blight late blight curl virus'
  },
  {
    id: 'soil_climate',
    badgeEn: 'Course 3',
    badgeUr: 'کورس 3',
    titleEn: 'Soil, Water & Weather Care',
    titleUr: 'مٹی، پانی اور موسمی حفاظت',
    descEn: 'Root watering timing, stopping black fruit bottoms, compost nutrition, and heatwave care.',
    descUr: 'پانی کا صحیح وقت، پھل کا نچلا سرا گلنے سے بچاؤ، کھاد اور گرمی کی دیکھ بھال۔',
    overviewVideoTitleEn: 'Tomato Drip Watering, Calcium & Heat Protection Guide',
    overviewVideoTitleUr: 'ٹماٹر کو پانی دینے، کیلشیم اور گرمی سے بچاؤ کی ویڈیو',
    overviewYoutubeQuery: 'tomato watering blossom end rot mulch care'
  }
];

export interface LearningModule {
  id: string;
  courseId: CourseId;
  lessonNumber: number;
  category: 'botany' | 'diseases' | 'soil' | 'climate';
  durationMinutes: number;
  offlineReady: boolean;
  titleEn: string;
  titleUr: string;
  summaryEn: string;
  summaryUr: string;
  lookForEn: string;
  lookForUr: string;
  detailedGuideEn: string[];
  detailedGuideUr: string[];
  keyTakeawaysEn: string[];
  keyTakeawaysUr: string[];
  avoidMistakeEn: string;
  avoidMistakeUr: string;
  actionTipEn: string;
  actionTipUr: string;
  videoTitleEn: string;
  videoTitleUr: string;
  videoDuration: string;
  youtubeQuery: string;
}

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'tomato_botany_anatomy',
    courseId: 'basics',
    lessonNumber: 1,
    category: 'botany',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Morning Lower-Leaf Check',
    titleUr: 'صبح نچلے پتوں کا آسان معائنہ',
    summaryEn:
      'Lower leaves touch damp soil splash first, so checking them in morning daylight catches trouble 5–7 days before fruit gets harmed.',
    summaryUr:
      'نچلے پتے مٹی کے چھینٹوں سے سب سے پہلے متاثر ہوتے ہیں، اس لیے صبح کی روشنی میں انہیں دیکھنا بیماری کو 5 سے 7 دن پہلے پکڑ لیتا ہے۔',
    lookForEn:
      'Turn over the oldest bottom 2–3 leaves and inspect both sides for tiny dark spots, yellow rings, dusty white patches, or fine spider webbing underneath.',
    lookForUr:
      'سب سے نیچے والے پرانے 2 سے 3 پتوں کو پلٹ کر دونوں طرف دیکھیں: چھوٹے سیاہ دھبے، پیلے حلقے، سفید تہہ یا باریک جالا تو نہیں ہے۔',
    detailedGuideEn: [
      'Best time to scout: Walk rows between 7:00 AM and 10:00 AM after harsh sun angle softens so faint yellow halos stand out clearly.',
      'Leaf zone order: Always check Ground Zone (bottom 15 cm) -> Middle Canopy -> Fresh Top Tips so you know whether trouble comes from soil splash or flying insects.',
      'Clean confirmation: Snap a close-up photo in AgroVision Scanner whenever a spot is wider than a lentil grain so you catch fungal spread on Day 1.'
    ],
    detailedGuideUr: [
      'معائنے کا بہترین وقت: صبح 7 سے 10 بجے کے درمیان ہلکی دھوپ میں قطاروں کا چکر لگائیں تاکہ ہلکے پیلے دھبے صاف نظر آئیں۔',
      'پودے کے حصے دیکھنے کی ترتیب: پہلے زمین سے 15 سینٹی میٹر تک کے نچلے پتے، پھر درمیانے پتے، اور آخر میں اوپر کی نئی کونپلیں چیک کریں۔',
      'فوری تصدیق: اگر دال کے دانے سے بڑا نیا دھبہ نظر آئے تو فوراً ایگرو وژن اسکینر سے تصویر لے کر جانچ کریں۔'
    ],
    keyTakeawaysEn: [
      'Tomato leaves have deep toothed edges and soft fuzz along stems—other garden leaves look smoother.',
      'Nine out of ten fungal leaf spots start near the soil line where watering splashes dirt upward.',
      'Checking just 3 bottom leaves per row every morning protects whole harvests.'
    ],
    keyTakeawaysUr: [
      'ٹماٹر کے پتوں کے کنارے کٹے ہوئے اور تنے پر باریک روئیں ہوتے ہیں۔',
      'زیادہ تر بیماریاں زمین کے قریب سے شروع ہوتی ہیں جہاں پانی کے چھینٹے لگتے ہیں۔',
      'ہر صبح قطار کے نچلے 3 پتوں کو دیکھ لینا پوری فصل کو بچا لیتا ہے۔'
    ],
    avoidMistakeEn: 'Do not only look at the bright green top leaves—disease hides low near the damp soil first.',
    avoidMistakeUr: 'صرف اوپر کے سبز پتوں کو نہ دیکھیں، بیماری ہمیشہ نیچے زمین کے قریب سے شروع ہوتی ہے۔',
    actionTipEn: 'Walk your row in morning light today and inspect 3 oldest bottom leaves.',
    actionTipUr: 'آج صبح کی روشنی میں قطار دیکھیں اور نیچے کے 3 پرانے پتے پلٹ کر چیک کریں۔',
    videoTitleEn: 'How to Scout Tomato Lower Leaves for Early Disease Signs',
    videoTitleUr: 'ٹماٹر کے نچلے پتوں میں بیماری کی ابتدائی علامات کیسے دیکھیں',
    videoDuration: '4:30',
    youtubeQuery: 'how to inspect tomato lower leaves for disease signs'
  },
  {
    id: 'seedling_vegetative_care',
    courseId: 'basics',
    lessonNumber: 2,
    category: 'botany',
    durationMinutes: 5,
    offlineReady: true,
    titleEn: 'Trimming Bottom Shoots & Staking',
    titleUr: 'نیچے کی شاخیں صاف کرنا اور سہارا لگانا',
    summaryEn:
      'Removing low crowded leaves and tying tall stems to bamboo stakes lets warm breeze dry leaves quickly after morning dew.',
    summaryUr:
      'نیچے کے گنجان پتے صاف کرنے اور پودے کو بانس کا سہارا دینے سے ہوا اور دھوپ پودے کو خشک اور صحت مند رکھتی ہے۔',
    lookForEn:
      'Look in the V-shaped fork between the main central stem and each big leaf branch for small extra angled shoots ("suckers").',
    lookForUr:
      'مرکزی تنے اور بڑی شاخ کے درمیان V کونے سے نکلنے والی چھوٹی فالتو شاخیں (سکر) تلاش کریں جو پودے کی طاقت بانٹتی ہیں۔',
    detailedGuideEn: [
      'Lower-leaf skirt clearing: When the tomato plant reaches 35–45 cm tall, snip off all leaves within 15–20 cm (one hand-span) of the soil so mud cannot splash onto foliage.',
      'Pinching side suckers: Gently bend and pinch small suckers under 5 cm long with clean dry fingers; for thicker shoots use alcohol-wiped shears.',
      'Soft figure-8 tying: Tie stems to bamboo or wire stakes every 25 cm using soft cloth strips or jute twine in a loose figure-8 loop so thick stems are never strangled.'
    ],
    detailedGuideUr: [
      'نچلے پتے صاف کرنا: جب پودا 35 سے 45 سینٹی میٹر کا ہو جائے تو زمین سے ایک بالشت (15–20 سینٹی میٹر) تک کے تمام نچلے پتے اتار دیں۔',
      'فالتو شاخیں توڑنا: 5 سینٹی میٹر سے چھوٹی بغل کی شاخیں صاف خشک انگلیوں سے توڑیں اور بڑی شاخ کے لیے صاف قینچی استعمال کریں۔',
      'نرم بندھائی: ہر 25 سینٹی میٹر پر بانس کے ساتھ نرم کپڑے یا سوتلی سے ڈھیلا بندھ لگائیں تاکہ تنا بڑھنے پر دبے نہیں۔'
    ],
    keyTakeawaysEn: [
      'Clear bottom foliage touching soil once plants grow knee-high.',
      'Pinch suckers during sunny morning hours so stem cuts seal dry before nightfall.',
      'Leave 45–60 cm between plants so morning dew evaporates fast.'
    ],
    keyTakeawaysUr: [
      'پودا گھٹنے جتنا اونچا ہو جائے تو زمین کو چھونے والے نچلے پتے اتار دیں۔',
      'فالتو بغل کی شاخیں دھوپ میں صاف ہاتھوں سے توڑیں تاکہ زخم اسی دن خشک ہو جائے۔',
      'پودوں کے درمیان 45–60 سینٹی میٹر فاصلہ رکھیں تاکہ ہوا شبنم کو جلد سکھا دے۔'
    ],
    avoidMistakeEn: 'Never trim or pinch tomato stems while leaves are wet with morning dew or rain—bacteria spread fast through wet cuts.',
    avoidMistakeUr: 'گیلے پتوں یا بارش کے فوراً بعد پودوں کی کٹائی ہرگز نہ کریں۔',
    actionTipEn: 'Sanitize pruning shears or wash hands with soap between sick and healthy beds.',
    actionTipUr: 'بیمار اور صحت مند پودے کے درمیان قینچی یا ہاتھ صابن سے ضرور دھوئیں۔',
    videoTitleEn: 'Pruning Tomato Suckers & Staking Step-by-Step Guide',
    videoTitleUr: 'ٹماٹر کی فالتو شاخیں کاٹنے اور بانس لگانے کا مکمل طریقہ',
    videoDuration: '6:15',
    youtubeQuery: 'how to prune tomato suckers and stake tomato plants'
  },
  {
    id: 'tomato_flower_pollination',
    courseId: 'basics',
    lessonNumber: 3,
    category: 'botany',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Helping Flowers Set Red Tomatoes',
    titleUr: 'پھولوں سے زیادہ ٹماٹر بنانا',
    summaryEn:
      'Yellow tomato flowers hold both male and female parts—a gentle midday tap and cool afternoon shade prevent blossom drop and boost fruit.',
    summaryUr:
      'ٹماٹر کے پیلے پھولوں کو دوپہر کے وقت ہلکا سا ہلانا اور متوازن پانی دینا پھول جھڑنے سے بچاتا اور زیادہ ٹماٹر بناتا ہے۔',
    lookForEn:
      'Bright open yellow petals with petals curled slightly back; if little flower stems turn yellow at the joint and snap off, heat or dry soil is stressing the plant.',
    lookForUr:
      'کھلے چمکیلے پیلے پھول دیکھیں؛ اگر ڈنڈی کے جوڑ سے پھول پیلا ہو کر گر رہا ہو تو گرمی یا پانی کی کمی کی علامت ہے۔',
    detailedGuideEn: [
      'Midday pollen release: Between 11:00 AM and 1:30 PM when humidity is moderate, lightly tap the bamboo stake or flower truss for 3 seconds to shake pollen onto the flower tip.',
      'Preventing blossom drop: Daytime temperatures above 35°C or nights above 25°C make pollen sticky—drape 30% green shade net over tunnels or raised beds during peak afternoon sun.',
      'Boost fruit growth: Switch from high-nitrogen leafy manure to potassium-rich compost tea or wood-ash extract once the first yellow flowers appear.'
    ],
    detailedGuideUr: [
      'دوپہر کا ہلکا جھٹکا: صبح 11 سے دوپہر 1:30 بجے کے درمیان بانس یا پھولوں کی شاخ کو 3 سیکنڈ ہلکا سا ہلائیں تاکہ زرپاشی مکمل ہو۔',
      'پھول جھڑنے سے بچاؤ: 35°C سے زیادہ دن کی گرمی میں دوپہر کو 30 فیصد سبز جالی کا سایہ دیں تاکہ پھول نہ جلیں۔',
      'پھل کی خوراک: پہلے پیلے پھول آتے ہی زیادہ نائٹروجن والی کھاد روک کر پوٹاش والی کھاد یا راکھ کا ہلکا محلول دیں۔'
    ],
    keyTakeawaysEn: [
      'In tunnels or calm courtyards, gentle midday tapping turns far more blossoms into firm fruit.',
      'Even root moisture keeps flower joints strong so blooms stay attached.',
      'Pick ripe red tomatoes promptly so the vine channels energy into new green fruit.'
    ],
    keyTakeawaysUr: [
      'ٹنل یا بند جگہ میں دوپہر کو پھولوں والی شاخ کو ہلکا سا ہلانے سے زیادہ پھل بنتا ہے۔',
      'جڑوں میں متوازن نمی پھولوں کو گرنے سے روکتی ہے۔',
      'سرخ پکے ٹماٹر وقت پر توڑ لیں تاکہ نئے ٹماٹروں کو خوراک ملے۔'
    ],
    avoidMistakeEn: 'Do not spray water directly onto open yellow flowers—wet pollen clumps together and fails to pollinate.',
    avoidMistakeUr: 'کھلے ہوئے پیلے پھولوں پر اوپر سے پانی نہ چھڑکیں۔',
    actionTipEn: 'Tap main stakes gently around noon today when flowers are open and dry.',
    actionTipUr: 'آج دوپہر کے وقت جب پھول کھلے اور خشک ہوں تو بانس یا تنے کو ہلکا ہلائیں۔',
    videoTitleEn: 'How to Hand-Pollinate Tomato Flowers & Stop Blossom Drop',
    videoTitleUr: 'ٹماٹر کے پھولوں کی زرپاشی اور پھول گرنے سے روکنے کا طریقہ',
    videoDuration: '5:10',
    youtubeQuery: 'how to pollinate tomato flowers stop blossom drop'
  },
  {
    id: 'seedling_transplant_feeding',
    courseId: 'basics',
    lessonNumber: 4,
    category: 'botany',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Deep Transplanting & First Feeding',
    titleUr: 'پنیری گہری لگانا اور پہلی خوراک',
    summaryEn:
      'Burying two-thirds of a young tomato stem sideways or deep lets white root bumps sprout along the whole stem for doubly strong plants.',
    summaryUr:
      'نئے پودے کے تنے کا دو تہائی حصہ مٹی میں دبا کر لگانے سے پورے تنے پر نئی جڑیں نکلتی ہیں اور پودا مضبوط بنتا ہے۔',
    lookForEn:
      'Notice the tiny pale bumps along a young tomato stem—every bump becomes a strong feeding root when buried in warm moist soil.',
    lookForUr:
      'نئے تنے پر موجود باریک ابھار دیکھیں—مٹی میں دبنے پر ہر ابھار ایک مضبوط نئی جڑ بن جاتا ہے۔',
    detailedGuideEn: [
      'Hardening seedlings: 5 days before planting outdoors, set nursery trays in dappled morning sun and wind for 2 hours daily, gradually increasing to full sun.',
      'Deep root planting: Pinch off the bottom two seed-leaves and bury the stem deeply so only the top cluster of 3–4 healthy leaflets sits above soil.',
      'Starter feed timing: Water immediately with plain lukewarm water; wait 10–14 days until new roots anchor before giving dilute compost tea or balanced organic fertilizer.'
    ],
    detailedGuideUr: [
      'پنیری مضبوط کرنا: کھیت یا گملے میں لگانے سے 5 دن پہلے پنیری کو روز تھوڑی دیر صبح کی دھوپ اور ہوا میں رکھیں۔',
      'گہری پیوند کاری: نیچے کے چھوٹے ابتدائی پتے ہٹا کر تنے کو گہرا دبائیں تاکہ صرف اوپر کے 3–4 سبز پتے باہر رہیں۔',
      'پہلی کھاد کا وقت: لگانے کے فوراً بعد سادہ پانی دیں، اور 10 سے 14 دن بعد نئی جڑیں چلنے پر ہلکی دیسی کھاد دیں۔'
    ],
    keyTakeawaysEn: [
      'Tomato stems root along buried sections, anchoring against wind and heatwaves.',
      'Plant seedlings in the late afternoon (4–6 PM) so roots settle overnight without sun wilt.',
      'Place straw mulch 3 days after planting to shield topsoil from crusting.'
    ],
    keyTakeawaysUr: [
      'گہری لگانے سے پودے میں دوگنی جڑیں بنتی ہیں جو گرمی اور ہوا کا مقابلہ کرتی ہیں۔',
      'پنیری ہمیشہ شام 4 سے 6 بجے کے درمیان لگائیں تاکہ رات کو جڑیں سیٹ ہو جائیں۔',
      'لگانے کے 3 دن بعد پودے کے گرد خشک بھوسا بچھا دیں۔'
    ],
    avoidMistakeEn: 'Never bury seedlings shallowly in hard dry clods or fertilize with strong chemical pellets on Day 1.',
    avoidMistakeUr: 'پنیری کو پہلے ہی دن تیز کیمیائی کھاد یا سخت خشک مٹی میں سطحی طور پر نہ لگائیں۔',
    actionTipEn: 'Check newly planted stems—hill loose composted soil around weak leaning stalks.',
    actionTipUr: 'اگر نئے پودے کا تنا جھک رہا ہو تو گرد ہلکی بھربھری مٹی چڑھا دیں۔',
    videoTitleEn: 'How to Transplant Tomato Seedlings Deeply for Strong Roots',
    videoTitleUr: 'مضبوط جڑوں کے لیے ٹماٹر کی پنیری گہری لگانے کا طریقہ',
    videoDuration: '5:45',
    youtubeQuery: 'how to plant tomato seedlings deep strong roots'
  },
  {
    id: 'fungal_blight_differentiation',
    courseId: 'diseases',
    lessonNumber: 1,
    category: 'diseases',
    durationMinutes: 5,
    offlineReady: true,
    titleEn: 'Early vs. Late Blight Made Simple',
    titleUr: 'ارلی اور لیٹ بلائیٹ کی آسان پہچان',
    summaryEn:
      'Learn the exact Day-1 visual cues and rapid rescue steps that tell slow Early Blight apart from fast-spreading Late Blight.',
    summaryUr:
      'خشک گول دائروں والے ارلی بلائیٹ اور تیز پھیلنے والے گیلے لیٹ بلائیٹ میں فوراً فرق اور بچاؤ کا عملی طریقہ سیکھیں۔',
    lookForEn:
      'Early Blight makes dry dark-brown bullseye rings surrounded by a bright yellow halo on old bottom leaves. Late Blight makes dark bruised wet patches on upper leaves and stems with pale white mold underneath after damp nights.',
    lookForUr:
      'ارلی بلائیٹ میں نیچے کے پتوں پر خشک بھورے گول دائرے اور پیلا ہالہ ہوتا ہے۔ لیٹ بلائیٹ میں اوپری پتوں پر گیلے سیاہ داغ اور نیچے سفید روئی جیسی تہہ آتی ہے۔',
    detailedGuideEn: [
      'Day-1 Check: Hold the leaf up to daylight. Concentric "target board" lines = Early Blight (Alternaria). Rapid dark watery blotches turning mushy brown = Late Blight (Phytophthora).',
      'Early Blight Organic Control: Snip off infected bottom leaves into a sealed bag. Mix 5 ml cold-pressed neem oil + 2 ml mild liquid soap in 1 liter water and mist undersides early morning every 7 days.',
      'Late Blight Emergency Action: Because Late Blight spores fly on damp wind and kill plants within 4–6 days, pull heavily black-stemmed plants immediately and apply protective organic copper spray to healthy neighbors before rain.'
    ],
    detailedGuideUr: [
      'پہلے دن کی پہچان: پتے کو روشنی میں دیکھیں؛ نشانے جیسے گول دائرے ارلی بلائیٹ ہیں، جبکہ گیلے سیاہ پھیلتے دھبے لیٹ بلائیٹ کی نشانی ہیں۔',
      'ارلی بلائیٹ کا علاج: خراب نچلے پتے شاپر میں کاٹ کر تلف کریں۔ 1 لیٹر پانی میں 5 ملی لیٹر نیم کا تیل اور چند قطرے صابن ملا کر صبح ہلکا اسپرے کریں۔',
      'لیٹ بلائیٹ پر فوری قدم: لیٹ بلائیٹ نمی میں 4 سے 6 دن میں پودا ختم کر دیتا ہے، اس لیے شدید بیمار پودا فوراً نکال کر باقی پودوں پر حفاظتی کاپر اسپرے کریں۔'
    ],
    keyTakeawaysEn: [
      'Early Blight creeps upward slowly from old bottom leaves—early pruning + neem keeps vines producing.',
      'Late Blight accelerates in cool wet weather (15–22°C, high humidity)—act the very first morning you see bruised lesions.',
      'Never throw blighted leaves onto home compost piles; seal in trash or bury deep.'
    ],
    keyTakeawaysUr: [
      'ارلی بلائیٹ آہستہ نیچے سے اوپر آتا ہے: خراب پتے کاٹ کر نیم یا تانبے کا اسپرے کریں۔',
      'لیٹ بلائیٹ ٹھنڈی نمی میں بہت تیز پھیلتا ہے: شدید بیمار پودا فوراً الگ کر دیں۔',
      'کٹے ہوئے بیمار پتے کھاد کے ڈھیر میں نہ ڈالیں، کھیت سے دور تلف کریں۔'
    ],
    avoidMistakeEn: 'Never water overhead late in the afternoon or evening—wet night leaves invite blight spores to sprout overnight.',
    avoidMistakeUr: 'شام کو پتوں پر پانی بالکل نہ دیں کیونکہ رات بھر کی نمی جھلساؤ پھیلاتی ہے۔',
    actionTipEn: 'Mulch soil with 5 cm dry wheat straw today so watering drops never splash mud onto leaves.',
    actionTipUr: 'آج پودوں کے نیچے خشک بھوسا بچھائیں تاکہ پانی کے چھینٹے پتوں پر نہ لگیں۔',
    videoTitleEn: 'Early Blight vs Late Blight on Tomatoes: Identification & Organic Control',
    videoTitleUr: 'ٹماٹر میں ارلی اور لیٹ بلائیٹ کی پہچان اور نامیاتی علاج',
    videoDuration: '7:20',
    youtubeQuery: 'tomato early blight vs late blight identification treatment'
  },
  {
    id: 'septoria_leaf_mold_target',
    courseId: 'diseases',
    lessonNumber: 2,
    category: 'diseases',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Septoria Gray Dots & Yellow Leaf Mold',
    titleUr: 'سیپٹوریا دھبے اور پیلی لیف مولڈ',
    summaryEn:
      'Spot tiny peppered gray-centered dots after rainy weeks versus fuzzy olive-yellow mold inside warm plastic tunnels.',
    summaryUr:
      'بارش کے بعد بننے والے باریک سرمئی دھبوں اور گرین ہاؤس کی مخملی پھپھوندی کی تفصیلی پہچان و حل۔',
    lookForEn:
      'Septoria shows dozens of 2–3 mm round dots with pale gray centers and dark brown edges (often with tiny black pepper specks inside). Leaf Mold shows pale yellow blotches on top and velvety olive-brown spores underneath.',
    lookForUr:
      'سیپٹوریا میں 2 سے 3 ملی میٹر کے درجنوں گول دھبے ہوتے ہیں جن کا بیچ سفید سرمئی اور کنارے گہرے ہوتے ہیں۔ لیف مولڈ میں اوپر پیلے داغ اور نیچے زیتونی تہہ ہوتی ہے۔',
    detailedGuideEn: [
      'Why Septoria breaks out: Fungus sleeps in winter weed scraps and bounces up onto lower leaves during warm rainy spells.',
      'Fixing Leaf Mold inside tunnels: Relative humidity over 85% triggers mold spores. Roll up plastic sidewalls by 7:30 AM and avoid crowding more than 2 plants per square meter.',
      'Simple Kitchen/Organic Spray: Mixing 1 tablespoon baking soda + 1 teaspoon vegetable oil + few drops mild soap per 2 liters of water raises leaf surface pH to slow fungal spores (spot-test 1 leaf first).'
    ],
    detailedGuideUr: [
      'سیپٹوریا پھیلنے کی وجہ: یہ پھپھوندی پرانے پودوں کے کچرے میں رہتی ہے اور بارش کے چھینٹوں سے نچلے پتوں پر لگتی ہے۔',
      'ٹنل میں لیف مولڈ کا حل: 85 فیصد سے زیادہ نمی اس بیماری کو بڑھاتی ہے۔ صبح 7:30 بجے ٹنل کے پردے کھولیں اور پودے زیادہ گنجان نہ لگائیں۔',
      'آسان حفاظتی اسپرے: متاثرہ نچلے پتے صاف کر کے صبح کے وقت ہلکا نامیاتی کاپر یا نیم اسپرے کریں۔'
    ],
    keyTakeawaysEn: [
      'Septoria rarely rots tomato fruit directly, but stripping leaves weakens sun protection and yield.',
      'Leaf Mold thrives in calm stagnant greenhouse air—morning airflow cures 70% of mild cases.',
      'Rotate tomato beds away from potatoes, peppers, and eggplants for 2–3 seasons.'
    ],
    keyTakeawaysUr: [
      'سیپٹوریا پتے گرا کر پیداوار کم کرتا ہے—متاثرہ پتے فوراً ہٹا دیں۔',
      'ٹنل میں صبح سویرے تازہ ہوا گزارنا لیف مولڈ کو روکنے کا بہترین طریقہ ہے۔',
      'ٹماٹر کی جگہ ہر سال آلو یا مرچ کی فصل سے بدل کر لگائیں۔'
    ],
    avoidMistakeEn: 'Do not leave greenhouse curtains sealed closed on warm humid mornings past sunrise.',
    avoidMistakeUr: 'سورج نکلنے کے بعد ٹنل یا گرین ہاؤس کو زیادہ دیر بند نہ رکھیں۔',
    actionTipEn: 'Open side vents early and water strictly at soil level around plant roots.',
    actionTipUr: 'صبح سورج نکلتے ہی ہوا کے لیے کنارے کھولیں اور پانی صرف جڑ میں دیں۔',
    videoTitleEn: 'How to Stop Septoria Leaf Spot & Tomato Leaf Mold Naturally',
    videoTitleUr: 'سیپٹوریا لیف اسپاٹ اور لیف مولڈ سے قدرتی بچاؤ کی ویڈیو',
    videoDuration: '5:50',
    youtubeQuery: 'septoria leaf spot tomato leaf mold organic treatment'
  },
  {
    id: 'bacterial_canker_hygiene',
    courseId: 'diseases',
    lessonNumber: 3,
    category: 'diseases',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Stopping Black Greasy Leaf Spots',
    titleUr: 'پتوں کے سیاہ چپچپے دھبوں سے بچاؤ',
    summaryEn:
      'Warm thunderstorms spread greasy black bacterial spots—field hygiene and tool disinfection stop infection from marching down every row.',
    summaryUr:
      'گرم بارش کے بعد سیاہ چپچپے بیکٹیریل دھبے پھیلتے ہیں جنہیں صفائی اور احتیاط سے پوری قطار میں پھیلنے سے روکا جا سکتا ہے۔',
    lookForEn:
      'Small dark greasy or water-soaked specks across leaves, plus raised scab-like black bumps on green tomato fruit.',
    lookForUr:
      'پتوں پر سیاہ یا گہرے بھورے چپچپے نقطے جو خشک ہو کر باریک سوراخ بنا دیتے ہیں، اور کچے پھل پر ابھرے ہوئے سیاہ داغ۔',
    detailedGuideEn: [
      'Tell Bacteria from Fungus: Fungal rings look dry and papery; bacterial spots look greasy wet around the rim and sometimes tear leaving "shot-holes".',
      'Work-Order Rule: Always inspect, tie, and harvest healthy beds FIRST, then handle symptomatic beds last.',
      'Tool Disinfection: Wipe shears with 70% rubbing alcohol or diluted 1:10 household bleach between beds so bacteria never hitchhike.'
    ],
    detailedGuideUr: [
      'بیکٹیریا اور پھپھوندی کا فرق: پھپھوندی کے دھبے خشک کاغذ جیسے ہوتے ہیں جبکہ بیکٹیریا کے دھبے چپچپے گیلے اور کناروں سے پھٹے ہوئے نظر آتے ہیں۔',
      'کام کرنے کی ترتیب: ہمیشہ پہلے صحت مند قطاروں میں کام کریں اور مشکوک یا بیمار پودوں کے پاس سب سے آخر میں جائیں۔',
      'اوزاروں کی صفائی: ایک قطار سے دوسری قطار میں جانے سے پہلے قینچی یا چاقو کو اسپرٹ یا صاف صابن سے دھو لیں۔'
    ],
    keyTakeawaysEn: [
      'Bacteria ride easily inside dew and rain droplets across wet clothing and hands.',
      'Removing heavily spotted lower branches reduces bacterial load.',
      'Early copper soap spray forms a protective barrier on healthy leaves before rainstorms.'
    ],
    keyTakeawaysUr: [
      'بیکٹیریا گیلے پتوں پر ہاتھ یا کپڑے لگنے سے ایک پودے سے دوسرے پودے پر جاتے ہیں۔',
      'پہلے صحت مند قطاروں میں کام کریں اور بیمار پودوں کے پاس آخر میں جائیں۔',
      'بارش سے پہلے ہلکا نامیاتی کاپر اسپرے پھیلاؤ روکنے میں مدد دیتا ہے۔'
    ],
    avoidMistakeEn: 'Never walk through, prune, or pick tomatoes while morning dew or rainwater sits on the leaves.',
    avoidMistakeUr: 'جب پتے گیلے ہوں تو ان کے درمیان چلنے، باندھنے یا تڑائی سے پرہیز کریں۔',
    actionTipEn: 'Wait until morning leaves feel dry before tying strings or picking tomatoes.',
    actionTipUr: 'صبح کی شبنم سوکھنے کے بعد ہی فصل میں کام شروع کریں۔',
    videoTitleEn: 'Bacterial Spot & Speck on Tomatoes: Prevention & Field Hygiene',
    videoTitleUr: 'ٹماٹر میں بیکٹیریل اسپاٹ کی پہچان اور کھیت کی صفائی',
    videoDuration: '5:25',
    youtubeQuery: 'tomato bacterial spot treatment prevention field hygiene'
  },
  {
    id: 'viral_tylcv_vectors',
    courseId: 'diseases',
    lessonNumber: 4,
    category: 'diseases',
    durationMinutes: 5,
    offlineReady: true,
    titleEn: 'Curled Yellow Tops & Whiteflies',
    titleUr: 'پتوں کا پیلا مروڑ اور سفید مکھی کا کنٹرول',
    summaryEn:
      'Stunted, upward-curled yellow leaves at vine tops are carried by tiny whiteflies—blocking whiteflies early saves your entire harvest.',
    summaryUr:
      'اوپری پتوں کا مڑنا اور پیلا ہونا سفید مکھی کے وائرس سے ہوتا ہے—کیڑوں کو شروع میں روکنا پوری فصل بچاتا ہے۔',
    lookForEn:
      'Tiny snowy-white moths fluttering under young leaves when tapped, paired with stiff, cupped, thick yellow-edged top shoots and few flowers.',
    lookForUr:
      'شاخ ہلانے پر اڑتی ہوئی باریک سفید مکھیاں اور اوپر کی طرف مڑے ہوئے پیلے کناروں والے سخت چھوٹے پتے۔',
    detailedGuideEn: [
      'Why no spray cures the virus: Leaf Curl Virus lives inside the plant sap—chemical fungicides do nothing. Protecting healthy neighbors by controlling whiteflies is everything.',
      '3-Step Whitefly Defense: (1) Hang bright yellow sticky cards 10 cm above plant tops; (2) Spray undersides with 5 ml neem oil + soap early morning every 5 days; (3) Pull thorny/broadleaf weeds within 3 meters of beds.',
      'If a young seedling catches severe curl before flowering: Remove and bag that one plant right away so whiteflies stop feeding on it and spreading virus to 20 healthy plants.'
    ],
    detailedGuideUr: [
      'دوا کیوں وائرس ختم نہیں کرتی: وائرس پودے کے رس میں چلا جاتا ہے، اس لیے فنگس اسپرے کام نہیں آتا—اصل حل سفید مکھی کو روکنا ہے۔',
      'سفید مکھی سے بچاؤ کے 3 قدم: (1) پودوں کے اوپر پیلے چپچپے کارڈ لگائیں؛ (2) ہر 5 دن بعد پتوں کے نیچے نیم کا تیل اسپرے کریں؛ (3) کھیت کے گرد 3 میٹر تک جڑی بوٹیاں صاف رکھیں۔',
      'اگر بالکل چھوٹا پودا پھول سے پہلے شدید مڑ جائے: اسے فوراً بیگ میں نکال دیں تاکہ سفید مکھی وہاں سے باقی صحت مند پودوں پر وائرس نہ لے جائے۔'
    ],
    keyTakeawaysEn: [
      'Fine 50-mesh insect netting over nurseries keeps seedlings 100% virus-free before transplanting.',
      'Sticky yellow traps catch scouting whiteflies days before curl symptoms even appear.',
      'Clean fence edges remove breeding hideouts for whiteflies and aphids.'
    ],
    keyTakeawaysUr: [
      'پنیری پر باریک جالی لگانے سے نئے پودے وائرس سے 100 فیصد محفوظ رہتے ہیں۔',
      'پیلے چپچپے کارڈ سفید مکھی کو علامات آنے سے پہلے ہی پکڑ لیتے ہیں۔',
      'کھیت کی منڈیروں سے جڑی بوٹیاں صاف رکھیں جہاں سفید مکھی پناہ لیتی ہے۔'
    ],
    avoidMistakeEn: 'Never handle tomato plants right after touching tobacco or cigarettes—wash hands thoroughly with soap first.',
    avoidMistakeUr: 'تمباکو کو ہاتھ لگانے کے بعد بغیر صابن سے ہاتھ دھوئے ٹماٹر کے پودوں کو نہ چھوئیں۔',
    actionTipEn: 'Tap a young branch softly today—if white insects fly out, place yellow sticky cards and spray undersides with neem.',
    actionTipUr: 'آج کسی شاخ کو ہلکا ہلا کر دیکھیں؛ سفید مکھی اڑے تو پیلے کارڈ لگائیں اور پتوں کے نیچے نیم اسپرے کریں۔',
    videoTitleEn: 'Tomato Yellow Leaf Curl Virus & Whitefly Control Guide',
    videoTitleUr: 'ٹماٹر کا پتہ مروڑ وائرس اور سفید مکھی کنٹرول کرنے کی ویڈیو',
    videoDuration: '6:40',
    youtubeQuery: 'tomato yellow leaf curl virus whitefly control organic'
  },
  {
    id: 'flowering_blossom_end_rot',
    courseId: 'soil_climate',
    lessonNumber: 1,
    category: 'soil',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Preventing Black Rot on Tomato Bottoms',
    titleUr: 'ٹماٹر کا نچلا سرا کالا ہونے سے بچانا',
    summaryEn:
      'Black leathery spots on the bottom of green tomatoes happen from uneven watering blocking calcium flow—not bugs or fungus.',
    summaryUr:
      'پھل کا نچلا سرا کالا اور سخت ہونا پانی کی بے قاعدگی اور کیلشیم کی کمی سے ہوتا ہے، کسی کیڑے سے نہیں۔',
    lookForEn:
      'A flat, dry, sunken black or dark-brown leather patch on the blossom end opposite the tomato stem.',
    lookForUr:
      'کچے سبز ٹماٹر کے نچلے سرے پر چپٹا کالا یا گہرا بھورا سخت دھبہ۔',
    detailedGuideEn: [
      'Root watering rhythm: Keep root soil evenly moist like a squeezed sponge—never let beds swing between bone-dry cracks and deep flooding.',
      'Calcium helper: Check soil pH in Soil & Water tab; keep soil between pH 6.2 and 6.8 so roots absorb calcium properly.',
      'Mulch shield: Lay 5 cm of dry straw or dried leaves around the base to cut evaporation in half.'
    ],
    detailedGuideUr: [
      'پانی کا باقاعدہ وقفہ: مٹی کو ہلکی نم رکھیں، کبھی بالکل خشک اور کبھی بہت زیادہ سیلاب جیسا پانی نہ دیں۔',
      'کیلشیم کا جذب: مٹی کا پی ایچ 6.2 سے 6.8 کے درمیان رکھیں تاکہ جڑیں کیلشیم اٹھا سکیں۔',
      'ملچنگ: پودوں کے گرد خشک گھاس یا بھوسے کی تہہ بچھائیں تاکہ نمی برقرار رہے۔'
    ],
    keyTakeawaysEn: [
      'Uneven drought-then-flood watering stops calcium from reaching swelling tomatoes.',
      'Water on a steady morning schedule during flowering and fruiting.',
      'Remove early black-bottomed fruit so energy goes into healthy tomatoes.'
    ],
    keyTakeawaysUr: [
      'کبھی مٹی بالکل سوکھ جائے اور پھر زیادہ پانی لگے تو پھل تک کیلشیم نہیں پہنچتا۔',
      'پھول اور پھل لگتے وقت صبح کے وقت متوازن پانی دیں۔',
      'خراب نچلے سرے والا پھل توڑ دیں تاکہ باقی ٹماٹر صحت مند رہیں۔'
    ],
    avoidMistakeEn: 'Do not wait until plants wilt completely before watering during fruiting weeks.',
    avoidMistakeUr: 'پھل لگنے کے دنوں میں پودوں کے مرجھانے کا انتظار نہ کریں، وقت پر ہلکا پانی دیں۔',
    actionTipEn: 'Spread 2 inches of dry leaves or wheat straw around stems today.',
    actionTipUr: 'آج پودوں کے گرد خشک گھاس یا بھوسے کی تہہ بچھائیں۔',
    videoTitleEn: 'How to Fix & Prevent Blossom End Rot on Tomatoes',
    videoTitleUr: 'ٹماٹر کا نچلا سرا گلنے (Blossom End Rot) کا آسان علاج',
    videoDuration: '4:50',
    youtubeQuery: 'how to fix blossom end rot on tomatoes'
  },
  {
    id: 'soil_ph_drip_nutrition',
    courseId: 'soil_climate',
    lessonNumber: 2,
    category: 'soil',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Soil Balance, Compost & Morning Watering',
    titleUr: 'بہترین مٹی، گوبر کھاد اور صبح کی آبپاشی',
    summaryEn:
      'Loose well-drained loam soil around pH 6.0–6.8 with aged compost gives sturdy dark-green leaves and flavorful red fruit.',
    summaryUr:
      'بھربھری بھل والی زمین جس کا پی ایچ 6.0 سے 6.8 ہو اور پرانی گلی سڑی کھاد پودے کو بھرپور طاقت دیتی ہے۔',
    lookForEn:
      'If water puddles on top for hours or top leaves turn pale yellow with dark green veins, soil drainage or pH needs balancing.',
    lookForUr:
      'اگر پانی دیر تک کھڑا رہے یا نئے پتے پیلے اور رگیں سبز رہیں تو نکاسی یا مٹی کے پی ایچ میں کمی ہو سکتی ہے۔',
    detailedGuideEn: [
      'Morning root irrigation: Pour slowly at the base before 10 AM so topsoil dries quickly under daylight and roots stay oxygenated.',
      'Aged compost boost: Mix 2 handfuls of cool, well-rotted cow-dung compost into topsoil every 3 weeks for steady soil microbes.',
      'Drainage check: Raised 15 cm ridges keep tomato crowns dry after heavy monsoon showers.'
    ],
    detailedGuideUr: [
      'صبح کی آبپاشی: صبح 10 بجے سے پہلے جڑوں میں آہستہ پانی دیں تاکہ دھوپ میں اوپری سطح خشک رہے۔',
      'دیسی کھاد: ہر 3 ہفتے بعد 2 مٹھی پرانی گلی سڑی گوبر کھاد مٹی میں ہلکی گود کر ملائیں۔',
      'نکاسیِ آب: 15 سینٹی میٹر اونچی کھیلیاں بنانے سے بارش کا پانی جڑوں میں کھڑا نہیں ہوتا۔'
    ],
    keyTakeawaysEn: [
      'Water slowly around the root crown, keeping foliage dry.',
      'Aged compost loosens hard clay and improves sandy moisture retention.',
      'Soggy standing water suffocates roots and invites wilt.'
    ],
    keyTakeawaysUr: [
      'پانی ہمیشہ جڑوں میں آہستہ دیں اور پتوں کو گیلا ہونے سے بچائیں۔',
      'گلی سڑی دیسی کھاد سخت یا ریتلی زمین دونوں کو زرخیز بناتی ہے۔',
      'جڑوں میں زیادہ دیر پانی کھڑا رہنے سے جڑیں گل سکتی ہیں۔'
    ],
    avoidMistakeEn: 'Never pack fresh raw manure under roots—always age it completely cool first.',
    avoidMistakeUr: 'تازہ کچی گوبر کھاد براہِ راست جڑوں میں نہ ڈالیں، ہمیشہ پرانی گلی سڑی کھاد استعمال کریں۔',
    actionTipEn: 'Check your Soil & Water tab before planning irrigation or compost top-dressing.',
    actionTipUr: 'پانی یا کھاد دینے سے پہلے مٹی اور موسم کا ٹیب ضرور دیکھیں۔',
    videoTitleEn: 'Best Soil Mix, pH & Morning Watering for Tomatoes',
    videoTitleUr: 'ٹماٹر کے لیے بہترین مٹی، پی ایچ اور صبح پانی دینے کا طریقہ',
    videoDuration: '5:35',
    youtubeQuery: 'best soil ph watering compost tomatoes guide'
  },
  {
    id: 'climate_stress_harvest',
    courseId: 'soil_climate',
    lessonNumber: 3,
    category: 'climate',
    durationMinutes: 4,
    offlineReady: true,
    titleEn: 'Heatwaves, Rainy Humidity & Harvest',
    titleUr: 'شدید گرمی، برسات کی نمی اور صاف تڑائی',
    summaryEn:
      'Simple steps to protect Punjab & Sindh crops during harsh summer heat or sticky monsoon spells and pick sweeter, longer-lasting tomatoes.',
    summaryUr:
      'پنجاب اور سندھ کی شدید گرمی اور برسات میں فصل بچانے اور بہترین ٹماٹر توڑنے کے آسان طریقے۔',
    lookForEn:
      'Leaves rolled gently at 3 PM in fierce sun are conserving water—if they stay limp at 7 AM, water roots deeply.',
    lookForUr:
      'دوپہر کی دھوپ میں پتے گرمی سے بچنے کے لیے مڑتے ہیں؛ اگر صبح ٹھنڈے وقت بھی ڈھیلے رہیں تو پانی دیں۔',
    detailedGuideEn: [
      'Over 35°C heatwave shield: Give deep root water before 8 AM and stretch light afternoon shade cloth above fruiting trusses.',
      'Monsoon & sticky humidity: Increase pruning ventilation and scout lower leaves every 48 hours for wet blight marks.',
      'Cool morning harvest: Pick tomatoes at breaker/pink-red stage before 9 AM with a short green calyx stem so they store longer without bruising.'
    ],
    detailedGuideUr: [
      '35°C سے زیادہ گرمی: صبح 8 بجے سے پہلے گہرا پانی دیں اور دوپہر کو ہلکی جالی کا سایہ فراہم کریں۔',
      'برسات کا موسم: پودوں کے درمیان ہوا کا گزر رکھیں اور ہر 48 گھنٹے بعد نچلے پتوں کا معائنہ کریں۔',
      'تڑائی کا صحیح وقت: ٹماٹر صبح 9 بجے سے پہلے ہلکی سبز ڈنڈی سمیت توڑیں تاکہ زیادہ دیر تازہ رہیں۔'
    ],
    keyTakeawaysEn: [
      'Morning deep watering + afternoon shade protects flowers in heatwaves.',
      'Pause all overhead spraying during rainstorms.',
      'Harvest in cool hours with stem caps intact.'
    ],
    keyTakeawaysUr: [
      'صبح گہرا پانی اور دوپہر کو سایہ گرمی میں پھولوں کو بچاتا ہے۔',
      'برسات میں پودوں کے اوپر سے پانی ہرگز نہ چھڑکیں۔',
      'ٹماٹر صبح ٹھنڈے وقت ہلکی سبز ڈنڈی سمیت توڑیں۔'
    ],
    avoidMistakeEn: 'Do not pick tomatoes in blazing midday heat or yank fruit without holding the stem.',
    avoidMistakeUr: 'تپتی دوپہر میں تڑائی نہ کریں اور پھل کو کھینچ کر توڑنے سے پودے کو نقصان نہ پہنچائیں۔',
    actionTipEn: 'Check Live Weather Risk on Home before planning sprays.',
    actionTipUr: 'اسپرے کرنے سے پہلے ہوم اسکرین پر آج کے موسم کا خطرہ ضرور چیک کریں۔',
    videoTitleEn: 'Protecting Tomatoes in Extreme Heat & Monsoon Humidity',
    videoTitleUr: 'شدید گرمی اور برسات میں ٹماٹر کی فصل بچانے کا طریقہ',
    videoDuration: '5:00',
    youtubeQuery: 'protect tomato plants heat wave high humidity monsoon'
  }
];

export interface DailyAgriTip {
  id: string;
  tagEn: string;
  tagUr: string;
  titleEn: string;
  titleUr: string;
  bodyEn: string;
  bodyUr: string;
  linkedModuleId: string;
}

export const DAILY_AGRI_TIPS: DailyAgriTip[] = [
  {
    id: 'tip_dew_window',
    tagEn: 'Today’s Farm Tip',
    tagUr: 'آج کا زرعی مشورہ',
    titleEn: 'Water Roots in the Morning, Not Evening',
    titleUr: 'شام کے بجائے صبح جڑوں میں پانی دیں',
    bodyEn:
      'Watering roots before 10 AM lets warm sun dry leaves fast, stopping fungal spots from growing overnight.',
    bodyUr:
      'صبح 10 بجے سے پہلے جڑوں میں پانی دینے سے پتے دھوپ میں خشک رہتے ہیں اور پھپھوندی نہیں لگتی۔',
    linkedModuleId: 'fungal_blight_differentiation'
  },
  {
    id: 'tip_lower_leaves',
    tagEn: 'Morning Habit',
    tagUr: 'صبح کی عادت',
    titleEn: 'Check Bottom Leaves First',
    titleUr: 'سب سے پہلے نچلے پتے دیکھیں',
    bodyEn:
      'Rain and soil splash hit bottom leaves first, showing spots days before upper leaves get sick.',
    bodyUr:
      'بارش اور پانی کے چھینٹے سب سے پہلے نچلے پتوں پر پڑتے ہیں، اس لیے بیماری وہیں سے شروع ہوتی ہے۔',
    linkedModuleId: 'tomato_botany_anatomy'
  },
  {
    id: 'tip_calcium_consistency',
    tagEn: 'Fruit Care',
    tagUr: 'پھل کی حفاظت',
    titleEn: 'Steady Water Stops Black Fruit Bottoms',
    titleUr: 'باقاعدہ پانی پھل کو کالا ہونے سے روکتا ہے',
    bodyEn:
      'Even soil moisture with straw mulch helps roots send steady calcium into growing green tomatoes.',
    bodyUr:
      'خشک بھوسے کی ملچنگ اور باقاعدہ پانی سے ٹماٹر تک کیلشیم صحیح پہنچتا ہے۔',
    linkedModuleId: 'flowering_blossom_end_rot'
  },
  {
    id: 'tip_whitefly_traps',
    tagEn: 'Pest Watch',
    tagUr: 'کیڑوں سے بچاؤ',
    titleEn: 'Trap Whiteflies Early with Yellow Cards',
    titleUr: 'سفید مکھی روکنے کے لیے پیلے کارڈ لگائیں',
    bodyEn:
      'Yellow sticky cards and weekly neem oil keep whiteflies from spreading Leaf Curl Virus.',
    bodyUr:
      'پودوں کے قریب پیلے چپچپے کارڈ اور ہفتہ وار نیم اسپرے پتہ مروڑ وائرس کو روکتے ہیں۔',
    linkedModuleId: 'viral_tylcv_vectors'
  },
  {
    id: 'tip_tool_hygiene',
    tagEn: 'Clean Hands',
    tagUr: 'صفائی اصول',
    titleEn: 'Wait Until Leaves Dry Before Trimming',
    titleUr: 'گیلے پتوں میں شاخ تراشی نہ کریں',
    bodyEn:
      'Wet morning leaves carry bacteria across shears and gloves from one plant to the next—wait for dry foliage.',
    bodyUr:
      'گیلی فصل میں کٹائی کرنے سے بیماری ایک پودے سے پوری قطار میں پھیل سکتی ہے۔',
    linkedModuleId: 'bacterial_canker_hygiene'
  }
];

export function getDailyAgriTip(date: Date = new Date()): DailyAgriTip {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_AGRI_TIPS[Math.abs(dayOfYear) % DAILY_AGRI_TIPS.length];
}
