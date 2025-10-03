import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Crown } from 'lucide-react-native';

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
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

