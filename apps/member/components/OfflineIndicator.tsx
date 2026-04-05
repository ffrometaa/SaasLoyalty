'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineIndicator() {
  const [, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setShowBanner(false);
      // Force a page reload to sync data
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-amber-500 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            <span className="text-sm font-medium">
              You&apos;re offline. Some features may be limited.
            </span>
          </div>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
