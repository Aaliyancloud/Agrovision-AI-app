package com.agrovision.ai.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.agrovision.ai.model.AgroRegion
import com.agrovision.ai.model.BlightRiskLevel
import com.agrovision.ai.model.WeatherTelemetryState

@Entity(tableName = "weather_cache")
data class WeatherCacheEntity(
    @PrimaryKey
    val regionKey: String,
    val locationLabel: String,
    val temperatureC: Double,
    val humidityPercent: Int,
    val dewPointC: Double,
    val rainMm: Double,
    val windKph: Double,
    val blightRiskName: String,
    val soilMoisturePercent: Int,
    val soilPh: Float,
    val advisoryText: String,
    val isLiveGps: Boolean,
    val updatedAtLabel: String,
    val cachedAtMs: Long
) {
    fun toTelemetryState(isOfflineFallback: Boolean): WeatherTelemetryState {
        val region = runCatching { AgroRegion.valueOf(regionKey) }.getOrDefault(AgroRegion.AUTO_GPS)
        val risk = runCatching { BlightRiskLevel.valueOf(blightRiskName) }.getOrDefault(BlightRiskLevel.MODERATE)
        return WeatherTelemetryState(
            region = region,
            locationLabel = locationLabel,
            temperatureC = temperatureC,
            humidityPercent = humidityPercent,
            dewPointC = dewPointC,
            rainMm = rainMm,
            windKph = windKph,
            blightRisk = risk,
            soilMoisturePercent = soilMoisturePercent,
            soilPh = soilPh,
            advisoryText = advisoryText,
            isLiveGps = isLiveGps,
            isSyncing = false,
            lastUpdatedLabel = if (isOfflineFallback) "Offline cache · $updatedAtLabel" else updatedAtLabel
        )
    }

    companion object {
        fun fromTelemetry(state: WeatherTelemetryState): WeatherCacheEntity = WeatherCacheEntity(
            regionKey = state.region.name,
            locationLabel = state.locationLabel,
            temperatureC = state.temperatureC,
            humidityPercent = state.humidityPercent,
            dewPointC = state.dewPointC,
            rainMm = state.rainMm,
            windKph = state.windKph,
            blightRiskName = state.blightRisk.name,
            soilMoisturePercent = state.soilMoisturePercent,
            soilPh = state.soilPh,
            advisoryText = state.advisoryText,
            isLiveGps = state.isLiveGps,
            updatedAtLabel = state.lastUpdatedLabel,
            cachedAtMs = System.currentTimeMillis()
        )
    }
}
