'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalType) => void>;
  }
}

interface OneSignalType {
  init(options: {
    appId: string;
    notifyButton?: { enable: boolean };
    allowLocalhostAsSecureOrigin?: boolean;
  }): Promise<void>;
  login(externalId: string): Promise<void>;
}

interface OneSignalInitProps {
  memberId: string;
}

export function OneSignalInit({ memberId }: OneSignalInitProps) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (!appId || !memberId) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: OneSignalType) => {
      await OneSignal.init({
        appId,
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      });
      await OneSignal.login(memberId);
    });
  }, [appId, memberId]);

  if (!appId) return null;

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
