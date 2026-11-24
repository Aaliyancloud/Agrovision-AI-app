package com.agrovision.ai.utils

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object HapticHelper {
    private fun getVibrator(context: Context): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    fun scanTap(context: Context) {
        vibratePattern(context, longArrayOf(0, 16), intArrayOf(0, 120))
    }

    fun missionCompleted(context: Context) {
        vibratePattern(context, longArrayOf(0, 14, 42, 22), intArrayOf(0, 110, 0, 160))
    }

    fun badgeUnlocked(context: Context) {
        vibratePattern(context, longArrayOf(0, 18, 45, 22, 55, 36), intArrayOf(0, 120, 0, 160, 0, 210))
    }

    private fun vibratePattern(context: Context, timings: LongArray, amplitudes: IntArray) {
        runCatching {
            val vibrator = getVibrator(context) ?: return
            if (!vibrator.hasVibrator()) return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(timings, -1)
            }
        }
    }
}
