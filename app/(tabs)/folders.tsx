import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Menu, Search, Plus, FolderPlus } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { CategoryCard } from '@/components/CategoryCard';
import { useNotes } from '@/lib/NotesContext';

export default function FoldersScreen() {
  const insets = useSafeAreaInsets();
  const { notes, categories } = useNotes();

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
          <TouchableOpacity onPress={() => {}}>
            <Menu size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
            <FolderPlus size={24} color={Colors.light.text} />
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
});
