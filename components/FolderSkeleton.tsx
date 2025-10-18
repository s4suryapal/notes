import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export function FolderSkeleton() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Folder icon skeleton */}
      <Animated.View style={[styles.iconSkeleton, { opacity }]} />

      {/* Folder name skeleton */}
      <View style={styles.textContainer}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.countSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  iconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.borderLight,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleSkeleton: {
    height: 16,
    width: '60%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  countSkeleton: {
    height: 12,
    width: '30%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
});
