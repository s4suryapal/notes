import { View, Text, TouchableOpacity, Modal, FlatList, Image, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { ArrowLeft, Trash2, Crop } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

interface ImagePreviewModalProps {
  visible: boolean;
  images: string[];
  currentIndex: number;
  flatListRef: any;
  onClose: () => void;
  onDelete: () => void;
  onCrop: () => void;
  onSwipe: (event: any) => void;
}

export function ImagePreviewModal({
  visible,
  images,
  currentIndex,
  flatListRef,
  onClose,
  onDelete,
  onCrop,
  onSwipe,
}: ImagePreviewModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.light.surface} />
            </TouchableOpacity>
            {images.length > 1 && (
              <Text style={styles.counter}>
                {currentIndex + 1} / {images.length}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={onCrop} style={styles.cropButton}>
              <Crop size={22} color={Colors.light.surface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Trash2 size={22} color={Colors.light.surface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Swiper */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onSwipe}
          keyExtractor={(_, index) => `image-preview-${index}`}
          renderItem={({ item }) => (
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              centerContent
            >
              <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
            </ScrollView>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.base,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BorderRadius.round,
  },
  counter: {
    color: Colors.light.surface,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  cropButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    borderRadius: BorderRadius.round,
  },
  deleteButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: BorderRadius.round,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Dimensions.get('window').height,
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
