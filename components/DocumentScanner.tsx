import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { X, ScanLine, FlipVertical } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export interface DocumentScanResult {
  imageUri: string;
}

interface DocumentScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (result: DocumentScanResult) => void;
}

export default function DocumentScanner({ visible, onClose, onScanComplete }: DocumentScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Request camera permission when modal opens
  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan documents.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  // Handle modal visibility change
  const handleModalShow = () => {
    if (hasPermission === null) {
      requestPermission();
    }
    setPreviewUri(null);
  };

  // Process scanned image (optimize and enhance)
  const processImage = async (uri: string) => {
    try {
      setIsProcessing(true);

      // Enhance image for document scanning (increase contrast, sharpen)
      const enhancedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 2048 } }, // High quality for documents
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setPreviewUri(enhancedImage.uri);
      setIsProcessing(false);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
      setIsProcessing(false);
    }
  };

  // Capture photo from camera
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.95,
        skipProcessing: false,
      });

      if (photo?.uri) {
        await processImage(photo.uri);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setIsProcessing(false);
    }
  };

  // Pick from gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please allow photo library access to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.95,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Confirm and save scanned document
  const handleConfirmScan = () => {
    if (previewUri) {
      onScanComplete({ imageUri: previewUri });
      setPreviewUri(null);
      onClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPreviewUri(null);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onShow={handleModalShow}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {hasPermission === null ? (
          <View style={styles.permissionContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Camera permission denied</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : previewUri ? (
          // Preview mode
          <View style={styles.previewContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleRetake} style={styles.iconButton}>
                <X size={28} color={Colors.light.surface} />
              </TouchableOpacity>
              <Text style={styles.title}>Preview</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.previewImageContainer}>
              <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
            </View>

            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmScan}>
                <Text style={styles.confirmButtonText}>Use Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Camera mode
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            >
              {/* Overlay with document guide */}
              <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                    <X size={28} color={Colors.light.surface} />
                  </TouchableOpacity>
                  <Text style={styles.title}>Scan Document</Text>
                  <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
                    <FlipVertical size={24} color={Colors.light.surface} />
                  </TouchableOpacity>
                </View>

                {/* Document frame guide */}
                <View style={styles.frameGuideContainer}>
                  <View style={styles.frameGuide}>
                    <View style={[styles.corner, styles.cornerTopLeft]} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View style={[styles.corner, styles.cornerBottomRight]} />
                  </View>
                  <Text style={styles.guideText}>Align document within frame</Text>
                </View>

                {/* Bottom Controls */}
                <View style={styles.controls}>
                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={handlePickFromGallery}
                    disabled={isProcessing}
                  >
                    <Text style={styles.galleryButtonText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="large" color={Colors.light.surface} />
                    ) : (
                      <View style={styles.captureButtonInner}>
                        <ScanLine size={32} color={Colors.light.primary} />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.placeholder} />
                </View>
              </View>
            </CameraView>

            {/* Processing Overlay */}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.text,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  permissionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.surface,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  closeButtonText: {
    color: Colors.light.surface,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.surface,
  },
  iconButton: {
    padding: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.round,
  },
  placeholder: {
    width: 40,
  },
  frameGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  frameGuide: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 500,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.light.surface,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  guideText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: Spacing.lg,
  },
  galleryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface,
    minWidth: 80,
  },
  galleryButtonText: {
    color: Colors.light.surface,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  processingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.medium,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.light.text,
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewControls: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: Spacing.lg,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface,
  },
  retakeButtonText: {
    color: Colors.light.surface,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
  },
  confirmButtonText: {
    color: Colors.light.surface,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
