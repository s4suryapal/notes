import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { ChecklistItem } from '@/types';

interface ChecklistItemProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export function ChecklistItemComponent({ item, onToggle, onUpdate, onDelete }: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text);

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== item.text) {
      onUpdate(item.id, text.trim());
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxChecked]}
        onPress={() => onToggle(item.id)}
      >
        {item.completed && <Check size={16} color={Colors.light.surface} strokeWidth={3} />}
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onBlur={handleBlur}
          autoFocus
          multiline
        />
      ) : (
        <TouchableOpacity style={styles.textContainer} onPress={() => setIsEditing(true)}>
          <Text
            style={[
              styles.text,
              item.completed && styles.textCompleted,
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={18} color={Colors.light.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.light.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    padding: 0,
    paddingVertical: Spacing.xs,
  },
});
