import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

// Android-only AdMob imports
import { BannerAd, BannerAdSize, AdSize } from 'react-native-google-mobile-ads';
import admobService from '@/services/admob';
import analytics from '@/services/analytics';
import BannerAdManager from '@/services/bannerAdManager';

interface BannerAdComponentProps {
  size?: any;
  adType?: 'banner' | 'adaptiveBanner' | 'rectangleBanner' | 'inlineAdaptiveBanner';
  height?: number; // Custom height for adaptive banners
  style?: any;
  location?: string; // Location identifier for ad management (defaults to 'default')
  unitId?: string; // Optional override ad unit id (e.g., from Remote Config)
}

// Performant Shimmer loading component
function ShimmerPlaceholder({
  width = '100%',
  height = 50,
  measuredWidth = 0,
  colors
}: {
  width?: string | number;
  height?: number;
  measuredWidth?: number;
  colors: any;
}) {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    // Start animation immediately and repeat infinitely
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1000 }), // Faster, smoother animation
      -1,
      false // No reverse, continuous motion
    );

    // Cleanup animation when component unmounts
    return () => {
      shimmerValue.value = 0;
    };
  }, [shimmerValue]);

  const shimmerStyle = useAnimatedStyle(() => {
    // Create a wider shimmer effect that moves across the entire width
    // Use measuredWidth if available, otherwise use width value, fallback to 350
    let containerWidth = 350; // Fallback width

    if (measuredWidth > 0) {
      containerWidth = measuredWidth;
    } else if (typeof width === 'number') {
      containerWidth = width;
    }

    const shimmerWidth = containerWidth * 0.8; // Shimmer width is 80% of container

    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-shimmerWidth, containerWidth + shimmerWidth]
    );

    return {
      transform: [{ translateX }],
      width: shimmerWidth,
    };
  });

  const baseColor = colors.surface || '#f0f0f0';
  const highlightColor = colors.primary ? `${colors.primary}15` : '#ffffff60';

  return (
    <View style={[
      styles.shimmerContainer,
      {
        width,
        height,
        backgroundColor: baseColor,
        borderColor: '#e0e0e0'
      }
    ]}>
      {/* Shimmer gradient overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          shimmerStyle,
          {
            height: '100%',
            borderRadius: 4,
          }
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            highlightColor,
            'transparent'
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>

      {/* Loading text */}
      <View style={styles.shimmerTextContainer}>
        <Text style={[styles.shimmerText, { color: colors.textSecondary || '#666' }]}>
          Loading Ad...
        </Text>
      </View>
    </View>
  );
}

function BannerAdComponent({
  size,
  adType = 'banner',
  height, // Height will be determined dynamically
  style,
  location = 'default',
  unitId
}: BannerAdComponentProps) {
  const { colors } = useTheme();
  const [adState, setAdState] = useState<'loading' | 'ready' | 'loaded' | 'error'>('loading');
  const [adError, setAdError] = useState<string | null>(null);
  const bannerRef = useRef<any>(null);
  const initTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false); // Track if this instance has been initialized
  const loadFallbackTimerRef = useRef<NodeJS.Timeout | null>(null); // Fallback if no load/error events
  const prevAdStateRef = useRef<'loading' | 'ready' | 'loaded' | 'error'>(adState);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);

  // Add unique instance ID for debugging duplicate loads
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const mountCount = useRef(0);
  const ownershipClaimedRef = useRef(false);
  const isOwnerRef = useRef(false);
  const markedLoadingRef = useRef(false);
  const [owned, setOwned] = useState<boolean>(false);
  const reclaimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const viewMountedRef = useRef(false);

  const logBanner = useCallback((event: string, data?: any) => {
    try {
      if (data !== undefined) {
        console.log(`📺 [BANNER] ${location}-${adType} [${instanceId.current}] ${event}`, data);
      } else {
        console.log(`📺 [BANNER] ${location}-${adType} [${instanceId.current}] ${event}`);
      }
    } catch {}
  }, [location, adType]);

  // Attempt to claim ownership on mount without setting state during render
  useEffect(() => {
    if (!ownershipClaimedRef.current) {
      ownershipClaimedRef.current = true;
      const ok = BannerAdManager.claimOwnership(location, adType, instanceId.current);
      isOwnerRef.current = ok;
      if (ok) setOwned(true);
    }
  }, [location, adType]);

  // Mount/unmount logging
  useEffect(() => {
    mountCount.current += 1;
    logBanner('mounted', { count: mountCount.current, heightProp: height });
    return () => {
      logBanner('unmounted');
    };
  }, [logBanner, height]);

  // Single effect to handle AdMob initialization and state
  useEffect(() => {
    if (!(owned || isOwnerRef.current)) return; // Only the owner initializes
    if (hasInitialized.current) return; // Already initialized
    if (adState !== 'loading') return; // Only initialize when loading

    logBanner('initializing');
    hasInitialized.current = true;

    initTimerRef.current = setTimeout(() => {
      if (admobService.isAdMobInitialized()) {
        setAdState('ready');
        logBanner('ready');
      } else {
        // Retry once after delay, then give up gracefully
        setTimeout(() => {
          setAdState('ready');
          logBanner('ready (fallback)');
        }, 1000);
      }
    }, 500); // Reduced delay for faster initial render

    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
      }
    };
  }, [adState, owned, logBanner, height]);

  // Start a fallback timer when we transition to 'ready' but no load/error arrives
  useEffect(() => {
    const prev = prevAdStateRef.current;
    prevAdStateRef.current = adState;
    if (!(owned || isOwnerRef.current)) return;

    // Entered 'ready' from a different state: start timer once
    if (adState === 'ready' && prev !== 'ready' && !loadFallbackTimerRef.current) {
      logBanner('fallback timer start', { timeoutMs: 8000 });
      loadFallbackTimerRef.current = setTimeout(() => {
        logBanner('fallback timeout hit → switching to error');
        setAdError('Timeout: Ad not available');
        setAdState('error');
        BannerAdManager.markAdFailed(location, adType);
      }, 8000);
    }

    // Left 'ready' (loaded or error): clear timer if present
    if (adState !== 'ready' && loadFallbackTimerRef.current) {
      logBanner('fallback timer clear');
      clearTimeout(loadFallbackTimerRef.current);
      loadFallbackTimerRef.current = null;
    }

    return () => {
      // On unmount ensure timer is cleared
      if (loadFallbackTimerRef.current) {
        logBanner('fallback timer clear (unmount)');
        clearTimeout(loadFallbackTimerRef.current);
        loadFallbackTimerRef.current = null;
      }
    };
  }, [adState, owned, logBanner, adType, location]);

  // Release ownership and reset key when component unmounts (only if this instance owned it)
  useEffect(() => {
    const idAtMount = instanceId.current;
    return () => {
      const wasOwner = BannerAdManager.isOwner(location, adType, idAtMount);
      BannerAdManager.releaseOwnership(location, adType, idAtMount);
      if (wasOwner) {
        BannerAdManager.resetAd(location, adType);
      }
      if (reclaimTimerRef.current) {
        clearTimeout(reclaimTimerRef.current);
      }
    };
  }, [location, adType]);

  // Get device width for adaptive banners (in density-independent pixels)
  const getDeviceWidth = useCallback(() => {
    if (measuredWidth > 0) return measuredWidth;
    const { width } = Dimensions.get('window');
    return Math.floor(width);
  }, [measuredWidth]);

  // Get the appropriate height based on ad type and provided height
  const getAdHeight = useCallback(() => {
    if (height) return height; // Use provided height if given

    switch (adType) {
      case 'inlineAdaptiveBanner':
        return 250; // Large height for inline adaptive banners
      case 'adaptiveBanner':
        return 50; // Standard height for adaptive banners (like home screen)
      case 'rectangleBanner':
        return 250; // Medium rectangle height
      default:
        return 50; // Standard banner height
    }
  }, [adType, height]);

  // Determine the ad size based on adType with safe fallbacks
  const getAdSize = useCallback(() => {
    if (size) return size; // Use provided size if given

    switch (adType) {
      case 'adaptiveBanner':
        // Use anchored adaptive banner for standard adaptive banners
        return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
      case 'inlineAdaptiveBanner':
        // Use the string constant - native Android code will handle sizing automatically
        // See: ReactNativeGoogleMobileAdsCommon.java:getAdSizeForAdaptiveBanner()
        // The native code will call AdSize.getInlineAdaptiveBannerAdSize(width, maxHeight)
        // where maxHeight comes from the maxHeight prop we set on the view
        console.log('📏 [INLINE ADAPTIVE] Using native INLINE_ADAPTIVE_BANNER with maxHeight:', getAdHeight());
        return 'INLINE_ADAPTIVE_BANNER';
      case 'rectangleBanner':
        return BannerAdSize.MEDIUM_RECTANGLE;
      default:
        return BannerAdSize.BANNER;
    }
  }, [size, adType, getAdHeight]);

  // Adaptive flag only for inline adaptive layout needs
  const isInlineAdaptive = adType === 'inlineAdaptiveBanner';

  // Map ad types to AdMobService types
  const getServiceAdType = useCallback(() => adType, [adType]);

  const adUnitId = unitId || admobService.getAdUnitId(getServiceAdType());
  logBanner('ad unit', { adUnitId, dev: __DEV__ });
  const adSize = getAdSize();
  const bannerKey = useMemo(
    () => `${instanceId.current}-${getServiceAdType()}-${getAdHeight()}-${getDeviceWidth()}`,
    [getServiceAdType, getAdHeight, getDeviceWidth]
  );

  // Memoize container styles to prevent recalculation
  const containerStyle = useMemo(() => {
    const baseStyle = [styles.container];

    if (isInlineAdaptive) {
      baseStyle.push(styles.adaptiveContainer);
    }

    const h = getAdHeight();
    if (h) {
      baseStyle.push({ height: h });
    }

    return baseStyle;
  }, [isInlineAdaptive, getAdHeight]);

  const handleAdLoaded = () => {
    // Add small delay to ensure smooth transition from shimmer to ad
    setTimeout(() => {
      setAdState('loaded');
      setAdError(null);
    }, 200);

    // Mark as loaded in singleton manager
    BannerAdManager.markAdLoaded(location, adType);

    // Track ad loaded event
    logBanner('onAdLoaded');
    analytics.logScreenView(`banner_ad_loaded_${location}`);
  };

  const handleAdFailedToLoad = (error: any) => {
    // Create detailed error message showing both code and message
    const errorMessage = error?.code
      ? `${error.code}: ${error.message || 'Unknown error'}`
      : error?.message || 'Failed to load ad';

    setAdError(errorMessage);
    setAdState('error');
    // Notify singleton manager for retry allowance
    BannerAdManager.markAdFailed(location, adType);

    // Log all errors for debugging
    logBanner('onAdFailedToLoad', {
      code: error?.code,
      message: error?.message,
      adUnitId,
      adType
    });
  };

  const handleAdOpened = () => {
    logBanner('onAdOpened');
    // Track ad opened event
    analytics.logScreenView(`banner_ad_opened_${location}`);
  };

  const handleAdClosed = () => {
    logBanner('onAdClosed');
    // Track ad closed event
    analytics.logScreenView(`banner_ad_closed_${location}`);
  };

  // If this instance is the owner and ad isn't marked as loading/loaded yet, mark loading once
  useEffect(() => {
    if ((owned || isOwnerRef.current) && !markedLoadingRef.current && BannerAdManager.canLoadAd(location, adType)) {
      logBanner('marking ad as loading');
      BannerAdManager.markAdLoading(location, adType);
      markedLoadingRef.current = true;
    }
  }, [location, adType, owned, logBanner]);

  // Retry claiming ownership if previous owner unmounts (e.g., StrictMode double-mount)
  useEffect(() => {
    if (owned) return;
    let attempts = 0;
    const tryClaim = () => {
      attempts += 1;
      const ok = BannerAdManager.claimOwnership(location, adType, instanceId.current);
      if (ok) {
        isOwnerRef.current = true;
        setOwned(true);
        return;
      }
      if (attempts < 10) {
        reclaimTimerRef.current = setTimeout(tryClaim, 100);
      }
    };
    reclaimTimerRef.current = setTimeout(tryClaim, 50);
    return () => {
      if (reclaimTimerRef.current) clearTimeout(reclaimTimerRef.current);
    };
  }, [owned, location, adType, logBanner]);

  // Track physical BannerAd view mount/unmount once per owning instance
  // Must be declared before any early returns to satisfy Rules of Hooks
  useEffect(() => {
    if ((owned || isOwnerRef.current) && !viewMountedRef.current) {
      BannerAdManager.notifyViewMounted(location, adType);
      viewMountedRef.current = true;
    }
    return () => {
      if (viewMountedRef.current) {
        BannerAdManager.notifyViewUnmounted(location, adType);
        viewMountedRef.current = false;
      }
    };
  }, [owned, location, adType]);

  // Guard: Only the owning instance should render/load the ad to prevent duplicates
  if (!(owned || isOwnerRef.current)) {
    console.log(`📺 BannerAdComponent [${instanceId.current}] not owner for ${location}-${adType}, rendering nothing.`);
    return null;
  }

  // Show error message when ad fails
  if (adState === 'error') {
    const adHeight = getAdHeight();
    logBanner('render: error', { adState, adError, adHeight });
    return (
      <View style={[styles.errorContainer, { backgroundColor: '#f5f5f5', height: adHeight }, style]}>
        <Text style={[styles.errorTitle, { color: '#666' }]}>
          Ad Unavailable
        </Text>
        <Text style={[styles.errorSubtext, { color: '#999' }]}>
          Content will load shortly
        </Text>
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <View
        style={[styles.adContainer, isInlineAdaptive && getAdHeight() ? { height: getAdHeight() } : {}]}
        onLayout={(e) => {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w && w !== measuredWidth) {
            setMeasuredWidth(w);
            logBanner('measured width', { width: w });
          }
        }}
      >
        {logBanner('render: banner', { adState, adUnitId })}
        <BannerAd
          key={bannerKey}
          ref={bannerRef}
          unitId={adUnitId}
          size={adSize}
          maxHeight={isInlineAdaptive ? getAdHeight() : undefined}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
            keywords: ['notes', 'productivity', 'organization'],
          }}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailedToLoad}
          onAdOpened={handleAdOpened}
          onAdClosed={handleAdClosed}
          onPaid={(value) => {
            // Track ad revenue (optional)
            logBanner('onPaid', { value: value.value, currency: value.currencyCode });
            analytics.logScreenView(`banner_ad_paid_${location}`);
          }}
          onAdClicked={() => {
            // Track ad clicks
            logBanner('onAdClicked');
            analytics.logScreenView(`banner_ad_clicked_${location}`);
          }}
          onAdImpression={() => {
            // Track ad impressions
            logBanner('onAdImpression');
            analytics.logScreenView(`banner_ad_impression_${location}`);
          }}
          style={[
            adState === 'loaded' ? styles.visibleAd : styles.loadingAd,
            styles.bannerAdBase
          ]}
        />

        {/* Show shimmer effect until ad loads ('loading' or 'ready') */}
        {(adState === 'loading' || adState === 'ready') && (
          <Animated.View
            style={[
              styles.loadingOverlayContainer,
              { opacity: adState === 'loaded' ? 0 : 1 }
            ]}
          >
            <ShimmerPlaceholder
              width="100%"
              height={getAdHeight()}
              measuredWidth={measuredWidth}
              colors={colors}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

export default React.memo(BannerAdComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  adaptiveContainer: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    flex: 1,
  },
  placeholder: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 6,
    minHeight: 50,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  errorSubtext: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  adContainer: {
    position: 'relative',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  bannerAdBase: {
    width: '100%',
    alignSelf: 'stretch',
  },
  visibleAd: {
    opacity: 1,
  },
  loadingAd: {
    opacity: 0.1,
  },
  loadingOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1, // Ensure it stays within its container
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
});
