# AdGenius AI - Android App Bundle Generation Guide

This document outlines the process for generating a signed Android App Bundle (AAB) for the AdGenius AI application, which is required for Google Play Store submission.

## Prerequisites

Before generating the app bundle, ensure you have:

1. **React Native Development Environment** set up correctly
2. **JDK 11** or newer installed
3. **Android Studio** with the latest SDK tools
4. **Keystore File** for signing the app (or create a new one)

## Step 1: Update App Version

Update the version information in the `android/app/build.gradle` file:

```gradle
android {
    defaultConfig {
        applicationId "com.adgeniusai"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1       // Increment this for each new release
        versionName "1.0.0" // Update semantic version
    }
}
```

## Step 2: Configure Signing Keys

### Option 1: Create a New Keystore (if you don't have one)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore adgenius-upload-key.keystore -alias adgenius-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted to create a password and provide information about your organization.

### Option 2: Use an Existing Keystore

If you already have a keystore file, make sure it's accessible for the build process.

### Configure Gradle to Use the Keystore

Create or edit the `android/gradle.properties` file to include (DO NOT commit these to version control):

```properties
ADGENIUS_UPLOAD_STORE_FILE=adgenius-upload-key.keystore
ADGENIUS_UPLOAD_KEY_ALIAS=adgenius-key-alias
ADGENIUS_UPLOAD_STORE_PASSWORD=*****
ADGENIUS_UPLOAD_KEY_PASSWORD=*****
```

Then, edit `android/app/build.gradle` to configure the signing config:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            if (project.hasProperty('ADGENIUS_UPLOAD_STORE_FILE')) {
                storeFile file(ADGENIUS_UPLOAD_STORE_FILE)
                storePassword ADGENIUS_UPLOAD_STORE_PASSWORD
                keyAlias ADGENIUS_UPLOAD_KEY_ALIAS
                keyPassword ADGENIUS_UPLOAD_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

## Step 3: Configure App Bundle Settings

Ensure the following is added to your `android/app/build.gradle`:

```gradle
android {
    ...
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}
```

## Step 4: Generate the App Bundle

### Option 1: Using Gradle Command Line

Navigate to the Android directory and run:

```bash
cd android
./gradlew bundleRelease
```

The generated AAB file will be located at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Option 2: Using Android Studio

1. Open the Android project in Android Studio
2. Select `Build > Generate Signed Bundle / APK`
3. Select `Android App Bundle`
4. Follow the wizard to select your keystore and build the bundle

## Step 5: Test the App Bundle

Before uploading to Google Play, test the app bundle using the `bundletool`:

1. Install bundletool:
```bash
brew install bundletool
```

2. Generate a set of APKs from your bundle:
```bash
bundletool build-apks --bundle=./android/app/build/outputs/bundle/release/app-release.aab --output=./adgenius.apks --ks=./android/app/adgenius-upload-key.keystore --ks-pass=pass:YOUR_KEYSTORE_PASSWORD --ks-key-alias=adgenius-key-alias --key-pass=pass:YOUR_KEY_PASSWORD
```

3. Install the APKs on a connected device:
```bash
bundletool install-apks --apks=./adgenius.apks
```

## Step 6: Prepare for Google Play Upload

Before uploading to Google Play Console, ensure you have:

1. **App Bundle File**: The `.aab` file generated in Step 4
2. **Keystore Backup**: Securely back up your keystore file and passwords
3. **Version Information**: Note the versionCode and versionName for tracking

## Important Notes

1. **NEVER lose your keystore file or forget the passwords**. If lost, you won't be able to update your app on Google Play.

2. **DO NOT include the keystore file or passwords in version control**. Use environment variables or a secure password manager.

3. **Keep track of your versionCode and versionName**. The versionCode must increase with each update submitted to Google Play.

4. **Subscription Configuration**: Ensure the in-app subscription products are properly configured in both the app code and Google Play Console.

5. **Privacy Policy**: Ensure the privacy policy URL is correctly set in the app and matches the one you'll provide in Google Play Console.

## Troubleshooting Common Issues

### Build Failures

- **Missing Keystore**: Ensure the keystore path is correct
- **Incorrect Passwords**: Double-check keystore and key passwords
- **Gradle Version Issues**: Make sure your Gradle version is compatible with your React Native version

### App Bundle Validation Errors

- **Package Name Conflicts**: Ensure your package name (applicationId) is unique and follows reverse domain name notation
- **Version Code Issues**: Make sure versionCode is an integer and increases with each release
- **Missing Required Files**: Ensure all required Android manifest entries are present

### Google Play Upload Issues

- **App Signing**: Consider using Google Play App Signing for additional security
- **Large APK Size**: Optimize images and assets if your app bundle is too large
- **Metadata Issues**: Ensure all required metadata fields are completed in Google Play Console

