package com.agrovision.ai.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

object AgroColors {
    val Background = Color(0xFFF6FAF7)
    val Surface = Color(0xFFFFFFFF)
    val SurfaceMuted = Color(0xFFEDF5EF)
    val Border = Color(0xFFCFE5D7)

    // Fixed, bold botanical palette (clean, restrained, zero neon glow)
    val ForestDark = Color(0xFF14532D)
    val ForestPrimary = Color(0xFF166534)
    val EmeraldBright = Color(0xFF059669)
    val EmeraldSoft = Color(0xFFDCFCE7)
    val TealVibrant = Color(0xFF0D9488)

    // Vibrant modern gradient stops for the Growth Stage hero card
    val StageVibrantStart = Color(0xFF059669)
    val StageVibrantMid = Color(0xFF0D9488)
    val StageVibrantEnd = Color(0xFF0284C7)

    val TerracottaAction = Color(0xFFC2410C)
    val RoyalBlue = Color(0xFF1D4ED8)
    val BlueSoft = Color(0xFFEFF6FF)
    val OchreWarm = Color(0xFFB45309)
    val AmberSoft = Color(0xFFFEF3C7)
    val CrimsonAlert = Color(0xFFB91C1C)
    val RedSoft = Color(0xFFFEF2F2)

    val TextPrimary = Color(0xFF13281C)
    val TextSecondary = Color(0xFF3D5947)
    val TextMuted = Color(0xFF64748B)
}

private val AgroLightColorScheme = lightColorScheme(
    primary = AgroColors.ForestPrimary,
    onPrimary = Color.White,
    primaryContainer = AgroColors.EmeraldSoft,
    onPrimaryContainer = AgroColors.ForestDark,
    secondary = AgroColors.TealVibrant,
    onSecondary = Color.White,
    tertiary = AgroColors.TerracottaAction,
    onTertiary = Color.White,
    background = AgroColors.Background,
    onBackground = AgroColors.TextPrimary,
    surface = AgroColors.Surface,
    onSurface = AgroColors.TextPrimary,
    surfaceVariant = AgroColors.SurfaceMuted,
    onSurfaceVariant = AgroColors.TextSecondary,
    outline = AgroColors.Border,
    error = AgroColors.CrimsonAlert
)

private val AgroTypography = Typography(
    titleLarge = TextStyle(
        fontSize = 20.sp,
        lineHeight = 26.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = (-0.3).sp
    ),
    titleMedium = TextStyle(
        fontSize = 16.sp,
        lineHeight = 22.sp,
        fontWeight = FontWeight.Bold
    ),
    titleSmall = TextStyle(
        fontSize = 14.sp,
        lineHeight = 19.sp,
        fontWeight = FontWeight.Bold
    ),
    bodyMedium = TextStyle(
        fontSize = 13.sp,
        lineHeight = 19.sp,
        fontWeight = FontWeight.Normal
    ),
    bodySmall = TextStyle(
        fontSize = 12.sp,
        lineHeight = 17.sp,
        fontWeight = FontWeight.Normal
    ),
    labelMedium = TextStyle(
        fontSize = 11.sp,
        lineHeight = 15.sp,
        fontWeight = FontWeight.SemiBold
    ),
    labelSmall = TextStyle(
        fontSize = 10.sp,
        lineHeight = 13.sp,
        fontWeight = FontWeight.SemiBold
    )
)

@Composable
fun AgroVisionTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AgroLightColorScheme,
        typography = AgroTypography,
        content = content
    )
}
