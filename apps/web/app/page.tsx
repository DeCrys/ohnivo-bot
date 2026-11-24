import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { CommunityTypes } from "@/components/marketing/community-types";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Faq } from "@/components/marketing/faq";
import { CtaSection } from "@/components/marketing/cta";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <CommunityTypes />
        <PricingSection />
        <Faq />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
