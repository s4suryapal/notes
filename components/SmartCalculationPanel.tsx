import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Clipboard } from 'react-native';
import { Copy, X, TrendingUp, Hash, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { CalculationStats, formatNumber } from '@/lib/smartCalculation';

interface SmartCalculationPanelProps {
  stats: CalculationStats | null;
  visible: boolean;
  onDismiss: () => void;
  onCopy: () => void;
}

export function SmartCalculationPanel({ stats, visible, onDismiss, onCopy }: SmartCalculationPanelProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && stats) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, stats]);

  if (!stats || !visible) return null;

  const handleCopy = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const copyText = `Sum: ${formatNumber(stats.sum)}\nAverage: ${formatNumber(stats.average)}\nCount: ${stats.count}`;
      Clipboard.setString(copyText);
      onCopy();
    } catch (error) {
      console.error('Failed to copy calculation:', error);
    }
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BarChart3 size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Smart Calculation</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        {/* Count */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Hash size={14} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Count</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.count}</Text>
          </View>
        </View>

        {/* Sum */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
            <TrendingUp size={14} color={colors.success} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sum</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(stats.sum)}</Text>
          </View>
        </View>

        {/* Average */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '15' }]}>
            <BarChart3 size={14} color={colors.accent} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(stats.average)}</Text>
          </View>
        </View>
      </View>

      {/* Copy Button */}
      <TouchableOpacity style={[styles.copyButton, { backgroundColor: colors.primary }]} onPress={handleCopy} activeOpacity={0.8}>
        <Copy size={16} color="#FFFFFF" />
        <Text style={styles.copyButtonText}>Copy Results</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    ...Shadows.xl,
    zIndex: 9999,
    elevation: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.light.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  copyButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
