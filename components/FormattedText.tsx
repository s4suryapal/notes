import React from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface FormattedTextProps {
  text: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export function FormattedText({ text, style, numberOfLines }: FormattedTextProps) {
  const renderFormattedText = () => {
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // Check for bullet list
      if (line.trim().startsWith('•')) {
        return (
          <View key={lineIndex} style={styles.listItem}>
            <Text style={[styles.bullet, style]}>•</Text>
            <Text style={[styles.text, style]} numberOfLines={1}>
              {line.trim().substring(1).trim()}
            </Text>
          </View>
        );
      }

      // Check for numbered list
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        return (
          <View key={lineIndex} style={styles.listItem}>
            <Text style={[styles.bullet, style]}>{numberedMatch[1]}.</Text>
            <Text style={[styles.text, style]} numberOfLines={1}>
              {numberedMatch[2]}
            </Text>
          </View>
        );
      }

      // Process bold and italic
      const segments = [];
      let currentIndex = 0;
      let segmentKey = 0;

      // Regex to find **bold** and *italic*
      const boldRegex = /\*\*(.+?)\*\*/g;
      const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;

      // First, find all bold matches
      const boldMatches: { start: number; end: number; text: string }[] = [];
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        boldMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[1],
        });
      }

      // Then find italic matches (avoiding bold regions)
      const italicMatches: { start: number; end: number; text: string }[] = [];
      while ((match = italicRegex.exec(line)) !== null) {
        const isInBold = boldMatches.some(
          (bold) => match!.index >= bold.start && match!.index < bold.end
        );
        if (!isInBold) {
          italicMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1],
          });
        }
      }

      // Combine and sort all matches
      const allMatches = [
        ...boldMatches.map((m) => ({ ...m, type: 'bold' })),
        ...italicMatches.map((m) => ({ ...m, type: 'italic' })),
      ].sort((a, b) => a.start - b.start);

      // Build segments
      allMatches.forEach((match) => {
        // Add text before the match
        if (currentIndex < match.start) {
          segments.push(
            <Text key={`text-${segmentKey++}`} style={[styles.text, style]}>
              {line.substring(currentIndex, match.start)}
            </Text>
          );
        }

        // Add formatted text
        if (match.type === 'bold') {
          segments.push(
            <Text key={`bold-${segmentKey++}`} style={[styles.text, styles.bold, style]}>
              {match.text}
            </Text>
          );
        } else {
          segments.push(
            <Text key={`italic-${segmentKey++}`} style={[styles.text, styles.italic, style]}>
              {match.text}
            </Text>
          );
        }

        currentIndex = match.end;
      });

      // Add remaining text
      if (currentIndex < line.length) {
        segments.push(
          <Text key={`text-${segmentKey++}`} style={[styles.text, style]}>
            {line.substring(currentIndex)}
          </Text>
        );
      }

      return (
        <Text key={lineIndex} style={[styles.line, style]}>
          {segments.length > 0 ? segments : line}
          {lineIndex < lines.length - 1 ? '\n' : ''}
        </Text>
      );
    });
  };

  return (
    <Text numberOfLines={numberOfLines} style={style}>
      {renderFormattedText()}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
  },
  bold: {
    fontWeight: Typography.fontWeight.bold,
  },
  italic: {
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginVertical: 2,
  },
  bullet: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    width: 20,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
