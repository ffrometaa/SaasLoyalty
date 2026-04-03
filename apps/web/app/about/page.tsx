import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'About — LoyaltyOS',
  description: 'We built LoyaltyOS because local businesses deserve the same retention tools used by global brands.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <section className="py-24 px-6 text-center" style={{ background: '#0a0a0f' }}>
          <div className="max-w-3xl mx-auto">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
              About
            </span>
            <h1 className="font-display font-black text-white mb-5" style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}>
              Built for the businesses that build communities
            </h1>
            <p className="text-white/55 text-xl leading-relaxed">
              Local businesses are the backbone of every neighborhood. We built LoyaltyOS because they deserve the
              same retention tools used by global brands — without the $100K price tag.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 px-6" style={{ background: '#0d0d18' }}>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
                Our Mission
              </span>
              <h2 className="font-display font-black text-white text-3xl mb-5">
                Level the playing field for local businesses
              </h2>
              <p className="text-white/55 leading-relaxed mb-4">
                Starbucks has a $10M loyalty engineering team. Sephora has a dedicated retention science division.
                Your local spa? A spreadsheet and a prayer.
              </p>
              <p className="text-white/55 leading-relaxed">
                LoyaltyOS changes that. We pack enterprise-grade loyalty infrastructure into a platform that any
                business owner can set up in a day — no technical knowledge required.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { num: '14+', label: 'Businesses using LoyaltyOS' },
                { num: '48h', label: 'Average setup time' },
                { num: '40%', label: 'Avg. customer reactivation rate' },
              ].map((stat) => (
                <div
                  key={stat.num}
                  style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                  }}
                >
                  <div className="font-display font-black gradient-text text-3xl mb-1">{stat.num}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-6" style={{ background: '#0a0a0f' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
                What We Believe
              </span>
              <h2 className="font-display font-black text-white text-3xl">Our principles</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Simplicity wins',
                  body: "Business owners shouldn't need a developer to run a loyalty program. If it's not simple, it won't be used.",
                },
                {
                  title: 'Your brand, not ours',
                  body: "Your customers should never know LoyaltyOS exists. Every touchpoint should feel like it came from you.",
                },
                {
                  title: 'Data belongs to you',
                  body: 'Every customer record, every transaction, every email — it\'s yours. We are custodians, not owners.',
                },
              ].map((v) => (
                <div
                  key={v.title}
                  style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                    padding: '28px',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl mb-5"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                  />
                  <h3 className="font-display font-bold text-white text-lg mb-3">{v.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
        <Footer />
      </div>
    </>
  );
}
