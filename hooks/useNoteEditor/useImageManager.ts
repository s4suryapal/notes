import { useState, useRef, useCallback } from 'react';
import { Alert, Dimensions } from 'react-native';
import * as ExpoCamera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import ExpoImageCropTool from 'expo-image-crop-tool';

interface UseImageManagerProps {
  onImagesChange: (images: string[]) => void;
  onImageAdded?: () => void;
}

export function useImageManager({ onImagesChange, onImageAdded }: UseImageManagerProps) {
  const [images, setImages] = useState<string[]>([]);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);
  const imagePreviewFlatListRef = useRef<any>(null);

  // Camera
  const handleCameraPress = useCallback(async () => {
    try {
      const cameraPermission = await ExpoCamera.Camera.requestCameraPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);
        onImagesChange(newImages);
        onImageAdded?.();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [images, onImagesChange, onImageAdded]);

  // Image Picker
  const handleImagePickerPress = useCallback(async () => {
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
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);
        onImagesChange(newImages);
        onImageAdded?.();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }, [images, onImagesChange, onImageAdded]);

  // Delete Image
  const handleDeleteImage = useCallback((index: number) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
            onImagesChange(newImages);
          },
        },
      ]
    );
  }, [images, onImagesChange]);

  // Image Preview
  const handleImagePress = useCallback((index: number) => {
    setPreviewImageIndex(index);
    setPreviewImageUri(images[index]);
    setTimeout(() => {
      imagePreviewFlatListRef.current?.scrollToIndex({ index, animated: false });
    }, 100);
  }, [images]);

  const handleClosePreview = useCallback(() => {
    setPreviewImageUri(null);
  }, []);

  const handleImageSwipe = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
    setPreviewImageIndex(index);
  }, []);

  // Delete from Preview
  const handleDeleteImageFromPreview = useCallback(() => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== previewImageIndex);
            setImages(newImages);
            onImagesChange(newImages);
            setPreviewImageUri(null);
          },
        },
      ]
    );
  }, [images, previewImageIndex, onImagesChange]);

  // Crop Image
  const handleCropImage = useCallback(async () => {
    try {
      const imageUri = images[previewImageIndex];

      const result = await ExpoImageCropTool.openCropperAsync({
        imageUri: imageUri,
        aspectRatio: undefined,
        shape: 'rectangle',
        format: 'jpeg',
        compressImageQuality: 0.9,
      });

      if (result && result.path) {
        const newImages = [...images];
        newImages[previewImageIndex] = result.path;
        setImages(newImages);
        setPreviewImageUri(result.path);
        onImagesChange(newImages);

        setTimeout(() => {
          imagePreviewFlatListRef.current?.scrollToIndex({
            index: previewImageIndex,
            animated: false
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message;
        if (!message.includes('cancel')) {
          Alert.alert('Error', 'Failed to crop image. Please try again.');
        }
      }
    }
  }, [images, previewImageIndex, onImagesChange]);

  return {
    images,
    setImages,
    previewImageUri,
    previewImageIndex,
    imagePreviewFlatListRef,
    handleCameraPress,
    handleImagePickerPress,
    handleDeleteImage,
    handleImagePress,
    handleClosePreview,
    handleImageSwipe,
    handleDeleteImageFromPreview,
    handleCropImage,
  };
}
