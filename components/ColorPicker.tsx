import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Keyboard } from 'react-native';
import { Check, Plus, X } from 'lucide-react-native';
import { runOnJS } from 'react-native-reanimated';
import ColorPicker2, { Panel1, HueSlider, type returnedResults } from 'reanimated-color-picker';
import { NoteColors, Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface ColorPickerProps {
  selectedColor: string | null;
  onSelectColor: (color: string | null) => void;
}

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempColor, setTempColor] = useState('#F44336');

  const handleCustomColorSubmit = () => {
    onSelectColor(tempColor);
    setShowCustomPicker(false);
  };

  const updateTempColor = useCallback((color: string) => {
    setTempColor(color);
  }, []);

  const onSelectColorFromPicker = useCallback(({ hex }: returnedResults) => {
    'worklet';
    runOnJS(updateTempColor)(hex);
  }, [updateTempColor]);

  const isCustomColor = selectedColor && !NoteColors.some(c => c.value === selectedColor);

  const handleColorSelect = useCallback((color: string | null) => {
    Keyboard.dismiss();
    onSelectColor(color);
  }, [onSelectColor]);

  const handleCustomPickerOpen = useCallback(() => {
    Keyboard.dismiss();
    setShowCustomPicker(true);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.colorGrid}>
        {NoteColors.map((noteColor) => (
          <TouchableOpacity
            key={noteColor.name}
            style={[
              styles.colorOption,
              noteColor.value
                ? { backgroundColor: noteColor.value }
                : styles.defaultColorOption,
            ]}
            onPress={() => handleColorSelect(noteColor.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${noteColor.name} color`}
          >
            {selectedColor === noteColor.value && (
              <Check size={32} color="white" strokeWidth={3} />
            )}
            {!noteColor.value && (
              <View style={styles.defaultColorSlash} />
            )}
          </TouchableOpacity>
        ))}

        {/* Custom Color Option */}
        <TouchableOpacity
          style={[
            styles.colorOption,
            isCustomColor && selectedColor ? { backgroundColor: selectedColor } : styles.customColorOption,
          ]}
          onPress={handleCustomPickerOpen}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Custom color"
        >
          {isCustomColor ? (
            <Check size={32} color="white" strokeWidth={3} />
          ) : (
            <Plus size={28} color={Colors.light.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Color Modal */}
      <Modal
        visible={showCustomPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCustomPicker(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Custom Color</Text>
              <TouchableOpacity onPress={() => setShowCustomPicker(false)}>
                <X size={24} color={Colors.light.text} />
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
                <Text style={styles.previewLabel}>Selected Color:</Text>
                <View style={[styles.previewColor, { backgroundColor: tempColor }]} />
                <Text style={styles.hexText}>{tempColor}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCustomPicker(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCustomColorSubmit}
              >
                <Text style={styles.modalButtonPrimaryText}>Apply</Text>
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
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  colorItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  defaultColorOption: {
    backgroundColor: '#BDBDBD',
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
  customColorOption: {
    backgroundColor: '#BDBDBD',
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
  modalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
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
