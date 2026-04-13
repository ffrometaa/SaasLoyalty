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

/**
 * Strips characters that have special meaning in PostgREST filter syntax.
 * Prevents injection via search parameters used inside .or() filter strings.
 */
export function sanitizeSearch(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().replace(/[,()]/g, '');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

// Redemption codes: UUID format (QR) or uppercase alphanumeric 4-32 chars (short code)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_CODE_RE = /^[A-Z0-9]{4,32}$/;

export function isValidRedemptionCode(value: string): boolean {
  const v = value.trim().toUpperCase();
  return UUID_RE.test(value.trim()) || SHORT_CODE_RE.test(v);
}

export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value.trim());
}
