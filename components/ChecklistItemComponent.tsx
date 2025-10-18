import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
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
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== item.text) {
      onUpdate(item.id, text.trim());
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.checkbox, { borderColor: C.textTertiary }, item.completed && { backgroundColor: C.primary, borderColor: C.primary }]}
        onPress={() => onToggle(item.id)}
      >
        {item.completed && <Check size={16} color={C.surface} strokeWidth={3} />}
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          style={[styles.input, { color: C.text }]}
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
              { color: C.text },
              item.completed && { color: C.textSecondary, textDecorationLine: 'line-through' },
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={18} color={C.textTertiary} />
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
  checkboxChecked: {},
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  textCompleted: {},
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    padding: 0,
    paddingVertical: Spacing.xs,
  },
});
