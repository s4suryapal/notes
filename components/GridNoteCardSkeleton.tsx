import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export function GridNoteCardSkeleton() {
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
      {/* Favorite indicator skeleton */}
      <View style={styles.header}>
        <Animated.View style={[styles.favoriteSkeleton, { opacity }]} />
      </View>

      {/* Title skeleton */}
      <Animated.View style={[styles.titleSkeleton, { opacity }]} />
      <Animated.View style={[styles.titleShortSkeleton, { opacity }]} />

      {/* Body lines skeleton */}
      <View style={styles.bodyContainer}>
        <Animated.View style={[styles.bodySkeleton, { opacity }]} />
        <Animated.View style={[styles.bodySkeleton, { opacity }]} />
        <Animated.View style={[styles.bodyShortSkeleton, { opacity }]} />
      </View>

      {/* Footer metadata skeleton */}
      <View style={styles.footer}>
        <Animated.View style={[styles.metadataSkeleton, { opacity }]} />
        <Animated.View style={[styles.metadataSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 140,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.xs,
  },
  favoriteSkeleton: {
    width: 14,
    height: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  titleSkeleton: {
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
    marginBottom: Spacing.xs,
  },
  titleShortSkeleton: {
    height: 16,
    width: '60%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
    marginBottom: Spacing.sm,
  },
  bodyContainer: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  bodySkeleton: {
    height: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  bodyShortSkeleton: {
    height: 12,
    width: '70%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 'auto',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  metadataSkeleton: {
    width: 30,
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
});
