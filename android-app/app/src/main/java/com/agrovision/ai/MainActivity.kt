package com.agrovision.ai

import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.agrovision.ai.model.AppTab
import com.agrovision.ai.ui.components.AgroFloatingBottomNav
import com.agrovision.ai.ui.components.AgroTopHeader
import com.agrovision.ai.ui.components.BadgeAndStreakBottomSheet
import com.agrovision.ai.ui.screens.FieldProfileScreen
import com.agrovision.ai.ui.screens.HomeScreen
import com.agrovision.ai.ui.screens.LibraryAndArticlesScreen
import com.agrovision.ai.ui.screens.ScanScreen
import com.agrovision.ai.ui.theme.AgroColors
import com.agrovision.ai.ui.theme.AgroVisionTheme
import com.agrovision.ai.viewmodel.AgroViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AgroVisionTheme {
                AgroVisionRoot()
            }
        }
    }
}

@Composable
fun AgroVisionRoot(
    viewModel: AgroViewModel = viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showBadgeSheet by remember { mutableStateOf(false) }

    val homePhotoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        uri?.let { picked ->
            runCatching {
                val bmp = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ImageDecoder.decodeBitmap(
                        ImageDecoder.createSource(context.contentResolver, picked)
                    ) { decoder, _, _ -> decoder.isMutableRequired = true }
                } else {
                    @Suppress("DEPRECATION")
                    BitmapFactory.decodeStream(context.contentResolver.openInputStream(picked))
                }
                if (bmp != null) {
                    viewModel.analyzeLeafBitmap(bmp, "Photo Upload")
                }
            }
        }
    }

    val (headerTitle, headerSubtitle) = when (uiState.activeTab) {
        AppTab.HOME -> "AgroVision AI" to "Solanum · Tomato Field Command"
        AppTab.SCAN -> "Leaf Scanner" to "CameraX & Chlorophyll Analysis"
        AppTab.LIBRARY -> "Crop Library" to "Disease Atlas & Latest News"
        AppTab.FIELD -> "Field & Profile" to "${uiState.currentBadge.title} · Scan Log"
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AgroColors.Background)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            AgroTopHeader(
                title = headerTitle,
                subtitle = headerSubtitle,
                uiState = uiState,
                onBadgeClick = { showBadgeSheet = true }
            )

            // Single clean leaf scan XP banner
            AnimatedVisibility(visible = uiState.recentXpBanner != null) {
                uiState.recentXpBanner?.let { bannerText ->
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = AgroColors.ForestDark,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Bolt,
                                contentDescription = null,
                                tint = AgroColors.AmberSoft,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = bannerText,
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(
                                onClick = viewModel::dismissXpBanner,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Rounded.Close, contentDescription = "Dismiss", tint = Color.White, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            }

            // Subtle non-intrusive badge unlock strip
            AnimatedVisibility(visible = uiState.recentBadgeUnlock != null) {
                uiState.recentBadgeUnlock?.let { badge ->
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = AgroColors.AmberSoft,
                        border = BorderStroke(1.dp, AgroColors.OchreWarm.copy(alpha = 0.45f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.AutoAwesome,
                                contentDescription = null,
                                tint = AgroColors.OchreWarm,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Badge unlocked: ${badge.title}",
                                color = AgroColors.TextPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(
                                onClick = viewModel::dismissBadgeBanner,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Rounded.Close, contentDescription = "Dismiss", tint = AgroColors.TextPrimary, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            }

            // Smooth spring-animated tab transitions (150ms–260ms)
            AnimatedContent(
                targetState = uiState.activeTab,
                transitionSpec = {
                    fadeIn(spring(stiffness = Spring.StiffnessMediumLow)) togetherWith
                        fadeOut(spring(stiffness = Spring.StiffnessMediumLow))
                },
                label = "mainTabContent",
                modifier = Modifier.weight(1f)
            ) { tab ->
                when (tab) {
                    AppTab.HOME -> HomeScreen(
                        uiState = uiState,
                        onSelectGrowthStage = viewModel::selectGrowthStage,
                        onSelectRegion = viewModel::selectRegion,
                        onLocationPermissionResult = viewModel::onLocationPermissionResult,
                        onRefreshWeather = { viewModel.refreshWeatherAndTelemetry() },
                        onOpenCameraScan = { viewModel.selectTab(AppTab.SCAN) },
                        onOpenUploadPhoto = {
                            homePhotoPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        }
                    )

                    AppTab.SCAN -> ScanScreen(
                        uiState = uiState,
                        onBitmapCaptured = viewModel::analyzeLeafBitmap,
                        onAnalyzeSample = viewModel::analyzeSampleLeaf,
                        onScanAnother = viewModel::clearActiveScanResult
                    )

                    AppTab.LIBRARY -> LibraryAndArticlesScreen(
                        onItemOpened = viewModel::onLibraryOrArticleOpened
                    )

                    AppTab.FIELD -> FieldProfileScreen(
                        uiState = uiState,
                        onSearchQueryChange = viewModel::onHistorySearchQueryChange,
                        onDeleteScan = viewModel::deleteScanHistoryItem,
                        onClearAllScans = viewModel::clearAllScans,
                        onStartScan = { viewModel.selectTab(AppTab.SCAN) }
                    )
                }
            }
        }

        // Floating Bottom Navigation Bar with gesture/navigationBar safe-area insets
        AgroFloatingBottomNav(
            activeTab = uiState.activeTab,
            onSelectTab = viewModel::selectTab,
            modifier = Modifier.align(Alignment.BottomCenter)
        )
    }

    if (showBadgeSheet) {
        BadgeAndStreakBottomSheet(
            uiState = uiState,
            onDismiss = { showBadgeSheet = false }
        )
    }
}
