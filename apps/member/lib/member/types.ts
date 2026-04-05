// Local types matching the actual SQL schema columns
// (different from @loyalty-os/db which has inconsistencies)

export type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type TransactionType =
  | 'earn'
  | 'redeem'
  | 'expire'
  | 'bonus'
  | 'referral'
  | 'birthday'
  | 'adjustment'
  | 'refund';

export interface TenantBrand {
  id: string;
  business_name: string;
  brand_app_name: string | null;
  brand_logo_url: string | null;
  brand_color_primary: string;
  brand_color_secondary: string;
  slug: string;
  points_expiry_days: number;
}

export interface MemberProfile {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  tier: MemberTier;
  points_balance: number;
  points_lifetime: number;
  member_code: string;
  avatar_url: string | null;
  tenant: TenantBrand;
}

export interface RewardItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  points_cost: number;
  monetary_value: number | null;
  is_active: boolean;
  valid_days: number;
  min_tier: MemberTier;
  max_per_member: number;
  sort_order: number;
}

export interface TransactionItem {
  id: string;
  type: TransactionType;
  points: number;
  points_balance: number;
  description: string;
  created_at: string;
}

export interface RedemptionResult {
  id: string;
  code: string;
  qr_data: string;
  points_spent: number;
  expires_at: string;
  reward_name: string;
}

export const TIER_THRESHOLDS: Record<MemberTier, number> = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
};

export const TIER_NEXT: Record<MemberTier, MemberTier | null> = {
  bronze: 'silver',
  silver: 'gold',
  gold: 'platinum',
  platinum: null,
};

export function getTierProgress(lifetimePoints: number, currentTier: MemberTier) {
  const next = TIER_NEXT[currentTier];
  if (!next) return { percent: 100, pointsToNext: 0, nextTier: null };

  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[next];
  const range = nextThreshold - currentThreshold;
  const progress = lifetimePoints - currentThreshold;
  const percent = Math.min(Math.round((progress / range) * 100), 100);
  const pointsToNext = Math.max(nextThreshold - lifetimePoints, 0);

  return { percent, pointsToNext, nextTier: next };
}
