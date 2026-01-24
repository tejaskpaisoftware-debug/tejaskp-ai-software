# Building TejasKP AI Mobile App

This guide explains how to build the installable files for your iOS and Android devices using the source code provided in the `mobile_app/` directory.

## Prerequisites
1. **Flutter SDK**: Install it from [flutter.dev](https://docs.flutter.dev/get-started/install).
2. **Xcode** (for iOS only): Required to build for iPhone.
3. **Android Studio** (for Android only): Required for the Android SDK.

## Step 1: Initialize the Project
Since the platform-specific folders (android/ios) are unique to each developer machine, you should initialize them first:

```bash
cd mobile_app
flutter create . --platforms=android,ios
```

## Step 2: Install Dependencies
Run this inside the `mobile_app/` folder:

```bash
flutter pub get
```

## Step 3: Build for your Device

### For Android (APK/AAB)
To generate an installable APK file:
```bash
flutter build apk --release
```
The file will be located at `build/app/outputs/flutter-apk/app-release.apk`.

### For iOS (iPhone)
1. Open the project in Xcode:
   ```bash
   open ios/Runner.xcworkspace
   ```
2. Connect your iPhone via USB.
3. In Xcode, select your iPhone as the target device.
4. Click the **Run** (Play) button or use:
   ```bash
   flutter build ipa
   ```
   *Note: You may need to configure "Signing & Capabilities" in Xcode with your Apple ID to run it on a physical device.*

## Features Included
- **WebView Wrapper**: Uses the high-performance Vercel production engine.
- **PWA support**: Works offline where cached.
- **Hardware Acceleration**: Smooth 3D graphics rendering for the charts.
- **External Links**: Properly handles WhatsApp reminders and phone calls.
