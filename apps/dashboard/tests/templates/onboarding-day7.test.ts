import { describe, it, expect } from 'vitest';
import { buildOnboardingDay7Email } from '@loyalty-os/email';

const BASE_PARAMS = {
  businessName: 'Acme Coffee',
  dashboardUrl: 'https://dashboard.loyalbase.dev',
  daysLeft: 7,
  upgradeUrl: 'https://dashboard.loyalbase.dev/settings?tab=billing',
};

describe('buildOnboardingDay7Email', () => {
  it('returns all four expected keys', () => {
    const result = buildOnboardingDay7Email(BASE_PARAMS);
    const keys = Object.keys(result).sort();

    expect(keys).toEqual(['enHtmlContent', 'enSubject', 'esHtmlContent', 'esSubject']);
  });

  it('daysLeft appears in enSubject', () => {
    const { enSubject } = buildOnboardingDay7Email({ ...BASE_PARAMS, daysLeft: 5 });

    expect(enSubject).toContain('5');
  });

  it('daysLeft appears in esSubject', () => {
    const { esSubject } = buildOnboardingDay7Email({ ...BASE_PARAMS, daysLeft: 5 });

    expect(esSubject).toContain('5');
  });

  it('daysLeft appears in EN HTML body', () => {
    const { enHtmlContent } = buildOnboardingDay7Email({ ...BASE_PARAMS, daysLeft: 4 });

    expect(enHtmlContent).toContain('4');
  });

  it('daysLeft appears in ES HTML body', () => {
    const { esHtmlContent } = buildOnboardingDay7Email({ ...BASE_PARAMS, daysLeft: 4 });

    expect(esHtmlContent).toContain('4');
  });

  it('EN HTML contains upgradeUrl', () => {
    const { enHtmlContent } = buildOnboardingDay7Email(BASE_PARAMS);

    expect(enHtmlContent).toContain(BASE_PARAMS.upgradeUrl);
  });

  it('ES HTML contains upgradeUrl', () => {
    const { esHtmlContent } = buildOnboardingDay7Email(BASE_PARAMS);

    expect(esHtmlContent).toContain(BASE_PARAMS.upgradeUrl);
  });

  it('EN HTML contains businessName', () => {
    const { enHtmlContent } = buildOnboardingDay7Email(BASE_PARAMS);

    expect(enHtmlContent).toContain('Acme Coffee');
  });

  it('ES HTML contains businessName', () => {
    const { esHtmlContent } = buildOnboardingDay7Email(BASE_PARAMS);

    expect(esHtmlContent).toContain('Acme Coffee');
  });

  it('works with no params (defaults applied)', () => {
    const result = buildOnboardingDay7Email();

    expect(result.enSubject).toBeTruthy();
    expect(result.esSubject).toBeTruthy();
    expect(result.enHtmlContent).toBeTruthy();
    expect(result.esHtmlContent).toBeTruthy();
  });
});
