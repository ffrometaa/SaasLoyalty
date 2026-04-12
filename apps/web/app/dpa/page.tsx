import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Data Processing Agreement — LoyalBase',
  description:
    'LoyalBase LLC Data Processing Agreement (DPA). Governs the processing of personal data on behalf of business customers using the LoyaltyOS platform.',
};

const SECTIONS = [
  {
    heading: 'Introduction',
    content: [
      'This Data Processing Agreement ("DPA") is entered into between LoyalBase LLC, a company organized under the laws of the State of Florida, with its principal place of business at 7901 4th St N, Ste 300, St. Petersburg, FL 33702, USA ("Processor," "LoyalBase"), and the Customer identified in the LoyaltyOS platform subscription agreement ("Controller," "Customer").',
      'This DPA forms an integral part of the Terms of Service between the parties and governs the processing of Personal Data by LoyalBase on behalf of the Customer in connection with the LoyaltyOS platform and related services (the "Services").',
      'By accepting the Terms of Service or accessing the Services, Customer agrees to the terms of this DPA. If Customer does not agree to this DPA, Customer must not use the Services.',
    ],
  },
  {
    heading: '1. Definitions',
    content: [
      'The following definitions apply throughout this DPA. Terms not defined here have the meaning given in the Terms of Service.',
    ],
    list: [
      '"Personal Data" means any information relating to an identified or identifiable natural person ("Data Subject"), including but not limited to names, email addresses, phone numbers, loyalty program activity, and device identifiers, processed by LoyalBase on behalf of Customer.',
      '"Processing" (and "Process") means any operation or set of operations performed on Personal Data, including collection, recording, organization, storage, retrieval, use, disclosure, transmission, restriction, erasure, or destruction.',
      '"Controller" means the Customer — the entity that determines the purposes and means of processing Personal Data.',
      '"Processor" means LoyalBase — the entity that processes Personal Data on behalf of the Controller.',
      '"Sub-processor" means any third party engaged by LoyalBase to process Personal Data on behalf of Customer.',
      '"Data Subject" means any natural person whose Personal Data is processed under this DPA, including Customer\'s end-user loyalty program members ("Members").',
      '"Security Incident" means any confirmed unauthorized access, disclosure, destruction, alteration, or loss of Personal Data.',
      '"Applicable Data Protection Law" means all applicable laws and regulations governing the protection and processing of Personal Data to which the processing of Personal Data under this DPA is subject, including, without limitation, the Florida Information Protection Act (FIPA), Fla. Stat. § 501.171, the CAN-SPAM Act, and, where applicable, the EU General Data Protection Regulation (GDPR), UK GDPR, and any other applicable privacy legislation.',
    ],
  },
  {
    heading: '2. Scope and Nature of Processing',
    subheadings: [
      {
        title: '2.1 Role of the Parties',
        content:
          'LoyalBase acts as a Processor with respect to Personal Data of Customer\'s Members. Customer acts as the Controller, determining the purposes and means of processing Member Data through the LoyaltyOS platform. LoyalBase acts as an independent Controller for its own business operations and for Tenant account data, as described in the Privacy Policy.',
      },
      {
        title: '2.2 Subject Matter',
        content:
          'LoyalBase processes Personal Data solely to provide and support the Services as described in the Terms of Service, including: operating Customer\'s branded loyalty program, managing Member accounts and loyalty activity, enabling push notification and email communications configured by Customer, generating analytics and reports for Customer, and processing reward redemptions.',
      },
      {
        title: '2.3 Categories of Personal Data',
        content: 'LoyalBase may process the following categories of Personal Data on behalf of Customer:',
        list: [
          'Identity data: Member first and last name, date of birth (if provided)',
          'Contact data: email address, phone number (if provided)',
          'Loyalty program data: points balance, tier status, transaction history, reward redemptions, visit records',
          'Technical data: device identifiers, IP addresses, push notification tokens, browser/OS information',
          'Preference data: language settings, notification opt-in/opt-out status, communication preferences',
          'Referral data: referral source, referred contact information (only where Member provides explicit consent)',
        ],
      },
      {
        title: '2.4 Special Categories of Data',
        content:
          'LoyalBase does not intentionally collect or process special categories of Personal Data (such as data revealing racial or ethnic origin, health information, biometric data, or financial account numbers). Customer must not configure the Services to collect or process such data without prior written consent from LoyalBase and implementation of appropriate additional safeguards.',
      },
      {
        title: '2.5 Duration of Processing',
        content:
          'Processing will continue for the duration of the active subscription plus thirty (30) days following termination, unless Customer requests earlier deletion. Upon written request within this period, Customer may receive a full data export. After thirty (30) days post-termination, all Personal Data will be permanently and irrecoverably deleted from LoyalBase systems and those of its Sub-processors, except where retention is required by applicable law.',
      },
    ],
  },
  {
    heading: '3. Processing Instructions',
    subheadings: [
      {
        title: '3.1 Documented Instructions',
        content:
          'LoyalBase shall process Personal Data only in accordance with Customer\'s documented instructions as set forth in this DPA, the Terms of Service, and any written instructions provided by Customer through the platform interface or via email to legal@loyalbase.dev. The Services themselves constitute Customer\'s primary processing instructions.',
      },
      {
        title: '3.2 Restrictions',
        content:
          'LoyalBase shall not: (a) process Personal Data for any purpose other than providing the Services; (b) sell, rent, or commercially exploit Personal Data; (c) combine Personal Data with data from other customers or third-party sources for profiling purposes; or (d) disclose Personal Data to third parties except as authorized under this DPA.',
      },
      {
        title: '3.3 Conflicting Legal Requirements',
        content:
          'If LoyalBase is required by applicable law to process Personal Data in a manner inconsistent with Customer\'s instructions, LoyalBase shall inform Customer of that legal requirement before processing (unless prohibited by law from doing so), and shall limit processing to what is strictly required by that legal obligation.',
      },
    ],
  },
  {
    heading: '4. Confidentiality',
    content: [
      'LoyalBase shall ensure that all personnel authorized to process Personal Data have committed to confidentiality or are under an appropriate statutory obligation of confidentiality. Access to Personal Data is restricted to personnel who require access to perform the Services.',
      'LoyalBase shall not disclose Personal Data to any third party other than Sub-processors authorized under Section 6 of this DPA, or as required by applicable law.',
    ],
  },
  {
    heading: '5. Technical and Organizational Security Measures',
    subheadings: [
      {
        title: '5.1 Implemented Measures',
        content:
          'LoyalBase implements and maintains appropriate technical and organizational security measures designed to protect Personal Data against unauthorized or unlawful processing and against accidental loss, destruction, damage, alteration, or disclosure. These measures include:',
        list: [
          'Encryption in transit: All data transmitted between users and LoyalBase is encrypted using TLS 1.2 or higher',
          'Encryption at rest: All Personal Data stored in the LoyalBase database infrastructure is encrypted at rest using AES-256',
          'Database isolation: Row Level Security (RLS) at the database engine level enforces strict logical tenant separation — no tenant can access another tenant\'s Member Data',
          'Access controls: Role-based access control (RBAC) and multi-factor authentication (MFA) required for all administrative access to production systems',
          'Principle of least privilege: Personnel access is limited to the minimum data and systems required for their role',
          'Monitoring and alerting: Continuous automated monitoring of production systems for anomalous activity',
          'Vulnerability management: Regular security reviews and prompt remediation of identified vulnerabilities',
          'Backup and recovery: Regular automated backups with tested restoration procedures',
          'Physical security: Data hosted in SOC 2 Type II certified data center infrastructure (via Supabase and Vercel)',
        ],
      },
      {
        title: '5.2 Security Updates',
        content:
          'LoyalBase shall review and update its security measures on a regular basis to account for changes in technology and risks. LoyalBase may update these measures over time, provided that updates do not materially decrease the overall level of protection of Personal Data.',
      },
      {
        title: '5.3 Customer Responsibility',
        content:
          'Customer is responsible for implementing and maintaining appropriate security measures on its own systems and for ensuring that any access credentials or API keys provided by LoyalBase are kept confidential and are not shared with unauthorized parties.',
      },
    ],
  },
  {
    heading: '6. Sub-processors',
    subheadings: [
      {
        title: '6.1 Authorized Sub-processors',
        content:
          'Customer grants LoyalBase general authorization to engage the following Sub-processors to assist in delivering the Services. LoyalBase has entered into or will enter into written agreements with each Sub-processor imposing data protection obligations no less protective than those in this DPA:',
        list: [
          'Supabase, Inc. (USA) — Database infrastructure, authentication, and file storage. Data hosted in the Eastern United States region (AWS us-east-1) by default.',
          'Vercel, Inc. (USA) — Web hosting, serverless computing, and content delivery. Operates globally via edge network.',
          'Stripe, Inc. (USA) — Payment processing. Stripe acts as an independent data controller for payment card data, which LoyalBase never stores or accesses.',
          'Resend, Inc. (USA) — Transactional email delivery for system notifications and loyalty communications.',
          'OneSignal, Inc. (USA) — Push notification delivery for Member-facing loyalty communications.',
        ],
      },
      {
        title: '6.2 New Sub-processors',
        content:
          'LoyalBase shall notify Customer at least thirty (30) days in advance of engaging any new Sub-processor that will process Personal Data, by updating this page and sending notice to the email address associated with Customer\'s account. Customer may object to the engagement of a new Sub-processor within fourteen (14) days of such notice by sending written objection to legal@loyalbase.dev. If Customer objects and the parties cannot resolve the objection, Customer may terminate its subscription without penalty upon written notice, with a pro-rated refund of prepaid but unused fees.',
      },
      {
        title: '6.3 Sub-processor Liability',
        content:
          'LoyalBase shall remain liable to Customer for the acts and omissions of its Sub-processors to the same extent LoyalBase would be liable if performing the services of each Sub-processor directly, subject to the limitations of liability in the Terms of Service.',
      },
    ],
  },
  {
    heading: '7. Data Subject Rights',
    subheadings: [
      {
        title: '7.1 Customer Obligations',
        content:
          'Customer is solely responsible for providing privacy notices to its Members and obtaining all legally required consents for the processing of Member Data through the Services. Customer must maintain a lawful basis for all processing it instructs LoyalBase to perform.',
      },
      {
        title: '7.2 LoyalBase Assistance',
        content:
          'LoyalBase shall provide Customer with reasonable technical and organizational assistance to fulfill Customer\'s obligations to respond to Data Subject requests to exercise rights under Applicable Data Protection Law, including rights of access, correction, deletion, portability, restriction, and objection. LoyalBase will make available in the platform dashboard the following self-service tools: Member account deletion, Member data export, and Member consent management.',
      },
      {
        title: '7.3 Direct Requests',
        content:
          'If LoyalBase receives a Data Subject rights request directly from a Member, LoyalBase shall promptly notify Customer (where legally permissible) and shall not respond to such request without Customer\'s written authorization, except as required by applicable law.',
      },
    ],
  },
  {
    heading: '8. Security Incident and Breach Notification',
    subheadings: [
      {
        title: '8.1 Notification Obligation',
        content:
          'LoyalBase shall notify Customer of any confirmed Security Incident involving Personal Data without undue delay and, where feasible, no later than seventy-two (72) hours after LoyalBase becomes aware of the incident. Notification will be sent to the email address associated with Customer\'s account.',
      },
      {
        title: '8.2 Notification Content',
        content: 'The breach notification shall include, to the extent available at the time of notice:',
        list: [
          'A description of the nature of the Security Incident, including categories and approximate number of Data Subjects and Personal Data records affected',
          'Contact details of LoyalBase\'s data protection point of contact (security@loyalbase.dev)',
          'A description of the likely consequences of the Security Incident',
          'A description of the measures taken or proposed to address the Security Incident and mitigate its effects',
        ],
      },
      {
        title: '8.3 Cooperation',
        content:
          'LoyalBase shall cooperate with Customer and provide Customer with further information necessary for Customer to meet its own breach notification obligations to Data Subjects and supervisory authorities under Applicable Data Protection Law. LoyalBase shall take all reasonable measures to contain and mitigate the Security Incident.',
      },
      {
        title: '8.4 Customer Obligations',
        content:
          'Customer is solely responsible for determining whether the Security Incident triggers any notification obligations to Data Subjects or regulatory authorities, and for fulfilling those obligations. LoyalBase\'s notification to Customer under this Section does not constitute an admission of fault or liability.',
      },
    ],
  },
  {
    heading: '9. Data Protection Impact Assessments and Prior Consultation',
    content: [
      'At Customer\'s written request and reasonable expense, LoyalBase shall provide Customer with reasonable information and assistance to support Customer\'s obligations to conduct Data Protection Impact Assessments (DPIAs) and prior consultations with supervisory authorities under Applicable Data Protection Law, to the extent such obligations apply and to the extent the information required is available to LoyalBase.',
    ],
  },
  {
    heading: '10. Audit Rights',
    subheadings: [
      {
        title: '10.1 Information and Documentation',
        content:
          'LoyalBase shall make available to Customer, upon written request, all information reasonably necessary to demonstrate compliance with the obligations set forth in this DPA, including summaries of relevant security certifications, audit reports, or penetration testing results, subject to appropriate confidentiality restrictions.',
      },
      {
        title: '10.2 Audits',
        content:
          'Customer may request an audit of LoyalBase\'s processing activities covered by this DPA no more than once per calendar year, with at least thirty (30) days\' prior written notice. Customer audits shall be conducted during regular business hours, in a manner that minimizes disruption to LoyalBase\'s operations, and at Customer\'s sole expense. LoyalBase may satisfy its audit obligations by providing Customer with reports prepared by qualified independent third parties. Any audit findings are confidential information of both parties.',
      },
    ],
  },
  {
    heading: '11. International Data Transfers',
    content: [
      'LoyalBase processes Personal Data primarily in the United States. Where Customer\'s Members are located outside the United States, Customer acknowledges that transfer of Personal Data to LoyalBase in the United States may constitute an international data transfer under Applicable Data Protection Law.',
      'For transfers of Personal Data from the European Economic Area (EEA), United Kingdom, or Switzerland to the United States, the parties agree that such transfers are subject to the Standard Contractual Clauses (SCCs) as published by the European Commission, which are incorporated by reference into this DPA. Where SCCs apply, LoyalBase shall act as data importer and Customer shall act as data exporter.',
      'LoyalBase shall implement appropriate supplementary technical measures (including encryption in transit and at rest) to protect Personal Data during international transfers.',
    ],
  },
  {
    heading: '12. Return and Deletion of Data',
    content: [
      'Upon termination or expiration of the Terms of Service, or upon Customer\'s written request, LoyalBase shall, at Customer\'s election: (a) return all Personal Data to Customer in a structured, commonly used, machine-readable format (CSV); or (b) permanently delete all Personal Data from its systems and those of its Sub-processors.',
      'LoyalBase will complete the return or deletion within thirty (30) days of Customer\'s written election. Upon completion, LoyalBase shall provide written certification of deletion upon request.',
      'LoyalBase may retain Personal Data beyond this period only to the extent and for the duration required by applicable law (e.g., retention of billing records for seven years under applicable tax law). Such retained data shall remain subject to the confidentiality and security obligations of this DPA.',
    ],
  },
  {
    heading: '13. Term and Termination',
    content: [
      'This DPA enters into force on the effective date of the Terms of Service and remains in effect for as long as LoyalBase processes Personal Data on behalf of Customer.',
      'This DPA automatically terminates upon expiration or termination of the Terms of Service, subject to the data deletion obligations in Section 12, which survive termination.',
    ],
  },
  {
    heading: '14. Liability',
    content: [
      'Each party\'s liability arising out of or related to this DPA is subject to the limitations and exclusions of liability set forth in the Terms of Service. Nothing in this DPA shall exclude or limit either party\'s liability for fraud, death or personal injury caused by negligence, or any liability that cannot be excluded or limited under applicable law.',
    ],
  },
  {
    heading: '15. Governing Law and Jurisdiction',
    content: [
      'This DPA shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to conflict of laws principles, except to the extent that Applicable Data Protection Law of another jurisdiction (such as the GDPR) mandates a different governing law for specific provisions.',
      'Any disputes arising under this DPA shall be subject to the exclusive jurisdiction and venue set forth in the Terms of Service.',
    ],
  },
  {
    heading: '16. General Provisions',
    subheadings: [
      {
        title: '16.1 Precedence',
        content:
          'In the event of any conflict or inconsistency between this DPA and the Terms of Service with respect to the subject matter of data protection, this DPA shall prevail. In all other respects, the Terms of Service shall govern.',
      },
      {
        title: '16.2 Severability',
        content:
          'If any provision of this DPA is found to be unenforceable, the remaining provisions shall remain in full force and effect.',
      },
      {
        title: '16.3 Entire Agreement',
        content:
          'This DPA, together with the Terms of Service, constitutes the entire agreement between the parties with respect to the processing of Personal Data and supersedes all prior agreements, understandings, and representations regarding the same subject matter.',
      },
      {
        title: '16.4 Amendments',
        content:
          'LoyalBase may update this DPA from time to time. Material changes will be communicated to Customer by email at least thirty (30) days in advance. Customer\'s continued use of the Services after the effective date of any change constitutes acceptance of the updated DPA. If Customer does not accept the changes, Customer may terminate its subscription as provided in the Terms of Service.',
      },
    ],
  },
];

export default function DpaPage() {
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
              Data Processing Agreement
            </h1>
            <p className="text-white/50 text-lg mb-3">LoyaltyOS Platform — DPA</p>
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
                                <li
                                  key={i}
                                  className="flex items-start gap-2.5 text-sm text-white/65"
                                >
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
                Data Protection Contact
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-3">
                For DPA inquiries, sub-processor objections, or data protection requests, contact us
                at{' '}
                <a
                  href="mailto:legal@loyalbase.dev"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  legal@loyalbase.dev
                </a>
              </p>
              <div
                className="mt-4 pt-4 space-y-1"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-white/35 text-xs">LoyalBase LLC</p>
                <p className="text-white/35 text-xs">7901 4th St N, Ste 300</p>
                <p className="text-white/35 text-xs">St. Petersburg, FL 33702, USA</p>
                <p className="text-white/35 text-xs">legal@loyalbase.dev</p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
