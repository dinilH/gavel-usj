"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
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
      className="relative py-40 md:py-36 flex items-center justify-center overflow-hidden"
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

      <motion.div
        style={{ opacity }}
        className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl relative z-10"
      >
        {/* Logo + Text */}
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 lg:gap-14">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Gavel Club Logo"
              width={200}
              height={200}
              className="w-32 md:w-44 lg:w-48"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="text-center md:text-left">
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-white text-balance leading-tight"
            >
              Gavel Club of <br />
              University of <br />
              Sri Jayawardenapura
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg sm:text-xl text-white/90 font-medium mb-4"
            >
             
            </motion.p>
          </div>

        </div>
      </motion.div>
    </section>
  );
}