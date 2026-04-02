// Email templates for LoyaltyOS
// Using React Email format

export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to {tenant_name}!',
    description: 'Sent when a new member joins',
  },
  points_earned: {
    subject: 'You earned {points} points!',
    description: 'Sent when member earns points from a purchase',
  },
  points_redeemed: {
    subject: 'Reward redeemed: {reward_name}',
    description: 'Sent when member redeems a reward',
  },
  tier_upgrade: {
    subject: 'Congratulations! You reached {new_tier} status!',
    description: 'Sent when member upgrades to a new tier',
  },
  miss_you: {
    subject: 'We miss you at {tenant_name}',
    description: 'Reactivation: Day 25',
  },
  bonus_offer: {
    subject: 'Special offer just for you!',
    description: 'Reactivation: Day 26',
  },
  urgency: {
    subject: 'Your offer expires tomorrow!',
    description: 'Reactivation: Day 28',
  },
  final_chance: {
    subject: 'Last chance - don\'t miss out!',
    description: 'Reactivation: Day 35',
  },
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;

// Default email styling
export const EMAIL_STYLES = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  primaryColor: '#6366f1',
  secondaryColor: '#818cf8',
  backgroundColor: '#f9fafb',
  textColor: '#1f2937',
  mutedColor: '#6b7280',
} as const;
