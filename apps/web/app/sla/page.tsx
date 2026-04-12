import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Service Level Agreement — LoyalBase',
  description:
    'LoyalBase LLC Service Level Agreement (SLA). Defines uptime commitments, service credits, support tiers, and maintenance windows for the LoyaltyOS platform.',
};

const SECTIONS = [
  {
    heading: 'Introduction',
    content: [
      'This Service Level Agreement ("SLA") describes the service availability commitments, support response times, and credit policy provided by LoyalBase LLC ("LoyalBase," "we," "us") to customers ("Customer") of the LoyaltyOS platform.',
      'This SLA forms part of the Terms of Service between LoyalBase and Customer. In the event of a conflict between this SLA and the Terms of Service, this SLA prevails with respect to service availability matters.',
      'Effective Date: April 12, 2026.',
    ],
  },
  {
    heading: '1. Definitions',
    list: [
      '"Monthly Uptime Percentage" means the total minutes in a calendar month minus the total Downtime minutes in that month, divided by the total minutes in the month, expressed as a percentage.',
      '"Downtime" means the total accumulated minutes per calendar month during which the LoyaltyOS platform is unavailable and not responding to authenticated API requests, excluding Scheduled Maintenance and Excluded Events.',
      '"Scheduled Maintenance" means maintenance periods announced by LoyalBase at least 48 hours in advance via the status page or email notification.',
      '"Excluded Events" means events as described in Section 7 of this SLA.',
      '"Service Credits" means the percentage of the applicable monthly subscription fee credited to Customer\'s account as the sole remedy for failure to meet the uptime commitment.',
      '"Billing Cycle" means the monthly period for which Customer is billed for the Services.',
    ],
  },
  {
    heading: '2. Service Availability Commitment',
    subheadings: [
      {
        title: '2.1 Uptime Target',
        content:
          'LoyalBase targets a Monthly Uptime Percentage of 99.9% for all paid subscription plans. This target applies to the core platform services: the Member App, the Tenant Dashboard, and the LoyaltyOS API.',
      },
      {
        title: '2.2 Service Credit Schedule',
        content:
          'If LoyalBase fails to meet the uptime target in any calendar month, Customer is eligible for Service Credits according to the following schedule:',
        list: [
          'Monthly Uptime < 99.9% and ≥ 99.0%: 10% Service Credit',
          'Monthly Uptime < 99.0% and ≥ 95.0%: 25% Service Credit',
          'Monthly Uptime < 95.0%: 50% Service Credit',
        ],
      },
      {
        title: '2.3 Plan-Based Applicability',
        content: 'Service Credits apply as follows by subscription plan:',
        list: [
          'Starter Plan: Service Credits are not available. LoyalBase commits to a best-effort 99.9% uptime target, but no credits are issued.',
          'Pro Plan: Service Credits apply per the schedule in Section 2.2.',
          'Scale Plan: Service Credits apply per the schedule in Section 2.2. Scale customers also receive priority incident response as described in Section 5.',
          'Enterprise Plan: Custom uptime commitments and credit schedules are defined in the applicable Order Form.',
        ],
      },
    ],
  },
  {
    heading: '3. Service Credit Conditions and Limitations',
    content: [
      'Service Credits are Customer\'s sole and exclusive remedy for any failure by LoyalBase to meet the Monthly Uptime Percentage commitment. Service Credits are not refundable as cash and may only be applied toward future subscription fees.',
      'The maximum total Service Credits issued to Customer in any single calendar month shall not exceed fifty percent (50%) of the subscription fee paid by Customer for that month.',
      'Service Credits do not apply if Customer\'s account is past due or suspended at the time of the incident.',
    ],
  },
  {
    heading: '4. Scheduled Maintenance',
    content: [
      'LoyalBase performs scheduled maintenance to ensure the reliability, security, and performance of the platform. Scheduled maintenance is excluded from Downtime calculations.',
      'LoyalBase will provide at least 48 hours\' advance notice for scheduled maintenance expected to impact service availability. Notices will be published on the LoyalBase status page and sent by email to the primary account contact.',
      'LoyalBase targets a scheduled maintenance window of Sunday 02:00–06:00 UTC. LoyalBase endeavors to complete all maintenance within the announced window and to minimize actual impact on service availability.',
      'Emergency maintenance required to address critical security vulnerabilities or active incidents may be performed with shorter notice. LoyalBase will provide as much advance notice as circumstances permit.',
    ],
  },
  {
    heading: '5. Support Tiers',
    subheadings: [
      {
        title: '5.1 Support Channels',
        content: 'Support is available through the following channels based on subscription plan:',
        list: [
          'Starter: Email support via support@loyalbase.dev. Response target: 2 business days.',
          'Pro: Email support + live chat (Crisp widget in dashboard). Response target: 1 business day for email; same-day for chat during business hours.',
          'Scale: Email support + live chat + dedicated Account Manager contact. Response target: 4 business hours for email; real-time for chat.',
          'Enterprise: Dedicated support channel. Response times defined in the applicable Order Form.',
        ],
      },
      {
        title: '5.2 Severity Levels',
        content: 'LoyalBase categorizes support requests by the following severity levels and targets:',
        list: [
          'Critical (P1) — Platform completely unavailable or data loss in progress. Target first response: 1 hour (Pro/Scale/Enterprise). Starter: 4 hours.',
          'High (P2) — Major feature unavailable, significant business impact. Target first response: 4 hours (Pro/Scale/Enterprise). Starter: 1 business day.',
          'Medium (P3) — Feature degraded, workaround available. Target first response: 1 business day (all plans).',
          'Low (P4) — General questions, feature requests, minor issues. Target first response: 2 business days (all plans).',
        ],
      },
      {
        title: '5.3 Business Hours',
        content:
          'Business hours for support purposes are Monday through Friday, 09:00–18:00 Eastern Time (ET), excluding U.S. federal holidays. Critical (P1) issues are handled on a best-effort basis outside business hours for Pro and Scale plans.',
      },
    ],
  },
  {
    heading: '6. Status Page and Incident Communication',
    content: [
      'LoyalBase maintains a public status page where current platform status, active incidents, and historical uptime data are published.',
      'Upon identifying an incident affecting service availability, LoyalBase will post an initial incident report within 30 minutes of detection, followed by regular updates until the incident is resolved.',
      'A post-incident report will be published within 5 business days for P1 incidents, summarizing the root cause, timeline, and corrective actions taken.',
    ],
  },
  {
    heading: '7. Exclusions',
    content: [
      'The following events are excluded from Downtime calculations and do not entitle Customer to Service Credits:',
    ],
    list: [
      'Scheduled Maintenance as defined in Section 4',
      'Events caused by factors outside LoyalBase\'s reasonable control, including Internet outages, force majeure events, and acts of government or regulatory bodies',
      'Actions or omissions by Customer or Customer\'s users, including unauthorized access to Customer\'s account, misconfiguration by Customer, or use of the Services in violation of the Terms of Service',
      'Failures of third-party services or infrastructure not within LoyalBase\'s direct control, including Supabase, Vercel, or other sub-processors, except where such failures result from LoyalBase\'s failure to implement reasonable failover or redundancy measures',
      'Denial-of-service (DoS) or distributed denial-of-service (DDoS) attacks targeting Customer\'s account or the platform generally',
      'Customer\'s failure to maintain current browser or operating system software compatible with the platform',
      'Beta features or services explicitly designated as experimental or preview',
    ],
  },
  {
    heading: '8. Measurement and Monitoring',
    content: [
      'LoyalBase measures Monthly Uptime Percentage using internal monitoring systems that perform authenticated health checks against the LoyaltyOS platform endpoints at regular intervals. Monitoring is performed from multiple geographic regions.',
      'A service is considered "unavailable" when three or more consecutive health checks from at least two independent monitoring locations fail to receive a successful response within a 30-second timeout.',
      'Uptime records are retained for a minimum of 12 months and are available to customers upon written request.',
    ],
  },
  {
    heading: '9. Claims Procedure',
    subheadings: [
      {
        title: '9.1 Submitting a Claim',
        content:
          'To receive a Service Credit, Customer must submit a claim within 30 days of the end of the affected calendar month. Claims must be submitted by email to legal@loyalbase.dev with the subject line "SLA Credit Request — [Month/Year]" and must include: the Customer\'s account name, the dates and times of the claimed Downtime, and a description of how Customer was affected.',
      },
      {
        title: '9.2 Credit Determination',
        content:
          'LoyalBase will evaluate the claim using its monitoring data within 15 business days of receipt. If the claim is validated, LoyalBase will apply the applicable Service Credit to Customer\'s next invoice. LoyalBase\'s determination is final, subject to Customer\'s right to dispute via the process in the Terms of Service.',
      },
    ],
  },
  {
    heading: '10. Limitation of Liability',
    content: [
      'Service Credits are the sole and exclusive remedy available to Customer for any failure by LoyalBase to meet the service availability commitments set forth in this SLA. The maximum aggregate liability of LoyalBase under this SLA in any calendar month shall not exceed the Service Credit caps described in Section 3.',
      'Nothing in this SLA limits either party\'s liability for fraud, death or personal injury caused by negligence, or any liability that cannot be excluded by applicable law.',
    ],
  },
  {
    heading: '11. Updates to This SLA',
    content: [
      'LoyalBase may update this SLA from time to time. Material changes will be communicated to Customer by email at least 30 days before taking effect. Customer\'s continued use of the Services after the effective date of any update constitutes acceptance of the updated SLA.',
      'If LoyalBase reduces the uptime commitment or service credit levels applicable to Customer\'s current plan, Customer may terminate its subscription for cause with a pro-rated refund of prepaid fees by providing written notice within 30 days of the effective date of such change.',
    ],
  },
  {
    heading: '12. Governing Law',
    content: [
      'This SLA is governed by the laws of the State of Florida, United States, without regard to conflict of laws principles. Any disputes arising under this SLA shall be subject to the exclusive jurisdiction and venue set forth in the Terms of Service.',
    ],
  },
];

export default function SlaPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16" style={{ background: '#0a0a0f' }}>
        {/* Hero */}
        <section
          className="py-20 px-6 text-center"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="max-w-3xl mx-auto">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
              Legal
            </span>
            <h1
              className="font-display font-black text-white mb-4"
              style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}
            >
              Service Level Agreement
            </h1>
            <p className="text-white/50 text-lg mb-3">LoyaltyOS Platform — SLA</p>
            <p className="text-white/30 text-sm">Effective Date: April 12, 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-12">
              {SECTIONS.map((section) => (
                <div key={section.heading}>
                  <h2
                    className="font-display font-bold text-white text-xl mb-5 pb-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {section.heading}
                  </h2>

                  {'content' in section && section.content && (
                    <div className="space-y-4 mb-4">
                      {section.content.map((p, i) => (
                        <p key={i} className="text-white/65 text-sm leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {'list' in section && section.list && (
                    <ul className="space-y-2 mb-4 ml-4">
                      {section.list.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {'subheadings' in section && section.subheadings && (
                    <div className="space-y-6">
                      {section.subheadings.map((sub) => (
                        <div key={sub.title}>
                          <h3 className="font-semibold text-white/90 text-base mb-2">{sub.title}</h3>
                          {'content' in sub && sub.content && (
                            <p className="text-white/65 text-sm leading-relaxed mb-3">{sub.content}</p>
                          )}
                          {'list' in sub && sub.list && (
                            <ul className="space-y-2 ml-4">
                              {sub.list.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact */}
            <div
              className="mt-16 p-6 rounded-2xl"
              style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-display font-bold text-white text-lg mb-3">
                SLA and Support Contact
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-3">
                For SLA claims, uptime inquiries, or support escalations, contact us at{' '}
                <a
                  href="mailto:legal@loyalbase.dev"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  legal@loyalbase.dev
                </a>{' '}
                or{' '}
                <a
                  href="mailto:support@loyalbase.dev"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  support@loyalbase.dev
                </a>
              </p>
              <div
                className="mt-4 pt-4 space-y-1"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-white/35 text-xs">LoyalBase LLC</p>
                <p className="text-white/35 text-xs">7901 4th St N, Ste 300</p>
                <p className="text-white/35 text-xs">St. Petersburg, FL 33702, USA</p>
                <p className="text-white/35 text-xs">+1 (561) 408-5283</p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
