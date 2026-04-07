export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Effective date: April 7, 2026 · Version 1.0</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-slate-300 leading-relaxed">
              We collect information you provide directly (name, email, phone), information generated through your use of the service (transaction history, points balance, redemptions), and technical data (IP address, browser type, device information).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed">
              We use your information to operate and improve the loyalty program, send notifications about your account and rewards, comply with legal obligations, and prevent fraud.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Information Sharing</h2>
            <p className="text-slate-300 leading-relaxed">
              We share your information with the businesses whose loyalty programs you participate in. We do not sell your personal information to third parties. We may share information with service providers who assist in operating the platform under strict confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed">
              Depending on your location, you may have rights to access, correct, or delete your personal information. To exercise these rights, contact us at privacy@loyalbase.dev.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Cookies</h2>
            <p className="text-slate-300 leading-relaxed">
              We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              For privacy questions, contact us at privacy@loyalbase.dev.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
