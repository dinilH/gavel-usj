import { Navbar } from "@/components/navbar";
import { SpeechMasterSection } from "@/components/speechmaster";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default function SpeechMasterPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <SpeechMasterSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
