import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Trash2, Archive } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { NoteCard } from './NoteCard';
import { Note } from '@/types';

interface SwipeableNoteCardProps {
  note: Note;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress: () => void;
  onDelete: () => void;
  onArchive: () => void;
  searchQuery?: string;
  selectionMode?: boolean;
  isSelected?: boolean;
}

export const SwipeableNoteCard = React.memo(function SwipeableNoteCard({
  note,
  onPress,
  onLongPress,
  onMenuPress,
  onDelete,
  onArchive,
  searchQuery,
  selectionMode = false,
  isSelected = false,
}: SwipeableNoteCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Archive size={24} color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 size={24} color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  };

  const handleSwipeLeft = () => {
    // Swipe left = archive
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    setTimeout(() => {
      onArchive();
    }, 200);
  };

  const handleSwipeRight = () => {
    // Swipe right = delete
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    swipeableRef.current?.close();
    setTimeout(() => {
      onDelete();
    }, 200);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={selectionMode ? undefined : renderLeftActions}
      renderRightActions={selectionMode ? undefined : renderRightActions}
      onSwipeableLeftOpen={handleSwipeLeft}
      onSwipeableRightOpen={handleSwipeRight}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={80}
      rightThreshold={80}
      enabled={!selectionMode}
    >
      <NoteCard
        note={note}
        onPress={onPress}
        onLongPress={onLongPress}
        onMenuPress={onMenuPress}
        searchQuery={searchQuery}
        selectionMode={selectionMode}
        isSelected={isSelected}
      />
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  leftAction: {
    backgroundColor: Colors.light.info,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: Spacing.xl,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  rightAction: {
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacing.xl,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
});
