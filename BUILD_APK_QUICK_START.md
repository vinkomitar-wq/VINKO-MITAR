# Build APK - Quick Start

## 🚀 Fastest Way to Build

### Option 1: Using npm script (Easiest)
```bash
npm run build:apk
```

### Option 2: Using bash script
```bash
chmod +x build-apk.sh
./build-apk.sh
```

### Option 3: Manual step-by-step
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## 📱 Install on Device/Emulator

```bash
# Start emulator (or connect physical device via USB)
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 APK Output Locations

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## ⚙️ Prerequisites

Before building, ensure you have:

1. **Java JDK 11+**
   ```bash
   java -version
   ```

2. **Android SDK**
   - Set `ANDROID_HOME` environment variable
   - Install API 30+ and build tools

3. **Node.js 20+**
   ```bash
   node -v
   ```

---

## 🐛 Troubleshooting

### "ANDROID_HOME not set"
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS/Linux
# or
setx ANDROID_HOME C:\Users\YourUsername\AppData\Local\Android\sdk  # Windows
```

### "Build failed: Gradle"
```bash
cd android && ./gradlew clean && cd ..
npm run build:apk
```

### "Port 8080 already in use"
Change the dev server port in `vite.config.ts`

---

For detailed instructions, see **APK_BUILD_GUIDE.md**
