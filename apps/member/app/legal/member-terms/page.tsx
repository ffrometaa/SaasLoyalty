export default function MemberTermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-10">Effective date: April 7, 2026 · Version 1.0</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              By accessing or using the LoyaltyOS member application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Use of Service</h2>
            <p className="text-slate-300 leading-relaxed">
              The LoyaltyOS member application allows you to participate in loyalty programs offered by participating businesses. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Points and Rewards</h2>
            <p className="text-slate-300 leading-relaxed">
              Points are awarded at the discretion of participating businesses and have no cash value unless explicitly stated. Points may expire as defined by the participating business. LoyaltyOS is not responsible for the redemption policies of individual businesses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              Your use of the service is also governed by our Privacy Policy. By using the service, you consent to the collection and use of information as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Modifications</h2>
            <p className="text-slate-300 leading-relaxed">
              LoyaltyOS reserves the right to modify these terms at any time. We will notify you of significant changes by requiring re-acceptance within the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Limitation of Liability</h2>
            <p className="text-slate-300 leading-relaxed">
              To the maximum extent permitted by law, LoyaltyOS shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              For questions about these terms, please contact us at legal@loyalbase.dev.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
