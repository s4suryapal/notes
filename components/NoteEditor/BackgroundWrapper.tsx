import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundPattern } from '@/components';
import type { Background } from '@/components';
import { Colors } from '@/constants/theme';

interface BackgroundWrapperProps {
  background: Background | null;
  children: ReactNode;
}

export function BackgroundWrapper({ background, children }: BackgroundWrapperProps) {
  if (!background) {
    return <View style={styles.wrapper}>{children}</View>;
  }

  // Gradient background
  if (background.type === 'gradient' && background.gradient && background.gradient.length >= 2) {
    return (
      <LinearGradient
        colors={background.gradient as [string, string, ...string[]]}
        style={styles.wrapper}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }

  // Pattern background
  if (background.type === 'pattern') {
    const svgPatterns = ['grid', 'dotgrid', 'lines', 'checks', 'hexagon', 'isometric', 'music'];
    const emojiPatterns: Record<string, string> = {
      floral: '🌸',
      strawberry: '🍓',
      leaf: '🍃',
      tree: '🌳',
      cloud: '☁️',
      star: '⭐',
      heart: '💕',
    };

    return (
      <View style={[styles.wrapper, { backgroundColor: background.value || Colors.light.background }]}>
        {background.pattern && svgPatterns.includes(background.pattern) && (
          <BackgroundPattern pattern={background.pattern} />
        )}
        {background.pattern && emojiPatterns[background.pattern] && (
          <Text style={styles.patternEmojiOverlay}>{emojiPatterns[background.pattern]}</Text>
        )}
        {children}
      </View>
    );
  }

  // Solid color background
  return (
    <View style={[styles.wrapper, { backgroundColor: background.value || Colors.light.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  patternEmojiOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: 120,
    opacity: 0.1,
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
});
