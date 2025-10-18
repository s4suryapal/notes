import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  noteCount: number;
  onPress: () => void;
}

export const CategoryCard = React.memo(function CategoryCard({ category, noteCount, onPress }: CategoryCardProps) {
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.content, { backgroundColor: C.surface }]}>
        <View style={[styles.colorTab, { backgroundColor: category.color }]} />
        <View style={[styles.countBadge, { backgroundColor: C.borderLight }]}>
          <Text style={[styles.countText, { color: C.textSecondary }]}>{noteCount}</Text>
        </View>
        <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
    marginBottom: Spacing.base,
  },
  content: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    minHeight: 120,
    ...Shadows.md,
  },
  colorTab: {
    position: 'absolute',
    top: 0,
    left: Spacing.base,
    right: Spacing.base,
    height: 4,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  countBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    minWidth: 24,
    height: 24,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  countText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.textSecondary,
  },
  name: {
    marginTop: Spacing.xxl + Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
});
