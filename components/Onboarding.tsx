import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import {
  ChevronRight,
  ScanText,
  FileText,
  CheckSquare,
  Palette,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Archive,
  Search,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Emoji styles defined early to avoid hoisting issues
const emojiStyles = {
  welcome: {
    fontSize: 120,
    textAlign: 'center' as 'center',
  },
  gesture: {
    fontSize: 20,
  },
};

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: [string, string];
  features?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to NotesAI',
    subtitle: 'Your Intelligent Notes Companion',
    description: 'Capture ideas, scan documents, and organize your thoughts with powerful features designed for productivity.',
    icon: <Text style={emojiStyles.welcome}>📝</Text>,
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    title: 'Powerful Features',
    subtitle: 'Everything You Need',
    description: 'Scan documents, extract text with OCR, create checklists, and customize with beautiful backgrounds.',
    icon: <Text style={emojiStyles.welcome}>✨</Text>,
    gradient: ['#f093fb', '#f5576c'],
    features: [
      {
        icon: <ScanText size={24} color={Colors.light.primary} />,
        title: 'Document Scanner',
        description: 'Scan receipts, forms, and documents in high quality',
      },
      {
        icon: <FileText size={24} color={Colors.light.primary} />,
        title: 'Text Extraction (OCR)',
        description: 'Extract text from images automatically',
      },
      {
        icon: <CheckSquare size={24} color={Colors.light.primary} />,
        title: 'Smart Checklists',
        description: 'Create interactive to-do lists within notes',
      },
      {
        icon: <Palette size={24} color={Colors.light.primary} />,
        title: 'Beautiful Backgrounds',
        description: 'Customize notes with colors and patterns',
      },
    ],
  },
  {
    id: 3,
    title: 'Master Gestures',
    subtitle: 'Quick Actions at Your Fingertips',
    description: 'Swipe to archive or delete, long press for more options. Make note management effortless.',
    icon: <Text style={emojiStyles.welcome}>👆</Text>,
    gradient: ['#4facfe', '#00f2fe'],
    features: [
      {
        icon: <ArrowLeft size={24} color="#4ECDC4" />,
        title: 'Swipe Left',
        description: 'Archive notes for later',
      },
      {
        icon: <ArrowRight size={24} color="#FF6B6B" />,
        title: 'Swipe Right',
        description: 'Delete notes quickly',
      },
      {
        icon: <Text style={emojiStyles.gesture}>👆</Text>,
        title: 'Long Press',
        description: 'Open actions menu',
      },
    ],
  },
  {
    id: 4,
    title: 'Smart & Automatic',
    subtitle: 'Focus on Creating',
    description: 'Auto-save as you type, powerful search, and intelligent organization. Your notes, effortlessly managed.',
    icon: <Text style={emojiStyles.welcome}>🤖</Text>,
    gradient: ['#fa709a', '#fee140'],
    features: [
      {
        icon: <Zap size={24} color="#FFD54F" />,
        title: 'Auto-Save',
        description: 'Never lose your work, saves automatically',
      },
      {
        icon: <Search size={24} color="#4A90E2" />,
        title: 'Fuzzy Search',
        description: 'Find anything instantly across all notes',
      },
      {
        icon: <Text style={emojiStyles.gesture}>📁</Text>,
        title: 'Smart Categories',
        description: 'Organize with folders and filters',
      },
    ],
  },
];

interface OnboardingProps {
  visible: boolean;
  onComplete: () => void;
}

export default function Onboarding({ visible, onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  // Fade in animation when component mounts
  useState(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  });

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: width * nextSlide,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newSlide = Math.round(offsetX / width);
    if (newSlide !== currentSlide && newSlide >= 0 && newSlide < slides.length) {
      setCurrentSlide(newSlide);
    }
  };

  const renderSlide = (slideData: OnboardingSlide, index: number) => (
    <View key={slideData.id} style={styles.slide}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.slideScrollContent}
      >
        <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
          {/* Icon/Illustration */}
          <View style={styles.iconContainer}>
            {slideData.icon}
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>{slideData.title}</Text>
          <Text style={styles.subtitle}>{slideData.subtitle}</Text>
          <Text style={styles.description}>{slideData.description}</Text>

          {/* Features */}
          {slideData.features && (
            <View style={styles.featuresContainer}>
              {slideData.features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    {feature.icon}
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient
          colors={slide.gradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Skip Button */}
        {!isLastSlide && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {slides.map((slideData, index) => renderSlide(slideData, index))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentSlide === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Next/Get Started Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
            {!isLastSlide && (
              <ChevronRight size={20} color={Colors.light.surface} style={styles.nextIcon} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: Spacing.xl,
    zIndex: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.semibold,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height: height - 200, // Leave space for footer
  },
  slideScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  slideContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.huge,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.surface,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
    textAlign: 'center',
    marginBottom: Spacing.base,
    opacity: 0.95,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.surface,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.5,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    opacity: 0.9,
  },
  featuresContainer: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.surface,
    opacity: 0.9,
    lineHeight: Typography.fontSize.sm * 1.4,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.light.surface,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: Colors.light.surface,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.round,
    minWidth: 200,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.surface,
  },
  nextIcon: {
    marginLeft: Spacing.xs,
  },
});
