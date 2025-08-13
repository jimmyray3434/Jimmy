# AdGenius AI - Release Build Instructions

This document provides detailed instructions for building the release version of AdGenius AI for Android and iOS platforms.

## Android Release Build

### Prerequisites
- Node.js and npm installed
- React Native CLI installed
- Android Studio installed
- JDK 11 or newer
- Android SDK with build tools
- Keystore file for signing

### Step 1: Configure App Properties

1. Update version information in `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.adgeniusai"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
    }
}
```

2. Configure signing in `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('adgenius-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'your-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 2: Create Keystore (if not already created)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore adgenius-release-key.keystore -alias adgenius-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Move the keystore file to `android/app/adgenius-release-key.keystore`

### Step 3: Build the App Bundle

```bash
# Install dependencies
npm install

# Generate the bundle
cd android
./gradlew bundleRelease
```

The generated AAB file will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Test the Release Build

1. Using bundletool:
```bash
bundletool build-apks --bundle=./app/build/outputs/bundle/release/app-release.aab --output=./app-release.apks
bundletool install-apks --apks=./app-release.apks
```

2. Or generate a test APK:
```bash
./gradlew assembleRelease
```

## iOS Release Build

### Prerequisites
- macOS computer
- Xcode installed
- CocoaPods installed
- Apple Developer account
- App Store Connect setup completed

### Step 1: Configure App Properties

1. Update version information in Xcode:
   - Open `ios/AdGeniusAI.xcworkspace` in Xcode
   - Select the project in the Project Navigator
   - Update Version (1.0.0) and Build (1) numbers

2. Configure signing in Xcode:
   - Select the project in the Project Navigator
   - Go to Signing & Capabilities
   - Select your team and provisioning profile

### Step 2: Build the Release Version

1. Using Xcode:
   - Select "Generic iOS Device" as the build target
   - Select Product > Archive
   - Once archiving is complete, the Organizer window will appear
   - Click "Distribute App" and follow the wizard

2. Using Command Line:
```bash
# Install dependencies
npm install
cd ios
pod install
cd ..

# Build the app
xcodebuild -workspace ios/AdGeniusAI.xcworkspace -scheme AdGeniusAI -configuration Release -archivePath ios/build/AdGeniusAI.xcarchive archive
```

## Environment-Specific Configuration

### Production API Endpoints

Ensure the app is configured to use production API endpoints:

1. Create a `.env.production` file:
```
API_BASE_URL=https://api.adgeniusai.com
OPENAI_API_ENDPOINT=https://api.openai.com/v1
GOOGLE_AI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1
```

2. Update the build script in `package.json`:
```json
"scripts": {
  "build:android": "ENVFILE=.env.production react-native run-android --variant=release",
  "build:ios": "ENVFILE=.env.production react-native run-ios --configuration Release"
}
```

### Subscription Configuration

Ensure subscription configuration is set for production:

1. Update PayPal configuration in `src/services/paypalService.ts`:
```typescript
const PAYPAL_ENVIRONMENT = 'production'; // 'sandbox' for testing
const PAYPAL_CLIENT_ID = 'your-production-client-id';
```

2. Update Google Play billing configuration in `android/app/src/main/java/com/adgeniusai/billing/BillingManager.java`

## Pre-Release Checklist

Before finalizing the release build:

1. **Remove Debug Code**:
   - Remove console.log statements
   - Disable developer menus
   - Remove test accounts

2. **Optimize Performance**:
   - Enable Hermes JavaScript engine
   - Configure ProGuard rules for Android
   - Optimize image assets

3. **Test Thoroughly**:
   - Test on multiple device sizes
   - Test all critical user flows
   - Verify subscription process works end-to-end
   - Test offline behavior

4. **Verify API Endpoints**:
   - Ensure all API calls use production URLs
   - Verify API keys are valid for production

## Troubleshooting Common Issues

### Android Build Issues

- **Keystore Problems**: Verify keystore path and passwords
- **Gradle Version Conflicts**: Update Gradle wrapper if needed
- **Memory Issues**: Increase Gradle memory in `gradle.properties`:
  ```
  org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=2048m
  ```

### iOS Build Issues

- **Signing Issues**: Verify provisioning profiles and certificates
- **Bitcode Compatibility**: Ensure all dependencies support Bitcode if required
- **Architecture Support**: Verify arm64 architecture support

## Continuous Integration Setup (Optional)

For automated builds, consider setting up:

1. **GitHub Actions**:
   - Create `.github/workflows/release.yml` for automated builds
   - Configure secrets for signing keys

2. **Fastlane**:
   - Set up Fastlane for automated deployment
   - Create Fastfile with release lanes for Android and iOS

