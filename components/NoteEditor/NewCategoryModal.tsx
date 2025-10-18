import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface NewCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function NewCategoryModal({ visible, onClose, onCreate }: NewCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];

  const handleCreate = async () => {
    if (categoryName.trim()) {
      await onCreate(categoryName.trim());
      setCategoryName('');
    }
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={[styles.overlay, { backgroundColor: C.overlay }]} onPress={handleClose}>
        <Pressable style={[styles.modal, { backgroundColor: C.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: C.text }]}>New Category</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { borderColor: C.border, color: C.text }]}
            placeholder="Category name"
            placeholderTextColor={C.textTertiary}
            value={categoryName}
            onChangeText={setCategoryName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: C.primary }]} onPress={handleCreate}>
              <Text style={[styles.createText, { color: C.surface }]}>Create</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  cancelButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  cancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  createButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
  },
  createText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.semibold,
  },
});
