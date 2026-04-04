// ─── TYPES ────────────────────────────────────────────────
export type Plan = 'starter' | 'pro' | 'scale' | 'enterprise';

export type Feature =
  | 'members_up_to_500'
  | 'members_up_to_2000'
  | 'members_unlimited'
  | 'campaigns_per_month_2'
  | 'campaigns_per_month_10'
  | 'campaigns_unlimited'
  | 'analytics_basic'
  | 'analytics_full'
  | 'analytics_heatmap'
  | 'analytics_export'
  | 'whitelabel_logo'
  | 'whitelabel_custom_domain'
  | 'whitelabel_full_brand'
  | 'booking_integrations'
  | 'support_email'
  | 'support_priority_chat'
  | 'support_account_manager'
  | 'api_access'
  | 'sso'
  | 'custom_integrations'
  | 'multi_location'
  | 'gamification'
  | 'gamification_advanced'
  | 'advanced_campaigns'
  | 'support_sla';

export interface PlanConfig {
  id: Plan;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxMembers: number | null;           // null = unlimited
  maxCampaignsPerMonth: number | null; // null = unlimited
  features: Feature[];
}

// ─── PLAN DEFINITIONS ─────────────────────────────────────
export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0,  // custom pricing
    annualPrice: 0,
    maxMembers: null,
    maxCampaignsPerMonth: null,
    features: [
      'members_unlimited',
      'campaigns_unlimited',
      'analytics_full',
      'analytics_heatmap',
      'analytics_export',
      'whitelabel_logo',
      'whitelabel_custom_domain',
      'whitelabel_full_brand',
      'booking_integrations',
      'support_priority_chat',
      'support_account_manager',
      'api_access',
      'sso',
      'custom_integrations',
      'multi_location',
      'gamification',
      'gamification_advanced',
      'advanced_campaigns',
      'support_sla',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 79,
    annualPrice: 66,
    maxMembers: 500,
    maxCampaignsPerMonth: 2,
    features: [
      'members_up_to_500',
      'campaigns_per_month_2',
      'analytics_basic',
      'whitelabel_logo',
      'support_email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 199,
    annualPrice: 166,
    maxMembers: 2000,
    maxCampaignsPerMonth: 10,
    features: [
      'members_up_to_2000',
      'campaigns_per_month_10',
      'analytics_full',
      'analytics_heatmap',
      'whitelabel_logo',
      'whitelabel_custom_domain',
      'booking_integrations',
      'support_priority_chat',
      'gamification',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 399,
    annualPrice: 332,
    maxMembers: null,
    maxCampaignsPerMonth: null,
    features: [
      'members_unlimited',
      'campaigns_unlimited',
      'analytics_full',
      'analytics_heatmap',
      'analytics_export',
      'whitelabel_logo',
      'whitelabel_custom_domain',
      'whitelabel_full_brand',
      'booking_integrations',
      'support_priority_chat',
      'support_account_manager',
      'api_access',
      'gamification',
    ],
  },
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────

export function planHasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_CONFIGS[plan].features.includes(feature);
}

export function canAddMember(plan: Plan, currentCount: number): boolean {
  const max = PLAN_CONFIGS[plan].maxMembers;
  if (max === null) return true;
  return currentCount < max;
}

export function canCreateCampaign(plan: Plan, campaignsThisMonth: number): boolean {
  const max = PLAN_CONFIGS[plan].maxCampaignsPerMonth;
  if (max === null) return true;
  return campaignsThisMonth < max;
}

export function getUpgradePlan(currentPlan: Plan): Plan | null {
  const upgrades: Record<Plan, Plan | null> = {
    starter: 'pro',
    pro: 'scale',
    scale: 'enterprise',
    enterprise: null,
  };
  return upgrades[currentPlan];
}
