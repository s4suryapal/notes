import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause, Trash2 } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/lib/ToastContext';

interface AudioPlayerProps {
  uri: string;
  onDelete: () => void;
  index: number;
}

export default function AudioPlayer({ uri, onDelete, index }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const { showInfo } = useToast();
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];

  useEffect(() => {
    loadSound();
    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
      setAppState(next);
    });
    return () => {
      sub.remove();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [uri]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    const isForeground = appStateRef.current === 'active';
    if (!isForeground) {
      showInfo('Bring app to foreground to play audio');
      return;
    }
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (e) {
      console.log('Audio play/pause error:', e);
      showInfo('Audio not available right now');
    }
  };

  // Auto-pause when app goes to background
  useEffect(() => {
    const isForeground = appState === 'active';
    if (!isForeground && sound && isPlaying) {
      sound.pauseAsync().catch(() => {});
    }
  }, [appState, isPlaying, sound]);

  const formatTime = (millis: number) => {
    const seconds = millis / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderColor: C.borderLight }]}>
      <TouchableOpacity style={[styles.playButton, { backgroundColor: C.borderLight }]} onPress={handlePlayPause}>
        {isPlaying ? (
          <Pause size={20} color={C.primary} />
        ) : (
          <Play size={20} color={C.primary} />
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={[styles.label, { color: C.text }]}>Recording {index + 1}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: C.borderLight }]}>
            <View
              style={[
                styles.progress,
                { width: duration > 0 ? `${(position / duration) * 100}%` : '0%', backgroundColor: C.primary },
              ]}
            />
          </View>
          <Text style={[styles.time, { color: C.textSecondary }]}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Trash2 size={18} color={C.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textSecondary,
    minWidth: 80,
  },
  deleteButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
