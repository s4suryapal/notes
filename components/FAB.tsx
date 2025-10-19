import { TouchableOpacity, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { Colors, Layout, Shadows, Spacing } from '@/constants/theme';
import { forwardRef } from 'react';

interface FABProps {
  onPress: () => void;
  bottom?: number; // optional bottom offset to avoid overlapping UI (e.g., banner ads)
  right?: number;  // optional right offset if needed
  onLayout?: (event: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }) => void;
}

export const FAB = forwardRef<View, FABProps>(({ onPress, bottom, right, onLayout }, ref) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View
      ref={ref}
      style={[
        styles.container,
        bottom != null ? { bottom } : null,
        right != null ? { right } : null,
      ]}
      collapsable={false}
      onLayout={onLayout}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.base,
    bottom: Spacing.base + 60, // default; screens can override with prop
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.fabSize / 2,
  },
});
