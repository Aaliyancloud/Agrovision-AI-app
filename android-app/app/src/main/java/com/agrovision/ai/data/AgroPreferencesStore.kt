package com.agrovision.ai.data

import android.content.Context
import com.agrovision.ai.model.AgroRegion
import com.agrovision.ai.model.DailyMissionId
import com.agrovision.ai.model.GrowthStage
import com.agrovision.ai.model.ScanHistoryItem
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class PersistedProgress(
    val xp: Int,
    val dailyStreak: Int,
    val longestStreak: Int,
    val lastCompletedDate: String?,
    val streakFreezes: Int,
    val lastFreezeUsedDate: String?,
    val streakProtectedByFreeze: Boolean,
    val completedMissionsToday: Set<DailyMissionId>,
    val growthStage: GrowthStage,
    val region: AgroRegion
)

class AgroPreferencesStore(context: Context) {

    private val prefs = context.getSharedPreferences("agrovision_native_prefs_v1", Context.MODE_PRIVATE)
    private val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    fun todayKey(): String = dateFormatter.format(Date())

    fun offsetDateKey(daysAgo: Int): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -daysAgo)
        return dateFormatter.format(cal.time)
    }

    fun loadProgress(): PersistedProgress {
        val today = todayKey()
        val yesterday = offsetDateKey(1)
        val twoDaysAgo = offsetDateKey(2)

        val xp = prefs.getInt("xp", 20).coerceAtLeast(0)
        var streakCount = prefs.getInt("streak_count", 0).coerceAtLeast(0)
        val longest = prefs.getInt("longest_streak", 0).coerceAtLeast(streakCount)
        var lastCompleted = prefs.getString("last_completed_date", null)
        var freezes = prefs.getInt("streak_freezes", 1).coerceIn(0, 2)
        var lastFreezeUsed = prefs.getString("last_freeze_used_date", null)

        if (streakCount > 0 && lastCompleted == twoDaysAgo && freezes > 0 && lastFreezeUsed != yesterday) {
            freezes -= 1
            lastCompleted = yesterday
            lastFreezeUsed = yesterday
            prefs.edit()
                .putInt("streak_freezes", freezes)
                .putString("last_completed_date", lastCompleted)
                .putString("last_freeze_used_date", lastFreezeUsed)
                .apply()
        } else if (lastCompleted != today && lastCompleted != yesterday) {
            streakCount = 0
        }

        val protectedByFreeze = lastCompleted != today && streakCount > 0 && lastFreezeUsed == yesterday

        val savedMissionDate = prefs.getString("missions_date", null)
        val completedMissions = if (savedMissionDate == today) {
            val rawSet = prefs.getStringSet("missions_done", emptySet()) ?: emptySet()
            rawSet.mapNotNull { runCatching { DailyMissionId.valueOf(it) }.getOrNull() }.toSet()
        } else {
            emptySet()
        }

        val stageName = prefs.getString("growth_stage", GrowthStage.FLOWERING.name)
        val growthStage = runCatching { GrowthStage.valueOf(stageName ?: "") }.getOrDefault(GrowthStage.FLOWERING)

        val regionName = prefs.getString("region", AgroRegion.AUTO_GPS.name)
        val region = runCatching { AgroRegion.valueOf(regionName ?: "") }.getOrDefault(AgroRegion.AUTO_GPS)

        return PersistedProgress(
            xp = xp,
            dailyStreak = streakCount,
            longestStreak = longest.coerceAtLeast(streakCount),
            lastCompletedDate = lastCompleted,
            streakFreezes = freezes,
            lastFreezeUsedDate = lastFreezeUsed,
            streakProtectedByFreeze = protectedByFreeze,
            completedMissionsToday = completedMissions,
            growthStage = growthStage,
            region = region
        )
    }

    fun saveProgress(
        xp: Int,
        dailyStreak: Int,
        longestStreak: Int,
        lastCompletedDate: String?,
        streakFreezes: Int,
        lastFreezeUsedDate: String?,
        completedMissionsToday: Set<DailyMissionId>
    ) {
        prefs.edit()
            .putInt("xp", xp)
            .putInt("streak_count", dailyStreak)
            .putInt("longest_streak", longestStreak)
            .putString("last_completed_date", lastCompletedDate)
            .putInt("streak_freezes", streakFreezes)
            .putString("last_freeze_used_date", lastFreezeUsedDate)
            .putString("missions_date", todayKey())
            .putStringSet("missions_done", completedMissionsToday.map { it.name }.toSet())
            .apply()
    }

    fun saveStageAndRegion(stage: GrowthStage, region: AgroRegion) {
        prefs.edit()
            .putString("growth_stage", stage.name)
            .putString("region", region.name)
            .apply()
    }

    /**
     * One-time migration helper: pulls any pre-Room SharedPreferences scans and clears legacy key.
     */
    fun consumeLegacyScansForMigration(): List<ScanHistoryItem> {
        val raw = prefs.getString("scan_history_json", null) ?: return emptyList()
        val parsed = runCatching {
            val arr = JSONArray(raw)
            List(arr.length()) { idx ->
                val obj = arr.getJSONObject(idx)
                val stepsJson = obj.optJSONArray("organicSteps") ?: JSONArray()
                val steps = List(stepsJson.length()) { sIdx -> stepsJson.optString(sIdx) }
                ScanHistoryItem(
                    id = obj.getString("id"),
                    diseaseId = obj.getString("diseaseId"),
                    diseaseName = obj.getString("diseaseName"),
                    scientificName = obj.getString("scientificName"),
                    isTomatoLeaf = obj.optBoolean("isTomatoLeaf", true),
                    confidencePercent = obj.optInt("confidencePercent", 90),
                    severity = obj.optString("severity", "Moderate"),
                    summary = obj.optString("summary", ""),
                    organicSteps = steps,
                    source = obj.optString("source", "Camera"),
                    moistureSnapshot = obj.optInt("moistureSnapshot", 58),
                    phSnapshot = obj.optDouble("phSnapshot", 6.4).toFloat(),
                    timestampMs = obj.optLong("timestampMs", System.currentTimeMillis()),
                    thumbnailPath = null
                )
            }
        }.getOrDefault(emptyList())
        prefs.edit().remove("scan_history_json").apply()
        return parsed
    }
}
