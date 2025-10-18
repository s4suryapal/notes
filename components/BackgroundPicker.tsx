import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions, Modal, Pressable } from 'react-native';
import { Check, Plus, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { runOnJS } from 'react-native-reanimated';
import ColorPicker2, { Panel1, HueSlider, returnedResults } from 'reanimated-color-picker';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface BackgroundPickerProps {
  selectedBackground: string | null;
  onBackgroundSelect: (background: string | null) => void;
}

export type BackgroundType = 'solid' | 'gradient' | 'pattern';

export interface Background {
  id: string;
  name: string;
  type: BackgroundType;
  value: string | null; // null for default
  gradient?: string[]; // For gradients
  pattern?: string; // For patterns (could be a design/emoji pattern)
}

export const backgrounds: { [key: string]: Background[] } = {
  hot: [
    { id: 'default', name: 'Default', type: 'solid', value: null },
    { id: 'yellow', name: 'Yellow', type: 'solid', value: '#FFF9C4' },
    { id: 'peach-grid', name: 'Peach Grid', type: 'pattern', value: '#FFE0B2', pattern: 'grid' },
    { id: 'mint-grid', name: 'Mint Grid', type: 'pattern', value: '#C8E6C9', pattern: 'grid' },
    { id: 'pink-dots', name: 'Pink Dots', type: 'pattern', value: '#FFE4E1', pattern: 'dotgrid' },
    { id: 'blue-lines', name: 'Blue Lines', type: 'pattern', value: '#E3F2FD', pattern: 'lines' },
    { id: 'yellow-checks', name: 'Yellow Checks', type: 'pattern', value: '#FFF9C4', pattern: 'checks' },
    { id: 'coral-hexagon', name: 'Coral Hex', type: 'pattern', value: '#FFCCBC', pattern: 'hexagon' },
    { id: 'pink-music', name: 'Pink Music', type: 'pattern', value: '#FCE4EC', pattern: 'music' },
    { id: 'pink-gradient', name: 'Pink', type: 'gradient', value: null, gradient: ['#FFB6C1', '#FF69B4'] },
    { id: 'purple-gradient', name: 'Purple', type: 'gradient', value: null, gradient: ['#E6E6FA', '#9370DB'] },
    { id: 'orange-gradient', name: 'Orange', type: 'gradient', value: null, gradient: ['#FFE0B2', '#FF9800'] },
    { id: 'floral', name: 'Floral', type: 'pattern', value: '#FFF5EE', pattern: 'floral' },
    { id: 'strawberry', name: 'Strawberry', type: 'pattern', value: '#FFF0F5', pattern: 'strawberry' },
    { id: 'heart', name: 'Heart', type: 'pattern', value: '#FFE4E1', pattern: 'heart' },
  ],
  nature: [
    { id: 'sky', name: 'Sky', type: 'gradient', value: null, gradient: ['#87CEEB', '#4FC3F7'] },
    { id: 'forest', name: 'Forest', type: 'gradient', value: null, gradient: ['#90EE90', '#228B22'] },
    { id: 'sunset', name: 'Sunset', type: 'gradient', value: null, gradient: ['#FFD700', '#FF8C00', '#FF6347'] },
    { id: 'ocean', name: 'Ocean', type: 'gradient', value: null, gradient: ['#00CED1', '#4682B4'] },
    { id: 'mint', name: 'Mint', type: 'solid', value: '#C8E6C9' },
    { id: 'lavender', name: 'Lavender', type: 'solid', value: '#E1BEE7' },
    { id: 'green-grid', name: 'Green Grid', type: 'pattern', value: '#C8E6C9', pattern: 'grid' },
    { id: 'blue-dotgrid', name: 'Blue Dots', type: 'pattern', value: '#BBDEFB', pattern: 'dotgrid' },
    { id: 'green-hexagon', name: 'Green Hex', type: 'pattern', value: '#C8E6C9', pattern: 'hexagon' },
    { id: 'blue-isometric', name: 'Blue Iso', type: 'pattern', value: '#E3F2FD', pattern: 'isometric' },
    { id: 'leaf', name: 'Leaf', type: 'pattern', value: '#E8F5E9', pattern: 'leaf' },
    { id: 'tree', name: 'Tree', type: 'pattern', value: '#F1F8E9', pattern: 'tree' },
    { id: 'cloud', name: 'Cloud', type: 'pattern', value: '#E1F5FE', pattern: 'cloud' },
    { id: 'star', name: 'Star', type: 'pattern', value: '#E8EAF6', pattern: 'star' },
  ],
  dark: [
    { id: 'charcoal', name: 'Charcoal', type: 'solid', value: '#36454F' },
    { id: 'navy', name: 'Navy', type: 'solid', value: '#2C3E50' },
    { id: 'dark-purple', name: 'Dark Purple', type: 'gradient', value: null, gradient: ['#2C1654', '#4A148C'] },
    { id: 'midnight', name: 'Midnight', type: 'gradient', value: null, gradient: ['#1a237e', '#0d47a1'] },
    { id: 'dark-red', name: 'Dark Red', type: 'gradient', value: null, gradient: ['#4A0404', '#8B0000'] },
    { id: 'dark-teal', name: 'Dark Teal', type: 'gradient', value: null, gradient: ['#004D40', '#00695C'] },
    { id: 'dark-grid', name: 'Dark Grid', type: 'pattern', value: '#37474F', pattern: 'grid' },
    { id: 'dark-dotgrid', name: 'Dark Dots', type: 'pattern', value: '#424242', pattern: 'dotgrid' },
    { id: 'dark-lines', name: 'Dark Lines', type: 'pattern', value: '#37474F', pattern: 'lines' },
    { id: 'dark-hexagon', name: 'Dark Hex', type: 'pattern', value: '#424242', pattern: 'hexagon' },
    { id: 'dark-music', name: 'Dark Music', type: 'pattern', value: '#37474F', pattern: 'music' },
  ],
  customize: [
    { id: 'coral', name: 'Coral', type: 'solid', value: '#FFCDD2' },
    { id: 'peach', name: 'Peach', type: 'solid', value: '#FFCCBC' },
    { id: 'sand', name: 'Sand', type: 'solid', value: '#FFE0B2' },
    { id: 'mint', name: 'Mint', type: 'solid', value: '#C8E6C9' },
    { id: 'cyan', name: 'Cyan', type: 'solid', value: '#B2EBF2' },
    { id: 'blue', name: 'Blue', type: 'solid', value: '#BBDEFB' },
    { id: 'periwinkle', name: 'Periwinkle', type: 'solid', value: '#D1C4E9' },
    { id: 'lavender', name: 'Lavender', type: 'solid', value: '#E1BEE7' },
    { id: 'pink', name: 'Pink', type: 'solid', value: '#F8BBD0' },
    { id: 'gray', name: 'Gray', type: 'solid', value: '#CFD8DC' },
  ],
};

// Helper function to get background by ID
export function getBackgroundById(id: string | null): Background | null {
  if (!id) return null;

  // Handle custom colors
  if (id.startsWith('custom-')) {
    const color = id.replace('custom-', '');
    return {
      id: id,
      name: 'Custom',
      type: 'solid',
      value: color,
    };
  }

  for (const category of Object.values(backgrounds)) {
    const bg = category.find(b => b.id === id);
    if (bg) return bg;
  }

  return null;
}

export function BackgroundPicker({ selectedBackground, onBackgroundSelect }: BackgroundPickerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  const tabOrder: (keyof typeof backgrounds)[] = ['customize', 'hot', 'nature', 'dark'];
  const [activeTabIndex, setActiveTabIndex] = useState(1); // Start with 'hot' (index 1)
  const flatListRef = useRef<FlatList>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempColor, setTempColor] = useState('#F44336');

  const activeTab = tabOrder[activeTabIndex];
  const currentBackgrounds = backgrounds[activeTab];

  const handleCustomColorSubmit = () => {
    onBackgroundSelect(`custom-${tempColor}`);
    setShowCustomPicker(false);
  };

  const updateTempColor = useCallback((color: string) => {
    setTempColor(color);
  }, []);

  const onSelectColorFromPicker = useCallback(({ hex }: returnedResults) => {
    'worklet';
    runOnJS(updateTempColor)(hex);
  }, [updateTempColor]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    if (index !== activeTabIndex) {
      setActiveTabIndex(index);
    }
  };

  const scrollToTab = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveTabIndex(index);
  };

  const renderBackgroundPreview = (bg: Background) => {
    if (bg.type === 'gradient' && bg.gradient) {
      return (
        <LinearGradient
          colors={bg.gradient as [string, string, ...string[]]}
          style={[
            styles.backgroundOption,
            selectedBackground === bg.id && styles.selectedOption,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {selectedBackground === bg.id && (
            <View style={styles.checkContainer}>
              <Check size={20} color={Colors.light.surface} strokeWidth={3} />
            </View>
          )}
        </LinearGradient>
      );
    }

    if (bg.type === 'pattern') {
      return (
        <View
          style={[
            styles.backgroundOption,
            { backgroundColor: bg.value || Colors.light.surface },
            selectedBackground === bg.id && styles.selectedOption,
          ]}
        >
          {bg.pattern === 'grid' && (
            <View style={styles.patternContainer}>
              <View style={styles.gridPattern} />
            </View>
          )}
          {bg.pattern === 'dotgrid' && (
            <View style={styles.patternContainer}>
              <View style={styles.dotgridPattern} />
            </View>
          )}
          {bg.pattern === 'lines' && (
            <View style={styles.patternContainer}>
              <View style={styles.linesPattern} />
            </View>
          )}
          {bg.pattern === 'checks' && (
            <View style={styles.patternContainer}>
              <View style={styles.checksPattern} />
            </View>
          )}
          {bg.pattern === 'hexagon' && <Text style={styles.patternEmoji}>⬡</Text>}
          {bg.pattern === 'isometric' && <Text style={styles.patternEmoji}>◈</Text>}
          {bg.pattern === 'music' && <Text style={styles.patternEmoji}>♪</Text>}
          {bg.pattern === 'floral' && <Text style={styles.patternEmoji}>🌸</Text>}
          {bg.pattern === 'strawberry' && <Text style={styles.patternEmoji}>🍓</Text>}
          {bg.pattern === 'leaf' && <Text style={styles.patternEmoji}>🍃</Text>}
          {bg.pattern === 'tree' && <Text style={styles.patternEmoji}>🌳</Text>}
          {bg.pattern === 'cloud' && <Text style={styles.patternEmoji}>☁️</Text>}
          {bg.pattern === 'star' && <Text style={styles.patternEmoji}>⭐</Text>}
          {bg.pattern === 'heart' && <Text style={styles.patternEmoji}>💕</Text>}
          {selectedBackground === bg.id && (
            <View style={styles.checkContainer}>
              <Check size={20} color={Colors.light.text} strokeWidth={3} />
            </View>
          )}
        </View>
      );
    }

    // Solid color
    return (
      <View
        style={[
          styles.backgroundOption,
          bg.value ? { backgroundColor: bg.value } : styles.defaultOption,
          selectedBackground === bg.id && styles.selectedOption,
        ]}
      >
        {selectedBackground === bg.id && (
          <View style={styles.checkContainer}>
            <Check size={20} color={Colors.light.text} strokeWidth={3} />
          </View>
        )}
        {!bg.value && <View style={styles.defaultSlash} />}
      </View>
    );
  };

  const isCustomColor = selectedBackground?.startsWith('custom-');

  const renderTabPage = ({ item: tabKey }: { item: keyof typeof backgrounds }) => {
    const tabBackgrounds = backgrounds[tabKey];
    const itemWidth = (windowWidth - (Spacing.base * 2) - (Spacing.md * 2)) / 3;

    return (
      <View style={[styles.pageContainer, { width: windowWidth }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.backgroundGrid}>
            {tabBackgrounds.map((bg) => (
              <TouchableOpacity
                key={bg.id}
                onPress={() => onBackgroundSelect(bg.id)}
                activeOpacity={0.7}
                style={[styles.backgroundItem, { width: itemWidth }]}
              >
                {renderBackgroundPreview(bg)}
              </TouchableOpacity>
            ))}

            {/* Add custom color picker button only in Customize tab */}
            {tabKey === 'customize' && (
              <TouchableOpacity
                onPress={() => setShowCustomPicker(true)}
                activeOpacity={0.7}
                style={[styles.backgroundItem, { width: itemWidth }]}
              >
                <View
                  style={[
                    styles.backgroundOption,
                    isCustomColor && selectedBackground ? { backgroundColor: selectedBackground.replace('custom-', '') } : styles.customColorOption,
                    isCustomColor && styles.selectedOption,
                  ]}
                >
                  {isCustomColor ? (
                    <View style={styles.checkContainer}>
                      <Check size={20} color={Colors.light.text} strokeWidth={3} />
                    </View>
                  ) : (
                    <Plus size={32} color={Colors.light.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTabIndex === 0 && styles.activeTab]}
          onPress={() => scrollToTab(0)}
        >
          <Text style={[styles.tabText, activeTabIndex === 0 && styles.activeTabText]}>
            Customize
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTabIndex === 1 && styles.activeTab]}
          onPress={() => scrollToTab(1)}
        >
          <Text style={[styles.tabText, activeTabIndex === 1 && styles.activeTabText]}>
            Hot🔥
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTabIndex === 2 && styles.activeTab]}
          onPress={() => scrollToTab(2)}
        >
          <Text style={[styles.tabText, activeTabIndex === 2 && styles.activeTabText]}>
            Nature
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTabIndex === 3 && styles.activeTab]}
          onPress={() => scrollToTab(3)}
        >
          <Text style={[styles.tabText, activeTabIndex === 3 && styles.activeTabText]}>
            Dark
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Background Pages */}
      <FlatList
        ref={flatListRef}
        data={tabOrder}
        renderItem={renderTabPage}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialScrollIndex={1}
        getItemLayout={(data, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
      />

      {/* Custom Color Modal */}
      <Modal
        visible={showCustomPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomPicker(false)}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: C.overlay }]} onPress={() => setShowCustomPicker(false)}>
          <Pressable style={[styles.modal, { backgroundColor: C.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Choose Custom Color</Text>
              <TouchableOpacity onPress={() => setShowCustomPicker(false)}>
                <X size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.colorPickerContainer}>
              <ColorPicker2
                value={tempColor}
                onComplete={onSelectColorFromPicker}
                style={styles.colorPickerStyle}
              >
                <Panel1 style={styles.panel} />
                <HueSlider style={styles.slider} />
              </ColorPicker2>

              <View style={styles.previewContainer}>
                <Text style={[styles.previewLabel, { color: C.textSecondary }]}>Selected Color:</Text>
                <View style={[styles.previewColor, { backgroundColor: tempColor, borderColor: C.border }]} />
                <Text style={[styles.hexText, { color: C.text }]}>{tempColor}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: C.background, borderColor: C.border }]}
                onPress={() => setShowCustomPicker(false)}
              >
                <Text style={[styles.modalButtonCancelText, { color: C.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: C.primary }]}
                onPress={handleCustomColorSubmit}
              >
                <Text style={[styles.modalButtonPrimaryText, { color: C.surface }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    height: 500,
  },
  pageContainer: {
    height: 440,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    paddingHorizontal: Spacing.base,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.semibold,
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  backgroundItem: {
    aspectRatio: 1,
  },
  backgroundOption: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  defaultOption: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.text,
    borderStyle: 'dashed',
  },
  selectedOption: {
    borderColor: Colors.light.primary,
    borderWidth: 3,
  },
  checkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.round,
    padding: 4,
    position: 'absolute',
  },
  defaultSlash: {
    width: 3,
    height: '100%',
    backgroundColor: Colors.light.error,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  patternContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    overflow: 'hidden',
  },
  gridPattern: {
    width: '100%',
    height: '100%',
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'solid',
  },
  dotgridPattern: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  linesPattern: {
    width: '100%',
    height: '100%',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'solid',
  },
  checksPattern: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  patternEmoji: {
    fontSize: 30,
    opacity: 0.3,
  },
  customColorOption: {
    backgroundColor: '#BDBDBD',
    borderStyle: 'dashed',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  colorPickerContainer: {
    marginBottom: Spacing.lg,
  },
  colorPickerStyle: {
    width: '100%',
  },
  panel: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  previewLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  previewColor: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  hexText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.text,
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalButtonCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  modalButtonPrimaryText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
  },
});
