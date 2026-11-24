package com.agrovision.ai.data

import android.graphics.Bitmap
import android.graphics.Color as AndroidColor
import com.agrovision.ai.model.AgroArticle
import com.agrovision.ai.model.AlertSeverity
import com.agrovision.ai.model.ArticleCategory
import com.agrovision.ai.model.BadgeTier
import com.agrovision.ai.model.DiseaseGuide
import com.agrovision.ai.model.GrowthStage
import com.agrovision.ai.model.GrowthStageAlert
import com.agrovision.ai.model.PathogenCategory
import com.agrovision.ai.model.ScanHistoryItem
import com.agrovision.ai.model.WeatherTelemetryState
import com.agrovision.ai.ui.theme.AgroColors
import java.util.UUID
import kotlin.math.roundToInt

object AgroRepository {

    val BADGE_TIERS: List<BadgeTier> = listOf(
        BadgeTier(
            id = "tomato_scout",
            requiredLevel = 1,
            requiredXp = 0,
            title = "Tomato Scout",
            subtitle = "Field Initiated",
            howToEarn = "Unlocked automatically at Level 1 (0 XP).",
            accentColor = AgroColors.ForestPrimary
        ),
        BadgeTier(
            id = "canopy_watcher",
            requiredLevel = 2,
            requiredXp = 100,
            title = "Canopy Watcher",
            subtitle = "Sharp Leaf Eye",
            howToEarn = "Reach Level 2 (100 XP) via leaf scans and automatic daily missions.",
            accentColor = AgroColors.RoyalBlue
        ),
        BadgeTier(
            id = "pathology_pro",
            requiredLevel = 3,
            requiredXp = 200,
            title = "Pathology Pro",
            subtitle = "Diagnostic Ace",
            howToEarn = "Reach Level 3 (200 XP) by analyzing leaves and reviewing the Library.",
            accentColor = AgroColors.TealVibrant
        ),
        BadgeTier(
            id = "soil_alchemist",
            requiredLevel = 4,
            requiredXp = 300,
            title = "Soil Alchemist",
            subtitle = "Root-Zone Balance",
            howToEarn = "Reach Level 4 (300 XP) by syncing weather and soil telemetry.",
            accentColor = AgroColors.OchreWarm
        ),
        BadgeTier(
            id = "harvest_guardian",
            requiredLevel = 5,
            requiredXp = 400,
            title = "Harvest Guardian",
            subtitle = "Yield Protector",
            howToEarn = "Reach Level 5 (400 XP) with consistent multi-day crop scouting.",
            accentColor = AgroColors.TerracottaAction
        ),
        BadgeTier(
            id = "master_agronomist",
            requiredLevel = 6,
            requiredXp = 500,
            title = "Master Agronomist",
            subtitle = "Peak Field Mastery",
            howToEarn = "Reach Level 6 (500 XP) to complete the AgroVision badge collection.",
            accentColor = AgroColors.ForestDark
        )
    )

    val DISEASE_LIBRARY: List<DiseaseGuide> = listOf(
        DiseaseGuide(
            id = "healthy",
            name = "Healthy Tomato Foliage",
            scientificName = "Solanum lycopersicum",
            category = PathogenCategory.HEALTHY,
            severity = "None",
            contagionRisk = "None",
            favorableClimate = "20°C–26°C · 50–65% RH",
            summary = "Uniform chlorophyll distribution, firm turgid leaves, and intact serrated leaf margins with zero necrotic spots.",
            keySymptoms = listOf(
                "Deep, uniform emerald-green pigmentation across leaf blades",
                "Serrated margins free of scorching, curl, or speckling",
                "Clean leaf underside without white sporulation or mites"
            ),
            organicCare = listOf(
                "Maintain 5 cm organic straw mulch around the base to stabilize soil moisture",
                "Apply dilute compost tea every 14 days for resilient root-zone biology"
            ),
            preventionSteps = listOf(
                "Irrigate strictly at soil level before 10:00 AM",
                "Space tomato plants 50–60 cm apart for steady airflow"
            )
        ),
        DiseaseGuide(
            id = "early_blight",
            name = "Early Blight",
            scientificName = "Alternaria solani",
            category = PathogenCategory.FUNGAL,
            severity = "Moderate",
            contagionRisk = "High",
            favorableClimate = "24°C–29°C · >85% RH",
            summary = "Destructive fungal disease starting on older lower leaves with dark concentric target-board rings surrounded by a yellow halo.",
            keySymptoms = listOf(
                "Circular brown-to-black target-ring lesions on lower canopy",
                "Distinct bright yellow chlorotic halo encircling dark spots",
                "Progressive lower leaf yellowing and premature leaf drop"
            ),
            organicCare = listOf(
                "Prune and bag infected lower leaves immediately—do not compost",
                "Apply copper soap (copper octanoate) or 1% neem oil emulsion every 7 days"
            ),
            preventionSteps = listOf(
                "Remove foliage within 30 cm of the soil to block rain-splash spores",
                "Rotate away from tomatoes and potatoes for 3 seasons"
            )
        ),
        DiseaseGuide(
            id = "late_blight",
            name = "Late Blight",
            scientificName = "Phytophthora infestans",
            category = PathogenCategory.FUNGAL,
            severity = "Severe",
            contagionRisk = "Critical",
            favorableClimate = "15°C–22°C · >90% RH",
            summary = "Rapidly spreading oomycete capable of collapsing entire vines within days during cool, humid, foggy weather.",
            keySymptoms = listOf(
                "Large irregular water-soaked dark green-gray to brown blotches",
                "Cottony white spore growth along leaf undersides in morning dew",
                "Blackened stems and firm greasy brown decay on fruit"
            ),
            organicCare = listOf(
                "Apply fixed copper hydroxide preventatively at the first humidity alert",
                "Remove and seal heavily infected plants immediately to save nearby rows"
            ),
            preventionSteps = listOf(
                "Plant resistant cultivars and maximize row spacing for fast morning drying",
                "Never use overhead sprinklers during cool overcast weeks"
            )
        ),
        DiseaseGuide(
            id = "bacterial_spot",
            name = "Bacterial Spot",
            scientificName = "Xanthomonas campestris",
            category = PathogenCategory.BACTERIAL,
            severity = "Moderate",
            contagionRisk = "High",
            favorableClimate = "25°C–30°C · Rain Splash",
            summary = "Seed- and splash-borne bacteria causing small angular water-soaked spots that dry into dark scabs or shot-holes.",
            keySymptoms = listOf(
                "Small 1–3 mm angular dark brown to black spots across leaflets",
                "Centers of older spots tear out creating a ragged shot-hole look",
                "Raised corky blister scabs on green tomato fruit"
            ),
            organicCare = listOf(
                "Spray liquid copper bactericide paired with Bacillus amyloliquefaciens",
                "Apply soluble potassium silicate to reinforce leaf cell walls"
            ),
            preventionSteps = listOf(
                "Never prune or tie vines while foliage is wet with dew or rain",
                "Sanitize pruning shears between plants with 70% alcohol"
            )
        ),
        DiseaseGuide(
            id = "septoria_leaf_spot",
            name = "Septoria Leaf Spot",
            scientificName = "Septoria lycopersici",
            category = PathogenCategory.FUNGAL,
            severity = "Moderate",
            contagionRisk = "High",
            favorableClimate = "20°C–25°C · >75% RH",
            summary = "Prolific foliar fungus producing dozens of small circular spots with dark rims and pale ash-gray centers.",
            keySymptoms = listOf(
                "Uniform 2–4 mm circular spots with tan/gray centers and dark borders",
                "Tiny black fruiting dots visible inside gray centers",
                "Rapid yellowing and defoliation moving upward from soil level"
            ),
            organicCare = listOf(
                "Strip affected bottom leaves early and mist remaining canopy with copper spray",
                "Top-dress mulch layer to seal fallen spores away from splash"
            ),
            preventionSteps = listOf(
                "Drip-irrigate strictly at the root crown",
                "Clear all crop debris from beds immediately after final harvest"
            )
        ),
        DiseaseGuide(
            id = "yellow_leaf_curl",
            name = "Yellow Leaf Curl Virus",
            scientificName = "Begomovirus (TYLCV)",
            category = PathogenCategory.VIRAL,
            severity = "Severe",
            contagionRisk = "High",
            favorableClimate = "28°C–36°C · Dry & Whiteflies",
            summary = "Whitefly-transmitted viral infection causing upward cupping of stunted top leaves, severe yellowing margins, and blossom drop.",
            keySymptoms = listOf(
                "Upward spoon-like curling and crinkling of young upper leaflets",
                "Bright yellow leaf margins with stunted, bushy plant crown",
                "Sharp drop in flower set and tiny underdeveloped fruit"
            ),
            organicCare = listOf(
                "Deploy yellow sticky traps and spray insecticidal soap + neem under leaves for whiteflies",
                "Remove early symptomatic seedlings to stop vector spread across the plot"
            ),
            preventionSteps = listOf(
                "Use reflective silver mulch or fine insect netting over young transplants",
                "Select TYLCV-tolerant hybrid tomato varieties"
            )
        ),
        DiseaseGuide(
            id = "powdery_mildew",
            name = "Powdery Mildew",
            scientificName = "Leveillula taurica",
            category = PathogenCategory.FUNGAL,
            severity = "Mild",
            contagionRisk = "Moderate",
            favorableClimate = "20°C–28°C · Warm Dry Days",
            summary = "Talcum-like white fungal patches on upper leaf surfaces that block photosynthesis and slowly yellow mature leaves.",
            keySymptoms = listOf(
                "Powdery white circular colonies scattered on upper leaf blades",
                "Yellow angular patches beneath older white fungal mats",
                "Dry papery curling if left untreated during warm weather"
            ),
            organicCare = listOf(
                "Spray potassium bicarbonate (1 tbsp/gal) or dilute wettable sulfur at dawn",
                "Apply cold-pressed neem oil weekly until new leaves emerge clean"
            ),
            preventionSteps = listOf(
                "Avoid excessive nitrogen fertilizer that creates dense shaded foliage",
                "Prune interior suckers to keep air moving through the trellis"
            )
        )
    )

    val ARTICLES_AND_NEWS: List<AgroArticle> = listOf(
        AgroArticle(
            id = "news_punjab_sindh_blight",
            title = "Humidity Spike Alert: Preventing Late & Early Blight in Punjab & Sindh",
            category = ArticleCategory.DISEASE_ALERT,
            regionTag = "Punjab & Sindh",
            publishedLabel = "Today",
            readTimeLabel = "3 min read",
            summary = "Morning dew and >75% relative humidity raise fungal spore pressure across tomato belts. Shift irrigation to early morning base watering.",
            bodyParagraphs = listOf(
                "Recent field telemetry across the Punjab plains and Sindh tomato belt shows prolonged morning leaf wetness lasting past 9:30 AM. When relative humidity crosses 75% alongside mild nights, Alternaria and Phytophthora spores germinate rapidly on lower shaded foliage.",
                "Growers in Flowering and Red Harvest stages should immediately bottom-prune leaves touching soil or mulch and pause overhead watering. Moving irrigation to root-level drip lines between 6:00 AM and 9:00 AM reduces canopy dampness duration by more than 4 hours per day.",
                "If water-soaked blotches or concentric target rings appear on lower leaves, isolate the clipped foliage in sealed bags and apply a preventative fixed-copper or neem barrier before evening dew settles."
            ),
            actionTip = "Open Home -> Weather & Soil Telemetry to check your live Blight Risk level."
        ),
        AgroArticle(
            id = "news_whitefly_curl_watch",
            title = "Warm Weather Vector Watch: Controlling Whiteflies Before Leaf Curl Spreads",
            category = ArticleCategory.LATEST_NEWS,
            regionTag = "Warm Valleys",
            publishedLabel = "2 days ago",
            readTimeLabel = "4 min read",
            summary = "Rising daytime temperatures above 30°C accelerate whitefly reproduction, increasing Tomato Yellow Leaf Curl Virus risk in young transplants.",
            bodyParagraphs = listOf(
                "During dry warm spells, silverleaf whiteflies migrate rapidly from weeds into newly transplanted seedling and leafy tomato rows. Once a plant contracts Yellow Leaf Curl Virus, chemical sprays cannot cure the virus itself—stopping the vector early is critical.",
                "Hang yellow sticky scouting cards at canopy height (1 card per 10 square meters) and inspect leaf undersides twice weekly. When whitefly counts rise, spray botanical neem oil + mild potassium soap thoroughly on leaf undersides at dusk.",
                "Clear flowering weeds along field borders and pair straw or reflective mulch with steady root moisture so transplants outgrow early stress."
            ),
            actionTip = "Use Scan whenever upper leaves show upward spoon curling or yellow margins."
        ),
        AgroArticle(
            id = "guide_soil_moisture_calcium",
            title = "Soil Moisture & pH Guide: Stopping Blossom-End Rot During Fruiting",
            category = ArticleCategory.CROP_GUIDE,
            regionTag = "All Regions",
            publishedLabel = "This Week",
            readTimeLabel = "4 min read",
            summary = "Keeping soil moisture in the 48–62% band and pH between 6.0 and 6.8 unlocks steady calcium transport into developing tomatoes.",
            bodyParagraphs = listOf(
                "Even when soil contains plenty of calcium, sharp swings between bone-dry soil and sudden heavy flooding interrupt calcium flow to rapidly expanding tomato fruit—causing dark sunken patches on the blossom end.",
                "Maintaining soil pH near 6.4 keeps phosphorus, magnesium, and calcium soluble. Acidic soils below pH 5.8 lock out calcium, while alkaline soils above pH 7.4 restrict iron uptake and mimic viral yellowing.",
                "Mulch root zones with 5 cm of dry straw and sync your local weather humidity before watering so root moisture stays steady without waterlogging."
            ),
            actionTip = "Switch your Growth Stage to Flowering or Harvest on Home to track stage-specific pH & moisture targets."
        ),
        AgroArticle(
            id = "guide_organic_spray_rotation",
            title = "Organic Spray Rotation: Copper, Neem & Bio-Fungicides Without Leaf Burn",
            category = ArticleCategory.CROP_GUIDE,
            regionTag = "Organic Care",
            publishedLabel = "5 days ago",
            readTimeLabel = "3 min read",
            summary = "Rotating Bacillus subtilis, cold-pressed neem, and low-rate copper prevents resistance and avoids sunscald on tender foliage.",
            bodyParagraphs = listOf(
                "Spraying oil-based organic remedies under midday sun above 30°C can scorch tomato cuticles. Always spray early morning or late evening once pollinators have settled.",
                "Alternate biological protectants like Bacillus subtilis with neem oil during dry weeks, reserving fixed copper sprays strictly for high-humidity blight alerts or bacterial spot outbreaks."
            ),
            actionTip = "Check the Organic Care steps inside any Disease Library entry before mixing a spray."
        )
    )

    fun evaluateGrowthStageAlert(
        stage: GrowthStage,
        moisturePercent: Int,
        soilPh: Float
    ): GrowthStageAlert {
        if (moisturePercent > stage.moistureMax + 7) {
            return GrowthStageAlert(
                stage = stage,
                severity = AlertSeverity.ACTION,
                statusLabel = "Moisture High",
                headline = if (stage == GrowthStage.SEEDLING) {
                    "Too wet for Seedlings ($moisturePercent%)"
                } else {
                    "High Fungal Humidity ($moisturePercent%)"
                },
                message = "Root moisture ($moisturePercent%) exceeds the ${stage.moistureMin}–${stage.moistureMax}% target for ${stage.label}. Pause watering and improve airflow.",
                diseaseWatch = stage.diseaseWatch
            )
        }
        if (moisturePercent < stage.moistureMin - 8) {
            return GrowthStageAlert(
                stage = stage,
                severity = AlertSeverity.ACTION,
                statusLabel = "Dry Stress",
                headline = if (stage == GrowthStage.FRUITING) {
                    "Blossom-End Rot Dry Risk ($moisturePercent%)"
                } else {
                    "Low Soil Moisture ($moisturePercent%)"
                },
                message = "Moisture dipped to $moisturePercent% (target ${stage.moistureMin}–${stage.moistureMax}%). Irrigate slowly at the root base.",
                diseaseWatch = stage.diseaseWatch
            )
        }
        if (soilPh < stage.phMin - 0.2f || soilPh > stage.phMax + 0.3f) {
            val isAcidic = soilPh < stage.phMin
            return GrowthStageAlert(
                stage = stage,
                severity = AlertSeverity.WATCH,
                statusLabel = "pH Watch",
                headline = if (isAcidic) {
                    "Acidic Soil Limits Calcium (pH ${"%.1f".format(soilPh)})"
                } else {
                    "Alkaline Lockout Risk (pH ${"%.1f".format(soilPh)})"
                },
                message = if (isAcidic) {
                    "pH ${"%.1f".format(soilPh)} is below ${stage.phMin}–${stage.phMax}. Add agricultural lime or crushed eggshell compost."
                } else {
                    "pH ${"%.1f".format(soilPh)} is above ${stage.phMin}–${stage.phMax}. Top-dress with acidic peat or organic sulfur."
                },
                diseaseWatch = stage.diseaseWatch
            )
        }
        return GrowthStageAlert(
            stage = stage,
            severity = AlertSeverity.OPTIMAL,
            statusLabel = "On Track",
            headline = stage.optimalHeadline,
            message = stage.optimalTip,
            diseaseWatch = stage.diseaseWatch
        )
    }

    /**
     * Native on-device pixel color & lesion-pattern inspection using HSV/RGB metrics.
     * Supports CameraX captures, Gallery Photo uploads, and built-in leaf checks.
     */
    fun analyzeLeafBitmap(
        bitmap: Bitmap,
        source: String,
        telemetry: WeatherTelemetryState
    ): ScanHistoryItem {
        val scaled = Bitmap.createScaledBitmap(bitmap, 96, 96, true)
        var greenCount = 0
        var yellowCount = 0
        var darkNecroticCount = 0
        var whitePowderyCount = 0
        val totalPixels = scaled.width * scaled.height
        val hsv = FloatArray(3)

        for (y in 0 until scaled.height) {
            for (x in 0 until scaled.width) {
                val pixel = scaled.getPixel(x, y)
                AndroidColor.colorToHSV(pixel, hsv)
                val hue = hsv[0]       // 0..360
                val sat = hsv[1]       // 0..1
                val value = hsv[2]     // 0..1

                when {
                    // Healthy chlorophyll green range
                    hue in 68f..165f && sat >= 0.22f && value >= 0.16f -> greenCount++
                    // Chlorotic yellow halos / TYLCV yellowing
                    hue in 36f..67f && sat >= 0.25f && value >= 0.28f -> yellowCount++
                    // Necrotic dark brown / blight lesions
                    (hue in 5f..35f && sat >= 0.18f && value in 0.08f..0.48f) ||
                        (value in 0.04f..0.16f && sat >= 0.12f) -> darkNecroticCount++
                    // Powdery mildew / downy white sporulation
                    sat < 0.14f && value > 0.78f -> whitePowderyCount++
                }
            }
        }

        val greenRatio = greenCount.toFloat() / totalPixels
        val yellowRatio = yellowCount.toFloat() / totalPixels
        val necroticRatio = darkNecroticCount.toFloat() / totalPixels
        val whiteRatio = whitePowderyCount.toFloat() / totalPixels
        val plantSignature = greenRatio + yellowRatio + (necroticRatio * 0.6f)

        // Check if image likely contains a plant leaf
        if (plantSignature < 0.14f && greenRatio < 0.08f) {
            return ScanHistoryItem(
                id = UUID.randomUUID().toString(),
                diseaseId = "non_leaf",
                diseaseName = "Non-Leaf Image Detected",
                scientificName = "Chlorophyll Verification Failed",
                isTomatoLeaf = false,
                confidencePercent = 91,
                severity = "N/A",
                summary = "Low green chlorophyll signature (${(greenRatio * 100).roundToInt()}%). Frame a single tomato leaf in natural daylight and scan again.",
                organicSteps = listOf(
                    "Hold a tomato leaflet 15–25 cm from the lens in even daylight",
                    "Avoid dark indoor shadows or busy soil backgrounds"
                ),
                source = source,
                moistureSnapshot = telemetry.soilMoisturePercent,
                phSnapshot = telemetry.soilPh,
                timestampMs = System.currentTimeMillis()
            )
        }

        val guide: DiseaseGuide
        val confidence: Int
        when {
            necroticRatio > 0.16f && telemetry.humidityPercent >= 74 -> {
                guide = DISEASE_LIBRARY.first { it.id == "late_blight" }
                confidence = (84 + ((necroticRatio * 40).roundToInt())).coerceIn(82, 96)
            }
            necroticRatio > 0.10f && yellowRatio > 0.08f -> {
                guide = DISEASE_LIBRARY.first { it.id == "early_blight" }
                confidence = (85 + ((necroticRatio * 35).roundToInt())).coerceIn(83, 95)
            }
            necroticRatio in 0.05f..0.10f && yellowRatio <= 0.08f -> {
                guide = DISEASE_LIBRARY.first { it.id == "bacterial_spot" }
                confidence = (80 + ((necroticRatio * 50).roundToInt())).coerceIn(79, 92)
            }
            yellowRatio > 0.22f && necroticRatio < 0.07f -> {
                guide = DISEASE_LIBRARY.first { it.id == "yellow_leaf_curl" }
                confidence = (83 + ((yellowRatio * 30).roundToInt())).coerceIn(82, 94)
            }
            whiteRatio > 0.20f && greenRatio > 0.20f -> {
                guide = DISEASE_LIBRARY.first { it.id == "powdery_mildew" }
                confidence = (81 + ((whiteRatio * 25).roundToInt())).coerceIn(80, 91)
            }
            else -> {
                guide = DISEASE_LIBRARY.first { it.id == "healthy" }
                confidence = (86 + ((greenRatio * 15).roundToInt())).coerceIn(85, 97)
            }
        }

        return ScanHistoryItem(
            id = UUID.randomUUID().toString(),
            diseaseId = guide.id,
            diseaseName = guide.name,
            scientificName = guide.scientificName,
            isTomatoLeaf = true,
            confidencePercent = confidence,
            severity = guide.severity,
            summary = "${guide.summary} [Env context: ${telemetry.humidityPercent}% RH, ${telemetry.soilMoisturePercent}% Soil VWC, pH ${"%.1f".format(telemetry.soilPh)}]",
            organicSteps = guide.organicCare,
            source = source,
            moistureSnapshot = telemetry.soilMoisturePercent,
            phSnapshot = telemetry.soilPh,
            timestampMs = System.currentTimeMillis()
        )
    }

    fun buildSampleScan(
        diseaseId: String,
        telemetry: WeatherTelemetryState
    ): ScanHistoryItem {
        val guide = DISEASE_LIBRARY.firstOrNull { it.id == diseaseId } ?: DISEASE_LIBRARY.first()
        return ScanHistoryItem(
            id = UUID.randomUUID().toString(),
            diseaseId = guide.id,
            diseaseName = guide.name,
            scientificName = guide.scientificName,
            isTomatoLeaf = true,
            confidencePercent = if (guide.id == "healthy") 95 else 91,
            severity = guide.severity,
            summary = "${guide.summary} [Env context: ${telemetry.humidityPercent}% RH, ${telemetry.soilMoisturePercent}% Soil VWC, pH ${"%.1f".format(telemetry.soilPh)}]",
            organicSteps = guide.organicCare,
            source = "Sample Specimen",
            moistureSnapshot = telemetry.soilMoisturePercent,
            phSnapshot = telemetry.soilPh,
            timestampMs = System.currentTimeMillis()
        )
    }
}
