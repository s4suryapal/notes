import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export function EmptyState({
  title = 'No notes yet',
  message = 'Tap the + button to create your first note',
  actionText,
  onActionPress,
}: EmptyStateProps) {
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <View style={[styles.noteIcon, { backgroundColor: C.surface, borderColor: C.border }, styles.noteIcon1]} />
        <View style={[styles.noteIcon, { backgroundColor: C.surface, borderColor: C.primary }, styles.noteIcon2]} />
        <View style={[styles.noteIcon, { backgroundColor: C.surface, borderColor: C.accent }, styles.noteIcon3]} />
      </View>
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      <Text style={[styles.message, { color: C.textSecondary }]}>{message}</Text>
      {actionText && onActionPress && (
        <TouchableOpacity style={[styles.button, { backgroundColor: C.primary }]} onPress={onActionPress} activeOpacity={0.8}>
          <Text style={[styles.buttonText, { color: C.surface }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  illustration: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  noteIcon: {
    position: 'absolute',
    width: 80,
    height: 100,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  noteIcon1: {
    transform: [{ rotate: '-10deg' }],
    top: 20,
    left: 20,
  },
  noteIcon2: {
    transform: [{ rotate: '5deg' }],
    top: 40,
    left: 60,
    borderColor: Colors.light.primary,
  },
  noteIcon3: {
    transform: [{ rotate: '-5deg' }],
    top: 60,
    left: 40,
    borderColor: Colors.light.accent,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  button: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xxl,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
