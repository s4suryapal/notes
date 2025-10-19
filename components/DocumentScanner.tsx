import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import DocumentScannerPlugin from 'react-native-document-scanner-plugin';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export interface DocumentScanResult {
  imageUri: string;
  scannedImages?: string[]; // Support multiple pages
}

interface DocumentScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (result: DocumentScanResult) => void;
}

export default function DocumentScanner({ visible, onClose, onScanComplete }: DocumentScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScanDocument = async () => {
    try {
      // Request camera permissions on Android (required since expo-camera adds CAMERA permission)
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Camera Permission Required',
            'Please grant camera permissions to use document scanner.',
            [{ text: 'OK', onPress: onClose }]
          );
          return;
        }
      }

      setIsProcessing(true);

      // Scan document with automatic edge detection and perspective correction
      const { scannedImages } = await DocumentScannerPlugin.scanDocument({
        maxNumDocuments: 5, // Allow up to 5 pages
        letUserAdjustCrop: true, // Let user adjust detected edges
        responseType: 'imageFilePath' as any, // Get file paths - type issue in library
      } as any);

      if (scannedImages && scannedImages.length > 0) {
        // Return first scanned image as primary, all as array
        onScanComplete({
          imageUri: scannedImages[0],
          scannedImages: scannedImages,
        });
      }

      setIsProcessing(false);
      onClose();
    } catch (error: any) {
      console.error('Document scanner error:', error);
      setIsProcessing(false);

      // User cancelled
      if (error?.message?.toLowerCase().includes('cancel') ||
          error?.message?.toLowerCase().includes('user')) {
        onClose();
      } else {
        Alert.alert(
          'Scanner Error',
          'Failed to scan document. Please try again.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    }
  };

  // Auto-launch scanner when modal opens
  useEffect(() => {
    if (visible && !isProcessing) {
      handleScanDocument();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {isProcessing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Processing document...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.lg,
    minWidth: 200,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
