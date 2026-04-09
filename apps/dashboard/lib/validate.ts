const ALLOWED_MEMBER_SORT_COLUMNS = new Set([
  'created_at',
  'name',
  'email',
  'points_balance',
  'points_lifetime',
  'visits_total',
  'tier',
  'status',
  'last_visit_at',
]);

/**
 * Returns the column name if it is in the allowed set, or the fallback.
 * Prevents column injection via untrusted sortBy query parameters.
 */
export function sanitizeSortBy(
  value: string | null | undefined,
  allowed: Set<string>,
  fallback: string,
): string {
  if (!value) return fallback;
  return allowed.has(value) ? value : fallback;
}

export { ALLOWED_MEMBER_SORT_COLUMNS };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
