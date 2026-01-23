import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { MemoriesSection } from "@/components/memories-section";
import { EventsSection } from "@/components/events-section";
import { AchievementsSection } from "@/components/achievements-section";
import { ExecutiveCommitteeSection } from "@/components/executive-committee-section";
import { PodcastsSection } from "@/components/podcasts-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <MemoriesSection />
      <EventsSection />
      <AchievementsSection />
      <ExecutiveCommitteeSection />
      <PodcastsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
