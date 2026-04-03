import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProofBar } from '@/components/landing/SocialProofBar';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { Testimonials } from '@/components/landing/Testimonials';
import { PricingPreview } from '@/components/landing/PricingPreview';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <FeaturesGrid />
      <HowItWorks />
      <DashboardPreview />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
