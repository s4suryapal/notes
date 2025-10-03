import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { NoteColors, Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface ColorPickerProps {
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
}

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Color</Text>
      <View style={styles.colorGrid}>
        {NoteColors.map((noteColor) => (
          <View key={noteColor.name} style={styles.colorItem}>
            <TouchableOpacity
              style={[
                styles.colorOption,
                noteColor.value
                  ? { backgroundColor: noteColor.value }
                  : styles.defaultColorOption,
                selectedColor === noteColor.value && styles.selectedOption,
              ]}
              onPress={() => onColorSelect(noteColor.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${noteColor.name} color`}
            >
              {selectedColor === noteColor.value && (
                <View style={styles.checkContainer}>
                  <Check size={20} color={Colors.light.text} strokeWidth={3} />
                </View>
              )}
              {!noteColor.value && (
                <View style={styles.defaultColorSlash} />
              )}
            </TouchableOpacity>
            <Text style={styles.colorLabel}>{noteColor.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.round,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultColorOption: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.text,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  selectedOption: {
    borderColor: Colors.light.text,
    borderWidth: 3,
  },
  checkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.round,
    padding: 2,
  },
  defaultColorSlash: {
    width: 2,
    height: 50,
    backgroundColor: Colors.light.error,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  colorLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textSecondary,
  },
});
