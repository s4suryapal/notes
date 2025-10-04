import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Rect, Path, Polygon, G } from 'react-native-svg';

interface BackgroundPatternProps {
  pattern: string;
}

export function BackgroundPattern({ pattern }: BackgroundPatternProps) {
  if (pattern === 'grid') {
    return (
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {/* Create grid lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <React.Fragment key={i}>
            <Line
              x1="0"
              y1={i * 40}
              x2="100%"
              y2={i * 40}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
            <Line
              x1={i * 40}
              y1="0"
              x2={i * 40}
              y2="100%"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
          </React.Fragment>
        ))}
      </Svg>
    );
  }

  if (pattern === 'dotgrid') {
    return (
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {/* Create dot grid pattern for bullet journaling */}
        {Array.from({ length: 40 }).map((_, row) =>
          Array.from({ length: 20 }).map((_, col) => (
            <Circle
              key={`${row}-${col}`}
              cx={col * 20 + 10}
              cy={row * 20 + 10}
              r="1.5"
              fill="rgba(0,0,0,0.15)"
            />
          ))
        )}
      </Svg>
    );
  }

  if (pattern === 'lines') {
    return (
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {/* Horizontal lines like ruled paper */}
        {Array.from({ length: 25 }).map((_, i) => (
          <Line
            key={i}
            x1="0"
            y1={i * 32 + 40}
            x2="100%"
            y2={i * 32 + 40}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
          />
        ))}
      </Svg>
    );
  }

  if (pattern === 'checks') {
    return (
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {/* Checkerboard pattern */}
        {Array.from({ length: 15 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => {
            const shouldFill = (row + col) % 2 === 0;
            return shouldFill ? (
              <Rect
                key={`${row}-${col}`}
                x={col * 50}
                y={row * 50}
                width="50"
                height="50"
                fill="rgba(0,0,0,0.04)"
              />
            ) : null;
          })
        )}
      </Svg>
    );
  }

  if (pattern === 'hexagon') {
    const hexHeight = 40;
    const hexWidth = 35;
    return (
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {/* Hexagonal grid pattern */}
        {Array.from({ length: 25 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => {
            const x = col * hexWidth + (row % 2 ? hexWidth / 2 : 0);
            const y = row * (hexHeight * 0.75);
            const points = `${x},${y + 10} ${x + 10},${y} ${x + 25},${y} ${x + 35},${y + 10} ${x + 25},${y + 20} ${x + 10},${y + 20}`;
            return (
              <Polygon
                key={`${row}-${col}`}
                points={points}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="1"
              />
            );
          })
        )}
      </Svg>
    );
  }

  if (pattern === 'isometric') {
    return (
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {/* Isometric grid pattern */}
        {Array.from({ length: 30 }).map((_, i) => (
          <React.Fragment key={i}>
            {/* Diagonal lines going right */}
            <Line
              x1={i * 30}
              y1="0"
              x2={i * 30 + 400}
              y2="400"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
            {/* Diagonal lines going left */}
            <Line
              x1={i * 30}
              y1="0"
              x2={i * 30 - 400}
              y2="400"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
            {/* Horizontal lines */}
            <Line
              x1="0"
              y1={i * 30}
              x2="100%"
              y2={i * 30}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
          </React.Fragment>
        ))}
      </Svg>
    );
  }

  if (pattern === 'music') {
    return (
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {/* Music staff lines */}
        {Array.from({ length: 8 }).map((_, staff) => (
          <G key={staff}>
            {Array.from({ length: 5 }).map((_, line) => (
              <Line
                key={line}
                x1="0"
                y1={staff * 100 + line * 10 + 40}
                x2="100%"
                y2={staff * 100 + line * 10 + 40}
                stroke="rgba(0,0,0,0.12)"
                strokeWidth="1.5"
              />
            ))}
          </G>
        ))}
      </Svg>
    );
  }

  return null;
}
