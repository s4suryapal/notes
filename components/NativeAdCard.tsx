import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
  NativeMediaAspectRatio,
  NativeAdChoicesPlacement,
} from 'react-native-google-mobile-ads';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  unitId?: string;
  location?: string;
  style?: any;
  onLoad?: () => void;
  onError?: () => void;
};

/**
 * Validate AdMob unit id (must be numeric ca-app-pub-.../...)
 */
function isValidAdUnitId(id?: string | null): boolean {
  if (!id) return false;
  const s = String(id).trim();
  return /^ca-app-pub-\d+\/\d+$/.test(s);
}

/**
 * Shimmer loading component for native ad
 */
function NativeAdShimmer({ colors }: { colors: any }) {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.shimmerContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={[
              'transparent',
              colors.primary ? `${colors.primary}20` : '#ffffff60',
              'transparent'
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
        <View style={styles.shimmerTextContainer}>
          <Text style={[styles.shimmerText, { color: colors.textSecondary }]}>
            Loading Ad...
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Error display component for native ad (dev mode only)
 */
function NativeAdError({ colors, location }: { colors: any; location: string }) {
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.errorContainer, { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Native Ad Load Failed</Text>
        <Text style={styles.errorMessage}>Location: {location}</Text>
        <Text style={styles.errorHint}>Check ad unit ID in Remote Config</Text>
      </View>
    </View>
  );
}

/**
 * NativeAdCard - Optimized Layout (Reference: AllMail implementation)
 *
 * Layout Structure:
 * 1. Media Banner (160px) - Large top banner (64% of total height)
 * 2. Icon + Ad Badge + Headline + Body (horizontal layout)
 * 3. CTA Button (prominent)
 *
 * Total: ~280dp
 */
export default function NativeAdCard({ unitId, location = 'language-selection', style, onLoad, onError }: Props) {
  const { colors } = useTheme();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Validate ad unit id
  const validUnitId = useMemo(() => (unitId && isValidAdUnitId(unitId) ? unitId : null), [unitId]);

  useEffect(() => {
    let cancelled = false;
    let current: NativeAd | null = null;

    async function load() {
      if (!validUnitId) {
        if (__DEV__) console.warn(`[NativeAdCard] Invalid or missing ad unit ID for ${location}`);
        setLoading(false);
        setError(true);
        onError?.();
        return;
      }
      try {
        setLoading(true);
        if (__DEV__) console.log(`[NativeAdCard] 🔄 Loading native ad for ${location}...`);
        const ad = await NativeAd.createForAdRequest(validUnitId, {
          startVideoMuted: true,
          aspectRatio: NativeMediaAspectRatio.LANDSCAPE,
          adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
        });
        if (cancelled) {
          try { ad.destroy(); } catch {}
          if (__DEV__) console.log(`[NativeAdCard] ⏹️ Ad load cancelled for ${location}`);
          return;
        }
        current = ad;
        setNativeAd(ad);
        setLoading(false);
        setError(false);
        onLoad?.();
        if (__DEV__) console.log(`[NativeAdCard] ✅ Ad loaded successfully for ${location}`);
      } catch (e) {
        if (__DEV__) console.log(`[NativeAdCard] ❌ Load error for ${location}:`, (e as any)?.toString?.());
        setLoading(false);
        setError(true);
        onError?.();
      }
    }

    load();
    return () => {
      cancelled = true;
      try { current?.destroy(); } catch {}
      if (__DEV__) console.log(`[NativeAdCard] 🧹 Cleanup for ${location}`);
    };
  }, [validUnitId, location, onLoad, onError]);

  // Show shimmer while loading
  if (loading) {
    return <NativeAdShimmer colors={colors} />;
  }

  // Show error in dev mode, hide in production
  if (error) {
    if (__DEV__) {
      return <NativeAdError colors={colors} location={location} />;
    }
    return null;
  }

  // No ad loaded
  if (!nativeAd) {
    return null;
  }

  const primary = colors.primary;
  const titleColor = colors.text;
  const bodyColor = colors.textSecondary;

  return (
    <View style={[styles.container, style, { backgroundColor: colors.surface }]}>
      <NativeAdView nativeAd={nativeAd} style={styles.nativeRoot}>
        {/* Top: Media Banner (160px) - Full width container */}
        <View style={styles.mediaBannerContainer}>
          <NativeMediaView
            resizeMode="cover"
            style={[styles.mediaBanner, { backgroundColor: colors.surfaceElevated }]}
          />
        </View>

        <View style={styles.contentContainer}>
          {/* Middle Section: Icon + Text Content (horizontal) */}
          <View style={styles.topSection}>
            {/* App Icon (50x50) */}
            {nativeAd.icon?.url && (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: nativeAd.icon.url }} style={styles.appIcon} />
              </NativeAsset>
            )}

            {/* Text Content (right side) */}
            <View style={styles.textColumn}>
              {/* Row 1: Ad Badge + Headline */}
              <View style={styles.headlineRow}>
                <View style={[styles.adBadge, { backgroundColor: primary }]}>
                  <Text style={styles.adBadgeText}>Ad</Text>
                </View>
                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                  <Text numberOfLines={1} style={[styles.headline, { color: titleColor }]}>
                    {nativeAd.headline}
                  </Text>
                </NativeAsset>
              </View>

              {/* Row 2: Body Text (2 lines) */}
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text numberOfLines={2} style={[styles.bodyText, { color: bodyColor }]}>
                  {nativeAd.body}
                </Text>
              </NativeAsset>
            </View>
          </View>

          {/* Bottom: CTA Button */}
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <Text style={[styles.ctaButton, { backgroundColor: primary }]}>
              {nativeAd.callToAction || 'INSTALL'}
            </Text>
          </NativeAsset>
        </View>
      </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    width: '100%',
    height: 280,
    overflow: 'visible',
  },
  nativeRoot: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 24,
  },
  // Media Banner Container (full width wrapper - larger like reference image)
  mediaBannerContainer: {
    width: '100%',
    height: 160,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Media Banner (fills container)
  mediaBanner: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  // Middle Section: Icon + Text (horizontal layout)
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  appIcon: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#CCC',
  },
  // Text Column (right of icon)
  textColumn: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  // Headline Row: Ad Badge + Headline
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  adBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 5,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  // Bottom: CTA Button
  ctaButton: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    alignSelf: 'stretch',
  },
  // Shimmer loading styles
  shimmerContainer: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 350,
    height: '100%',
    opacity: 0.8,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  shimmerTextContainer: {
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  shimmerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
  // Error display styles
  errorContainer: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    borderWidth: 2,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
