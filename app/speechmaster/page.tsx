import { Navbar } from "@/components/navbar";
import { SpeechMasterLanding } from "@/components/speechmaster";
import { Footer } from "@/components/footer";

export default function SpeechMasterPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <SpeechMasterLanding />
      <Footer />
    </main>
  );
}
