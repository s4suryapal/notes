import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Crown, ArrowLeft } from 'lucide-react-native';

export default function PremiumScreen() {
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Premium</Text>
      </View>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Crown size={32} color={C.secondary} />
          <Text style={[styles.title, { color: C.text }]}>Unlock more with Premium</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Coming soon</Text>
          <TouchableOpacity style={[styles.cta, { backgroundColor: C.primary }]} activeOpacity={0.8}>
            <Text style={[styles.ctaText, { color: C.surface }]}>Notify Me</Text>
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
