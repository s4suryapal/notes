import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, Info, XCircle, X, Archive, ArchiveRestore, Trash2, LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'deleted' | 'archived' | 'restored' | 'exit';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  customColor?: string; // Optional custom color override
}

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
  customColor,
}: ToastProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current; // 0 -> 1
  const [cardWidth, setCardWidth] = useState(0);

  useEffect(() => {
    if (visible) {
      // Haptics for important toasts
      try {
        if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else if (type === 'warning') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      // Reset and show animation
      progress.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
      ]).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration, type]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getIcon = () => {
    const iconColor = '#FFFFFF';
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color={iconColor} />;
      case 'error':
        return <XCircle size={20} color={iconColor} />;
      case 'warning':
        return <AlertCircle size={20} color={iconColor} />;
      case 'deleted':
        return <Trash2 size={20} color={iconColor} />;
      case 'archived':
        return <Archive size={20} color={iconColor} />;
      case 'restored':
        return <ArchiveRestore size={20} color={iconColor} />;
      case 'exit':
        return <LogOut size={20} color={iconColor} />;
      case 'info':
      default:
        return <Info size={20} color={iconColor} />;
    }
  };

  const getBackgroundColor = () => {
    // If custom color is provided, use it
    if (customColor) {
      return customColor + 'E6'; // 90% opacity
    }

    switch (type) {
      case 'success':
        return colors.success + 'E6'; // 90% opacity
      case 'error':
        return colors.error + 'E6';
      case 'warning':
        return colors.warning + 'E6';
      case 'deleted':
        return '#EF4444E6'; // Red-500
      case 'archived':
        return '#8B5CF6E6'; // Violet-500
      case 'restored':
        return '#10B981E6'; // Green-500
      case 'exit':
        return '#64748BE6'; // Slate-500
      case 'info':
      default:
        return colors.primary + 'E6';
    }
  };

  const getIconBackgroundColor = () => {
    // Not currently used, but kept for potential future use
    if (customColor) {
      return customColor;
    }

    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'deleted':
        return '#EF4444';
      case 'archived':
        return '#8B5CF6';
      case 'restored':
        return '#10B981';
      case 'exit':
        return '#64748B';
      case 'info':
      default:
        return colors.primary;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBackgroundColor(),
          bottom: insets.bottom + 72,
        },
      ]}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF40' }]}>
          {getIcon()}
        </View>
        <Text
          style={[styles.message, { color: '#FFFFFF' }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
        {action && (
          <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <X size={18} color="#FFFFFFCC" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: '#FFFFFF60',
              width: progress.interpolate({ inputRange: [0, 1], outputRange: [cardWidth, 0] }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    borderRadius: BorderRadius.xl,
    zIndex: 9999,
    ...Shadows.xl,
    // Add backdrop blur effect simulation with darker overlay
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  message: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF30',
    borderRadius: BorderRadius.md,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#FFFFFF20',
    overflow: 'hidden',
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  progressBar: {
    height: 4,
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.sm,
  },
});
