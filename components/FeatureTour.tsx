import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { ChevronRight, X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  shape?: 'circle' | 'rectangle';
  isFirstNote?: boolean; // Special styling for first note creation
}

interface FeatureTourProps {
  visible: boolean;
  steps: TourStep[];
  currentStepIndex: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export default function FeatureTour({
  visible,
  steps,
  currentStepIndex,
  onNext,
  onSkip,
  onComplete,
}: FeatureTourProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [tooltipLayout, setTooltipLayout] = useState({ width: 0, height: 0 });

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Fade in animation
  useEffect(() => {
    if (visible && currentStep) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Pulse animation for spotlight
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, currentStep, currentStepIndex]);

  if (!visible || !currentStep) return null;

  const { targetPosition, shape = 'rectangle', tooltipPosition = 'bottom', isFirstNote = false } = currentStep;

  // Calculate spotlight dimensions
  const spotlightPadding = isFirstNote ? 8 : 12;
  const spotlightWidth = targetPosition.width + spotlightPadding * 2;
  const spotlightHeight = targetPosition.height + spotlightPadding * 2;
  const spotlightX = targetPosition.x - spotlightPadding;
  const spotlightY = targetPosition.y - spotlightPadding;

  // Calculate tooltip position
  const calculateTooltipPosition = () => {
    const spacing = 20;
    const tooltipWidth = tooltipLayout.width || 300;
    const tooltipHeight = tooltipLayout.height || 120;

    let x = 0;
    let y = 0;

    switch (tooltipPosition) {
      case 'top':
        x = targetPosition.x + targetPosition.width / 2 - tooltipWidth / 2;
        y = targetPosition.y - tooltipHeight - spacing;
        break;
      case 'bottom':
        x = targetPosition.x + targetPosition.width / 2 - tooltipWidth / 2;
        y = targetPosition.y + targetPosition.height + spacing;
        break;
      case 'left':
        x = targetPosition.x - tooltipWidth - spacing;
        y = targetPosition.y + targetPosition.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = targetPosition.x + targetPosition.width + spacing;
        y = targetPosition.y + targetPosition.height / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip within screen bounds
    x = Math.max(Spacing.base, Math.min(x, width - tooltipWidth - Spacing.base));
    y = Math.max(Spacing.base, Math.min(y, height - tooltipHeight - Spacing.base));

    return { x, y };
  };

  const tooltipPos = calculateTooltipPosition();

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.container}>
        {/* Dark Overlay with Spotlight Cutout */}
        <Animated.View
          style={[styles.overlay, { opacity: fadeAnim }]}
          pointerEvents={isFirstNote ? 'box-none' : 'auto'}
        >
          {/* This creates a semi-transparent overlay */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.overlayBackground} />
          </View>

          {/* Spotlight Highlight */}
          <Animated.View
            style={[
              styles.spotlight,
              {
                left: spotlightX,
                top: spotlightY,
                width: spotlightWidth,
                height: spotlightHeight,
                borderRadius: shape === 'circle' ? spotlightWidth / 2 : BorderRadius.lg,
                transform: [{ scale: pulseAnim }],
              },
            ]}
            pointerEvents="none"
          />
        </Animated.View>

        {/* Special First Note Tooltip */}
        {isFirstNote ? (
          <Animated.View
            style={[
              styles.firstNoteTooltip,
              {
                left: tooltipPos.x,
                top: tooltipPos.y,
                opacity: fadeAnim,
              },
            ]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setTooltipLayout({ width, height });
            }}
          >
            {/* Speech Bubble with Tail */}
            <View style={styles.speechBubble}>
              {/* Sparkles */}
              <Text style={styles.sparkleLeft}>✨</Text>
              <Text style={styles.sparkleRight}>✨</Text>

              <Text style={styles.firstNoteText}>{currentStep.title}</Text>

              {/* Tail pointing down to FAB */}
              <View style={styles.bubbleTail} />
            </View>
          </Animated.View>
        ) : (
          /* Standard Tooltip */
          <Animated.View
            style={[
              styles.tooltip,
              {
                left: tooltipPos.x,
                top: tooltipPos.y,
                opacity: fadeAnim,
              },
            ]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setTooltipLayout({ width, height });
            }}
          >
            {/* Tooltip Arrow */}
            {tooltipPosition === 'bottom' && (
              <View style={[styles.arrow, styles.arrowTop]} />
            )}
            {tooltipPosition === 'top' && (
              <View style={[styles.arrow, styles.arrowBottom]} />
            )}

            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>{currentStep.title}</Text>
              <Text style={styles.tooltipDescription}>{currentStep.description}</Text>

              {/* Progress Dots */}
              <View style={styles.progressContainer}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index === currentStepIndex && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                  <Text style={styles.skipButtonText}>Skip Tour</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                  <Text style={styles.nextButtonText}>
                    {isLastStep ? 'Got it!' : 'Next'}
                  </Text>
                  {!isLastStep && (
                    <ChevronRight size={16} color={Colors.light.surface} style={styles.nextIcon} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Close Button - only show for standard tours */}
        {!isFirstNote && (
          <TouchableOpacity style={styles.closeButton} onPress={onSkip}>
            <X size={24} color={Colors.light.surface} />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxWidth: 320,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    alignSelf: 'center',
  },
  arrowTop: {
    top: -8,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.light.surface,
  },
  arrowBottom: {
    bottom: -8,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.light.surface,
  },
  tooltipContent: {
    gap: Spacing.sm,
  },
  tooltipTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  tooltipDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    lineHeight: Typography.fontSize.sm * 1.5,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.borderLight,
  },
  progressDotActive: {
    width: 20,
    backgroundColor: Colors.light.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.round,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
  },
  nextIcon: {
    marginLeft: Spacing.xs,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.round,
  },
  // First Note specific styles
  firstNoteTooltip: {
    position: 'absolute',
  },
  speechBubble: {
    backgroundColor: '#4A90E2',
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    maxWidth: 280,
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  sparkleLeft: {
    position: 'absolute',
    left: -8,
    top: -8,
    fontSize: 24,
  },
  sparkleRight: {
    position: 'absolute',
    right: -8,
    top: 8,
    fontSize: 20,
  },
  firstNoteText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.4,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    marginLeft: -12,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4A90E2',
  },
});
