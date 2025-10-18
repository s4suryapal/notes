import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Search, Check, MoreVertical, ChevronDown } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface NoteEditorHeaderProps {
  onBack: () => void;
  onSearch: () => void;
  onMore: () => void;
  categoryName: string | null;
  onCategoryPress: () => void;
  hasNoteId: boolean;
}

export function NoteEditorHeader({
  onBack,
  onSearch,
  onMore,
  categoryName,
  onCategoryPress,
  hasNoteId,
}: NoteEditorHeaderProps) {
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  return (
    <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.borderLight }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Notes</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onSearch} style={styles.iconButton}>
            <Search size={20} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Check size={24} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMore}
            style={[styles.iconButton, !hasNoteId && styles.iconButtonDisabled]}
            disabled={!hasNoteId}
          >
            <MoreVertical size={24} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Timestamp & Category Row */}
      <View style={styles.metaRow}>
        <Text style={[styles.timestamp, { color: C.textSecondary }]}>
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </Text>
        <TouchableOpacity style={styles.categoryDropdown} onPress={onCategoryPress}>
          <Text style={[styles.categoryDropdownText, { color: C.text }]}>{categoryName || 'All'}</Text>
          <ChevronDown size={16} color={C.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    flex: 1,
    marginLeft: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timestamp: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textSecondary,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryDropdownText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
});
