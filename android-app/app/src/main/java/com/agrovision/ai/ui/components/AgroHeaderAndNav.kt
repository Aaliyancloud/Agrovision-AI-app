package com.agrovision.ai.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Eco
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.LocalFireDepartment
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.MenuBook
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.PhotoCamera
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrovision.ai.data.AgroRepository
import com.agrovision.ai.model.AppTab
import com.agrovision.ai.ui.theme.AgroColors
import com.agrovision.ai.viewmodel.AgroUiState

@Composable
fun AgroTopHeader(
    title: String,
    subtitle: String,
    uiState: AgroUiState,
    onBadgeClick: () -> Unit
) {
    Surface(
        color = AgroColors.Surface,
        shadowElevation = 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.statusBarsPadding()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(AgroColors.ForestPrimary),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Eco,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // Weight(1f) + single-line ellipsis prevents title from colliding with Level chip
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = AgroColors.TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.labelSmall,
                        color = AgroColors.ForestPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Streak indicator pill (compact, never wraps or clips)
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = AgroColors.AmberSoft,
                    border = BorderStroke(1.dp, AgroColors.OchreWarm.copy(alpha = 0.35f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.LocalFireDepartment,
                            contentDescription = "Daily Streak",
                            tint = AgroColors.TerracottaAction,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "${uiState.dailyStreak}d",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AgroColors.OchreWarm,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }

                // Compact Level Badge trigger (always cleanly fits Level 1 / Level 2+)
                Surface(
                    onClick = onBadgeClick,
                    shape = RoundedCornerShape(12.dp),
                    color = AgroColors.EmeraldSoft,
                    border = BorderStroke(1.dp, AgroColors.Border)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(uiState.currentBadge.accentColor)
                        )
                        Text(
                            text = "Level ${uiState.level}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AgroColors.ForestDark,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AgroFloatingBottomNav(
    activeTab: AppTab,
    onSelectTab: (AppTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(26.dp),
            color = AgroColors.Surface,
            shadowElevation = 10.dp,
            border = BorderStroke(1.dp, AgroColors.Border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(6.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AppTab.entries.forEach { tab ->
                    val selected = tab == activeTab
                    val containerColor by animateColorAsState(
                        targetValue = if (selected) AgroColors.ForestPrimary else Color.Transparent,
                        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
                        label = "navTabBg"
                    )
                    val contentColor by animateColorAsState(
                        targetValue = if (selected) Color.White else AgroColors.TextSecondary,
                        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
                        label = "navTabFg"
                    )

                    val icon: ImageVector = when (tab) {
                        AppTab.HOME -> Icons.Rounded.Home
                        AppTab.SCAN -> Icons.Rounded.PhotoCamera
                        AppTab.LIBRARY -> Icons.Rounded.MenuBook
                        AppTab.FIELD -> Icons.Rounded.Person
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(20.dp))
                            .background(containerColor)
                            .clickable { onSelectTab(tab) }
                            .padding(vertical = 10.dp, horizontal = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = tab.label,
                                tint = contentColor,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = tab.label,
                                color = contentColor,
                                fontSize = 11.sp,
                                fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.SemiBold,
                                maxLines = 1,
                                softWrap = false,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BadgeAndStreakBottomSheet(
    uiState: AgroUiState,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = AgroColors.Surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = uiState.currentBadge.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = AgroColors.TextPrimary
                    )
                    Text(
                        text = "Level ${uiState.level} · ${uiState.xp} Total XP",
                        style = MaterialTheme.typography.bodySmall,
                        color = AgroColors.TextSecondary
                    )
                }
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = AgroColors.EmeraldSoft
                ) {
                    Text(
                        text = "${uiState.unlockedBadgeIds.size}/${AgroRepository.BADGE_TIERS.size} Badges",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = AgroColors.ForestDark
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                LinearProgressIndicator(
                    progress = { (uiState.xpIntoLevel.toFloat() / uiState.xpForNextLevel).coerceIn(0.05f, 1f) },
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
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${uiState.xpIntoLevel}/${uiState.xpForNextLevel} XP to Level ${uiState.level + 1}",
                        style = MaterialTheme.typography.labelSmall,
                        color = AgroColors.TextSecondary
                    )
                    uiState.nextBadge?.let {
                        Text(
                            text = "Next: ${it.title}",
                            style = MaterialTheme.typography.labelSmall,
                            color = AgroColors.ForestPrimary
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    color = AgroColors.SurfaceMuted,
                    border = BorderStroke(1.dp, AgroColors.Border)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.LocalFireDepartment,
                            contentDescription = null,
                            tint = AgroColors.TerracottaAction
                        )
                        Column {
                            Text(
                                text = "${uiState.dailyStreak} Day Streak",
                                style = MaterialTheme.typography.labelMedium,
                                color = AgroColors.TextPrimary
                            )
                            Text(
                                text = "Best: ${uiState.longestStreak}d",
                                style = MaterialTheme.typography.labelSmall,
                                color = AgroColors.TextSecondary
                            )
                        }
                    }
                }
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    color = AgroColors.BlueSoft,
                    border = BorderStroke(1.dp, AgroColors.RoyalBlue.copy(alpha = 0.25f))
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Shield,
                            contentDescription = null,
                            tint = AgroColors.RoyalBlue
                        )
                        Column {
                            Text(
                                text = "${uiState.streakFreezes}/${uiState.maxStreakFreezes} Freeze",
                                style = MaterialTheme.typography.labelMedium,
                                color = AgroColors.TextPrimary
                            )
                            Text(
                                text = "+1 every 3-day streak",
                                style = MaterialTheme.typography.labelSmall,
                                color = AgroColors.TextSecondary
                            )
                        }
                    }
                }
            }

            Text(
                text = "Achievement Badges",
                style = MaterialTheme.typography.titleSmall,
                color = AgroColors.TextPrimary
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                AgroRepository.BADGE_TIERS.forEach { badge ->
                    val unlocked = uiState.level >= badge.requiredLevel
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (unlocked) AgroColors.SurfaceMuted else AgroColors.Background,
                        border = BorderStroke(1.dp, AgroColors.Border),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(if (unlocked) badge.accentColor else Color(0xFFCBD5E1)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (unlocked) Icons.Rounded.CheckCircle else Icons.Rounded.Lock,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${badge.title} · Lv.${badge.requiredLevel}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = AgroColors.TextPrimary
                                )
                                Text(
                                    text = badge.howToEarn,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AgroColors.TextSecondary
                                )
                            }
                            if (unlocked) {
                                Icon(
                                    imageVector = Icons.Rounded.AutoAwesome,
                                    contentDescription = "Unlocked",
                                    tint = badge.accentColor,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}
