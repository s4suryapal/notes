import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Pressable } from 'react-native';
// @ts-ignore types shipped by lib
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { Menu, Search, Plus, ArrowUpDown, GripVertical } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { CategoryCard } from '@/components/CategoryCard';
import { useNotes } from '@/lib/NotesContext';

export default function FoldersScreen() {
  const insets = useSafeAreaInsets();
  const { notes, categories, reorderCategories } = useNotes();
  const navigation = useNavigation<any>();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>(categories.map(c => c.id));

  useEffect(() => {
    setOrderedIds(categories.map(c => c.id));
  }, [categories]);

  const draggableData = orderedIds
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean) as { id: string; name: string }[];

  const handleSaveOrder = async () => {
    await reorderCategories(orderedIds);
    setShowOrderModal(false);
  };
  const openDrawer = () => {
    const parent = navigation.getParent?.();
    if (parent?.openDrawer) parent.openDrawer();
    else navigation.openDrawer?.();
  };

  const totalNotes = useMemo(() => {
    return notes.filter((n) => !n.is_deleted && !n.is_archived).length;
  }, [notes]);

  const getCategoryNoteCount = (categoryId: string) => {
    return notes.filter((n) => n.category_id === categoryId && !n.is_deleted && !n.is_archived).length;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={openDrawer}>
            <Menu size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowOrderModal(true)} style={styles.iconButton}>
            <ArrowUpDown size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
            <Search size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
            <Plus size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Folders</Text>
        <Text style={styles.subtitle}>
          {categories.length} folders, {totalNotes} notes
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            noteCount={getCategoryNoteCount(item.id)}
            onPress={() => {}}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Modal */}
      <Modal
        visible={showOrderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrderModal(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOrderModal(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Set Category Order</Text>
            <DraggableFlatList
              data={draggableData}
              keyExtractor={(item) => item.id}
              containerStyle={styles.draggable}
              onDragEnd={({ data }) => setOrderedIds(data.map((d: any) => d.id))}
              renderItem={({ item, drag, isActive }: RenderItemParams<any>) => (
                <TouchableOpacity
                  style={[styles.modalRow, isActive && { backgroundColor: Colors.light.background }]}
                  onLongPress={drag}
                  activeOpacity={0.7}
                >
                  <GripVertical size={20} color={Colors.light.textTertiary} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.modalRowText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionCancel]} onPress={() => setShowOrderModal(false)}>
                <Text style={styles.actionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={handleSaveOrder}>
                <Text style={styles.actionPrimaryText}>Save</Text>
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
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
  },
  listContainer: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  row: {
    gap: Spacing.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.base,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  draggable: {
    maxHeight: 360,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalRowText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
  modalRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  actionCancel: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionCancelText: {
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
  actionPrimary: {
    backgroundColor: Colors.light.primary,
  },
  actionPrimaryText: {
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.semibold,
  },
});
