import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — LoyalBase',
  description: 'LoyalBase Data Protection & Privacy Policy. Learn how we collect, use, and protect your information.',
};

const SECTIONS = [
  {
    heading: 'Introduction',
    content: [
      'LoyalBase LLC ("LoyalBase," "we," "us," or "our") is committed to protecting the privacy and security of personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our platform, website, and related services (collectively, the "Services").',
      'This Policy applies to two distinct categories of users: (1) Business Customers ("Tenants") — businesses that subscribe to and operate the LoyaltyOS platform; and (2) End Users ("Members") — individual customers of Tenant businesses who interact with Tenant-branded loyalty applications powered by LoyaltyOS.',
      'This Privacy Policy is designed to comply with applicable federal privacy laws and the privacy laws of the State of Florida, including but not limited to: the Florida Information Protection Act (FIPA), Fla. Stat. § 501.171; the Florida Consumer Protection Law, Fla. Stat. Ch. 501; the CAN-SPAM Act (15 U.S.C. § 7701 et seq.); the Children\'s Online Privacy Protection Act (COPPA), 15 U.S.C. § 6501 et seq.; and applicable Federal Trade Commission (FTC) regulations and guidelines.',
    ],
  },
  {
    heading: '1. Data Controller and Processor Roles',
    content: [
      'The roles of "data controller" and "data processor" under this Privacy Policy are defined as follows: LoyalBase acts as the data controller for Tenant account information, and as a data processor for Member Data processed on behalf of Tenants.',
      'Tenants are independently responsible for providing their end-user Members with required privacy notices and obtaining all legally required consents before enrolling Members in their loyalty programs.',
    ],
  },
  {
    heading: '2. Information We Collect',
    subheadings: [
      {
        title: '2.1 Information Collected from Tenants (Business Customers)',
        list: [
          'Business contact information: business name, address, phone number, website URL',
          'Account credentials: email address, encrypted password, multi-factor authentication data',
          'Billing and payment information: processed and stored by Stripe, Inc. — LoyalBase does not store complete payment card numbers',
          'Business configuration data: branding assets, loyalty program settings, campaign content',
          'Usage data: features accessed, actions performed, timestamps, IP addresses, device information',
          'Communications: emails, support tickets, feedback submitted to LoyalBase',
        ],
      },
      {
        title: '2.2 Information Collected from Members (End Users of Tenant Businesses)',
        content: 'LoyalBase collects and processes the following Member information on behalf of Tenants:',
        list: [
          'Identity information: first and last name, date of birth (optional)',
          'Contact information: email address, phone number (optional)',
          'Loyalty program data: points balance, tier status, transaction history, reward redemptions',
          'Visit and behavioral data: visit timestamps, services utilized, purchase amounts',
          'Device and technical data: device type, operating system, browser type, IP address, push notification tokens',
          'Preferences: notification preferences, language settings, communication opt-ins/opt-outs',
          'Referral data: referral source, referred contacts (only with explicit consent)',
        ],
      },
      {
        title: '2.3 Information Collected Automatically',
        content: 'When you access our platform, we automatically collect:',
        list: [
          'Log data: IP address, browser type, pages visited, time and date of access, referring URLs',
          'Cookies and similar tracking technologies — see Section 8 for details',
          'Performance and analytics data collected through Vercel Analytics and Sentry error monitoring',
        ],
      },
      {
        title: '2.4 Information We Do Not Collect',
        content: 'LoyalBase does not collect or store: complete payment card numbers (processed entirely by Stripe), Social Security Numbers, government-issued ID numbers, or sensitive health information, unless explicitly required and disclosed for a specific feature.',
      },
    ],
  },
  {
    heading: '3. How We Use Information',
    subheadings: [
      {
        title: '3.1 Tenant Information',
        list: [
          'To create and manage your LoyalBase account',
          'To process subscription payments and send billing communications',
          'To provide technical support and respond to inquiries',
          'To send product updates, feature announcements, and service notifications',
          'To analyze platform usage and improve our Services',
          'To enforce these Terms and prevent fraud or abuse',
          'To comply with legal obligations',
        ],
      },
      {
        title: '3.2 Member Information (Processed on behalf of Tenants)',
        list: [
          'To operate the loyalty program on behalf of the Tenant, including tracking and displaying points, tiers, and rewards',
          'To send push notifications and email communications as instructed by the Tenant and consented to by the Member',
          'To generate business analytics and reports for the Tenant',
          'To power automated customer retention and reactivation campaigns configured by the Tenant',
          'To record visit history and generate personalized recommendations',
          'To process reward redemptions and validate redemption codes',
        ],
      },
      {
        title: '3.3 Legal Bases for Processing',
        content: 'LoyalBase processes personal information based on the following legal bases:',
        list: [
          'Contract performance: processing necessary to provide the Services you have subscribed to',
          'Legitimate interests: improving the platform, preventing fraud, and ensuring security',
          'Legal obligations: complying with applicable federal and Florida state law',
          'Consent: for optional features and marketing communications, where required by law',
        ],
      },
    ],
  },
  {
    heading: '4. Disclosure of Information',
    subheadings: [
      {
        title: '4.1 We Do Not Sell Personal Information',
        content: 'LoyalBase does not sell, rent, or trade personal information to third parties for their marketing purposes. This applies to both Tenant and Member information.',
      },
      {
        title: '4.2 Service Providers (Sub-processors)',
        content: 'We share information with trusted third-party service providers who assist us in operating the Platform. These providers are contractually required to process data only as directed by LoyalBase and to implement appropriate security measures. Key sub-processors include Stripe (payment processing), Supabase (database infrastructure), Vercel (hosting and analytics), and Resend (email delivery).',
      },
      {
        title: '4.3 Legal Requirements',
        content: 'LoyalBase may disclose personal information if required to do so by law or in good faith belief that such action is necessary to: (a) comply with a legal obligation, court order, or subpoena; (b) protect and defend the rights or property of LoyalBase; (c) prevent or investigate possible wrongdoing in connection with the Services; (d) protect the personal safety of users or the public; or (e) protect against legal liability.',
      },
      {
        title: '4.4 Business Transfers',
        content: 'In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or substantially all of LoyalBase\'s assets, personal information may be transferred as part of that transaction. You will be notified of any such change in ownership or control of your personal information via email or prominent notice on our website.',
      },
    ],
  },
  {
    heading: '5. Your Privacy Rights',
    subheadings: [
      {
        title: '5.1 Rights Available to All Users',
        content: 'Subject to applicable law and our ability to verify your identity, you have the following rights:',
        list: [
          'Right to Access: Request a copy of personal information we hold about you',
          'Right to Correction: Request correction of inaccurate or incomplete personal information',
          'Right to Deletion: Request deletion of your personal information, subject to certain legal exceptions',
          'Right to Portability: Request your personal information in a structured, machine-readable format',
          'Right to Opt-Out: Opt out of marketing communications at any time using the unsubscribe link in any email or by contacting privacy@loyalbase.dev',
        ],
      },
      {
        title: '5.2 Florida-Specific Rights',
        content: 'Florida residents have rights under the Florida Information Protection Act (FIPA), Fla. Stat. § 501.171, and other applicable Florida law, including the right to:',
        list: [
          'Receive notification of a data breach affecting your personal information within the timeframes required by FIPA',
          'File a complaint with the Florida Office of the Attorney General for violations of Florida consumer protection or privacy laws',
          'Seek remedies under the Florida Deceptive and Unfair Trade Practices Act (FDUTPA), Fla. Stat. § 501.201 et seq., for unfair or deceptive data practices',
        ],
      },
      {
        title: '5.3 Children\'s Privacy (COPPA Compliance)',
        content: 'The LoyaltyOS platform is not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. Tenants are independently responsible for ensuring that their loyalty programs are not directed to children under 13 and for complying with COPPA requirements with respect to their Members. If we become aware that we have collected personal information from a child under 13 without verifiable parental consent, we will delete such information promptly. Contact us at privacy@loyalbase.dev if you believe we have inadvertently collected such information.',
      },
      {
        title: '5.4 How to Exercise Your Rights',
        content: 'To exercise any of the rights described in this Section, please submit a request to privacy@loyalbase.dev. We will respond to verified requests within thirty (30) days, or within the timeframe required by applicable law. We may require verification of your identity before processing your request.',
      },
    ],
  },
  {
    heading: '6. Data Security',
    content: [
      'LoyalBase implements a comprehensive set of technical and organizational security measures to protect personal information:',
    ],
    list: [
      'Encryption in transit: All data transmitted between users and LoyalBase is encrypted using TLS 1.2 or higher',
      'Encryption at rest: Sensitive data stored in our database is encrypted at rest',
      'Access controls: Role-based access control (RBAC) and multi-factor authentication (MFA) are required for administrative access',
      'Database isolation: Row Level Security (RLS) at the database engine level ensures strict logical separation of Tenant data',
      'Monitoring: Continuous monitoring for security anomalies using automated alerting systems',
      'Vulnerability management: Regular security reviews and prompt patching of identified vulnerabilities',
      'Vendor security: All third-party sub-processors are required to maintain appropriate security standards',
    ],
    footer: 'Despite these measures, no transmission over the Internet or electronic storage system is 100% secure. LoyalBase cannot guarantee absolute security of personal information. In the event of a security breach, LoyalBase will notify affected parties as required by applicable law.',
  },
  {
    heading: '7. Data Retention',
    content: [
      'LoyalBase retains Tenant account data for the duration of the active subscription plus thirty (30) days following termination, after which it is permanently deleted.',
      'Member Data is retained for the duration of the Tenant\'s active subscription plus thirty (30) days following termination. Upon written request within this window, a full data export is available.',
      'Billing records are retained for seven (7) years as required by applicable tax and financial regulations. Anonymized usage and analytics data may be retained indefinitely.',
    ],
  },
  {
    heading: '8. Cookies and Tracking Technologies',
    content: [
      'LoyalBase uses cookies and similar tracking technologies to operate the Platform and improve user experience. The following categories of cookies are used:',
    ],
    list: [
      'Strictly Necessary Cookies: Required for authentication, session management, and core platform functionality. These cannot be disabled.',
      'Functional Cookies: Remember your preferences and settings to improve your experience.',
      'Analytics Cookies: Collect anonymized information about how the Platform is used to help us improve our Services. We use Vercel Analytics for this purpose.',
      'Security Cookies: Support our security measures, including fraud detection.',
    ],
    footer: 'You may control cookie preferences through your browser settings. However, disabling certain cookies may affect the functionality of the Platform. We do not use third-party advertising or behavioral tracking cookies.',
  },
  {
    heading: '9. Electronic Communications and CAN-SPAM Compliance',
    content: [
      'LoyalBase may send you electronic communications related to your account, the Services, and (with your consent) marketing information. All commercial email communications from LoyalBase comply with the CAN-SPAM Act (15 U.S.C. § 7701) and include:',
    ],
    list: [
      'Accurate "From," "To," and routing information',
      'A clear and conspicuous identification as an advertisement where applicable',
      "LoyalBase's valid physical postal address",
      'A clear and conspicuous explanation of how to opt out of future emails',
      'A functioning opt-out mechanism honored within ten (10) business days',
    ],
    footer: 'Push notification communications sent through the Platform on behalf of Tenants to Members are the sole responsibility of the Tenant, who must ensure compliance with the TCPA, CAN-SPAM, and any other applicable law governing electronic communications.',
  },
  {
    heading: '10. International Data Transfers',
    content: [
      'LoyalBase is based in the United States and processes data on servers located in the United States (primarily in the Eastern United States region). If you are accessing our Services from outside the United States, please be aware that your information will be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country.',
    ],
  },
  {
    heading: '11. Changes to This Privacy Policy',
    content: [
      'LoyalBase reserves the right to update this Privacy Policy at any time. We will notify you of material changes by: (a) sending an email to the address associated with your account; (b) posting a prominent notice on our website; and/or (c) displaying an in-platform notification. Changes take effect thirty (30) days after notification, or immediately for changes required by law.',
      'Your continued use of the Platform after the effective date of any change constitutes your acceptance of the updated Policy.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16" style={{ background: '#0a0a0f' }}>
        {/* Hero */}
        <section className="py-20 px-6 text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-3xl mx-auto">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
              Legal
            </span>
            <h1 className="font-display font-black text-white mb-4" style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}>
              Privacy Policy
            </h1>
            <p className="text-white/50 text-lg mb-3">LoyaltyOS Platform — Data Protection & Privacy</p>
            <p className="text-white/30 text-sm">Effective Date: April 1, 2026</p>
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

                  {'footer' in section && section.footer && (
                    <p className="text-white/65 text-sm leading-relaxed mt-4">{section.footer}</p>
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
              <h2 className="font-display font-bold text-white text-lg mb-3">Contact Us</h2>
              <p className="text-white/55 text-sm leading-relaxed">
                Questions, concerns, or privacy requests? Contact our Privacy team at{' '}
                <a href="mailto:privacy@loyalbase.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
                  privacy@loyalbase.dev
                </a>
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
