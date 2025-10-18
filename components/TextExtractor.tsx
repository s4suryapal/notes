import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, FileText, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface OCRResult {
  text: string;
  imageUri: string;
  confidence?: number;
}

interface TextExtractorProps {
  visible: boolean;
  onClose: () => void;
  onExtractComplete: (result: OCRResult) => void;
}

export default function TextExtractor({ visible, onClose, onExtractComplete }: TextExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [sourceImageUri, setSourceImageUri] = useState<string>('');
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];

  // Process image with OCR
  const processImage = async (uri: string) => {
    try {
      setIsProcessing(true);
      setExtractedText('');

      // Optimize image for OCR (resize if too large, improve contrast)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1920 } }, // Max width for faster processing
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Run OCR
      const result = await TextRecognition.recognize(manipulatedImage.uri);

      if (result.text.trim().length === 0) {
        Alert.alert(
          'No Text Detected',
          'Could not detect any text in the image. Please try again with better lighting or a clearer image.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        setExtractedText('');
        setSourceImageUri('');
        return;
      }

      // Show extracted text preview
      setExtractedText(result.text);
      setSourceImageUri(manipulatedImage.uri);
      setIsProcessing(false);
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert(
        'Processing Failed',
        'Failed to extract text from image. Please try again.',
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
      setExtractedText('');
      setSourceImageUri('');
    }
  };

  // Pick from camera
  const handlePickFromCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Confirm and use extracted text
  const handleConfirm = () => {
    if (extractedText && sourceImageUri) {
      onExtractComplete({
        text: extractedText,
        imageUri: sourceImageUri,
        confidence: 1,
      });
      handleClose();
    }
  };

  // Cancel and reset
  const handleClose = () => {
    setExtractedText('');
    setSourceImageUri('');
    setIsProcessing(false);
    onClose();
  };

  // Try again
  const handleTryAgain = () => {
    setExtractedText('');
    setSourceImageUri('');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={[styles.overlay, { backgroundColor: C.overlay }]} onPress={handleClose}>
        <Pressable style={[styles.modal, { backgroundColor: C.surface }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <FileText size={24} color={C.primary} />
            <Text style={[styles.title, { color: C.text }]}>Extract Text from Image</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          {isProcessing ? (
            // Processing state
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={[styles.processingText, { color: C.text }]}>Extracting text...</Text>
              <Text style={[styles.processingHint, { color: C.textSecondary }]}>This may take a few seconds</Text>
            </View>
          ) : extractedText ? (
            // Result state
            <>
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultTitle, { color: C.text }]}>Extracted Text:</Text>
                  <Text style={[styles.characterCount, { color: C.textSecondary }]}>{extractedText.length} characters</Text>
                </View>
                <ScrollView style={styles.textPreviewScroll} contentContainerStyle={styles.textPreviewContent}>
                  <Text style={[styles.extractedText, { color: C.text, backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : Colors.light.borderLight }]} selectable>{extractedText}</Text>
                </ScrollView>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.tryAgainButton, { borderColor: C.border }]} onPress={handleTryAgain}>
                  <Text style={[styles.tryAgainButtonText, { color: C.text }]}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmButton, { backgroundColor: C.primary }]} onPress={handleConfirm}>
                  <Text style={[styles.confirmButtonText, { color: C.surface }]}>Use Text</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Initial state - choose source
            <>
              <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                Select an image containing text to extract:
              </Text>

              <View style={styles.optionsContainer}>
                <TouchableOpacity style={[styles.optionButton, { borderColor: C.border }]} onPress={handlePickFromCamera}>
                  <View style={styles.optionIcon}>
                    <ImageIcon size={32} color={C.primary} />
                  </View>
                  <Text style={[styles.optionTitle, { color: C.text }]}>Take Photo</Text>
                  <Text style={[styles.optionDescription, { color: C.textSecondary }]}>
                    Capture a photo of document, receipt, or any text
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.optionButton, { borderColor: C.border }]} onPress={handlePickFromGallery}>
                  <View style={styles.optionIcon}>
                    <FileText size={32} color={C.primary} />
                  </View>
                  <Text style={[styles.optionTitle, { color: C.text }]}>Choose from Gallery</Text>
                  <Text style={[styles.optionDescription, { color: C.textSecondary }]}>
                    Select an existing image from your photo library
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tipContainer}>
                <Text style={[styles.tipTitle, { color: C.text }]}>💡 Tips for best results:</Text>
                <Text style={[styles.tipText, { color: C.textSecondary }]}>• Ensure good lighting and clear focus</Text>
                <Text style={[styles.tipText, { color: C.textSecondary }]}>• Avoid shadows and glare</Text>
                <Text style={[styles.tipText, { color: C.textSecondary }]}>• Hold camera steady and parallel to text</Text>
                <Text style={[styles.tipText, { color: C.textSecondary }]}>• Works best with printed text</Text>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  optionsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  optionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  tipContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  tipTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  processingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  processingText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
  processingHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
  characterCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
  },
  textPreviewScroll: {
    flex: 1,
  },
  textPreviewContent: {
    paddingBottom: Spacing.lg,
  },
  extractedText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    backgroundColor: Colors.light.borderLight,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  tryAgainButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
  },
});
