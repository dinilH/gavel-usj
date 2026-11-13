import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Table Topics Voter | Gavel Club USJ",
  description:
    "Vote for table topics speakers in Gavel Club USJ educational meetings.",
};

export default function TTVoteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fef9f9]">
      <Navbar forceSolid />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
