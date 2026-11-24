package com.agrovision.ai.data

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import androidx.core.content.ContextCompat
import com.agrovision.ai.data.local.AgroDao
import com.agrovision.ai.data.local.WeatherCacheEntity
import com.agrovision.ai.model.AgroRegion
import com.agrovision.ai.model.BlightRiskLevel
import com.agrovision.ai.model.WeatherTelemetryState
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.coroutines.resume
import kotlin.math.roundToInt

class WeatherTelemetryService(
    private val context: Context,
    private val agroDao: AgroDao
) {

    private val fusedClient by lazy {
        LocationServices.getFusedLocationProviderClient(context)
    }

    fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    suspend fun loadCachedTelemetry(region: AgroRegion): WeatherTelemetryState? = withContext(Dispatchers.IO) {
        agroDao.getCachedWeather(region.name)?.toTelemetryState(isOfflineFallback = true)
    }

    suspend fun fetchAutomaticWeatherAndTelemetry(
        requestedRegion: AgroRegion
    ): WeatherTelemetryState = withContext(Dispatchers.IO) {
        val online = isNetworkAvailable()
        val useGps = requestedRegion == AgroRegion.AUTO_GPS && hasLocationPermission() && online
        val coordinates = if (useGps) getDeviceCoordinates() else null

        val lat = coordinates?.first ?: requestedRegion.latitude
        val lon = coordinates?.second ?: requestedRegion.longitude
        val liveWeather = if (online) fetchOpenMeteoWeather(lat, lon) else null

        // If offline or API unreachable, serve cached Room telemetry when available
        if (liveWeather == null) {
            val cached = agroDao.getCachedWeather(requestedRegion.name)
            if (cached != null) {
                return@withContext cached.toTelemetryState(isOfflineFallback = true).copy(
                    isOfflineCached = true
                )
            }
        }

        val resolvedLabel = when {
            coordinates != null -> resolveCityOrRegionLabel(lat, lon)
            requestedRegion == AgroRegion.AUTO_GPS -> "Punjab Plains (Offline Profile)"
            requestedRegion == AgroRegion.PUNJAB -> "Punjab Agricultural Plains"
            requestedRegion == AgroRegion.SINDH -> "Sindh Tomato Belt"
            else -> "Protected Tunnel / Greenhouse"
        }

        val timeText = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())

        val rawTemp = liveWeather?.tempC ?: when (requestedRegion) {
            AgroRegion.SINDH -> 29.5
            AgroRegion.GREENHOUSE -> 22.5
            else -> 25.4
        }
        val rawHumidity = liveWeather?.humidity ?: when (requestedRegion) {
            AgroRegion.SINDH -> 78
            AgroRegion.GREENHOUSE -> 54
            else -> 64
        }
        val rawDew = liveWeather?.dewPointC ?: (rawTemp - ((100 - rawHumidity) / 5.0))
        val rainMm = liveWeather?.rainMm ?: 0.0
        val windKph = liveWeather?.windKph ?: 8.5

        val finalTemp = if (requestedRegion == AgroRegion.GREENHOUSE) {
            rawTemp.coerceIn(20.0, 24.5)
        } else {
            rawTemp
        }
        val finalHumidity = if (requestedRegion == AgroRegion.GREENHOUSE) {
            rawHumidity.coerceIn(48, 58)
        } else {
            rawHumidity
        }
        val finalDew = if (requestedRegion == AgroRegion.GREENHOUSE) {
            (finalTemp - ((100 - finalHumidity) / 5.0))
        } else {
            rawDew
        }

        val autoSoilMoisture = computeVirtualSoilMoisture(
            humidityPercent = finalHumidity,
            tempC = finalTemp,
            rainMm = rainMm,
            region = requestedRegion
        )

        val autoSoilPh = computeVirtualSoilPh(
            region = requestedRegion,
            rainMm = rainMm,
            moisturePercent = autoSoilMoisture,
            lat = lat
        )

        val blightRisk = when {
            finalHumidity >= 76 || (rainMm >= 1.5 && finalHumidity >= 68) -> BlightRiskLevel.HIGH
            finalHumidity >= 62 -> BlightRiskLevel.MODERATE
            else -> BlightRiskLevel.LOW
        }

        val advisory = when (blightRisk) {
            BlightRiskLevel.HIGH ->
                "High humidity ($finalHumidity%) & ${rainMm}mm rain elevate blight spore risk. Pause overhead watering and scout lower leaves."
            BlightRiskLevel.MODERATE ->
                "Moderate moisture balance ($finalHumidity% RH). Water strictly at the root crown before 10 AM."
            BlightRiskLevel.LOW ->
                "Optimal dry-canopy window ($finalHumidity% RH). Maintain steady root-zone hydration."
        }

        val state = WeatherTelemetryState(
            region = requestedRegion,
            locationLabel = resolvedLabel,
            temperatureC = finalTemp,
            humidityPercent = finalHumidity,
            dewPointC = finalDew,
            rainMm = rainMm,
            windKph = windKph,
            blightRisk = blightRisk,
            soilMoisturePercent = autoSoilMoisture,
            soilPh = autoSoilPh,
            advisoryText = advisory,
            isLiveGps = coordinates != null,
            isOfflineCached = liveWeather == null,
            isSyncing = false,
            lastUpdatedLabel = if (liveWeather != null) "Live · $timeText" else "Offline baseline · $timeText"
        )

        // Persist fresh live weather telemetry into Room for future offline sessions
        if (liveWeather != null) {
            agroDao.upsertWeatherCache(WeatherCacheEntity.fromTelemetry(state))
        }

        state
    }

    private fun computeVirtualSoilMoisture(
        humidityPercent: Int,
        tempC: Double,
        rainMm: Double,
        region: AgroRegion
    ): Int {
        if (region == AgroRegion.GREENHOUSE) {
            return (54 + ((humidityPercent - 50) * 0.25)).roundToInt().coerceIn(48, 64)
        }
        val baseFromHumidity = 34.0 + (humidityPercent * 0.36)
        val rainBoost = (rainMm * 5.2).coerceAtMost(24.0)
        val heatEvapPenalty = ((tempC - 24.0) * 0.9).coerceIn(-6.0, 14.0)
        return (baseFromHumidity + rainBoost - heatEvapPenalty).roundToInt().coerceIn(22, 88)
    }

    private fun computeVirtualSoilPh(
        region: AgroRegion,
        rainMm: Double,
        moisturePercent: Int,
        lat: Double
    ): Float {
        val basePh = when {
            region == AgroRegion.GREENHOUSE -> 6.4f
            region == AgroRegion.SINDH || lat < 27.5 -> 6.9f
            else -> 6.5f
        }
        val rainAcidShift = (rainMm * 0.04f).coerceAtMost(0.3f)
        val dryAlkalineShift = if (moisturePercent < 38) 0.2f else 0.0f
        val computed = (basePh - rainAcidShift + dryAlkalineShift).coerceIn(5.4f, 7.6f)
        return ((computed * 10f).roundToInt()) / 10f
    }

    @SuppressLint("MissingPermission")
    private suspend fun getDeviceCoordinates(): Pair<Double, Double>? {
        if (!hasLocationPermission()) return null
        return suspendCancellableCoroutine { cont ->
            val cts = CancellationTokenSource()
            fusedClient.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token)
                .addOnSuccessListener { location ->
                    if (location != null) {
                        cont.resume(location.latitude to location.longitude)
                    } else {
                        fusedClient.lastLocation
                            .addOnSuccessListener { last ->
                                cont.resume(last?.let { it.latitude to it.longitude })
                            }
                            .addOnFailureListener { cont.resume(null) }
                    }
                }
                .addOnFailureListener { cont.resume(null) }
            cont.invokeOnCancellation { cts.cancel() }
        }
    }

    @Suppress("DEPRECATION")
    private fun resolveCityOrRegionLabel(lat: Double, lon: Double): String {
        runCatching {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                val geocoder = Geocoder(context, Locale.getDefault())
                val list = geocoder.getFromLocation(lat, lon, 1)
                val addr = list?.firstOrNull()
                val city = addr?.locality ?: addr?.subAdminArea ?: addr?.adminArea
                if (!city.isNullOrBlank()) return "$city (GPS)"
            }
        }
        return when {
            lat in 28.0..33.8 && lon in 69.5..75.5 -> "Punjab Field (GPS)"
            lat in 23.5..28.0 && lon in 66.5..71.2 -> "Sindh Field (GPS)"
            else -> "Local Field (${"%.2f".format(lat)}, ${"%.2f".format(lon)})"
        }
    }

    private data class OpenMeteoSnapshot(
        val tempC: Double,
        val humidity: Int,
        val dewPointC: Double,
        val rainMm: Double,
        val windKph: Double
    )

    private fun fetchOpenMeteoWeather(lat: Double, lon: Double): OpenMeteoSnapshot? {
        var conn: HttpURLConnection? = null
        return runCatching {
            val endpoint =
                "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon" +
                    "&current=temperature_2m,relative_humidity_2m,dew_point_2m,rain,wind_speed_10m&timezone=auto"
            conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 6000
                readTimeout = 6000
            }
            if (conn?.responseCode != HttpURLConnection.HTTP_OK) return null
            val body = conn?.inputStream?.bufferedReader()?.use { it.readText() } ?: return null
            val current = JSONObject(body).getJSONObject("current")
            OpenMeteoSnapshot(
                tempC = current.optDouble("temperature_2m", 25.0),
                humidity = current.optInt("relative_humidity_2m", 64),
                dewPointC = current.optDouble("dew_point_2m", 17.0),
                rainMm = current.optDouble("rain", 0.0),
                windKph = current.optDouble("wind_speed_10m", 8.0)
            )
        }.also {
            conn?.disconnect()
        }.getOrNull()
    }
}
