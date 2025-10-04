import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { FolderPlus } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Category } from '@/types';

interface CategoryPickerDropdownProps {
  visible: boolean;
  categories: Category[];
  selectedCategory: string | null;
  onClose: () => void;
  onSelectCategory: (categoryId: string | null) => void;
  onAddCategory: () => void;
}

export function CategoryPickerDropdown({
  visible,
  categories,
  selectedCategory,
  onClose,
  onSelectCategory,
  onAddCategory,
}: CategoryPickerDropdownProps) {
  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <View style={styles.positioner}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.modal}>
            {/* Add New Category Option */}
            <TouchableOpacity style={styles.addOption} onPress={onAddCategory}>
              <FolderPlus size={18} color={Colors.light.primary} />
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.option, !selectedCategory && styles.optionActive]}
              onPress={() => onSelectCategory(null)}
            >
              <Text style={styles.optionText}>All</Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.option, selectedCategory === category.id && styles.optionActive]}
                onPress={() => onSelectCategory(category.id)}
              >
                <Text style={styles.optionText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  positioner: {
    position: 'absolute',
    top: 100,
    right: Spacing.base,
  },
  modal: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xs,
    minWidth: 150,
    ...Shadows.lg,
  },
  option: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  optionActive: {
    backgroundColor: Colors.light.borderLight,
  },
  optionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  addText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: Spacing.xs,
  },
});
