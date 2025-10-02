import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface CategoryChipProps {
  name: string;
  color: string;
  isActive: boolean;
  onPress: () => void;
  noteCount?: number;
}

export const CategoryChip = React.memo(function CategoryChip({ name, color, isActive, onPress, noteCount }: CategoryChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        isActive && { backgroundColor: color },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, isActive && styles.textActive]}>{name}</Text>
      {noteCount !== undefined && noteCount > 0 && (
        <View style={[styles.badge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : color }]}>
          <Text style={[styles.badgeText, isActive && { color: '#FFFFFF' }]}>{noteCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.xs,
  },
  text: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.semibold,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
