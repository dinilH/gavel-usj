"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

const timelineData = [
  {
    date: "23rd Oct",
    title: "REGISTRATIONS OPEN",
    description: "Kickstart your journey! Sign up and join the premier public speaking challenge.",
  },
  {
    date: "10th Nov",
    title: "WORKSHOP 01",
    description: "Gain insights and skills to shape your innovative speech ideas.",
  },
  {
    date: "14th Nov",
    title: "REGISTRATIONS CLOSING",
    description: "Last call to register and be part of the competition.",
  },
  {
    date: "15th Nov",
    title: "INTRODUCTORY SESSION",
    description: "Get to know the competition, teams, and what lies ahead.",
  },
  {
    date: "16th Nov",
    title: "SUBMISSIONS OPENING",
    description: "Begin submitting your speech drafts and technical requirements.",
  },
];

export function SpeechMasterLanding() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="bg-black text-white">
      {/* --- HERO SECTION --- */}
      <section
        ref={ref}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#781007] via-black to-black" />
        
        <motion.div style={{ y: y1 }} className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl hidden md:block" />
        <motion.div style={{ y: y1 }} className="absolute bottom-20 left-20 w-80 h-80 bg-[#781007]/10 rounded-full blur-3xl hidden md:block" />

        <motion.div style={{ opacity }} className="container mx-auto px-6 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter"
          >
            Speech Master
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/80 font-medium mb-6"
          >
            Sri Lanka{"'"}s premium stage for public speaking
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-sm text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Speech Master is a prestigious competition with separate school and university sections. 
            We provide workshops designed to nurture communication skills and boost confidence.
          </motion.p>
          <Button
            size="lg"
            className="bg-white hover:bg-[#781007] hover:text-white text-[#781007] px-10 py-7 text-sm rounded-lg font-bold transition-all shadow-xl"
            onClick={() => window.open('https://forms.gle/nUtv4GRFCBj4Cneu7', '_blank')}
          >
            REGISTER NOW
          </Button>
        </motion.div>
      </section>

      {/* --- TIMELINE SECTION --- */}
      <section className="relative py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-widest">
              Event <span className="text-[#781007]">Roadmap</span>
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Center Line */}
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-[1px] bg-gradient-to-b from-[#781007] via-white/20 to-transparent" />

            <div className="space-y-16">
              {timelineData.map((item, index) => (
                <TimelineItem key={index} item={item} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TimelineItem({ item, index }: { item: any; index: number }) {
  const isLeft = index % 2 !== 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className={`relative flex items-center justify-between w-full ${
        isLeft ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <div className="hidden md:block w-5/12" />
      <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-3 h-3 rounded-full bg-[#781007] z-20 shadow-[0_0_15px_#781007]" />
      <div className="w-full md:w-5/12 pl-12 md:pl-0">
        <div className="p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-sm hover:border-[#781007]/40 transition-all group">
          <span className="text-[#781007] font-bold text-xs uppercase mb-2 block tracking-widest">
            {item.date}
          </span>
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#781007] transition-colors">
            {item.title}
          </h3>
          <p className="text-white/50 text-sm leading-relaxed font-light">
            {item.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}