import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator, NativeModules, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles, CheckSquare } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { NOTE_TEMPLATES, TemplateCategory, NoteTemplate, fillTemplatePlaceholders } from '@/constants/noteTemplates';
import { ChecklistItem } from '@/types';

const { FirebaseAIModule } = NativeModules;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50; // Minimum swipe distance to trigger category change

interface TemplatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string, checklistItems?: ChecklistItem[]) => void;
}

export function TemplatePicker({ visible, onClose, onSelectTemplate }: TemplatePickerProps) {
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(TemplateCategory.PRODUCTIVITY);
  const [isGenerating, setIsGenerating] = useState(false);
  const categoryScrollRef = useRef<ScrollView>(null);

  // Swipe animation values
  const translateX = useSharedValue(0);
  const categories = Object.values(TemplateCategory);
  const currentIndex = categories.indexOf(selectedCategory);

  const filteredTemplates = NOTE_TEMPLATES.filter(t => t.category === selectedCategory);

  // Handle category change from swipe
  const handleCategoryChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < categories.length) {
      setSelectedCategory(categories[newIndex]);

      // Auto-scroll category tabs to show selected
      setTimeout(() => {
        categoryScrollRef.current?.scrollTo({
          x: newIndex * 120, // Approximate tab width
          animated: true,
        });
      }, 100);
    }
  };

  // Swipe gesture for templates area
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldSwipe) {
        if (event.translationX > 0) {
          // Swiped right - go to previous category
          runOnJS(handleCategoryChange)(currentIndex - 1);
        } else {
          // Swiped left - go to next category
          runOnJS(handleCategoryChange)(currentIndex + 1);
        }
      }

      // Reset animation
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    });

  // Animated style for swipe feedback
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value * 0.3, // Reduced movement for better UX
      },
    ],
  }));

  const handleSelectTemplate = async (template: NoteTemplate) => {
    // Check if this is a checklist template
    if (template.isChecklistTemplate && template.checklistItems) {
      // Convert template checklist items to proper ChecklistItem format
      const checklistItems: ChecklistItem[] = template.checklistItems.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        text: item.text,
        completed: item.completed,
        order: index,
      }));

      // Pass empty content and the checklist items
      onSelectTemplate('', checklistItems);
      onClose();
      return;
    }

    // Regular HTML template flow
    let content = fillTemplatePlaceholders(template.content);

    // If template has smart fields and AI is available, offer to fill them
    if (template.hasSmartFields && FirebaseAIModule) {
      // For now, just insert the template with placeholders
      // User can manually fill or we can add AI fill later
      onSelectTemplate(content);
      onClose();
    } else {
      onSelectTemplate(content);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={[styles.overlay, { backgroundColor: C.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.modal,
            {
              backgroundColor: C.surface,
              paddingBottom: Math.max(insets.bottom, Spacing.xl)
            }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: C.border }]}>
            <Text style={[styles.title, { color: C.text }]}>Choose Template</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  { borderColor: C.border },
                  selectedCategory === category && {
                    backgroundColor: C.primary,
                    borderColor: C.primary
                  }
                ]}
                onPress={() => handleCategoryChange(index)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: selectedCategory === category ? '#FFFFFF' : C.text }
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Templates Grid with Swipe Gesture */}
          <GestureDetector gesture={swipeGesture}>
            <Animated.View style={[styles.templatesWrapper, animatedStyle]}>
              <ScrollView
                style={styles.templatesContainer}
                contentContainerStyle={[
                  styles.templatesContent,
                  { paddingBottom: Math.max(insets.bottom, Spacing.base) }
                ]}
                showsVerticalScrollIndicator={true}
              >
                {filteredTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[styles.templateCard, { backgroundColor: C.background, borderColor: C.border }]}
                    onPress={() => handleSelectTemplate(template)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.templateHeader}>
                      <Text style={styles.templateIcon}>{template.icon}</Text>
                      <View style={styles.badgeContainer}>
                        {template.isChecklistTemplate && (
                          <View style={[styles.checklistBadge, { backgroundColor: C.success }]}>
                            <CheckSquare size={12} color="#FFFFFF" />
                          </View>
                        )}
                        {template.hasSmartFields && (
                          <View style={[styles.smartBadge, { backgroundColor: C.primary }]}>
                            <Sparkles size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.templateName, { color: C.text }]}>{template.name}</Text>
                    <Text style={[styles.templateDescription, { color: C.textSecondary }]} numberOfLines={2}>
                      {template.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </GestureDetector>

          {isGenerating && (
            <View style={[styles.loadingOverlay, { backgroundColor: C.overlay }]}>
              <View style={[styles.loadingCard, { backgroundColor: C.surface }]}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={[styles.loadingText, { color: C.text }]}>Generating smart content...</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    height: '85%',
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  categoryTabs: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  categoryTabsContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryTabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
  },
  templatesWrapper: {
    flex: 1,
  },
  templatesContainer: {
    flex: 1,
  },
  templatesContent: {
    padding: Spacing.base,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  templateCard: {
    width: '48%',
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.base,
    minHeight: 120,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  templateIcon: {
    fontSize: 32,
  },
  checklistBadge: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  smartBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  templateName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xxs,
  },
  templateDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textSecondary,
    lineHeight: Typography.fontSize.xs * 1.4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
});
