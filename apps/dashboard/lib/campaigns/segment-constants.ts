// ─── PURE CONSTANTS — safe to import in both client and server ────────────────
// Do NOT add any server-side imports here.

export const SEGMENTS = [
  { id: 'all', labelKey: 'segmentAll', descKey: 'segmentAllDesc' },
  { id: 'active', labelKey: 'segmentActive', descKey: 'segmentActiveDesc' },
  { id: 'at_risk', labelKey: 'segmentAtRisk', descKey: 'segmentAtRiskDesc' },
  { id: 'inactive', labelKey: 'segmentInactive', descKey: 'segmentInactiveDesc' },
  { id: 'tier_bronze', labelKey: 'segmentTierBronze', descKey: 'segmentTierBronzeDesc' },
  { id: 'tier_silver', labelKey: 'segmentTierSilver', descKey: 'segmentTierSilverDesc' },
  { id: 'tier_gold', labelKey: 'segmentTierGold', descKey: 'segmentTierGoldDesc' },
  { id: 'tier_platinum', labelKey: 'segmentTierPlatinum', descKey: 'segmentTierPlatinumDesc' },
  { id: 'birthday_month', labelKey: 'segmentBirthdayMonth', descKey: 'segmentBirthdayMonthDesc' },
] as const;

export type SegmentId = (typeof SEGMENTS)[number]['id'];

export function isValidSegment(id: string): id is SegmentId {
  return SEGMENTS.some((s) => s.id === id);
}
