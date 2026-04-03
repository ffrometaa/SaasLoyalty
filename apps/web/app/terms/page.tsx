import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service — LoyaltyOS',
  description: 'LoyaltyOS Platform B2B SaaS Agreement. Read our terms of service before using the platform.',
};

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    content: [
      'These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between LoyaltyOS, LLC, a company organized under the laws of the State of Florida ("LoyaltyOS," "Company," "we," "us," or "our") and the entity or individual ("Customer," "Tenant," "you," or "your") accessing or using the LoyaltyOS platform and related services.',
      'BY CLICKING "I AGREE," COMPLETING THE REGISTRATION PROCESS, OR ACCESSING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, DO NOT ACCESS OR USE THE PLATFORM.',
      'If you are accepting these Terms on behalf of a business or other legal entity, you represent and warrant that you have the authority to bind that entity to these Terms, in which case "you" and "your" will refer to that entity.',
    ],
  },
  {
    heading: '2. Description of Services',
    content: [
      'LoyaltyOS provides a multi-tenant, white-label Software-as-a-Service ("SaaS") platform that enables businesses ("Tenants") to create, manage, and operate customer loyalty and membership programs. Services include, but are not limited to:',
    ],
    list: [
      'A branded web application ("Member App") for end-user members of Tenant businesses',
      'An administrative dashboard for Tenant business owners and staff',
      'Automated customer retention and reactivation campaign tools',
      'Points, rewards, and membership management systems',
      'Analytics, reporting, and business intelligence features',
      'Appointment and booking management integrations',
      'Push notification and email marketing tools',
      'White-label branding capabilities including custom domains',
    ],
    footer: 'LoyaltyOS reserves the right to modify, enhance, or discontinue any feature or service with reasonable prior notice, except where required by law to provide additional notice.',
  },
  {
    heading: '3. Eligibility and Account Registration',
    subheadings: [
      {
        title: '3.1 Eligibility Requirements',
        content: 'To access and use LoyaltyOS, you must:',
        list: [
          'Be at least 18 years of age',
          'Be a legally formed business entity or self-employed individual operating lawfully in your jurisdiction',
          'Have the legal capacity to enter into binding contracts under applicable law',
          'Not be located in a country subject to U.S. government embargo or designated as a "terrorist supporting" country by the U.S. government',
          'Not be listed on any U.S. government list of prohibited or restricted parties',
        ],
      },
      {
        title: '3.2 Account Security',
        content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to: (a) provide accurate, current, and complete registration information; (b) maintain and promptly update your account information; (c) notify LoyaltyOS immediately at security@loyaltyos.com of any unauthorized access or use of your account; and (d) be responsible for all activities that occur under your account. LoyaltyOS will not be liable for any loss or damage arising from your failure to maintain the security of your account credentials.',
      },
    ],
  },
  {
    heading: '4. Subscription Plans and Payment Terms',
    subheadings: [
      {
        title: '4.1 Subscription Plans',
        content: 'LoyaltyOS offers the following subscription tiers, subject to change with thirty (30) days notice. Please refer to our pricing page for current plan details and pricing.',
      },
      {
        title: '4.2 Free Trial',
        content: 'LoyaltyOS may offer a fourteen (14) day free trial period at its sole discretion. No credit card is required during the trial period. Upon expiration of the trial, access to the Platform will be suspended unless a paid subscription is activated. Trial periods are limited to one per business entity.',
      },
      {
        title: '4.3 Billing and Payment',
        content: 'All fees are due in advance and are payable in United States Dollars (USD). Payment is processed through Stripe, Inc., a third-party payment processor. By providing payment information, you authorize LoyaltyOS to charge your designated payment method on a recurring basis for the applicable subscription fees. All sales are final. LoyaltyOS does not offer refunds for partial subscription periods, except as required by applicable law.',
      },
      {
        title: '4.4 Automatic Renewal',
        content: 'Subscriptions automatically renew at the end of each billing period (monthly or annual) unless canceled by the Customer at least twenty-four (24) hours before the renewal date. You may cancel your subscription through your account dashboard or by contacting billing@loyaltyos.com.',
      },
      {
        title: '4.5 Late Payment and Suspension',
        content: 'If payment fails, LoyaltyOS will attempt to charge the payment method on file for up to seven (7) days. If payment remains outstanding after this period, LoyaltyOS reserves the right to suspend or terminate your access to the Platform without further notice. You remain liable for all outstanding amounts.',
      },
      {
        title: '4.6 Taxes',
        content: 'All fees are exclusive of applicable taxes. LoyaltyOS uses Stripe Tax to automatically calculate and collect applicable sales tax based on your location and the nature of the services provided. You are responsible for all applicable taxes, levies, or duties imposed by taxing authorities.',
      },
    ],
  },
  {
    heading: '5. Acceptable Use Policy',
    subheadings: [
      {
        title: '5.1 Permitted Uses',
        content: 'You may use the LoyaltyOS platform solely for lawful business purposes in accordance with these Terms. You agree to use the Platform in compliance with all applicable federal, state, and local laws and regulations, including but not limited to the CAN-SPAM Act, the Telephone Consumer Protection Act (TCPA), and the Florida Electronic Communications Act.',
      },
      {
        title: '5.2 Prohibited Activities',
        content: 'You agree NOT to use the Platform to:',
        list: [
          'Violate any applicable law, regulation, or third-party rights',
          'Send unsolicited commercial electronic communications (spam) to end users',
          'Collect or process personal data without proper legal basis or required consents',
          'Transmit malware, viruses, or any code designed to disrupt, damage, or gain unauthorized access to systems',
          'Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Platform',
          'Resell, sublicense, or otherwise transfer access to the Platform to third parties without written authorization from LoyaltyOS',
          'Use the Platform to collect or process payment card data in a manner that violates PCI DSS standards',
          'Engage in discriminatory practices based on race, color, national origin, religion, sex, disability, age, or any other characteristic protected by applicable law',
          'Use the Platform in any manner that could damage, overburden, or impair the servers or networks connected to the Platform',
        ],
      },
    ],
  },
  {
    heading: '6. Data, Privacy, and Security',
    subheadings: [
      {
        title: '6.1 Customer Data',
        content: '"Customer Data" means all data, content, and information that you or your end users submit, upload, or generate through the Platform, including personal information about your customers ("Member Data"). You retain full ownership of all Customer Data. LoyaltyOS processes Customer Data solely to provide and improve the Services in accordance with these Terms and our Privacy Policy.',
      },
      {
        title: '6.2 Data Processing',
        content: 'You are the data controller of Member Data. LoyaltyOS acts as a data processor on your behalf. You are solely responsible for ensuring that you have obtained all necessary consents and legal bases required to collect, process, and transfer Member Data to LoyaltyOS.',
      },
      {
        title: '6.3 Data Security',
        content: 'LoyaltyOS implements commercially reasonable administrative, technical, and physical safeguards designed to protect Customer Data against unauthorized access, alteration, disclosure, or destruction. These measures include: (a) encryption of data in transit using TLS 1.2 or higher; (b) encryption of sensitive data at rest; (c) role-based access controls and multi-factor authentication; (d) regular security assessments; and (e) logical data isolation between tenants using database-level Row Level Security (RLS).',
      },
      {
        title: '6.4 Data Breach Notification',
        content: 'In the event of a security breach affecting your Customer Data, LoyaltyOS will notify you without undue delay and in no event later than seventy-two (72) hours after becoming aware of the breach, as required by the Florida Information Protection Act (Fla. Stat. § 501.171) and applicable federal law.',
      },
      {
        title: '6.5 Data Retention and Deletion',
        content: 'LoyaltyOS retains Customer Data for the duration of your active subscription plus ninety (90) days following termination. Upon written request submitted within this period, LoyaltyOS will provide an export of your Customer Data in a machine-readable format. After the retention period, Customer Data is permanently deleted from LoyaltyOS systems, except where retention is required by applicable law.',
      },
    ],
  },
  {
    heading: '7. Intellectual Property Rights',
    subheadings: [
      {
        title: '7.1 LoyaltyOS IP',
        content: 'LoyaltyOS and its licensors retain all right, title, and interest in and to the Platform, including all software, algorithms, interfaces, documentation, trademarks, service marks, trade names, and other intellectual property ("LoyaltyOS IP"). These Terms grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform solely for your internal business purposes during the term of your subscription. No other rights are granted.',
      },
      {
        title: '7.2 Customer IP',
        content: 'You retain all right, title, and interest in and to your Customer Data, branding assets, and any content you upload to the Platform. You grant LoyaltyOS a limited, non-exclusive, worldwide license to use, store, reproduce, and display your Customer Data and branding assets solely to the extent necessary to provide the Services.',
      },
      {
        title: '7.3 Feedback',
        content: 'If you provide LoyaltyOS with any suggestions, ideas, enhancement requests, or other feedback regarding the Platform ("Feedback"), you grant LoyaltyOS a perpetual, irrevocable, royalty-free, worldwide license to use, incorporate, and commercialize such Feedback without restriction and without any obligation to you.',
      },
    ],
  },
  {
    heading: '8. Confidentiality',
    content: [
      'Each party ("Receiving Party") agrees to hold in strict confidence all non-public information disclosed by the other party ("Disclosing Party") that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure ("Confidential Information"). Each party agrees to: (a) use Confidential Information only to fulfill its obligations under these Terms; (b) not disclose Confidential Information to third parties without prior written consent; and (c) protect Confidential Information with at least the same degree of care used for its own similar confidential information, but in no event less than reasonable care.',
    ],
  },
  {
    heading: '9. Warranties and Disclaimers',
    subheadings: [
      {
        title: '9.1 LoyaltyOS Warranties',
        content: 'LoyaltyOS warrants that: (a) it has the authority to enter into these Terms; (b) the Platform will perform materially in accordance with its documentation under normal use; and (c) it will implement commercially reasonable security measures to protect Customer Data.',
      },
      {
        title: '9.2 Disclaimer of Warranties',
        content: 'EXCEPT AS EXPRESSLY SET FORTH IN SECTION 9.1, THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LOYALTYOS DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. LOYALTYOS DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.',
      },
    ],
  },
  {
    heading: '10. Limitation of Liability',
    content: [
      'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL LOYALTYOS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE PLATFORM, EVEN IF LOYALTYOS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
      "LOYALTYOS'S TOTAL CUMULATIVE LIABILITY TO YOU ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE TOTAL FEES PAID BY YOU TO LOYALTYOS IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED DOLLARS ($100.00).",
      'SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN WARRANTIES OR LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.',
    ],
  },
  {
    heading: '11. Indemnification',
    content: [
      'You agree to indemnify, defend, and hold harmless LoyaltyOS, its affiliates, officers, directors, employees, agents, and licensors from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys\' fees) arising out of or related to: (a) your use of the Platform in violation of these Terms; (b) your violation of any applicable law or third-party rights; (c) your Customer Data, including any claim that such data infringes any third-party intellectual property rights or violates any privacy law; (d) your collection or processing of Member Data without required consents; or (e) any products or services offered by you to your customers.',
    ],
  },
  {
    heading: '12. Term and Termination',
    subheadings: [
      {
        title: '12.1 Term',
        content: 'These Terms commence on the date you first access the Platform and continue for the duration of your active subscription, including any renewal periods.',
      },
      {
        title: '12.2 Termination by Customer',
        content: 'You may cancel your subscription at any time through your account dashboard. Cancellation takes effect at the end of the current billing period. No refunds are issued for the remaining portion of any prepaid subscription period.',
      },
      {
        title: '12.3 Termination by LoyaltyOS',
        content: 'LoyaltyOS may suspend or terminate your access to the Platform immediately upon written notice if: (a) you materially breach these Terms and fail to cure such breach within fifteen (15) days of notice; (b) you fail to pay fees when due; (c) you become insolvent, make an assignment for the benefit of creditors, or become subject to bankruptcy proceedings; or (d) continued provision of the Platform would violate applicable law.',
      },
      {
        title: '12.4 Effect of Termination',
        content: 'Upon termination: (a) all rights and licenses granted to you under these Terms immediately cease; (b) you must cease all use of the Platform; (c) LoyaltyOS will retain your Customer Data for ninety (90) days during which you may request an export; and (d) all provisions of these Terms that by their nature should survive will survive termination, including Sections 7, 8, 9, 10, 11, and 14.',
      },
    ],
  },
  {
    heading: '13. Governing Law and Dispute Resolution',
    subheadings: [
      {
        title: '13.1 Governing Law',
        content: 'These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. The United Nations Convention on Contracts for the International Sale of Goods does not apply to these Terms.',
      },
      {
        title: '13.2 Dispute Resolution',
        content: 'Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or validity thereof, shall be resolved through binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules. Arbitration shall take place in Palm Beach County, Florida. The arbitrator\'s award shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.',
      },
      {
        title: '13.3 Class Action Waiver',
        content: 'YOU AND LOYALTYOS AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.',
      },
      {
        title: '13.4 Venue',
        content: 'For any matters not subject to arbitration, you consent to the exclusive jurisdiction and venue of the state and federal courts located in Palm Beach County, Florida.',
      },
    ],
  },
  {
    heading: '14. General Provisions',
    list: [
      'Entire Agreement: These Terms, together with the Privacy Policy and any executed Order Forms, constitute the entire agreement between the parties with respect to the Platform and supersede all prior agreements.',
      'Amendments: LoyaltyOS reserves the right to modify these Terms at any time. We will provide at least thirty (30) days notice of material changes via email or in-platform notification. Continued use of the Platform after the effective date of changes constitutes acceptance.',
      'Severability: If any provision of these Terms is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.',
      'Waiver: Failure by either party to enforce any provision of these Terms shall not constitute a waiver of that party\'s right to enforce such provision in the future.',
      'Force Majeure: Neither party shall be liable for delays or failures in performance resulting from causes beyond that party\'s reasonable control, including acts of God, natural disasters, war, terrorism, labor disputes, or internet service disruptions.',
      'Assignment: You may not assign these Terms or any rights or obligations hereunder without the prior written consent of LoyaltyOS. LoyaltyOS may freely assign these Terms in connection with a merger, acquisition, or sale of assets.',
      'Notices: Legal notices to LoyaltyOS must be sent in writing to legal@loyaltyos.com or to the registered business address of LoyaltyOS, LLC in Florida.',
    ],
  },
];

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-white/50 text-lg mb-3">LoyaltyOS Platform — B2B SaaS Agreement</p>
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
                          <p className="text-white/65 text-sm leading-relaxed mb-3">{sub.content}</p>
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
              <h2 className="font-display font-bold text-white text-lg mb-3">Contact</h2>
              <p className="text-white/55 text-sm leading-relaxed">
                Questions about these Terms? Contact us at{' '}
                <a href="mailto:legal@loyaltyos.com" className="text-purple-400 hover:text-purple-300 transition-colors">
                  legal@loyaltyos.com
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
