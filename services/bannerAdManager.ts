// Singleton service to prevent duplicate banner ad loading across component re-renders
class BannerAdManager {
  private static instance: BannerAdManager;
  private loadingAds: Set<string> = new Set();
  private loadedAds: Set<string> = new Set();
  private owners: Map<string, string> = new Map(); // key -> instanceId
  private viewMounts: Map<string, number> = new Map(); // key -> active BannerAd views

  public static getInstance(): BannerAdManager {
    if (!BannerAdManager.instance) {
      BannerAdManager.instance = new BannerAdManager();
    }
    return BannerAdManager.instance;
  }

  // Generate unique key for banner ad based on location and type
  private getAdKey(location: string, adType: string): string {
    return `${location}-${adType}`;
  }

  // Check if this ad is already loading or loaded
  public canLoadAd(location: string, adType: string): boolean {
    const key = this.getAdKey(location, adType);
    const canLoad = !this.loadingAds.has(key) && !this.loadedAds.has(key);

    console.log(`📺 [AD_MANAGER] Can load ${key}?`, { canLoad, loading: this.loadingAds.has(key), loaded: this.loadedAds.has(key) });

    return canLoad;
  }

  // Ownership handling ensures only one component instance renders/loads an ad per screen
  public claimOwnership(location: string, adType: string, instanceId: string): boolean {
    const key = this.getAdKey(location, adType);
    const currentOwner = this.owners.get(key);
    if (!currentOwner) {
      this.owners.set(key, instanceId);
      console.log(`📺 [AD_MANAGER] ${key} ownership claimed by ${instanceId}`);
      return true;
    }
    const isSame = currentOwner === instanceId;
    console.log(`📺 [AD_MANAGER] ${key} ownership check`, { instanceId, currentOwner, isOwner: isSame });
    return isSame;
  }

  public releaseOwnership(location: string, adType: string, instanceId: string): void {
    const key = this.getAdKey(location, adType);
    const currentOwner = this.owners.get(key);
    if (currentOwner === instanceId) {
      this.owners.delete(key);
      console.log(`📺 [AD_MANAGER] ${key} ownership released by ${instanceId}`);
    } else if (currentOwner) {
      console.log(`📺 [AD_MANAGER] ${key} ownership NOT released by ${instanceId} (currentOwner=${currentOwner})`);
    }
  }

  public isOwner(location: string, adType: string, instanceId: string): boolean {
    const key = this.getAdKey(location, adType);
    return this.owners.get(key) === instanceId;
  }

  // Mark ad as loading
  public markAdLoading(location: string, adType: string): void {
    const key = this.getAdKey(location, adType);
    this.loadingAds.add(key);
    console.log(`📺 [AD_MANAGER] Marked ${key} as loading`);
  }

  // Mark ad as loaded successfully
  public markAdLoaded(location: string, adType: string): void {
    const key = this.getAdKey(location, adType);
    this.loadingAds.delete(key);
    this.loadedAds.add(key);
    console.log(`📺 [AD_MANAGER] Marked ${key} as loaded`);
  }

  // Mark ad as failed to load
  public markAdFailed(location: string, adType: string): void {
    const key = this.getAdKey(location, adType);
    this.loadingAds.delete(key);
    // Don't add to loadedAds - allow retry later
    console.log(`📺 [AD_MANAGER] Marked ${key} as failed`);
  }

  // Reset ads for a specific location (useful for navigation)
  public resetLocation(location: string): void {
    const keysToRemove: string[] = [];

    this.loadingAds.forEach(key => {
      if (key.startsWith(location)) keysToRemove.push(key);
    });

    this.loadedAds.forEach(key => {
      if (key.startsWith(location)) keysToRemove.push(key);
    });

    // Also clear ownerships for this location
    this.owners.forEach((_, key) => {
      if (key.startsWith(location)) keysToRemove.push(key);
    });

    keysToRemove.forEach(key => {
      this.loadingAds.delete(key);
      this.loadedAds.delete(key);
      this.owners.delete(key);
    });

    if (keysToRemove.length > 0) {
      console.log(`📺 [AD_MANAGER] Reset ${keysToRemove.length} ads for location: ${location}`);
    }
  }

  // Reset a specific ad (location + type)
  public resetAd(location: string, adType: string): void {
    const key = this.getAdKey(location, adType);
    const hadLoading = this.loadingAds.delete(key);
    const hadLoaded = this.loadedAds.delete(key);
    const hadOwner = this.owners.delete(key);
    if (hadLoading || hadLoaded || hadOwner) {
      console.log(`📺 [AD_MANAGER] Reset ad: ${key} (loading=${hadLoading} loaded=${hadLoaded} owner=${hadOwner})`);
    }
  }

  // Get current state for debugging
  public getState() {
    return {
      loading: Array.from(this.loadingAds),
      loaded: Array.from(this.loadedAds),
      owners: Array.from(this.owners.entries()),
      views: Array.from(this.viewMounts.entries())
    };
  }

  // Track actual rendered BannerAd view mounts (defensive monitoring)
  public notifyViewMounted(location: string, adType: string): void {
    const key = this.getAdKey(location, adType);
    const count = (this.viewMounts.get(key) || 0) + 1;
    this.viewMounts.set(key, count);
    if (count > 1) {
      console.log(`📺 [AD_MANAGER] WARNING: Multiple BannerAd views mounted for ${key} (count=${count})`);
    } else {
      console.log(`📺 [AD_MANAGER] View mounted for ${key}`);
    }
  }

  public notifyViewUnmounted(location: string, adType: string): void {
    const key = this.getAdKey(location, adType);
    const current = this.viewMounts.get(key) || 0;
    const next = Math.max(0, current - 1);
    this.viewMounts.set(key, next);
    console.log(`📺 [AD_MANAGER] View unmounted for ${key} (remaining=${next})`);
  }
}

export default BannerAdManager.getInstance();
