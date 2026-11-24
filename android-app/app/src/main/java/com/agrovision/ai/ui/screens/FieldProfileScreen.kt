package com.agrovision.ai.ui.screens

import android.graphics.BitmapFactory
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.LocalFireDepartment
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.OfflinePin
import androidx.compose.material.icons.rounded.PhotoCamera
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrovision.ai.data.AgroRepository
import com.agrovision.ai.model.ScanHistoryItem
import com.agrovision.ai.ui.theme.AgroColors
import com.agrovision.ai.viewmodel.AgroUiState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FieldProfileScreen(
    uiState: AgroUiState,
    onSearchQueryChange: (String) -> Unit,
    onDeleteScan: (String) -> Unit,
    onClearAllScans: () -> Unit,
    onStartScan: () -> Unit,
    modifier: Modifier = Modifier
) {
    var inspectedScan by remember { mutableStateOf<ScanHistoryItem?>(null) }
    val dateFormatter = remember { SimpleDateFormat("MMM d · hh:mm a", Locale.getDefault()) }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Grower Profile, Streaks & Grace Freeze Card
        item {
            Surface(
                shape = RoundedCornerShape(22.dp),
                color = AgroColors.Surface,
                border = BorderStroke(1.dp, AgroColors.Border),
                shadowElevation = 1.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = uiState.currentBadge.title,
                                style = MaterialTheme.typography.titleMedium,
                                color = AgroColors.TextPrimary
                            )
                            Text(
                                text = "Level ${uiState.level} · ${uiState.xp} Total XP",
                                style = MaterialTheme.typography.bodySmall,
                                color = AgroColors.ForestPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = AgroColors.EmeraldSoft
                        ) {
                            Text(
                                text = "${uiState.unlockedBadgeIds.size}/${AgroRepository.BADGE_TIERS.size} Badges",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = AgroColors.ForestDark,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }

                    LinearProgressIndicator(
                        progress = { (uiState.xpIntoLevel.toFloat() / uiState.xpForNextLevel).coerceIn(0.06f, 1f) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(99.dp)),
                        color = AgroColors.ForestPrimary,
                        trackColor = AgroColors.SurfaceMuted,
                        strokeCap = StrokeCap.Round
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            color = AgroColors.AmberSoft
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Rounded.LocalFireDepartment, contentDescription = null, tint = AgroColors.TerracottaAction)
                                Column {
                                    Text("${uiState.dailyStreak} Day Streak", style = MaterialTheme.typography.labelMedium, color = AgroColors.TextPrimary)
                                    Text("Longest: ${uiState.longestStreak}d", style = MaterialTheme.typography.labelSmall, color = AgroColors.OchreWarm)
                                }
                            }
                        }

                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            color = AgroColors.BlueSoft
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Rounded.Shield, contentDescription = null, tint = AgroColors.RoyalBlue)
                                Column {
                                    Text("${uiState.streakFreezes}/${uiState.maxStreakFreezes} Freeze", style = MaterialTheme.typography.labelMedium, color = AgroColors.TextPrimary)
                                    Text(
                                        text = if (uiState.streakProtectedByFreeze) "Grace active" else "1-day grace",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = AgroColors.RoyalBlue
                                    )
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        AgroRepository.BADGE_TIERS.forEach { badge ->
                            val unlocked = uiState.level >= badge.requiredLevel
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (unlocked) AgroColors.SurfaceMuted else AgroColors.Background,
                                border = BorderStroke(1.dp, AgroColors.Border),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(
                                    modifier = Modifier.padding(vertical = 8.dp, horizontal = 2.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(if (unlocked) badge.accentColor else Color(0xFFCBD5E1)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = if (unlocked) Icons.Rounded.EmojiEvents else Icons.Rounded.Lock,
                                            contentDescription = badge.title,
                                            tint = Color.White,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                    Text(
                                        text = "Lv.${badge.requiredLevel}",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AgroColors.TextSecondary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Offline Room Database Scan History Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text("Field Scan Log", style = MaterialTheme.typography.titleMedium, color = AgroColors.TextPrimary)
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = AgroColors.EmeraldSoft
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                                ) {
                                    Icon(Icons.Rounded.OfflinePin, contentDescription = null, tint = AgroColors.ForestPrimary, modifier = Modifier.size(11.dp))
                                    Text("Offline SQLite", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = AgroColors.ForestDark)
                                }
                            }
                        }
                        Text(
                            text = "${uiState.scanHistory.size} cached scans available offline",
                            style = MaterialTheme.typography.labelSmall,
                            color = AgroColors.TextSecondary
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (uiState.scanHistory.isNotEmpty()) {
                            TextButton(onClick = onClearAllScans) {
                                Text("Clear", color = AgroColors.CrimsonAlert, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Button(
                            onClick = onStartScan,
                            colors = ButtonDefaults.buttonColors(containerColor = AgroColors.ForestPrimary),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Rounded.PhotoCamera, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.size(6.dp))
                            Text("Scan", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Offline Room Search Filter
                if (uiState.scanHistory.isNotEmpty() || uiState.historySearchQuery.isNotBlank()) {
                    OutlinedTextField(
                        value = uiState.historySearchQuery,
                        onValueChange = onSearchQueryChange,
                        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                        trailingIcon = {
                            if (uiState.historySearchQuery.isNotEmpty()) {
                                IconButton(onClick = { onSearchQueryChange("") }) {
                                    Icon(Icons.Rounded.Close, contentDescription = "Clear search")
                                }
                            }
                        },
                        placeholder = { Text("Search cached scans offline...", fontSize = 12.sp) },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        if (uiState.scanHistory.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = AgroColors.Surface,
                    border = BorderStroke(1.dp, AgroColors.Border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = if (uiState.historySearchQuery.isNotBlank()) {
                                "No Matching Cached Scans"
                            } else {
                                "No Field Scans Recorded Yet"
                            },
                            style = MaterialTheme.typography.titleSmall,
                            color = AgroColors.TextPrimary
                        )
                        Text(
                            text = "Scans are saved locally in Room SQLite so you can inspect leaf history and treatments anytime without internet.",
                            style = MaterialTheme.typography.bodySmall,
                            color = AgroColors.TextSecondary
                        )
                    }
                }
            }
        } else {
            items(uiState.scanHistory, key = { it.id }) { item ->
                Surface(
                    onClick = { inspectedScan = item },
                    shape = RoundedCornerShape(16.dp),
                    color = AgroColors.Surface,
                    border = BorderStroke(1.dp, AgroColors.Border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        ScanThumbnailAvatar(
                            thumbnailPath = item.thumbnailPath,
                            isTomatoLeaf = item.isTomatoLeaf
                        )

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.diseaseName,
                                style = MaterialTheme.typography.titleSmall,
                                color = AgroColors.TextPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "${item.confidencePercent}% · ${item.source} · ${dateFormatter.format(Date(item.timestampMs))}",
                                style = MaterialTheme.typography.labelSmall,
                                color = AgroColors.TextSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        IconButton(onClick = { onDeleteScan(item.id) }) {
                            Icon(
                                imageVector = Icons.Rounded.DeleteOutline,
                                contentDescription = "Delete Scan",
                                tint = AgroColors.CrimsonAlert
                            )
                        }
                    }
                }
            }
        }
    }

    inspectedScan?.let { entry ->
        ModalBottomSheet(
            onDismissRequest = { inspectedScan = null },
            containerColor = AgroColors.Surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ScanThumbnailAvatar(
                        thumbnailPath = entry.thumbnailPath,
                        isTomatoLeaf = entry.isTomatoLeaf,
                        sizeDp = 58
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(entry.diseaseName, style = MaterialTheme.typography.titleLarge, color = AgroColors.TextPrimary)
                        Text(
                            text = "${entry.scientificName} · ${entry.confidencePercent}% · ${entry.severity}",
                            fontStyle = FontStyle.Italic,
                            style = MaterialTheme.typography.labelMedium,
                            color = AgroColors.ForestPrimary
                        )
                    }
                }
                Text(entry.summary, style = MaterialTheme.typography.bodySmall, color = AgroColors.TextSecondary)
                Text("Organic Steps:", style = MaterialTheme.typography.titleSmall, color = AgroColors.ForestDark)
                entry.organicSteps.forEach { step ->
                    Text("• $step", style = MaterialTheme.typography.bodySmall, color = AgroColors.TextPrimary)
                }
                Spacer(modifier = Modifier.height(14.dp))
            }
        }
    }
}

@Composable
private fun ScanThumbnailAvatar(
    thumbnailPath: String?,
    isTomatoLeaf: Boolean,
    sizeDp: Int = 44
) {
    val thumbBitmap by produceState<ImageBitmap?>(initialValue = null, thumbnailPath) {
        value = if (!thumbnailPath.isNullOrBlank()) {
            withContext(Dispatchers.IO) {
                runCatching {
                    val file = File(thumbnailPath)
                    if (file.exists()) {
                        BitmapFactory.decodeFile(file.absolutePath)?.asImageBitmap()
                    } else null
                }.getOrNull()
            }
        } else null
    }

    if (thumbBitmap != null) {
        Image(
            bitmap = thumbBitmap!!,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(sizeDp.dp)
                .clip(RoundedCornerShape(12.dp))
        )
    } else {
        Box(
            modifier = Modifier
                .size(sizeDp.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(if (isTomatoLeaf) AgroColors.EmeraldSoft else AgroColors.AmberSoft),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Rounded.CheckCircle,
                contentDescription = null,
                tint = if (isTomatoLeaf) AgroColors.ForestPrimary else AgroColors.OchreWarm,
                modifier = Modifier.size((sizeDp / 2).dp)
            )
        }
    }
}
