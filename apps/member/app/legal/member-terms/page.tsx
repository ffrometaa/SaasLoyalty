export default function MemberTermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-2">Member Terms of Use</h1>
        <p className="text-slate-400 text-sm mb-10">
          LoyaltyOS Platform — End User Agreement · Effective Date: April 7, 2026 · Version 1.0
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. What This Agreement Covers</h2>
            <p className="text-slate-300 leading-relaxed">
              These Member Terms of Use (&ldquo;Member Terms&rdquo;) govern your use of loyalty program
              applications (&ldquo;Member App&rdquo;) powered by the LoyaltyOS platform. When you create an
              account or participate in a loyalty program through a Member App, you agree to these Member Terms.
            </p>
            <p className="text-slate-300 leading-relaxed mt-3">
              The Member App you use is operated by a business (&ldquo;Business&rdquo; or &ldquo;Merchant&rdquo;)
              that has subscribed to the LoyaltyOS platform. LoyalBase LLC (&ldquo;LoyalBase,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides the technology that powers
              the Member App on behalf of the Business.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Who Controls Your Data</h2>
            <p className="text-slate-300 leading-relaxed">
              Your Business is responsible for deciding what data is collected about you and how it is used
              in connection with their loyalty program. LoyalBase processes your data on behalf of the Business
              as a technology provider. This means:
            </p>
            <ul className="mt-3 space-y-2 ml-4">
              {[
                'The Business is the "data controller" — they decide why and how your data is used for their loyalty program.',
                'LoyalBase is the "data processor" — we store and process your data only as needed to operate the platform on the Business\'s behalf.',
                "Questions about how a specific Business uses your loyalty data should be directed to that Business.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Information We Collect</h2>
            <p className="text-slate-300 leading-relaxed mb-3">
              When you use a Member App, the following information may be collected and processed:
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white/80 mb-1">Information you provide directly:</p>
                <ul className="space-y-1 ml-4">
                  {[
                    'Your name, email address, and password when you create an account',
                    'Your phone number (if you choose to provide it)',
                    'Your date of birth (if you choose to provide it)',
                    'Your notification preferences and communication opt-ins',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-white/80 mb-1">Information generated through your participation:</p>
                <ul className="space-y-1 ml-4">
                  {[
                    'Points balance, tier status, and rewards earned',
                    'Transaction history and reward redemptions',
                    'Visit history and check-in timestamps',
                    'Challenge and mission progress',
                    'Referral activity (only with your explicit consent)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-white/80 mb-1">Information collected automatically:</p>
                <ul className="space-y-1 ml-4">
                  {[
                    'Device type, operating system, and browser type',
                    'IP address and approximate location',
                    'Push notification tokens (if you enable notifications)',
                    'App usage patterns and session data',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. How Your Information Is Used</h2>
            <p className="text-slate-300 leading-relaxed mb-3">Your information is used to:</p>
            <ul className="space-y-2 ml-4">
              {[
                'Operate your loyalty program account: track points, tiers, rewards, and visit history',
                'Send you notifications about your rewards, challenges, and loyalty status (with your consent)',
                'Send you promotional communications from the Business (with your consent)',
                'Generate analytics and reports for the Business about their loyalty program',
                'Power automated campaigns such as reactivation messages or special offers configured by the Business',
                'Maintain the security and integrity of your account',
                'Comply with legal obligations',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Third-Party Service Providers</h2>
            <p className="text-slate-300 leading-relaxed mb-3">
              To operate the platform, LoyalBase uses the following third-party service providers who may
              process your data:
            </p>
            <ul className="space-y-2 ml-4">
              {[
                'Supabase, Inc. — Database hosting and authentication',
                'Vercel, Inc. — Application hosting',
                'Stripe, Inc. — Payment processing (if applicable)',
                'OneSignal, Inc. — Push notifications',
                'Resend, Inc. — Email delivery',
                'Sentry, Inc. — Error monitoring (anonymized data only)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-slate-300 leading-relaxed mt-3">
              These providers are contractually required to process your data only as directed by LoyalBase
              and to maintain appropriate security measures. LoyalBase does not sell, rent, or trade your
              personal information to third parties for their marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Push Notifications and Email Communications</h2>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white/90">Push Notifications:</strong> If you enable push notifications
              on your device, you may receive messages about your rewards, challenges, promotions, and loyalty
              status. You can disable push notifications at any time through your device settings or within
              the Member App.
            </p>
            <p className="text-slate-300 leading-relaxed mt-3">
              <strong className="text-white/90">Email Communications:</strong> With your consent, you may
              receive emails related to your loyalty account, including transactional messages (points earned,
              rewards available) and promotional messages from the Business. Every promotional email includes
              an unsubscribe link. Unsubscribe requests are honored within ten (10) business days. All
              electronic communications comply with the CAN-SPAM Act (15 U.S.C. § 7701) and the TCPA where
              applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed mb-3">
              You have the following rights regarding your personal information:
            </p>
            <ul className="space-y-2 ml-4">
              {[
                'Access: Request a copy of the personal information we hold about you.',
                'Correction: Request correction of inaccurate or incomplete information.',
                'Deletion: Request deletion of your personal information, subject to legal retention requirements.',
                'Portability: Request your data in a structured, machine-readable format.',
                'Opt-Out: Opt out of promotional communications at any time.',
                'Withdraw Consent: Withdraw your consent to data processing at any time, which may affect your ability to participate in the loyalty program.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-slate-300 leading-relaxed mt-3">
              To exercise any of these rights, contact{' '}
              <a href="mailto:privacy@loyalbase.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
                privacy@loyalbase.dev
              </a>
              . We will respond within thirty (30) days. Florida residents have additional rights under the
              Florida Information Protection Act (FIPA), Fla. Stat. § 501.171, including the right to receive
              notification of data breaches and to file complaints with the Florida Office of the Attorney
              General.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Data Security</h2>
            <p className="text-slate-300 leading-relaxed mb-3">
              LoyalBase implements technical and organizational security measures to protect your information,
              including:
            </p>
            <ul className="space-y-2 ml-4">
              {[
                'Encryption of data in transit (TLS 1.2 or higher) and at rest',
                'Database-level isolation between different Businesses using Row Level Security',
                'Role-based access controls and monitoring',
                'Regular security assessments',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-slate-300 leading-relaxed mt-3">
              No system is 100% secure. In the event of a data breach affecting your information, we will
              notify affected parties as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              Your loyalty program data is retained for the duration of the Business&apos;s active subscription
              to LoyalBase plus thirty (30) days. Transaction records may be retained for up to seven (7) years
              for legal and tax compliance purposes. You may request deletion of your account at any time by
              contacting{' '}
              <a href="mailto:privacy@loyalbase.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
                privacy@loyalbase.dev
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Children&apos;s Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              The Member App is not directed to children under the age of 13. We do not knowingly collect
              personal information from children under 13. If you are under 13, do not create an account.
              If we become aware that we have collected information from a child under 13 without verifiable
              parental consent, we will delete that information promptly. Contact{' '}
              <a href="mailto:privacy@loyalbase.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
                privacy@loyalbase.dev
              </a>{' '}
              if you believe a child under 13 has created an account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Multiple Memberships</h2>
            <p className="text-slate-300 leading-relaxed">
              Your LoyaltyOS account may be associated with loyalty programs from multiple Businesses. Each
              Business independently controls their loyalty program. Your participation in one Business&apos;s
              program does not grant another Business access to your activity in a different program. Data
              isolation between Businesses is enforced at the database level.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Changes to These Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update these Member Terms from time to time. When we make material changes, we will
              notify you by email and/or by displaying a notice within the Member App. You will be asked to
              review and accept the updated terms before continuing to use the Member App. If you do not
              accept the updated terms, your account will remain active in read-only mode until you accept
              or request deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">13. Governing Law</h2>
            <p className="text-slate-300 leading-relaxed">
              These Member Terms are governed by the laws of the State of Florida, without regard to conflict
              of law provisions. Any disputes shall be resolved through binding arbitration administered by
              the American Arbitration Association in Palm Beach County, Florida.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">14. Contact Information</h2>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <strong className="text-white/80">Privacy Questions:</strong>{' '}
                <a href="mailto:privacy@loyalbase.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
                  privacy@loyalbase.dev
                </a>
              </p>
              <p>
                <strong className="text-white/80">Account Support:</strong>{' '}
                <a href="mailto:support@loyalbase.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
                  support@loyalbase.dev
                </a>
              </p>
              <p>
                <strong className="text-white/80">Legal Inquiries:</strong>{' '}
                <a href="mailto:legal@loyalbase.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
                  legal@loyalbase.dev
                </a>{' '}
                · +1(561) 408-5283
              </p>
              <p className="text-slate-400 mt-3">
                LoyalBase LLC · 7901 4th St N, Ste 300, St. Petersburg, FL 33702, USA
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
