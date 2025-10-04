import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

interface NativeSplashScreenProps {
  onAnimationFinish?: () => void;
}

export default function NativeSplashScreen({ onAnimationFinish }: NativeSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Auto-play animation on mount
    animationRef.current?.play();
  }, []);

  const handleAnimationFinish = () => {
    // Fade out the splash screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onAnimationFinish?.();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LottieView
        ref={animationRef}
        source={require('../notesai_splash.json')}
        autoPlay={false}
        loop={false}
        style={styles.animation}
        onAnimationFinish={handleAnimationFinish}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 400,
    height: 400,
  },
});
