import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export function SearchResultSkeleton() {
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
      {/* Title skeleton */}
      <Animated.View style={[styles.titleSkeleton, { opacity }]} />

      {/* Snippet skeleton */}
      <Animated.View style={[styles.snippetSkeleton, { opacity }]} />
      <Animated.View style={[styles.snippetShortSkeleton, { opacity }]} />

      {/* Metadata skeleton */}
      <View style={styles.metadataRow}>
        <Animated.View style={[styles.dateSkeleton, { opacity }]} />
        <Animated.View style={[styles.categorySkeleton, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    gap: Spacing.xs,
  },
  titleSkeleton: {
    height: 18,
    width: '70%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  snippetSkeleton: {
    height: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  snippetShortSkeleton: {
    height: 14,
    width: '85%',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  dateSkeleton: {
    height: 12,
    width: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
  categorySkeleton: {
    height: 12,
    width: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.borderLight,
  },
});
