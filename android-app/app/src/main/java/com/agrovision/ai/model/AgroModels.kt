package com.agrovision.ai.model

import androidx.compose.ui.graphics.Color

enum class AppTab(val label: String) {
    HOME("Home"),
    SCAN("Scan"),
    LIBRARY("Library"),
    FIELD("Field")
}

enum class GrowthStage(
    val label: String,
    val daysRange: String,
    val moistureMin: Int,
    val moistureMax: Int,
    val phMin: Float,
    val phMax: Float,
    val optimalHeadline: String,
    val optimalTip: String,
    val diseaseWatch: String
) {
    SEEDLING(
        label = "Seedling",
        daysRange = "Days 1–20",
        moistureMin = 55,
        moistureMax = 68,
        phMin = 6.0f,
        phMax = 6.6f,
        optimalHeadline = "Protect tender stems & roots",
        optimalTip = "Keep topsoil lightly damp (55–68%) with bright light so stems grow sturdy without damping-off.",
        diseaseWatch = "Inspect cotyledons for stem rot or curling."
    ),
    VEGETATIVE(
        label = "Leafy",
        daysRange = "Days 21–42",
        moistureMin = 50,
        moistureMax = 65,
        phMin = 6.0f,
        phMax = 6.8f,
        optimalHeadline = "Build airflow across lower leaves",
        optimalTip = "Prune bottom suckers and stake early so sunlight dries lower foliage before fungal spores settle.",
        diseaseWatch = "Check lower leaves for Septoria specks or Early Blight."
    ),
    FLOWERING(
        label = "Flowering",
        daysRange = "Days 43–65",
        moistureMin = 50,
        moistureMax = 65,
        phMin = 6.2f,
        phMax = 6.8f,
        optimalHeadline = "Steady pH & pollination window",
        optimalTip = "Hold soil pH near 6.4 for calcium uptake, tap blossoms gently at midday, and keep leaves dry.",
        diseaseWatch = "Check mid-canopy leaves for Early Blight target rings."
    ),
    FRUITING(
        label = "Harvest",
        daysRange = "Days 66+",
        moistureMin = 48,
        moistureMax = 62,
        phMin = 6.0f,
        phMax = 6.8f,
        optimalHeadline = "Consistent moisture stops cracking",
        optimalTip = "Mulch stems and water evenly at the root zone so ripening fruit avoids blossom-end rot and blight.",
        diseaseWatch = "Scan damp foliage for Late Blight water-soaked lesions."
    )
}

enum class AlertSeverity { OPTIMAL, WATCH, ACTION }

data class GrowthStageAlert(
    val stage: GrowthStage,
    val severity: AlertSeverity,
    val statusLabel: String,
    val headline: String,
    val message: String,
    val diseaseWatch: String
)

enum class AgroRegion(
    val label: String,
    val latitude: Double,
    val longitude: Double
) {
    AUTO_GPS("Local GPS", 31.5204, 74.3587),
    PUNJAB("Punjab Belt", 31.5204, 74.3587),
    SINDH("Sindh Belt", 25.3960, 68.3578),
    GREENHOUSE("Greenhouse", 33.6844, 73.0479)
}

enum class BlightRiskLevel(val label: String) {
    LOW("Low"),
    MODERATE("Moderate"),
    HIGH("High")
}

data class WeatherTelemetryState(
    val region: AgroRegion = AgroRegion.AUTO_GPS,
    val locationLabel: String = "Punjab Agricultural Plains",
    val temperatureC: Double = 25.4,
    val humidityPercent: Int = 64,
    val dewPointC: Double = 17.1,
    val rainMm: Double = 0.0,
    val windKph: Double = 9.5,
    val blightRisk: BlightRiskLevel = BlightRiskLevel.MODERATE,
    val soilMoisturePercent: Int = 58,
    val soilPh: Float = 6.4f,
    val advisoryText: String = "Balanced daylight warmth. Irrigate at the base in the morning.",
    val isLiveGps: Boolean = false,
    val isOfflineCached: Boolean = false,
    val isSyncing: Boolean = false,
    val lastUpdatedLabel: String = "Synced just now"
)

enum class DailyMissionId(
    val title: String,
    val xpReward: Int,
    val triggerHint: String
) {
    GPS_WEATHER_SYNC(
        title = "Sync Local Weather & Telemetry",
        xpReward = 25,
        triggerHint = "Auto-completes on weather sync"
    ),
    SCAN_TOMATO_LEAF(
        title = "Scan or Upload a Tomato Leaf",
        xpReward = 40,
        triggerHint = "Auto-completes after leaf scan"
    ),
    LIBRARY_GUIDE_READ(
        title = "Review a Disease Guide or Article",
        xpReward = 20,
        triggerHint = "Auto-completes when opening a guide"
    ),
    HIGH_RISK_PREVENTIVE_CHECK(
        title = "Evaluate Growth Stage Telemetry",
        xpReward = 30,
        triggerHint = "Auto-completes on stage/region check"
    )
}

data class BadgeTier(
    val id: String,
    val requiredLevel: Int,
    val requiredXp: Int,
    val title: String,
    val subtitle: String,
    val howToEarn: String,
    val accentColor: Color
)

data class ScanHistoryItem(
    val id: String,
    val diseaseId: String,
    val diseaseName: String,
    val scientificName: String,
    val isTomatoLeaf: Boolean,
    val confidencePercent: Int,
    val severity: String,
    val summary: String,
    val organicSteps: List<String>,
    val source: String,
    val moistureSnapshot: Int,
    val phSnapshot: Float,
    val timestampMs: Long,
    val thumbnailPath: String? = null
)

enum class PathogenCategory(val label: String) {
    ALL("All"),
    FUNGAL("Fungal"),
    BACTERIAL("Bacterial"),
    VIRAL("Viral"),
    HEALTHY("Healthy")
}

data class DiseaseGuide(
    val id: String,
    val name: String,
    val scientificName: String,
    val category: PathogenCategory,
    val severity: String,
    val contagionRisk: String,
    val favorableClimate: String,
    val summary: String,
    val keySymptoms: List<String>,
    val organicCare: List<String>,
    val preventionSteps: List<String>
)

enum class ArticleCategory(val label: String) {
    ALL("All"),
    DISEASE_ALERT("Disease Alert"),
    LATEST_NEWS("Latest News"),
    CROP_GUIDE("Crop Guide")
}

data class AgroArticle(
    val id: String,
    val title: String,
    val category: ArticleCategory,
    val regionTag: String,
    val publishedLabel: String,
    val readTimeLabel: String,
    val summary: String,
    val bodyParagraphs: List<String>,
    val actionTip: String
)
