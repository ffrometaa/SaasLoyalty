// App-wide constants

export const APP_NAME = 'LoyaltyOS';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001';
export const MEMBER_URL = process.env.NEXT_PUBLIC_MEMBER_URL || 'http://localhost:3002';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Points system
export const DEFAULT_POINTS_PER_DOLLAR = 1;
export const DEFAULT_POINTS_EXPIRATION_DAYS = 365;
export const REDEMPTION_EXPIRES_IN_DAYS = 30;

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
} as const;

// Reactivation engine
export const REACTIVATION_DAYS = {
  trigger: 25,
  bonusOffer: 26,
  urgency: 28,
  finalChance: 35,
  dashboardAlert: 45,
} as const;

// Plans
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 199,
    maxMembers: 500,
    campaignsPerMonth: 2,
    features: {
      whiteLabel: 'logo',
      support: 'email',
      analytics: 'basic',
      export: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 399,
    maxMembers: 2000,
    campaignsPerMonth: 10,
    features: {
      whiteLabel: 'logo+domain',
      support: 'priority',
      analytics: 'complete',
      export: false,
    },
  },
  scale: {
    name: 'Scale',
    price: 599,
    maxMembers: -1, // unlimited
    campaignsPerMonth: -1,
    features: {
      whiteLabel: 'full',
      support: 'account_manager',
      analytics: 'complete',
      export: true,
    },
  },
} as const;

// Business types
export const BUSINESS_TYPES = [
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'restaurant', label: 'Restaurant & Bar' },
  { value: 'gym', label: 'Gym & Fitness' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'salon', label: 'Salon & Beauty' },
] as const;

// Founding Partner Program
export const FOUNDING_PARTNER_DISCOUNT = 0.20;
export const FOUNDING_PARTNER_MAX_SPOTS = 15;
export const FOUNDING_PARTNER_TRIAL_DAYS = 60;
export const FOUNDING_PARTNER_COUPON_ID = 'FOUNDING20';

// Session
export const JWT_EXPIRY_HOURS = 1;
export const REFRESH_TOKEN_DAYS = 7;

// API
export const API_TIMEOUT_MS = 10000;
export const RATE_LIMIT_MAX = 100;
export const RATE_LIMIT_WINDOW_MS = 60000;
