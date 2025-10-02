import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export function NoteCardSkeleton() {
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
      <View style={styles.content}>
        {/* Header with star placeholder */}
        <View style={styles.header}>
          <Animated.View style={[styles.starSkeleton, { opacity }]} />
        </View>

        {/* Title skeleton */}
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.titleShortSkeleton, { opacity }]} />

        {/* Body skeleton */}
        <Animated.View style={[styles.bodySkeleton, { opacity }]} />
        <Animated.View style={[styles.bodySkeleton, { opacity }]} />
        <Animated.View style={[styles.bodyShortSkeleton, { opacity }]} />

        {/* Footer skeleton */}
        <View style={styles.footer}>
          <Animated.View style={[styles.dateSkeleton, { opacity }]} />
          <Animated.View style={[styles.menuSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  content: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 20,
  },
  starSkeleton: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  titleSkeleton: {
    height: 18,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  titleShortSkeleton: {
    height: 18,
    width: '60%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  bodySkeleton: {
    height: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  bodyShortSkeleton: {
    height: 14,
    width: '80%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  dateSkeleton: {
    width: 100,
    height: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  menuSkeleton: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
});
