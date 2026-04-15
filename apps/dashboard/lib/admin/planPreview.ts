import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';

const COOKIE_NAME = 'admin_preview_plan';
const COOKIE_MAX_AGE = 2 * 60 * 60; // 2 hours in seconds

const VALID_PLANS = ['starter', 'pro', 'scale', 'enterprise'];

// Sets the admin plan preview cookie.
// This allows the admin to see the dashboard as if they were on the given plan.
export function setAdminPlanPreview(plan = '') {
  if (!VALID_PLANS.includes(plan)) return;

  (cookies() as unknown as UnsafeUnwrappedCookies).set(COOKIE_NAME, plan, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

// Returns the currently previewed plan name or null if no preview is active.
export function getAdminPlanPreview() {
  const value = (cookies() as unknown as UnsafeUnwrappedCookies).get(COOKIE_NAME)?.value;
  if (!value || !VALID_PLANS.includes(value)) return null;
  return value;
}

// Clears the plan preview cookie.
export function clearAdminPlanPreview() {
  (cookies() as unknown as UnsafeUnwrappedCookies).delete(COOKIE_NAME);
}
