package com.agrovision.ai.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedContent
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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.PhotoLibrary
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Science
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.agrovision.ai.model.ScanHistoryItem
import com.agrovision.ai.ui.theme.AgroColors
import com.agrovision.ai.viewmodel.AgroUiState
import java.nio.ByteBuffer

private enum class ScanInputMode { CAMERA, UPLOAD, SAMPLES }

@Composable
fun ScanScreen(
    uiState: AgroUiState,
    onBitmapCaptured: (Bitmap, String) -> Unit,
    onAnalyzeSample: (String) -> Unit,
    onScanAnother: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var inputMode by remember { mutableStateOf(ScanInputMode.CAMERA) }
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
        )
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
    }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        uri?.let { pickedUri ->
            runCatching {
                val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ImageDecoder.decodeBitmap(
                        ImageDecoder.createSource(context.contentResolver, pickedUri)
                    ) { decoder, _, _ ->
                        decoder.isMutableRequired = true
                    }
                } else {
                    @Suppress("DEPRECATION")
                    BitmapFactory.decodeStream(context.contentResolver.openInputStream(pickedUri))
                }
                if (bitmap != null) {
                    onBitmapCaptured(bitmap, "Photo Upload")
                }
            }
        }
    }

    LaunchedEffect(inputMode) {
        if (inputMode == ScanInputMode.CAMERA && !hasCameraPermission) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            // Segmented Input Mode Switcher (Live Camera | Upload Photo | Test Leaves)
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = AgroColors.SurfaceMuted,
                border = BorderStroke(1.dp, AgroColors.Border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf(
                        ScanInputMode.CAMERA to "Camera Scan",
                        ScanInputMode.UPLOAD to "Upload Photo",
                        ScanInputMode.SAMPLES to "Test Leaves"
                    ).forEach { (mode, label) ->
                        val selected = inputMode == mode
                        Surface(
                            onClick = {
                                inputMode = mode
                                if (mode == ScanInputMode.UPLOAD) {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            color = if (selected) AgroColors.ForestPrimary else Color.Transparent,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier.padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
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
            }
        }

        item {
            AnimatedContent(
                targetState = Triple(uiState.isAnalyzingLeaf, uiState.activeScanResult, inputMode),
                transitionSpec = {
                    fadeIn(spring(stiffness = Spring.StiffnessMedium)) togetherWith
                        fadeOut(spring(stiffness = Spring.StiffnessMedium))
                },
                label = "scanContent"
            ) { (isAnalyzing, activeResult, mode) ->
                when {
                    isAnalyzing -> {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = AgroColors.Surface,
                            border = BorderStroke(1.dp, AgroColors.Border),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(28.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                CircularProgressIndicator(color = AgroColors.ForestPrimary)
                                Text(
                                    text = "Analyzing Chlorophyll & Lesion Patterns...",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = AgroColors.TextPrimary
                                )
                                Text(
                                    text = "Cross-checking with ${uiState.telemetry.humidityPercent}% RH & ${uiState.telemetry.soilMoisturePercent}% Soil VWC",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AgroColors.TextSecondary
                                )
                            }
                        }
                    }

                    activeResult != null -> {
                        ScanResultSummaryCard(
                            result = activeResult,
                            onScanAnother = {
                                onScanAnother()
                                inputMode = ScanInputMode.CAMERA
                            }
                        )
                    }

                    mode == ScanInputMode.CAMERA -> {
                        if (hasCameraPermission) {
                            NativeCameraCaptureCard(
                                onCapture = { bmp -> onBitmapCaptured(bmp, "Camera Scan") }
                            )
                        } else {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = AgroColors.Surface,
                                border = BorderStroke(1.dp, AgroColors.Border),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.CameraAlt,
                                        contentDescription = null,
                                        tint = AgroColors.ForestPrimary,
                                        modifier = Modifier.size(40.dp)
                                    )
                                    Text(
                                        text = "Camera Permission Needed",
                                        style = MaterialTheme.typography.titleSmall,
                                        color = AgroColors.TextPrimary
                                    )
                                    Text(
                                        text = "Allow camera access to scan tomato leaves live in the field, or switch to Upload Photo.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AgroColors.TextSecondary
                                    )
                                    Button(
                                        onClick = { cameraPermissionLauncher.launch(Manifest.permission.CAMERA) },
                                        colors = ButtonDefaults.buttonColors(containerColor = AgroColors.ForestPrimary),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("Allow Camera")
                                    }
                                }
                            }
                        }
                    }

                    mode == ScanInputMode.UPLOAD -> {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = AgroColors.Surface,
                            border = BorderStroke(1.dp, AgroColors.Border),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.PhotoLibrary,
                                    contentDescription = null,
                                    tint = AgroColors.ForestPrimary,
                                    modifier = Modifier.size(40.dp)
                                )
                                Text(
                                    text = "Upload Tomato Leaf Photo",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = AgroColors.TextPrimary
                                )
                                Text(
                                    text = "Select a clear daylight leaf image from your phone gallery.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AgroColors.TextSecondary
                                )
                                Button(
                                    onClick = {
                                        photoPickerLauncher.launch(
                                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                        )
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = AgroColors.ForestPrimary),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Choose Photo")
                                }
                            }
                        }
                    }

                    else -> {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = AgroColors.Surface,
                            border = BorderStroke(1.dp, AgroColors.Border),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "Test Reference Leaf Specimens",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = AgroColors.TextPrimary
                                )
                                listOf(
                                    "healthy" to "Healthy Tomato Foliage",
                                    "early_blight" to "Early Blight (Alternaria)",
                                    "late_blight" to "Late Blight (Phytophthora)",
                                    "bacterial_spot" to "Bacterial Spot",
                                    "yellow_leaf_curl" to "Yellow Leaf Curl Virus"
                                ).forEach { (id, label) ->
                                    OutlinedButton(
                                        onClick = { onAnalyzeSample(id) },
                                        shape = RoundedCornerShape(12.dp),
                                        border = BorderStroke(1.dp, AgroColors.Border),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(label, color = AgroColors.TextPrimary, fontWeight = FontWeight.SemiBold)
                                            Text("Run Check", color = AgroColors.ForestPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NativeCameraCaptureCard(
    onCapture: (Bitmap) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val imageCapture = remember { ImageCapture.Builder().build() }

    Surface(
        shape = RoundedCornerShape(22.dp),
        color = Color(0xFF13281C),
        modifier = Modifier
            .fillMaxWidth()
            .height(410.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        runCatching {
                            val provider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build().also {
                                it.surfaceProvider = previewView.surfaceProvider
                            }
                            provider.unbindAll()
                            provider.bindToLifecycle(
                                lifecycleOwner,
                                CameraSelector.DEFAULT_BACK_CAMERA,
                                preview,
                                imageCapture
                            )
                        }.onFailure { err ->
                            Log.e("AgroCameraX", "Camera bind failed", err)
                        }
                    }, ContextCompat.getMainExecutor(ctx))
                    previewView
                },
                modifier = Modifier.fillMaxSize()
            )

            // Crisp non-neon white reticle frame
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(220.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(Color.Transparent)
            ) {
                Surface(
                    shape = RoundedCornerShape(22.dp),
                    color = Color.Transparent,
                    border = BorderStroke(2.dp, Color.White),
                    modifier = Modifier.fillMaxSize()
                ) {}
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color.White,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp)
                ) {
                    Text(
                        text = "FRAME TOMATO LEAF",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = AgroColors.ForestDark,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Button(
                onClick = {
                    imageCapture.takePicture(
                        ContextCompat.getMainExecutor(context),
                        object : ImageCapture.OnImageCapturedCallback() {
                            override fun onCaptureSuccess(image: ImageProxy) {
                                val buffer: ByteBuffer = image.planes[0].buffer
                                val bytes = ByteArray(buffer.remaining())
                                buffer.get(bytes)
                                val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                                image.close()
                                if (bmp != null) {
                                    onCapture(bmp)
                                }
                            }

                            override fun onError(exception: ImageCaptureException) {
                                Log.e("AgroCameraX", "Capture error", exception)
                            }
                        }
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = AgroColors.ForestPrimary),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 18.dp)
            ) {
                Icon(Icons.Rounded.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.size(8.dp))
                Text("Capture & Diagnose", fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
private fun ScanResultSummaryCard(
    result: ScanHistoryItem,
    onScanAnother: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = AgroColors.Surface,
        border = BorderStroke(1.dp, AgroColors.Border),
        shadowElevation = 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = if (result.isTomatoLeaf) Icons.Rounded.CheckCircle else Icons.Rounded.Warning,
                    contentDescription = null,
                    tint = if (result.isTomatoLeaf) AgroColors.ForestPrimary else AgroColors.OchreWarm,
                    modifier = Modifier.size(28.dp)
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = result.diseaseName,
                        style = MaterialTheme.typography.titleMedium,
                        color = AgroColors.TextPrimary
                    )
                    Text(
                        text = "${result.scientificName} · ${result.source}",
                        style = MaterialTheme.typography.labelSmall,
                        color = AgroColors.TextSecondary
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Model Confidence", style = MaterialTheme.typography.labelSmall, color = AgroColors.TextSecondary)
                    Text("${result.confidencePercent}% · ${result.severity}", style = MaterialTheme.typography.labelMedium, color = AgroColors.ForestDark)
                }
                LinearProgressIndicator(
                    progress = { (result.confidencePercent / 100f).coerceIn(0.1f, 1f) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(99.dp)),
                    color = AgroColors.ForestPrimary,
                    trackColor = AgroColors.SurfaceMuted,
                    strokeCap = StrokeCap.Round
                )
            }

            Surface(
                shape = RoundedCornerShape(12.dp),
                color = AgroColors.SurfaceMuted,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Rounded.Science, contentDescription = null, tint = AgroColors.ForestPrimary, modifier = Modifier.size(16.dp))
                    Text(
                        text = "Telemetry at scan: ${result.moistureSnapshot}% Soil Moisture · pH ${"%.1f".format(result.phSnapshot)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = AgroColors.TextPrimary
                    )
                }
            }

            Text(
                text = result.summary,
                style = MaterialTheme.typography.bodySmall,
                color = AgroColors.TextSecondary
            )

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Recommended Organic Care", style = MaterialTheme.typography.titleSmall, color = AgroColors.ForestDark)
                result.organicSteps.forEach { step ->
                    Text(
                        text = "• $step",
                        style = MaterialTheme.typography.bodySmall,
                        color = AgroColors.TextPrimary
                    )
                }
            }

            Button(
                onClick = onScanAnother,
                colors = ButtonDefaults.buttonColors(containerColor = AgroColors.TerracottaAction),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Rounded.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.size(8.dp))
                Text("Scan Another Leaf", fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}
