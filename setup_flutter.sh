#!/bin/bash

# TEJASKP AI - One-Click Mobile App Setup Script
# This script installs all necessary tools to build the iPhone/Android app on your Mac.

echo -e "\033[1;33m🚀 Starting TejasKP AI Mobile App Setup...\033[0m"

# 1. Install Homebrew if not present
if ! command -v brew &> /dev/null; then
    echo -e "\033[1;36m📦 Installing Homebrew (Package Manager)...\033[0m"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "\033[1;32m✅ Homebrew is already installed.\033[0m"
fi

# 2. Install Flutter
if ! command -v flutter &> /dev/null; then
    echo -e "\033[1;36m📦 Installing Flutter SDK (Mobile Framework)...\033[0m"
    brew install --cask flutter
else
    echo -e "\033[1;32m✅ Flutter is already installed.\033[0m"
fi

# 3. Install CocoaPods (Required for iOS)
if ! command -v pod &> /dev/null; then
    echo -e "\033[1;36m📦 Installing CocoaPods (iOS Dependency Manager)...\033[0m"
    brew install cocoapods
else
    echo -e "\033[1;32m✅ CocoaPods is already installed.\033[0m"
fi

# 4. Initialize Project
echo -e "\033[1;33m🛠️  Initializing App Project Structure...\033[0m"
cd mobile_app

# Run flutter create to generate iOS/Android folders respecting existing code
flutter create . --platforms=android,ios --org com.tejaskpai.app

# Install dependencies
echo -e "\033[1;33m⬇️  Downloading App Dependencies...\033[0m"
flutter pub get

# 5. Verify Setup
echo -e "\033[1;33m🔍 Verifying Environment...\033[0m"
flutter doctor

echo "--------------------------------------------------------"
echo -e "\033[1;32m✅ SETUP COMPLETE! YOU ARE READY TO BUILD.\033[0m"
echo "--------------------------------------------------------"
echo "To install the app on your connected iPhone:"
echo ""
echo "   1. Open a terminal in this folder."
echo "   2. Run: cd mobile_app"
echo "   3. Run: flutter run --release"
echo ""
echo "Note: If you haven't set up your Apple Developer Team yet,"
echo "open 'mobile_app/ios/Runner.xcworkspace' in Xcode and select your Team in 'Signing & Capabilities'."
echo "--------------------------------------------------------"
