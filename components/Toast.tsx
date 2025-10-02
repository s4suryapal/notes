import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

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
}

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
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
      ]).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

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
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color={Colors.light.success} />;
      case 'error':
        return <XCircle size={20} color={Colors.light.error} />;
      case 'warning':
        return <AlertCircle size={20} color={Colors.light.warning} />;
      case 'info':
      default:
        return <Info size={20} color={Colors.light.info} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return Colors.light.success + '15';
      case 'error':
        return Colors.light.error + '15';
      case 'warning':
        return Colors.light.warning + '15';
      case 'info':
      default:
        return Colors.light.info + '15';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return Colors.light.success;
      case 'error':
        return Colors.light.error;
      case 'warning':
        return Colors.light.warning;
      case 'info':
      default:
        return Colors.light.info;
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
          borderLeftColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={styles.message}>{message}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: getBorderColor() }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <X size={18} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    ...Shadows.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  message: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  closeButton: {
    padding: Spacing.xs,
  },
});
