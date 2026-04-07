'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const CONSENT_WHITELIST = ['/consent-update', '/legal/', '/api/'];

interface ConsentGuardProps {
  pendingCount: number;
}

export function ConsentGuard({ pendingCount }: ConsentGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pendingCount <= 0) return;
    const isWhitelisted = CONSENT_WHITELIST.some((path) => pathname.startsWith(path));
    if (!isWhitelisted) {
      router.replace('/consent-update');
    }
  }, [pendingCount, pathname, router]);

  return null;
}
