import { Footer } from "@/components/footer";
import { FlyerProofreader } from "@/components/flyer-proofreader";
import { Navbar } from "@/components/navbar";

export default function ProofreadPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <FlyerProofreader />
      <Footer />
    </main>
  );
}
