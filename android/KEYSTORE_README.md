# Android Keystore Management

## Release Keystore Information

**Location:** `android/app/notesai-release.keystore`  
**Configuration:** `android/keystore.properties`

### Keystore Details
- **Alias:** notesai-key
- **Keystore Type:** PKCS12
- **Key Algorithm:** RSA
- **Key Size:** 2048 bits
- **Validity:** 10,000 days (~27 years)
- **Password:** Stored in `keystore.properties`

### SHA Fingerprints
Run this command to get the fingerprints:
```bash
keytool -list -v -keystore android/app/notesai-release.keystore -alias notesai-key
```

Current SHA-256 fingerprint:
```
75:31:EB:D5:6E:BF:C1:AB:91:01:F2:6F:41:E2:FC:67:7A:F6:00:E9:92:D9:B6:C2:F5:1E:78:D0:20:BF:0E:D2
```

### Security Best Practices

1. **NEVER commit these files to Git:**
   - `android/app/notesai-release.keystore`
   - `android/keystore.properties`
   
   ✅ They are already in `.gitignore`

2. **Backup the keystore securely:**
   - Store in encrypted cloud storage (1Password, LastPass, etc.)
   - Keep offline backup on encrypted USB drive
   - Store passwords separately from keystore file

3. **If keystore is lost:**
   - You CANNOT update your app on Play Store
   - You'll need to publish as a new app with different package name
   - Users will have to uninstall and reinstall

### Building Release APK/AAB

```bash
# Verify keystore exists
npm run verify:keystore

# Build release APK
npm run build:apk

# Build release AAB (for Play Store)
npm run build:aab
```

### Play Console Setup

For Google Play Console, you'll need to register this SHA-256 fingerprint:
- **App Signing:** Upload the AAB, Play Console will re-sign with their key
- **OAuth/Firebase:** Use the SHA-256 from the keystore above

### Emergency Recovery

If you need to recover/transfer the keystore:

1. Copy both files to new machine:
   ```bash
   android/app/notesai-release.keystore
   android/keystore.properties
   ```

2. Verify with:
   ```bash
   npm run verify:keystore
   ```

3. Test build:
   ```bash
   npm run build:apk
   ```

---

**⚠️ CRITICAL:** Keep this keystore safe! Without it, you cannot update your app on Google Play Store.
