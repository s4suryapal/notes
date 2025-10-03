import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

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
    { id: 'pink-gradient', name: 'Pink', type: 'gradient', value: null, gradient: ['#FFB6C1', '#FF69B4'] },
    { id: 'purple-gradient', name: 'Purple', type: 'gradient', value: null, gradient: ['#E6E6FA', '#9370DB'] },
    { id: 'floral', name: 'Floral', type: 'pattern', value: '#FFF5EE', pattern: 'floral' },
    { id: 'strawberry', name: 'Strawberry', type: 'pattern', value: '#FFF0F5', pattern: 'strawberry' },
  ],
  nature: [
    { id: 'sky', name: 'Sky', type: 'gradient', value: null, gradient: ['#87CEEB', '#4FC3F7'] },
    { id: 'forest', name: 'Forest', type: 'gradient', value: null, gradient: ['#90EE90', '#228B22'] },
    { id: 'sunset', name: 'Sunset', type: 'gradient', value: null, gradient: ['#FFD700', '#FF8C00', '#FF6347'] },
    { id: 'ocean', name: 'Ocean', type: 'gradient', value: null, gradient: ['#00CED1', '#4682B4'] },
    { id: 'mint', name: 'Mint', type: 'solid', value: '#C8E6C9' },
    { id: 'lavender', name: 'Lavender', type: 'solid', value: '#E1BEE7' },
  ],
  dark: [
    { id: 'charcoal', name: 'Charcoal', type: 'solid', value: '#36454F' },
    { id: 'navy', name: 'Navy', type: 'solid', value: '#2C3E50' },
    { id: 'dark-purple', name: 'Dark Purple', type: 'gradient', value: null, gradient: ['#2C1654', '#4A148C'] },
    { id: 'midnight', name: 'Midnight', type: 'gradient', value: null, gradient: ['#1a237e', '#0d47a1'] },
    { id: 'dark-red', name: 'Dark Red', type: 'gradient', value: null, gradient: ['#4A0404', '#8B0000'] },
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

  for (const category of Object.values(backgrounds)) {
    const bg = category.find(b => b.id === id);
    if (bg) return bg;
  }

  return null;
}

export function BackgroundPicker({ selectedBackground, onBackgroundSelect }: BackgroundPickerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const tabOrder: (keyof typeof backgrounds)[] = ['customize', 'hot', 'nature', 'dark'];
  const [activeTabIndex, setActiveTabIndex] = useState(1); // Start with 'hot' (index 1)
  const flatListRef = useRef<FlatList>(null);

  const activeTab = tabOrder[activeTabIndex];
  const currentBackgrounds = backgrounds[activeTab];

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
          colors={bg.gradient}
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
          {bg.pattern === 'grid' && <View style={styles.gridPattern} />}
          {bg.pattern === 'floral' && <Text style={styles.patternEmoji}>🌸</Text>}
          {bg.pattern === 'strawberry' && <Text style={styles.patternEmoji}>🍓</Text>}
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
        keyExtractor={(item) => item}
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
  gridPattern: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'solid',
  },
  patternEmoji: {
    fontSize: 30,
    opacity: 0.3,
  },
});
