import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

interface UseAudioRecorderProps {
  onAudioRecordingsChange: (recordings: string[]) => void;
  onAudioAdded?: () => void;
}

export function useAudioRecorder({ onAudioRecordingsChange, onAudioAdded }: UseAudioRecorderProps) {
  const [audioRecordings, setAudioRecordings] = useState<string[]>([]);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const newRecordings = [...audioRecordings, uri];
        setAudioRecordings(newRecordings);
        onAudioRecordingsChange(newRecordings);
        onAudioAdded?.();
      }

      setRecording(null);
      setShowAudioRecorder(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  }, [recording, audioRecordings, onAudioRecordingsChange, onAudioAdded]);

  const cancelRecording = useCallback(async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
    setShowAudioRecorder(false);
  }, [recording]);

  const handleDeleteAudio = useCallback((index: number) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newRecordings = audioRecordings.filter((_, i) => i !== index);
            setAudioRecordings(newRecordings);
            onAudioRecordingsChange(newRecordings);
          },
        },
      ]
    );
  }, [audioRecordings, onAudioRecordingsChange]);

  const openRecorder = useCallback(() => {
    setShowAudioRecorder(true);
  }, []);

  return {
    audioRecordings,
    setAudioRecordings,
    showAudioRecorder,
    recording,
    startRecording,
    stopRecording,
    cancelRecording,
    handleDeleteAudio,
    openRecorder,
  };
}
