import React from 'react';
import { Text, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
  numberOfLines?: number;
}

export function HighlightedText({
  text,
  searchQuery,
  style,
  highlightStyle,
  numberOfLines,
}: HighlightedTextProps) {
  if (!searchQuery.trim()) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
        return (
          <Text
            key={index}
            style={
              isMatch
                ? {
                    backgroundColor: Colors.light.secondary,
                    fontWeight: '600',
                    ...highlightStyle,
                  }
                : undefined
            }
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}
