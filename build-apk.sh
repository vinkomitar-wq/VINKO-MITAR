#!/bin/bash

# APK Build Script for Phuket Amazing Yacht Charter
# This script automates the APK build process

set -e

echo "🚀 Starting APK Build Process..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"

if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java found: $(java -version 2>&1 | head -n 1)${NC}"

if ! command -v gradle &> /dev/null && [ ! -f "android/gradlew" ]; then
    echo -e "${RED}❌ Gradle not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Gradle found${NC}"

echo ""
echo -e "${YELLOW}🔨 Building web app...${NC}"
npm run build

echo ""
echo -e "${YELLOW}📱 Syncing with Capacitor...${NC}"
npx cap sync android

echo ""
echo -e "${YELLOW}🛠️  Building Android APK...${NC}"

cd android

# Make gradlew executable
chmod +x gradlew

# Build debug APK
echo -e "${YELLOW}Building Debug APK...${NC}"
./gradlew assembleDebug

# Build release APK
echo -e "${YELLOW}Building Release APK...${NC}"
./gradlew assembleRelease

cd ..

# Show output paths
echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "📦 APK Output Locations:"
echo "  Debug:   android/app/build/outputs/apk/debug/app-debug.apk"
echo "  Release: android/app/build/outputs/apk/release/app-release-unsigned.apk"
echo ""
echo "📝 Next steps:"
echo "  1. Test on device/emulator: adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo "  2. For production, sign the release APK (see APK_BUILD_GUIDE.md)"
echo ""
