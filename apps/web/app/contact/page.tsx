import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact — LoyaltyOS',
  description: 'Book a personalized demo for your business.',
};

export default async function ContactPage() {
  const t = await getTranslations('contact');

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: '#0a0a0f' }}>
        <div className="max-w-2xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
              {t('label')}
            </span>
            <h1 className="font-display font-black text-white mb-4" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
              {t('heading')}
            </h1>
            <p className="text-white/50 text-lg">
              {t('subheading')}
            </p>
          </div>

          <ContactForm />
        </div>
        <Footer />
      </div>
    </>
  );
}
