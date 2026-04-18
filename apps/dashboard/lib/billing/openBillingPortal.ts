export async function openBillingPortal(): Promise<{ url: string } | { error: string }> {
  try {
    const res = await fetch('/api/billing/portal');
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? 'portal_error' };
    return { url: data.url };
  } catch {
    return { error: 'network_error' };
  }
}
