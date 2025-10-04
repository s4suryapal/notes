# Scanner & OCR Setup Guide

Quick setup instructions for Document Scanner and Text Extractor features.

## 📦 Installation

Dependencies are already installed:
- ✅ `@react-native-ml-kit/text-recognition@2.0.0`
- ✅ `expo-image-manipulator`
- ✅ ML Kit configured in Android gradle

## 🔧 Build & Run

### Android

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..

# Run development build
npm run android
```

### iOS

```bash
# Install pods
cd ios
pod install
cd ..

# Run development build
npm run ios
```

## ✅ Verification

1. **Open the app** and create/edit a note
2. **Check toolbar** - You should see two new icons:
   - 📄 **Scanner icon** (ScanText) - Document scanner
   - 🔍 **OCR icon** (FileText) - Text extractor

3. **Test Document Scanner:**
   - Tap scanner icon
   - Scan a document
   - Preview → Use Scan
   - ✅ Image attached to note

4. **Test Text Extractor:**
   - Tap OCR icon
   - Take photo or pick from gallery
   - Wait for text extraction (1-3 sec)
   - ✅ Text inserted + image attached

## 🐛 Troubleshooting

### "Module not found: @react-native-ml-kit/text-recognition"
```bash
npm install
npx expo prebuild --clean
npm run android
```

### Camera not working
- Check permissions in `app.json` ✅ (already configured)
- Allow camera/gallery permissions on device

### ML Kit errors on Android
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Build errors
```bash
# Nuclear option - clean everything
rm -rf android/build
rm -rf android/app/build
rm -rf node_modules
npm install
npm run android
```

## 📱 Features Overview

### 📄 Document Scanner
- High-quality document scanning
- Preview with retake option
- 2048px resolution
- **No OCR** - just clean images

### 🔍 Text Extractor (OCR)
- Google ML Kit Text Recognition
- Extracts text from images
- On-device processing (offline)
- 95%+ accuracy for printed text
- 60-80% accuracy for handwriting

## 🎯 Usage in Notes

1. Open note editor
2. Tap toolbar icon:
   - **📄** for document scan
   - **🔍** for text extraction
3. Follow on-screen instructions
4. Content automatically saved to note

## 📚 Documentation

Full documentation: `SCANNER_OCR.md`

## 🆘 Support

If issues persist:
1. Check `SCANNER_OCR.md` troubleshooting section
2. Verify Android gradle config: `android/app/build.gradle`
3. Ensure ML Kit dependency is present:
   ```gradle
   implementation("com.google.mlkit:text-recognition:16.0.1")
   ```

## ✨ Ready!

Your app now has professional document scanning and OCR capabilities! 🚀
