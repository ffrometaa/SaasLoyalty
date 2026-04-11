import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProofBar } from '@/components/landing/SocialProofBar';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { Testimonials } from '@/components/landing/Testimonials';
import { PricingPreview } from '@/components/landing/PricingPreview';
import { FoundingPartners } from '@/components/landing/FoundingPartners';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do my customers need to download an app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. LoyaltyOS is a Progressive Web App (PWA). Customers access it directly from their browser and can add it to their home screen in one tap — no App Store required, no friction for your customers.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I customize the points rules and rewards?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You set the points-per-dollar ratio, define tier thresholds (Bronze, Silver, Gold, Platinum), and create your own reward catalog. Customers earn at your pace, redeem on your terms.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does "white-label" mean exactly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your customers see your business name, your logo, and your colors — not LoyaltyOS. It looks and feels like a loyalty app you built yourself, at a fraction of the cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'How quickly can I get started?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most businesses are fully live within 24 to 48 hours. We handle the entire setup — you just share a QR code with your first customer.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my customer data secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We use bank-level encryption in transit and at rest, database-level isolation between all business accounts, and we never sell or share your customer data under any circumstances.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Cancel from your dashboard at any time. No long-term contracts, no cancellation fees. Your data remains available for export for 90 days after cancellation.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when my free trial ends?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "You'll receive an email reminder 3 days before your trial ends. If you don't add a payment method, your account is paused — not deleted. Your data stays safe for 30 days.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <FeaturesGrid />
      <HowItWorks />
      <DashboardPreview />
      <Testimonials />
      <PricingPreview />
      <FoundingPartners />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
