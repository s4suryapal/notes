import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Crown, ArrowLeft } from 'lucide-react-native';

export default function PremiumScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Crown size={32} color="#FFD54F" />
          <Text style={styles.title}>Unlock more with Premium</Text>
          <Text style={styles.subtitle}>Coming soon</Text>
          <TouchableOpacity style={styles.cta} activeOpacity={0.8}>
            <Text style={styles.ctaText}>Notify Me</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: {
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xxl,
    ...Shadows.lg,
  },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.light.text },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.light.textSecondary, marginBottom: Spacing.md },
  cta: { backgroundColor: Colors.light.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  ctaText: { color: Colors.light.surface, fontWeight: Typography.fontWeight.semibold },
});

