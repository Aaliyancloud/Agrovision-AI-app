package com.agrovision.ai.viewmodel

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.agrovision.ai.data.AgroPreferencesStore
import com.agrovision.ai.data.AgroRepository
import com.agrovision.ai.data.WeatherTelemetryService
import com.agrovision.ai.data.local.AgroDatabase
import com.agrovision.ai.data.local.ScanHistoryEntity
import com.agrovision.ai.model.AgroRegion
import com.agrovision.ai.model.AppTab
import com.agrovision.ai.model.BadgeTier
import com.agrovision.ai.model.DailyMissionId
import com.agrovision.ai.model.GrowthStage
import com.agrovision.ai.model.GrowthStageAlert
import com.agrovision.ai.model.ScanHistoryItem
import com.agrovision.ai.model.WeatherTelemetryState
import com.agrovision.ai.utils.HapticHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

data class AgroUiState(
    val activeTab: AppTab = AppTab.HOME,
    val xp: Int = 20,
    val level: Int = 1,
    val xpIntoLevel: Int = 20,
    val xpForNextLevel: Int = 100,
    val dailyStreak: Int = 0,
    val longestStreak: Int = 0,
    val streakFreezes: Int = 1,
    val maxStreakFreezes: Int = 2,
    val streakProtectedByFreeze: Boolean = false,
    val hasCompletedMissionToday: Boolean = false,
    val completedMissionsToday: Set<DailyMissionId> = emptySet(),
    val currentBadge: BadgeTier = AgroRepository.BADGE_TIERS.first(),
    val nextBadge: BadgeTier? = AgroRepository.BADGE_TIERS[1],
    val unlockedBadgeIds: Set<String> = setOf("tomato_scout"),
    val recentXpBanner: String? = null,
    val recentBadgeUnlock: BadgeTier? = null,
    val selectedGrowthStage: GrowthStage = GrowthStage.FLOWERING,
    val growthStageAlert: GrowthStageAlert = AgroRepository.evaluateGrowthStageAlert(
        GrowthStage.FLOWERING, 58, 6.4f
    ),
    val telemetry: WeatherTelemetryState = WeatherTelemetryState(),
    val locationPermissionGranted: Boolean = false,
    val locationPromptDismissed: Boolean = false,
    val scanHistory: List<ScanHistoryItem> = emptyList(),
    val historySearchQuery: String = "",
    val activeScanResult: ScanHistoryItem? = null,
    val isAnalyzingLeaf: Boolean = false
)

@OptIn(ExperimentalCoroutinesApi::class)
class AgroViewModel(application: Application) : AndroidViewModel(application) {

    private val store = AgroPreferencesStore(application)
    private val agroDao = AgroDatabase.getInstance(application).agroDao()
    private val weatherService = WeatherTelemetryService(application, agroDao)

    private var lastCompletedDate: String? = null
    private var lastFreezeUsedDate: String? = null

    private val searchQueryFlow = MutableStateFlow("")
    private val _uiState = MutableStateFlow(buildInitialState())
    val uiState: StateFlow<AgroUiState> = _uiState.asStateFlow()

    init {
        migrateLegacyHistoryAndObserveRoom()
        loadCachedTelemetryThenRefresh()
    }

    private fun buildInitialState(): AgroUiState {
        val loaded = store.loadProgress()
        lastCompletedDate = loaded.lastCompletedDate
        lastFreezeUsedDate = loaded.lastFreezeUsedDate

        val level = (loaded.xp / 100) + 1
        val unlocked = AgroRepository.BADGE_TIERS.filter { level >= it.requiredLevel }
        val currentBadge = unlocked.lastOrNull() ?: AgroRepository.BADGE_TIERS.first()
        val nextBadge = AgroRepository.BADGE_TIERS.firstOrNull { level < it.requiredLevel }
        val defaultTelemetry = WeatherTelemetryState(region = loaded.region)

        return AgroUiState(
            xp = loaded.xp,
            level = level,
            xpIntoLevel = loaded.xp % 100,
            dailyStreak = loaded.dailyStreak,
            longestStreak = loaded.longestStreak,
            streakFreezes = loaded.streakFreezes,
            streakProtectedByFreeze = loaded.streakProtectedByFreeze,
            hasCompletedMissionToday = loaded.lastCompletedDate == store.todayKey(),
            completedMissionsToday = loaded.completedMissionsToday,
            currentBadge = currentBadge,
            nextBadge = nextBadge,
            unlockedBadgeIds = unlocked.map { it.id }.toSet(),
            selectedGrowthStage = loaded.growthStage,
            growthStageAlert = AgroRepository.evaluateGrowthStageAlert(
                loaded.growthStage,
                defaultTelemetry.soilMoisturePercent,
                defaultTelemetry.soilPh
            ),
            telemetry = defaultTelemetry,
            locationPermissionGranted = weatherService.hasLocationPermission()
        )
    }

    private fun migrateLegacyHistoryAndObserveRoom() {
        viewModelScope.launch(Dispatchers.IO) {
            val legacyScans = store.consumeLegacyScansForMigration()
            if (legacyScans.isNotEmpty()) {
                agroDao.insertScans(legacyScans.map { ScanHistoryEntity.fromDomainModel(it) })
            }
        }

        viewModelScope.launch {
            searchQueryFlow
                .flatMapLatest { query ->
                    val trimmed = query.trim()
                    if (trimmed.isEmpty()) {
                        agroDao.observeAllScans()
                    } else {
                        agroDao.searchScans(trimmed)
                    }
                }
                .map { entities -> entities.map { it.toDomainModel() } }
                .collect { items ->
                    _uiState.update { it.copy(scanHistory = items) }
                }
        }
    }

    private fun loadCachedTelemetryThenRefresh() {
        viewModelScope.launch {
            val cached = weatherService.loadCachedTelemetry(_uiState.value.telemetry.region)
            if (cached != null) {
                _uiState.update { state ->
                    state.copy(
                        telemetry = cached,
                        growthStageAlert = AgroRepository.evaluateGrowthStageAlert(
                            state.selectedGrowthStage,
                            cached.soilMoisturePercent,
                            cached.soilPh
                        )
                    )
                }
            }
            refreshWeatherAndTelemetry()
        }
    }

    fun selectTab(tab: AppTab) {
        if (tab == AppTab.SCAN) {
            HapticHelper.scanTap(getApplication())
        }
        _uiState.update { it.copy(activeTab = tab) }
    }

    fun onHistorySearchQueryChange(query: String) {
        searchQueryFlow.value = query
        _uiState.update { it.copy(historySearchQuery = query) }
    }

    fun selectGrowthStage(stage: GrowthStage) {
        val telemetry = _uiState.value.telemetry
        store.saveStageAndRegion(stage, telemetry.region)
        _uiState.update {
            it.copy(
                selectedGrowthStage = stage,
                growthStageAlert = AgroRepository.evaluateGrowthStageAlert(
                    stage,
                    telemetry.soilMoisturePercent,
                    telemetry.soilPh
                )
            )
        }
        completeMissionAutomatically(DailyMissionId.HIGH_RISK_PREVENTIVE_CHECK)
    }

    fun selectRegion(region: AgroRegion) {
        store.saveStageAndRegion(_uiState.value.selectedGrowthStage, region)
        _uiState.update {
            it.copy(telemetry = it.telemetry.copy(region = region, isSyncing = true))
        }
        refreshWeatherAndTelemetry(region)
        completeMissionAutomatically(DailyMissionId.HIGH_RISK_PREVENTIVE_CHECK)
    }

    fun onLocationPermissionResult(granted: Boolean) {
        _uiState.update {
            it.copy(
                locationPermissionGranted = granted,
                locationPromptDismissed = !granted
            )
        }
        refreshWeatherAndTelemetry(
            if (granted) AgroRegion.AUTO_GPS else _uiState.value.telemetry.region
        )
    }

    fun refreshWeatherAndTelemetry(regionOverride: AgroRegion? = null) {
        val targetRegion = regionOverride ?: _uiState.value.telemetry.region
        _uiState.update {
            it.copy(telemetry = it.telemetry.copy(region = targetRegion, isSyncing = true))
        }

        viewModelScope.launch {
            val updated = weatherService.fetchAutomaticWeatherAndTelemetry(targetRegion)
            _uiState.update { state ->
                state.copy(
                    telemetry = updated,
                    locationPermissionGranted = weatherService.hasLocationPermission(),
                    growthStageAlert = AgroRepository.evaluateGrowthStageAlert(
                        state.selectedGrowthStage,
                        updated.soilMoisturePercent,
                        updated.soilPh
                    )
                )
            }
            if (!updated.isOfflineCached) {
                completeMissionAutomatically(DailyMissionId.GPS_WEATHER_SYNC)
            }
        }
    }

    fun analyzeLeafBitmap(bitmap: Bitmap, source: String) {
        HapticHelper.scanTap(getApplication())
        _uiState.update { it.copy(isAnalyzingLeaf = true, activeTab = AppTab.SCAN) }

        viewModelScope.launch {
            val result = withContext(Dispatchers.Default) {
                delay(420)
                val analyzed = AgroRepository.analyzeLeafBitmap(bitmap, source, _uiState.value.telemetry)
                val thumbPath = saveScanThumbnailToDisk(analyzed.id, bitmap)
                analyzed.copy(thumbnailPath = thumbPath)
            }
            recordScanResult(result)
        }
    }

    fun analyzeSampleLeaf(diseaseId: String) {
        HapticHelper.scanTap(getApplication())
        _uiState.update { it.copy(isAnalyzingLeaf = true, activeTab = AppTab.SCAN) }

        viewModelScope.launch {
            val result = withContext(Dispatchers.Default) {
                delay(320)
                AgroRepository.buildSampleScan(diseaseId, _uiState.value.telemetry)
            }
            recordScanResult(result)
        }
    }

    private suspend fun saveScanThumbnailToDisk(scanId: String, sourceBitmap: Bitmap): String? {
        return withContext(Dispatchers.IO) {
            runCatching {
                val thumbDir = File(getApplication<Application>().filesDir, "scan_thumbs")
                if (!thumbDir.exists()) thumbDir.mkdirs()
                val outFile = File(thumbDir, "$scanId.jpg")
                val scaled = Bitmap.createScaledBitmap(sourceBitmap, 220, 220, true)
                FileOutputStream(outFile).use { stream ->
                    scaled.compress(Bitmap.CompressFormat.JPEG, 82, stream)
                }
                outFile.absolutePath
            }.getOrNull()
        }
    }

    private fun recordScanResult(result: ScanHistoryItem) {
        viewModelScope.launch(Dispatchers.IO) {
            agroDao.insertScan(ScanHistoryEntity.fromDomainModel(result))
        }
        _uiState.update {
            it.copy(
                isAnalyzingLeaf = false,
                activeScanResult = result
            )
        }
        if (result.isTomatoLeaf) {
            awardXp(40, "Scan a Leaf +40 XP")
            completeMissionAutomatically(DailyMissionId.SCAN_TOMATO_LEAF)
        }
    }

    fun clearActiveScanResult() {
        HapticHelper.scanTap(getApplication())
        _uiState.update { it.copy(activeScanResult = null) }
    }

    fun deleteScanHistoryItem(id: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val existing = agroDao.getScanById(id)
            existing?.thumbnailPath?.let { path ->
                runCatching { File(path).delete() }
            }
            agroDao.deleteScanById(id)
        }
    }

    fun clearAllScans() {
        viewModelScope.launch(Dispatchers.IO) {
            agroDao.clearAllScans()
            val thumbDir = File(getApplication<Application>().filesDir, "scan_thumbs")
            if (thumbDir.exists()) {
                thumbDir.listFiles()?.forEach { runCatching { it.delete() } }
            }
        }
    }

    fun onLibraryOrArticleOpened() {
        completeMissionAutomatically(DailyMissionId.LIBRARY_GUIDE_READ)
    }

    private fun completeMissionAutomatically(missionId: DailyMissionId) {
        val current = _uiState.value
        if (current.completedMissionsToday.contains(missionId)) return

        val nextMissions = current.completedMissionsToday + missionId
        val today = store.todayKey()
        val yesterday = store.offsetDateKey(1)
        val alreadyStreakToday = lastCompletedDate == today

        var nextStreak = current.dailyStreak
        var nextLongest = current.longestStreak
        var nextFreezes = current.streakFreezes
        var streakBonus = 0

        if (!alreadyStreakToday) {
            val activePrior = if (lastCompletedDate == yesterday) current.dailyStreak else 0
            nextStreak = activePrior + 1
            nextLongest = maxOf(current.longestStreak, nextStreak)
            if (nextStreak % 3 == 0 && nextFreezes < current.maxStreakFreezes) {
                nextFreezes += 1
            }
            streakBonus = (10 + nextStreak * 5).coerceAtMost(50)
            lastCompletedDate = today
        }

        val addedXp = missionId.xpReward + streakBonus
        val nextXp = current.xp + addedXp
        applyXpAndStreakState(
            nextXp = nextXp,
            nextStreak = nextStreak,
            nextLongest = nextLongest,
            nextFreezes = nextFreezes,
            nextMissions = nextMissions,
            xpBannerText = null
        )
        HapticHelper.missionCompleted(getApplication())
    }

    private fun awardXp(amount: Int, bannerText: String) {
        val current = _uiState.value
        applyXpAndStreakState(
            nextXp = current.xp + amount,
            nextStreak = current.dailyStreak,
            nextLongest = current.longestStreak,
            nextFreezes = current.streakFreezes,
            nextMissions = current.completedMissionsToday,
            xpBannerText = bannerText
        )
    }

    private fun applyXpAndStreakState(
        nextXp: Int,
        nextStreak: Int,
        nextLongest: Int,
        nextFreezes: Int,
        nextMissions: Set<DailyMissionId>,
        xpBannerText: String?
    ) {
        val prevLevel = _uiState.value.level
        val nextLevel = (nextXp / 100) + 1
        val unlockedTiers = AgroRepository.BADGE_TIERS.filter { nextLevel >= it.requiredLevel }
        val currentBadge = unlockedTiers.lastOrNull() ?: AgroRepository.BADGE_TIERS.first()
        val nextBadge = AgroRepository.BADGE_TIERS.firstOrNull { nextLevel < it.requiredLevel }
        val newlyUnlockedBadge = if (nextLevel > prevLevel) {
            AgroRepository.BADGE_TIERS.lastOrNull {
                it.requiredLevel in (prevLevel + 1)..nextLevel
            }
        } else null

        if (newlyUnlockedBadge != null) {
            HapticHelper.badgeUnlocked(getApplication())
        }

        store.saveProgress(
            xp = nextXp,
            dailyStreak = nextStreak,
            longestStreak = nextLongest,
            lastCompletedDate = lastCompletedDate,
            streakFreezes = nextFreezes,
            lastFreezeUsedDate = lastFreezeUsedDate,
            completedMissionsToday = nextMissions
        )

        _uiState.update { state ->
            state.copy(
                xp = nextXp,
                level = nextLevel,
                xpIntoLevel = nextXp % 100,
                dailyStreak = nextStreak,
                longestStreak = nextLongest,
                streakFreezes = nextFreezes,
                streakProtectedByFreeze = lastCompletedDate != store.todayKey() &&
                    nextStreak > 0 && lastFreezeUsedDate == store.offsetDateKey(1),
                hasCompletedMissionToday = lastCompletedDate == store.todayKey(),
                completedMissionsToday = nextMissions,
                currentBadge = currentBadge,
                nextBadge = nextBadge,
                unlockedBadgeIds = unlockedTiers.map { it.id }.toSet(),
                recentXpBanner = xpBannerText ?: state.recentXpBanner,
                recentBadgeUnlock = newlyUnlockedBadge ?: state.recentBadgeUnlock
            )
        }
    }

    fun dismissXpBanner() {
        _uiState.update { it.copy(recentXpBanner = null) }
    }

    fun dismissBadgeBanner() {
        _uiState.update { it.copy(recentBadgeUnlock = null) }
    }
}
