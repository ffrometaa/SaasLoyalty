'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

interface CrispChatProps {
  plan: string;
}

const PRIORITY_CHAT_PLANS = ['pro', 'scale', 'enterprise'];

export function CrispChat({ plan }: CrispChatProps) {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!PRIORITY_CHAT_PLANS.includes(plan) || !websiteId) return;
    if (typeof window === 'undefined') return;

    // Avoid re-injecting if already loaded
    if (document.getElementById('crisp-chat-script')) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.id = 'crisp-chat-script';
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);
  }, [plan, websiteId]);

  return null;
}
