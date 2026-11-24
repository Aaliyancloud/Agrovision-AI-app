package com.agrovision.ai.ui.screens

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoMode
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.CloudSync
import androidx.compose.material.icons.rounded.Eco
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.PhotoCamera
import androidx.compose.material.icons.rounded.Science
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Thermostat
import androidx.compose.material.icons.rounded.UploadFile
import androidx.compose.material.icons.rounded.WaterDrop
import androidx.compose.material.icons.rounded.WbSunny
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrovision.ai.model.AgroRegion
import com.agrovision.ai.model.AlertSeverity
import com.agrovision.ai.model.BlightRiskLevel
import com.agrovision.ai.model.DailyMissionId
import com.agrovision.ai.model.GrowthStage
import com.agrovision.ai.ui.theme.AgroColors
import com.agrovision.ai.viewmodel.AgroUiState

@Composable
fun HomeScreen(
    uiState: AgroUiState,
    onSelectGrowthStage: (GrowthStage) -> Unit,
    onSelectRegion: (AgroRegion) -> Unit,
    onLocationPermissionResult: (Boolean) -> Unit,
    onRefreshWeather: () -> Unit,
    onOpenCameraScan: () -> Unit,
    onOpenUploadPhoto: () -> Unit,
    modifier: Modifier = Modifier
) {
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        onLocationPermissionResult(granted)
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Vibrant Tomato Growth Stage Card (Modern, Bright Gradient Accent, Zero Dark/Black Clutter)
        item {
            VibrantTomatoGrowthStageCard(
                uiState = uiState,
                onSelectGrowthStage = onSelectGrowthStage,
                onOpenCameraScan = onOpenCameraScan,
                onOpenUploadPhoto = onOpenUploadPhoto
            )
        }

        // 2. Clean Location Permission Prompt if not yet granted
        if (!uiState.locationPermissionGranted && !uiState.locationPromptDismissed) {
            item {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = AgroColors.BlueSoft,
                    border = BorderStroke(1.dp, AgroColors.RoyalBlue.copy(alpha = 0.25f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(AgroColors.RoyalBlue),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.LocationOn,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Auto-Sync Local Weather & Soil",
                                style = MaterialTheme.typography.labelMedium,
                                color = AgroColors.TextPrimary
                            )
                            Text(
                                text = "Allow location for real-time local blight & soil moisture updates.",
                                style = MaterialTheme.typography.labelSmall,
                                color = AgroColors.TextSecondary
                            )
                        }
                        Button(
                            onClick = {
                                locationPermissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = AgroColors.RoyalBlue),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Enable", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 3. Automatic Weather & Virtual Soil Moisture / Telemetry Card
        item {
            AutomaticWeatherAndSoilCard(
                uiState = uiState,
                onSelectRegion = onSelectRegion,
                onRefresh = onRefreshWeather,
                onRequestLocation = {
                    locationPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            )
        }

        // 4. Automatic Daily Field Missions (No manual checkboxes — event-driven only)
        item {
            AutoDailyMissionsCard(uiState = uiState)
        }
    }
}

@Composable
private fun VibrantTomatoGrowthStageCard(
    uiState: AgroUiState,
    onSelectGrowthStage: (GrowthStage) -> Unit,
    onOpenCameraScan: () -> Unit,
    onOpenUploadPhoto: () -> Unit
) {
    val alert = uiState.growthStageAlert
    val stageGradient = Brush.linearGradient(
        colors = listOf(
            AgroColors.StageVibrantStart,
            AgroColors.StageVibrantMid,
            AgroColors.StageVibrantEnd
        )
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(stageGradient)
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Eco,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Tomato Growth Stage",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color.White.copy(alpha = 0.22f)
                ) {
                    Text(
                        text = uiState.selectedGrowthStage.daysRange,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            // 4 Growth Stage Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                GrowthStage.entries.forEach { stage ->
                    val active = stage == uiState.selectedGrowthStage
                    Surface(
                        onClick = { onSelectGrowthStage(stage) },
                        shape = RoundedCornerShape(12.dp),
                        color = if (active) Color.White else Color.White.copy(alpha = 0.20f),
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier.padding(vertical = 9.dp, horizontal = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = stage.label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (active) AgroColors.ForestDark else Color.White,
                                maxLines = 1,
                                softWrap = false,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }

            // Crisp White High-Readability Contextual Alert Surface
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val statusBg = when (alert.severity) {
                        AlertSeverity.ACTION -> AgroColors.CrimsonAlert
                        AlertSeverity.WATCH -> AgroColors.OchreWarm
                        AlertSeverity.OPTIMAL -> AgroColors.ForestPrimary
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = alert.headline,
                            style = MaterialTheme.typography.titleSmall,
                            color = AgroColors.TextPrimary,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.size(8.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = statusBg
                        ) {
                            Text(
                                text = alert.statusLabel,
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }

                    Text(
                        text = alert.message,
                        style = MaterialTheme.typography.bodySmall,
                        color = AgroColors.TextSecondary
                    )

                    Text(
                        text = "Target: ${alert.stage.moistureMin}–${alert.stage.moistureMax}% VWC · pH ${alert.stage.phMin}–${alert.stage.phMax}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = AgroColors.ForestPrimary
                    )
                }
            }

            // Instant Camera Scan & Upload Photo Pair
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onOpenCameraScan,
                    colors = ButtonDefaults.buttonColors(containerColor = AgroColors.TerracottaAction),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.PhotoCamera,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.size(6.dp))
                    Text("Camera Scan", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
                }

                Button(
                    onClick = onOpenUploadPhoto,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = AgroColors.ForestDark
                    ),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.UploadFile,
                        contentDescription = null,
                        tint = AgroColors.ForestPrimary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.size(6.dp))
                    Text("Upload Photo", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
                }
            }
        }
    }
}

@Composable
private fun AutomaticWeatherAndSoilCard(
    uiState: AgroUiState,
    onSelectRegion: (AgroRegion) -> Unit,
    onRefresh: () -> Unit,
    onRequestLocation: () -> Unit
) {
    val telemetry = uiState.telemetry
    val riskColor = when (telemetry.blightRisk) {
        BlightRiskLevel.HIGH -> AgroColors.CrimsonAlert
        BlightRiskLevel.MODERATE -> AgroColors.OchreWarm
        BlightRiskLevel.LOW -> AgroColors.ForestPrimary
    }

    Surface(
        shape = RoundedCornerShape(20.dp),
        color = AgroColors.Surface,
        border = BorderStroke(1.dp, AgroColors.Border),
        shadowElevation = 1.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "AUTO WEATHER & SOIL TELEMETRY",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = AgroColors.ForestPrimary
                    )
                    Text(
                        text = telemetry.locationLabel,
                        style = MaterialTheme.typography.titleSmall,
                        color = AgroColors.TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = riskColor
                    ) {
                        Text(
                            text = "${telemetry.blightRisk.label} Blight",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    Surface(
                        onClick = onRefresh,
                        shape = RoundedCornerShape(8.dp),
                        color = AgroColors.SurfaceMuted
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.CloudSync,
                            contentDescription = "Refresh Weather",
                            tint = AgroColors.ForestPrimary,
                            modifier = Modifier
                                .padding(6.dp)
                                .size(16.dp)
                        )
                    }
                }
            }

            // Region Chips (Auto GPS + Punjab + Sindh + Greenhouse)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                AgroRegion.entries.forEach { region ->
                    val selected = telemetry.region == region
                    Surface(
                        onClick = {
                            if (region == AgroRegion.AUTO_GPS && !uiState.locationPermissionGranted) {
                                onRequestLocation()
                            } else {
                                onSelectRegion(region)
                            }
                        },
                        shape = RoundedCornerShape(10.dp),
                        color = if (selected) AgroColors.ForestPrimary else AgroColors.SurfaceMuted,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier.padding(vertical = 7.dp, horizontal = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = when (region) {
                                    AgroRegion.AUTO_GPS -> "GPS"
                                    AgroRegion.PUNJAB -> "Punjab"
                                    AgroRegion.SINDH -> "Sindh"
                                    AgroRegion.GREENHOUSE -> "Tunnel"
                                },
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (selected) Color.White else AgroColors.TextSecondary,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }
            }

            // Compact 2x2 Automatic Weather & Virtual Soil Moisture / pH Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TelemetryMetricTile(
                    icon = Icons.Rounded.Thermostat,
                    iconBg = AgroColors.OchreWarm,
                    label = "Temp · Humidity",
                    value = "${"%.1f".format(telemetry.temperatureC)}°C · ${telemetry.humidityPercent}%",
                    modifier = Modifier.weight(1f)
                )
                TelemetryMetricTile(
                    icon = Icons.Rounded.WbSunny,
                    iconBg = AgroColors.TealVibrant,
                    label = "Dew Point · Rain",
                    value = "${"%.1f".format(telemetry.dewPointC)}°C · ${telemetry.rainMm}mm",
                    modifier = Modifier.weight(1f)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TelemetryMetricTile(
                    icon = Icons.Rounded.WaterDrop,
                    iconBg = AgroColors.RoyalBlue,
                    label = "Auto Soil Moisture",
                    value = "${telemetry.soilMoisturePercent}% VWC",
                    modifier = Modifier.weight(1f)
                )
                TelemetryMetricTile(
                    icon = Icons.Rounded.Science,
                    iconBg = AgroColors.ForestPrimary,
                    label = "Derived Soil pH",
                    value = "${"%.1f".format(telemetry.soilPh)} pH",
                    modifier = Modifier.weight(1f)
                )
            }

            Text(
                text = "${telemetry.advisoryText} (${telemetry.lastUpdatedLabel})",
                style = MaterialTheme.typography.labelSmall,
                color = AgroColors.TextSecondary
            )
        }
    }
}

@Composable
private fun TelemetryMetricTile(
    icon: ImageVector,
    iconBg: Color,
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = AgroColors.Background,
        border = BorderStroke(1.dp, AgroColors.Border),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    fontSize = 10.sp,
                    color = AgroColors.TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = value,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = AgroColors.TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun AutoDailyMissionsCard(uiState: AgroUiState) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = AgroColors.Surface,
        border = BorderStroke(1.dp, AgroColors.Border),
        shadowElevation = 1.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.AutoMode,
                            contentDescription = null,
                            tint = AgroColors.ForestPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Daily Field Missions",
                            style = MaterialTheme.typography.titleSmall,
                            color = AgroColors.TextPrimary
                        )
                    }
                    Text(
                        text = "${uiState.completedMissionsToday.size}/${DailyMissionId.entries.size} auto-completed today",
                        style = MaterialTheme.typography.labelSmall,
                        color = AgroColors.TextSecondary
                    )
                }

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = AgroColors.SurfaceMuted
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Shield,
                            contentDescription = null,
                            tint = AgroColors.RoyalBlue,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = "Auto-Tracked",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = AgroColors.RoyalBlue
                        )
                    }
                }
            }

            // Read-only mission rows: strictly tracked automatically via real app events
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                DailyMissionId.entries.forEach { mission ->
                    val completed = uiState.completedMissionsToday.contains(mission)
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (completed) AgroColors.EmeraldSoft else AgroColors.Background,
                        border = BorderStroke(
                            1.dp,
                            if (completed) AgroColors.ForestPrimary.copy(alpha = 0.45f) else AgroColors.Border
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CheckCircle,
                                contentDescription = if (completed) "Completed" else "Pending",
                                tint = if (completed) AgroColors.ForestPrimary else AgroColors.TextMuted.copy(alpha = 0.4f),
                                modifier = Modifier.size(18.dp)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = mission.title,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = AgroColors.TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = if (completed) "Completed automatically" else mission.triggerHint,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (completed) AgroColors.ForestPrimary else AgroColors.TextSecondary
                                )
                            }
                            Text(
                                text = "+${mission.xpReward} XP",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = AgroColors.TerracottaAction
                            )
                        }
                    }
                }
            }
        }
    }
}
