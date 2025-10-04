import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

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
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onToggle(id)}
        style={[styles.checkbox, completed && styles.checkboxCompleted]}
      >
        {completed && <View style={styles.checkmark} />}
      </TouchableOpacity>

      <TextInput
        style={[styles.input, completed && styles.inputCompleted]}
        value={text}
        onChangeText={(newText) => onTextChange(id, newText)}
        placeholder="List item"
        placeholderTextColor={Colors.light.textTertiary}
        multiline
        autoFocus={autoFocus}
      />

      <TouchableOpacity onPress={() => onDelete(id)} style={styles.deleteButton}>
        <X size={16} color={Colors.light.textSecondary} />
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
  checkboxCompleted: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
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
  inputCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
});
