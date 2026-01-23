"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax effects for desktop/tablet
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative py-25 md:py-48 flex items-center justify-center overflow-hidden"
    >
      {/* Full-width gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#781007] to-[#000000]" />

      {/* 3D Parallax decorative elements - desktop/tablet only */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl hidden md:block"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-20 left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl hidden md:block"
      />
      <motion.div
        style={{ y: y1 }}
        className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/3 rounded-full blur-2xl hidden md:block"
      />

      <motion.div style={{ opacity }} className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white text-balance"
          >
            Speech Master
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-white/90 font-medium mb-4"
          >
            Sri Lanka{"'"}s premium stage for public speaking
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Our Speech Master program offers structured training and personalized feedback to help
            you become a proficient and engaging speaker.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-white hover:bg-white/90 text-[#781007] px-8 py-6 text-xs rounded-lg font-semibold"
              onClick={() => window.open('https://forms.google.com', '_blank')}
            >
              Register Now
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
