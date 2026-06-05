# 🚀 APK Build Setup Guide

## Phuket Amazing Yacht Charter - Android Build Instructions

This guide will help you build an APK from your Capacitor + React project.

---

## **Prerequisites**

### Required Software:
- ✅ **Node.js 20+** (you likely have this)
- ✅ **Java JDK 11+** or **JDK 17**
- ✅ **Android SDK** (API 30+)
- ✅ **Gradle** (included with Android SDK)
- ⭐ **Android Studio** (recommended, optional)

### Installation Commands:

**macOS (using Homebrew):**
```bash
# Java
brew install openjdk@11

# Android SDK
brew install --cask android-sdk

# Android Studio (optional)
brew install --cask android-studio
```

**Ubuntu/Linux:**
```bash
# Java
sudo apt-get install openjdk-11-jdk

# Android SDK
# Download from https://developer.android.com/studio
```

**Windows:**
- Download Java from: https://www.oracle.com/java/technologies/downloads/
- Download Android Studio: https://developer.android.com/studio

---

## **Step-by-Step Build Process**

### **Step 1: Install Dependencies**
```bash
npm ci
```

### **Step 2: Build Web App**
```bash
npm run build
```

### **Step 3: Initialize Android Platform**
```bash
# Add Android platform (if first time)
npx cap add android

# Sync files
npx cap sync android
```

### **Step 4: Build APK**

#### **Option A: Using Gradle (Terminal)**
```bash
cd android

# Debug APK (for testing)
./gradlew assembleDebug

# Release APK (for production)
./gradlew assembleRelease
```

**Output locations:**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

#### **Option B: Using Android Studio (GUI)**
```bash
# Open in Android Studio
npx cap open android

# Then in Android Studio:
# 1. Click "Build" menu
# 2. Select "Build Bundle(s)/APK(s)"
# 3. Select "Build APK(s)"
```

---

## **Environment Variables Required**

Create a `.env.local` file in the root directory:

```env
GOOGLE_MAPS_PLATFORM_KEY=your_key_here
VITE_FIREBASE_PROJECT_ID=payc-141f9
VITE_FIREBASE_APP_ID=1:245786032645:web:9fdc48202663180f7dba6c
```

---

## **Troubleshooting**

### **Issue: "ANDROID_HOME not set"**
```bash
# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/tools:$PATH
export PATH=$ANDROID_HOME/tools/bin:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH

# Windows (Command Prompt)
setx ANDROID_HOME C:\Users\%USERNAME%\AppData\Local\Android\sdk
setx PATH %PATH%;%ANDROID_HOME%\platform-tools
```

### **Issue: "Java not found"**
```bash
# Check Java version
java -version

# Set JAVA_HOME (if needed)
export JAVA_HOME=/path/to/java
```

### **Issue: Gradle build fails**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## **Signing the APK (Production)**

For Google Play Store, you need to sign your release APK:

### **Generate Keystore:**
```bash
keytool -genkey -v -keystore ~/yacht-charter.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias yacht-charter-key
```

### **Sign Release APK:**
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore ~/yacht-charter.keystore \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  yacht-charter-key
```

### **Align APK:**
```bash
zipalign -v 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  android/app/build/outputs/apk/release/app-release-signed.apk
```

---

## **CI/CD with GitHub Actions**

A GitHub Actions workflow has been created (`.github/workflows/build-apk.yml`) to automatically build APKs on every push.

**Features:**
- ✅ Automatic builds on push to `main`
- ✅ Creates debug and release APKs
- ✅ Stores APKs as GitHub artifacts
- ✅ Can create releases with APK downloads

**View artifacts:**
1. Go to: `https://github.com/vinkomitar-wq/VINKO-MITAR/actions`
2. Click on the workflow run
3. Download APK artifacts

---

## **Testing the APK**

### **Using Android Emulator:**
```bash
# List emulators
emulator -list-avds

# Start emulator
emulator -avd pixel_4

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### **Using Physical Device:**
```bash
# Enable Developer Mode on Android phone
# Connect phone via USB

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## **Next Steps**

1. ✅ Install prerequisites
2. ✅ Run `npm run build && npx cap sync android`
3. ✅ Run `./gradlew assembleDebug` in the android folder
4. ✅ Test the APK on a device/emulator
5. ✅ For production, sign the release APK

---

## **Resources**

- 📚 [Capacitor Documentation](https://capacitorjs.com/docs/android)
- 📚 [Android Studio Setup](https://developer.android.com/studio/install)
- 📚 [Gradle Documentation](https://gradle.org/releases/)
- 📚 [Firebase Configuration](https://firebase.google.com/docs/projects/learn-more)

---

**Need help?** Check the troubleshooting section or the linked documentation.
