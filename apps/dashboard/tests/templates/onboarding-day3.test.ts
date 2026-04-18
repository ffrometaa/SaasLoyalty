import { describe, it, expect } from 'vitest';
import { buildOnboardingDay3Email } from '@loyalty-os/email';

const BASE_PARAMS = {
  businessName: 'Acme Coffee',
  dashboardUrl: 'https://dashboard.loyalbase.dev',
  rewardsUrl: 'https://dashboard.loyalbase.dev/rewards',
};

describe('buildOnboardingDay3Email', () => {
  it('returns all four expected keys', () => {
    const result = buildOnboardingDay3Email(BASE_PARAMS);
    const keys = Object.keys(result).sort();

    expect(keys).toEqual(['enHtmlContent', 'enSubject', 'esHtmlContent', 'esSubject']);
  });

  it('enSubject is a non-empty string', () => {
    const { enSubject } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(enSubject).toBeTruthy();
    expect(typeof enSubject).toBe('string');
  });

  it('esSubject is a non-empty string', () => {
    const { esSubject } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(esSubject).toBeTruthy();
    expect(typeof esSubject).toBe('string');
  });

  it('EN HTML contains businessName', () => {
    const { enHtmlContent } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(enHtmlContent).toContain('Acme Coffee');
  });

  it('ES HTML contains businessName', () => {
    const { esHtmlContent } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(esHtmlContent).toContain('Acme Coffee');
  });

  it('EN HTML contains rewardsUrl', () => {
    const { enHtmlContent } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(enHtmlContent).toContain(BASE_PARAMS.rewardsUrl);
  });

  it('ES HTML contains rewardsUrl', () => {
    const { esHtmlContent } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(esHtmlContent).toContain(BASE_PARAMS.rewardsUrl);
  });

  it('EN HTML contains dashboardUrl', () => {
    const { enHtmlContent } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(enHtmlContent).toContain(BASE_PARAMS.dashboardUrl);
  });

  it('ES HTML contains dashboardUrl', () => {
    const { esHtmlContent } = buildOnboardingDay3Email(BASE_PARAMS);

    expect(esHtmlContent).toContain(BASE_PARAMS.dashboardUrl);
  });

  it('works with no params (defaults applied)', () => {
    const result = buildOnboardingDay3Email();

    expect(result.enSubject).toBeTruthy();
    expect(result.esSubject).toBeTruthy();
    expect(result.enHtmlContent).toBeTruthy();
    expect(result.esHtmlContent).toBeTruthy();
  });
});
