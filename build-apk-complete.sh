#!/bin/bash

# Complete APK Build Script for Phuket Amazing Yacht Charter
# This script automates the entire process from source to APK

set -e

echo "=================================================="
echo "🚀 Starting Complete APK Build Process"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_ID="com.phuket.amazing.yacht.charter"
APP_NAME="Phuket Amazing Yacht Charter"
OUTPUT_DIR="dist/apk"

# Step 1: Install dependencies
echo -e "${BLUE}[1/7]${NC} Installing Node dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Node modules already installed"
fi

# Step 2: Build React app
echo -e "${BLUE}[2/7]${NC} Building React application..."
npm run build

if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo "❌ Build failed: dist folder is empty"
    exit 1
fi

echo -e "${GREEN}✓ React build complete${NC}"

# Step 3: Check and install Capacitor
echo -e "${BLUE}[3/7]${NC} Setting up Capacitor..."
if ! command -v cap &> /dev/null; then
    echo "Installing Capacitor CLI globally..."
    npm install -g @capacitor/cli
fi

# Step 4: Sync web assets to Capacitor
echo -e "${BLUE}[4/7]${NC} Syncing web assets to Capacitor..."
npx cap sync

# Step 5: Check for Android platform
echo -e "${BLUE}[5/7]${NC} Checking Android platform..."
if [ ! -d "android" ]; then
    echo "Adding Android platform..."
    npx cap add android
else
    echo "Android platform already exists, updating..."
    npx cap update android
fi

# Step 6: Copy capacitor config
echo -e "${BLUE}[6/7]${NC} Updating Capacitor configuration..."
cat > capacitor.config.ts << 'EOF'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phuket.amazing.yacht.charter',
  appName: 'Phuket Amazing Yacht Charter',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
EOF

# Step 7: Build APK using Gradle
echo -e "${BLUE}[7/7]${NC} Building APK with Gradle..."

# Check if Android SDK is available
if [ ! -d "$ANDROID_SDK_ROOT" ] && [ ! -d "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠️  Android SDK not found${NC}"
    echo "Setting ANDROID_SDK_ROOT to Android Studio default location..."
    
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
        export ANDROID_HOME="$HOME/Library/Android/sdk"
    else
        echo "❌ Android SDK not found. Please install Android Studio or set ANDROID_SDK_ROOT"
        exit 1
    fi
fi

# Navigate to Android directory and build
cd android

echo "Building release APK..."
if command -v gradlew &> /dev/null; then
    ./gradlew assembleRelease
elif [ -f "gradlew" ]; then
    chmod +x gradlew
    ./gradlew assembleRelease
else
    echo "❌ Gradle wrapper not found"
    exit 1
fi

# Copy APK to output directory
mkdir -p "../${OUTPUT_DIR}"
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    cp app/build/outputs/apk/release/app-release.apk "../${OUTPUT_DIR}/${APP_NAME}.apk"
    echo -e "${GREEN}✓ APK created successfully!${NC}"
    echo -e "${GREEN}📦 APK location: ${OUTPUT_DIR}/${APP_NAME}.apk${NC}"
else
    echo "❌ APK build failed"
    exit 1
fi

cd ..

echo ""
echo "=================================================="
echo -e "${GREEN}✅ APK Build Complete!${NC}"
echo "=================================================="
echo "APK File: ${OUTPUT_DIR}/${APP_NAME}.apk"
echo "App ID: ${APP_ID}"
echo ""
echo "📱 To install on device:"
echo "   adb install -r ${OUTPUT_DIR}/${APP_NAME}.apk"
echo ""
echo "🔍 To sign the APK (production):"
echo "   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \\"
echo "     -keystore your-keystore.keystore \\"
echo "     ${OUTPUT_DIR}/${APP_NAME}.apk your-alias"
echo ""
