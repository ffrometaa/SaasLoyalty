'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const t = useTranslations('install');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isMobileIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;

      if (isStandalone || isMobileIOS) {
        setIsInstalled(true);
        return;
      }

      // Check localStorage to see if user dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return; // Don't show for 7 days
        }
      }

      setShowPrompt(true);
    };

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      checkInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check on mount
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-[60] animate-slide-up">
      <div className="rounded-xl shadow-2xl p-4 max-w-md mx-auto" style={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.25)' }}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
            <Smartphone className="h-6 w-6" style={{ color: '#a78bfa' }} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">{t('title')}</h3>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('description')}
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-opacity"
                style={{ background: 'linear-gradient(135deg, #e11d48, #7c3aed)' }}
              >
                <Download className="h-4 w-4" />
                {t('install')}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {t('notNow')}
              </button>
            </div>
          </div>

          <button onClick={handleDismiss} className="p-1 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
