import { useState, useCallback } from 'react';
import { ChecklistItem as ChecklistItemType } from '@/types';

interface UseChecklistManagerProps {
  onChecklistChange: (items: ChecklistItemType[]) => void;
}

export function useChecklistManager({ onChecklistChange }: UseChecklistManagerProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItemType[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);

  const handleToggleChecklist = useCallback(() => {
    if (showChecklist) {
      // Hide checklist
      setShowChecklist(false);
      setChecklistItems([]);
      onChecklistChange([]);
    } else {
      // Show checklist with one empty item
      setShowChecklist(true);
      const newItem: ChecklistItemType = {
        id: Date.now().toString(),
        text: '',
        completed: false,
        order: 0,
      };
      setChecklistItems([newItem]);
      // Don't notify yet - wait for user to add content
    }
  }, [showChecklist, onChecklistChange]);

  const handleAddChecklistItem = useCallback(() => {
    const newItem: ChecklistItemType = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      order: checklistItems.length,
    };
    const newItems = [...checklistItems, newItem];
    setChecklistItems(newItems);
    onChecklistChange(newItems);
  }, [checklistItems, onChecklistChange]);

  const handleToggleChecklistItem = useCallback((itemId: string) => {
    const newItems = checklistItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklistItems(newItems);
    onChecklistChange(newItems);
  }, [checklistItems, onChecklistChange]);

  const handleChecklistItemTextChange = useCallback((itemId: string, text: string) => {
    const newItems = checklistItems.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    setChecklistItems(newItems);
    onChecklistChange(newItems);
  }, [checklistItems, onChecklistChange]);

  const handleDeleteChecklistItem = useCallback((itemId: string) => {
    const newItems = checklistItems.filter((item) => item.id !== itemId);
    setChecklistItems(newItems);

    // If no items left, hide checklist
    if (newItems.length === 0) {
      setShowChecklist(false);
    }

    onChecklistChange(newItems);
  }, [checklistItems, onChecklistChange]);

  return {
    checklistItems,
    setChecklistItems,
    showChecklist,
    setShowChecklist,
    handleToggleChecklist,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleChecklistItemTextChange,
    handleDeleteChecklistItem,
  };
}
