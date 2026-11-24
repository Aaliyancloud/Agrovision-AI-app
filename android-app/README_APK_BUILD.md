# AgroVision AI — Native Android App (Kotlin + Jetpack Compose)

This folder (`android-app/`) is a complete, modular native Android Studio project ready to compile into an installable `.apk` file.

## Project Structure

- `app/src/main/AndroidManifest.xml` — Camera, Fine/Coarse Location, Internet, Media Images (`READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`), and Vibration permissions.
- `app/src/main/java/com/agrovision/ai/MainActivity.kt` — Edge-to-edge Jetpack Compose host, spring tab transitions, XP/badge banners, and floating bottom navigation.
- `app/src/main/java/com/agrovision/ai/ui/components/AgroHeaderAndNav.kt` — Responsive top header (no overlap/clipping on `Level X`) and floating pill bottom navigation bar with active container highlight + gesture safe-area insets.
- `app/src/main/java/com/agrovision/ai/ui/screens/HomeScreen.kt` — Vibrant Tomato Growth Stage card, automatic GPS/regional weather & virtual soil moisture/pH telemetry, and strictly event-driven Daily Field Missions.
- `app/src/main/java/com/agrovision/ai/ui/screens/ScanScreen.kt` — Native CameraX live leaf scanner, Android Photo Picker upload, and on-device HSV chlorophyll/lesion diagnostics.
- `app/src/main/java/com/agrovision/ai/ui/screens/LibraryAndArticlesScreen.kt` — Searchable Tomato Disease Library + dedicated **Articles & Latest News** feed.
- `app/src/main/java/com/agrovision/ai/data/local/` — Local **Room SQLite** database (`AgroDatabase`, `AgroDao`, `ScanHistoryEntity`, `WeatherCacheEntity`, `Converters`) caching scan history, leaf thumbnails, and weather telemetry for full offline functionality.
- `app/src/main/java/com/agrovision/ai/ui/screens/FieldProfileScreen.kt` — Badges, Daily Streak + Grace Freeze tracker, offline Room search, and Field Scan Log.

## Step-by-Step Instructions to Build an APK in Android Studio

1. **Open Project**:
   - Launch **Android Studio (Ladybug 2024.2 or newer)**.
   - Choose **File → Open** and select the `android-app` directory.
   - Wait for **Gradle Sync** to download Kotlin, Jetpack Compose, CameraX, and Play Services Location dependencies.

2. **Test on Your Phone or Emulator**:
   - Connect an Android phone via USB (with **Developer Options → USB Debugging** enabled) or start an API 34/35 Emulator.
   - Click **Run ▶** (`Shift + F10`) to install and test Camera Scan, Location Weather sync, Library, and Daily Missions.

3. **Build an Installable Debug APK**:
   - In Android Studio top menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
   - Or via Terminal inside `android-app/`:
     ```bash
     ./gradlew assembleDebug
     ```
   - Locate the generated APK at:
     `android-app/app/build/outputs/apk/debug/app-debug.apk`
   - Copy `app-debug.apk` onto your Android phone and tap to install.

4. **Build a Signed Release APK (for Distribution / Play Store)**:
   - In Android Studio: **Build → Generate Signed Bundle / APK...**
   - Select **APK**, click **Next**, and create/select a `.jks` keystore file.
   - Choose the **release** build variant and click **Create**.
   - Find your release APK at:
     `android-app/app/build/outputs/apk/release/app-release.apk`
