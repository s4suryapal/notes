import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { X, Mic } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

interface AudioRecorderModalProps {
  visible: boolean;
  recording: Audio.Recording | null;
  onClose: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function AudioRecorderModal({
  visible,
  recording,
  onClose,
  onStartRecording,
  onStopRecording,
}: AudioRecorderModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{recording ? 'Recording...' : 'Record Audio'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {recording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording in progress...</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.recordButton, recording && styles.recordButtonActive]}
              onPress={recording ? onStopRecording : onStartRecording}
            >
              <Mic size={32} color={Colors.light.surface} />
            </TouchableOpacity>

            <Text style={styles.hint}>
              {recording ? 'Tap to stop recording' : 'Tap to start recording'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  content: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.error,
  },
  recordingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.error,
    fontWeight: Typography.fontWeight.medium,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  recordButtonActive: {
    backgroundColor: Colors.light.error,
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
  },
});
