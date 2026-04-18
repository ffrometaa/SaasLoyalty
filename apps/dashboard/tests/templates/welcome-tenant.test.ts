import { describe, it, expect } from 'vitest';
import { buildWelcomeTenantEmail } from '@loyalty-os/email';

const BASE_PARAMS = {
  businessName: 'Acme Coffee',
  plan: 'starter',
  dashboardUrl: 'https://dashboard.loyalbase.dev',
};

describe('buildWelcomeTenantEmail', () => {
  it('default call (no trialDays) — subject contains "14", body contains "14"', () => {
    const result = buildWelcomeTenantEmail(BASE_PARAMS);

    expect(result.enSubject).toContain('14');
    expect(result.esSubject).toContain('14');
    expect(result.enHtmlContent).toContain('14');
    expect(result.esHtmlContent).toContain('14');
  });

  it('trialDays: 60 — subject and body contain "60" in both EN and ES', () => {
    const result = buildWelcomeTenantEmail({ ...BASE_PARAMS, trialDays: 60 });

    expect(result.enSubject).toContain('60');
    expect(result.esSubject).toContain('60');
    expect(result.enHtmlContent).toContain('60');
    expect(result.esHtmlContent).toContain('60');
  });

  it('EN content contains /settings link', () => {
    const result = buildWelcomeTenantEmail(BASE_PARAMS);

    expect(result.enHtmlContent).toContain('/settings');
  });

  it('EN content contains /rewards link', () => {
    const result = buildWelcomeTenantEmail(BASE_PARAMS);

    expect(result.enHtmlContent).toContain('/rewards');
  });

  it('EN content contains /members link', () => {
    const result = buildWelcomeTenantEmail(BASE_PARAMS);

    expect(result.enHtmlContent).toContain('/members');
  });

  it('EN content does NOT contain the old 4th step "Start recording visits"', () => {
    const result = buildWelcomeTenantEmail(BASE_PARAMS);

    expect(result.enHtmlContent).not.toContain('Start recording visits');
    expect(result.enHtmlContent).not.toContain('earning points');
  });

  it('isFoundingPartner: false (default) — no founding partner callout in EN or ES', () => {
    const result = buildWelcomeTenantEmail({ ...BASE_PARAMS, isFoundingPartner: false });

    expect(result.enHtmlContent).not.toContain('Founding Partner');
    expect(result.esHtmlContent).not.toContain('Founding Partner');
  });

  it('isFoundingPartner: true — EN content includes founding partner text', () => {
    const result = buildWelcomeTenantEmail({ ...BASE_PARAMS, isFoundingPartner: true });

    expect(result.enHtmlContent).toContain('Founding Partner');
  });

  it('isFoundingPartner: true — ES content includes founding partner text', () => {
    const result = buildWelcomeTenantEmail({ ...BASE_PARAMS, isFoundingPartner: true });

    expect(result.esHtmlContent).toContain('Founding Partner');
  });

  it('return shape has exactly the four expected keys', () => {
    const result = buildWelcomeTenantEmail(BASE_PARAMS);
    const keys = Object.keys(result).sort();

    expect(keys).toEqual(['enHtmlContent', 'enSubject', 'esHtmlContent', 'esSubject']);
  });

  it('backward compatible: calling with only { businessName, plan, dashboardUrl } still works', () => {
    const result = buildWelcomeTenantEmail({ businessName: 'My Shop', plan: 'pro', dashboardUrl: 'https://example.com' });

    expect(result.enSubject).toBeTruthy();
    expect(result.esSubject).toBeTruthy();
    expect(result.enHtmlContent).toBeTruthy();
    expect(result.esHtmlContent).toBeTruthy();
    // Should use default 14 days
    expect(result.enSubject).toContain('14');
  });
});
