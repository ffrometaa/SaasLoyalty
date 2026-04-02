// Database types for LoyaltyOS
// Generated from Supabase schema

export type BusinessType = 'spa' | 'restaurant' | 'gym' | 'retail' | 'hotel' | 'salon';
export type PlanType = 'starter' | 'pro' | 'scale';
export type PlanStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type MemberStatus = 'active' | 'inactive' | 'blocked';
export type TransactionType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'referral' | 'birthday' | 'adjustment' | 'refund';
export type RedemptionStatus = 'pending' | 'used' | 'expired';
export type CampaignType = 'reactivation' | 'birthday' | 'custom' | 'launch';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
export type NotificationChannel = 'email' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'failed';

export interface Tenant {
  id: string;
  auth_user_id: string | null;
  business_name: string;
  business_type: BusinessType;
  slug: string;
  plan: PlanType;
  plan_status: PlanStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  brand_color_primary: string;
  brand_color_secondary: string;
  brand_logo_url: string | null;
  brand_app_name: string | null;
  points_per_dollar: number;
  points_expiration_days: number;
  max_members: number;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Member {
  id: string;
  tenant_id: string;
  auth_user_id: string | null;
  member_code: string;
  email: string;
  name: string;
  phone: string | null;
  tier: MemberTier;
  points_balance: number;
  points_lifetime: number;
  visits_total: number;
  last_visit_at: string | null;
  status: MemberStatus;
  accepts_email: boolean;
  accepts_push: boolean;
  referrer_member_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  member_id: string;
  type: TransactionType;
  points: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  points_required: number;
  max_redemptions: number | null;
  redemption_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Redemption {
  id: string;
  tenant_id: string;
  member_id: string;
  reward_id: string;
  points_spent: number;
  status: RedemptionStatus;
  qr_code: string;
  alphanumeric_code: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  target_segment: string | null;
  bonus_points: number;
  bonus_multiplier: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  stats: CampaignStats;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface Visit {
  id: string;
  tenant_id: string;
  member_id: string;
  transaction_id: string | null;
  amount: number | null;
  points_earned: number | null;
  day_of_week: number | null;
  hour_of_day: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  tenant_id: string | null;
  member_id: string | null;
  campaign_id: string | null;
  channel: NotificationChannel;
  type: string;
  subject: string | null;
  content: string | null;
  status: NotificationStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ReactivationSequence {
  id: string;
  tenant_id: string;
  member_id: string;
  started_at: string;
  current_step: number;
  current_step_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
}

export interface DashboardAlert {
  id: string;
  tenant_id: string;
  type: string;
  title: string;
  message: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

// Database types with relations
export interface MemberWithTenant extends Member {
  tenants?: Tenant;
}

export interface TransactionWithMember extends Transaction {
  members?: Member;
}

export interface RedemptionWithDetails extends Redemption {
  members?: Member;
  rewards?: Reward;
}

// Analytics types
export interface MemberSegment {
  frequent: number;
  regular: number;
  occasional: number;
  at_risk: number;
  inactive: number;
}

export interface DashboardMetrics {
  active_members: number;
  visits_this_month: number;
  points_redeemed_this_month: number;
  retention_rate: number;
}

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
} as const;

export function getTierFromPoints(lifetimePoints: number): MemberTier {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

export function getPointsForNextTier(lifetimePoints: number): number | null {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return null;
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return TIER_THRESHOLDS.platinum - lifetimePoints;
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return TIER_THRESHOLDS.gold - lifetimePoints;
  return TIER_THRESHOLDS.silver - lifetimePoints;
}
