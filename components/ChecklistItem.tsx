import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ChecklistItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

export default function ChecklistItem({
  id,
  text,
  completed,
  onToggle,
  onTextChange,
  onDelete,
  autoFocus = false,
}: ChecklistItemProps) {
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onToggle(id)}
        style={[styles.checkbox, { borderColor: C.border }, completed && { backgroundColor: C.primary, borderColor: C.primary }]}
      >
        {completed && <View style={[styles.checkmark, { backgroundColor: C.surface }]} />}
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { color: C.text }, completed && { color: C.textSecondary, textDecorationLine: 'line-through' }]}
        value={text}
        onChangeText={(newText) => onTextChange(id, newText)}
        placeholder="List item"
        placeholderTextColor={C.textTertiary}
        multiline
        autoFocus={autoFocus}
      />

      <TouchableOpacity onPress={() => onDelete(id)} style={styles.deleteButton}>
        <X size={16} color={C.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {},
  checkmark: {
    width: 10,
    height: 10,
    backgroundColor: Colors.light.surface,
    borderRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    paddingVertical: Spacing.xs,
  },
  inputCompleted: {},
  deleteButton: {
    padding: Spacing.xs,
  },
});
