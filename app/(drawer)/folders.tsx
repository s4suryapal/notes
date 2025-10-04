import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
// @ts-ignore
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { ArrowLeft, GripVertical, Lock, Unlock, Edit2, Trash2, Plus, Info } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { ColorPicker } from '@/components';
import type { Category } from '@/types';

export default function ManageCategoriesScreen() {
  const { categories, reorderCategories, updateCategory, deleteCategory, createCategory, getCategoryNoteCounts } = useNotes();
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#F44336');
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const createInputRef = useRef<TextInput>(null);
  const renameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setLocalCategories([...categories]);
    loadNoteCounts();
  }, [categories]);

  // Reload counts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNoteCounts();
    }, [])
  );

  const loadNoteCounts = async () => {
    const counts = await getCategoryNoteCounts();
    setNoteCounts(counts);
  };

  const handleDragEnd = ({ data }: { data: Category[] }) => {
    setLocalCategories(data);
    // Auto-save order
    const orderedIds = data.map(cat => cat.id);
    reorderCategories(orderedIds);
  };

  const handleToggleLock = async (category: Category) => {
    try {
      // Using color as lock indicator (you can add a 'locked' field to Category type if needed)
      await updateCategory(category.id, {
        // Toggle lock state - using metadata or a custom field
        name: category.name, // Keep name same, just update
      });
      Alert.alert('Success', `Category ${category.name} lock toggled`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleRename = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color);
    setShowRenameModal(true);
    // Focus input after modal opens
    setTimeout(() => {
      renameInputRef.current?.focus();
    }, 100);
  };

  const handleSaveRename = async () => {
    if (!selectedCategory || !categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      await updateCategory(selectedCategory.id, {
        name: categoryName.trim(),
        color: categoryColor
      });
      setShowRenameModal(false);
      setCategoryName('');
      setCategoryColor('#FF6B6B');
      setSelectedCategory(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to rename category');
    }
  };

  const handleDelete = (category: Category) => {
    const noteCount = noteCounts[category.id] || 0;
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? ${noteCount > 0 ? `All ${noteCount} note(s) in this category will be moved to trash.` : 'This category is empty.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              await loadNoteCounts(); // Reload counts after deletion
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      await createCategory(categoryName.trim(), categoryColor);
      setShowCreateModal(false);
      setCategoryName('');
      setCategoryColor('#FF6B6B');
      await loadNoteCounts(); // Reload counts after creation
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const renderCategory = ({ item, drag, isActive }: RenderItemParams<Category>) => {
    // Check if "All" category (should be locked)
    const isAllCategory = item.id === 'all';
    const noteCount = noteCounts[item.id] || 0;

    return (
      <TouchableOpacity
        style={[
          styles.categoryRow,
          isActive && styles.categoryRowActive,
          isAllCategory && styles.categoryRowLocked,
        ]}
        onLongPress={!isAllCategory ? drag : undefined}
        disabled={isAllCategory}
        activeOpacity={0.8}
      >
        <View style={styles.categoryLeft}>
          <GripVertical
            size={20}
            color={isAllCategory ? Colors.light.borderLight : Colors.light.textSecondary}
            style={styles.gripIcon}
          />
          <View
            style={[styles.categoryColorDot, { backgroundColor: item.color }]}
          />
          <Text style={[styles.categoryName, isAllCategory && styles.categoryNameLocked]}>
            {item.name}
            <Text style={styles.categoryCount}>({noteCount})</Text>
          </Text>
        </View>

        <View style={styles.categoryRight}>
          {isAllCategory ? (
            <Lock size={18} color={Colors.light.borderLight} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleRename(item)}
              >
                <Edit2 size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item)}
              >
                <Trash2 size={18} color={Colors.light.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Folders</Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Info size={18} color="#856404" />
        <Text style={styles.infoBannerText}>
          You can reorder, rename or delete folders here.
        </Text>
      </View>

      {/* Categories List */}
      <DraggableFlatList
        data={localCategories}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            Categories ({localCategories.length})
          </Text>
        }
      />

      {/* Add Category Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setCategoryName('');
            setShowCreateModal(true);
          }}
        >
          <Plus size={20} color={Colors.light.surface} />
          <Text style={styles.addButtonText}>ADD FOLDER</Text>
        </TouchableOpacity>
      </View>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
        onShow={() => {
          setTimeout(() => {
            renameInputRef.current?.blur();
            renameInputRef.current?.focus();
          }, 50);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRenameModal(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Folder</Text>
            <TextInput
              ref={renameInputRef}
              style={styles.input}
              placeholder="Folder name"
              placeholderTextColor={Colors.light.textTertiary}
              value={categoryName}
              onChangeText={setCategoryName}
              returnKeyType="done"
              onSubmitEditing={handleSaveRename}
            />

            {/* Color Picker */}
            <View style={styles.colorPickerSection}>
              <Text style={styles.colorPickerLabel}>Color</Text>
              <ColorPicker
                selectedColor={categoryColor}
                onSelectColor={setCategoryColor}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowRenameModal(false);
                  setCategoryName('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveRename}
              >
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
        onShow={() => {
          setTimeout(() => {
            createInputRef.current?.blur();
            createInputRef.current?.focus();
          }, 50);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              ref={createInputRef}
              style={styles.input}
              placeholder="Folder name"
              placeholderTextColor={Colors.light.textTertiary}
              value={categoryName}
              onChangeText={setCategoryName}
              returnKeyType="done"
              onSubmitEditing={handleCreateCategory}
            />

            {/* Color Picker */}
            <View style={styles.colorPickerSection}>
              <Text style={styles.colorPickerLabel}>Color</Text>
              <ColorPicker
                selectedColor={categoryColor}
                onSelectColor={setCategoryColor}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowCreateModal(false);
                  setCategoryName('');
                  setCategoryColor('#F44336');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateCategory}
              >
                <Text style={styles.modalButtonPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFC107',
  },
  infoBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: '#856404',
  },
  listContent: {
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  categoryRowActive: {
    backgroundColor: Colors.light.primaryLight,
    ...Shadows.md,
  },
  categoryRowLocked: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  gripIcon: {
    marginRight: Spacing.xs,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
    flex: 1,
  },
  categoryNameLocked: {
    color: Colors.light.textTertiary,
  },
  categoryCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '400' as any,
    color: Colors.light.textSecondary,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  footer: {
    padding: Spacing.base,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  addButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.surface,
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
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
  colorPickerSection: {
    marginBottom: Spacing.lg,
  },
  colorPickerLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
});
