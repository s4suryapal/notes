import { TouchableOpacity, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { Colors, Layout, Shadows, Spacing } from '@/constants/theme';

interface FABProps {
  onPress: () => void;
  bottom?: number; // optional bottom offset to avoid overlapping UI (e.g., banner ads)
  right?: number;  // optional right offset if needed
}

export function FAB({ onPress, bottom, right }: FABProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        bottom != null ? { bottom } : null,
        right != null ? { right } : null,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Plus size={28} color="#FFFFFF" strokeWidth={3} />
      </View>
    </TouchableOpacity>
  );
}

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
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
