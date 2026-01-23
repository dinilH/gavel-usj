"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-20 bg-[#FCFCFD]">
      <div className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#781007] to-[#000000] bg-clip-text text-transparent">
              About Us
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gavel Club Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 relative">
                <Image
                  src="/logo.png"
                  alt="Gavel Club USJ"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-3">
                Gavel Club of University of Sri Jayewardenepura
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Gavel Club of the University of Sri Jayewardenepura, operating under the Career Guidance Unit, is a dynamic community affiliated with Toastmasters International. It develops public speaking and leadership skills through regular meetings, workshops, and events, providing a supportive environment for personal and professional growth.growth.
              </p>
            </div>
          </motion.div>

          {/* CGU Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-[#F8F9FA] rounded-xl p-8 shadow-sm border border-gray-200"
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 relative">
                <Image
                  src="/about-us/CGU%20logo.png"
                  alt="Career Guidance Unit"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-3">
                Career Guidance Unit
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Career Guidance Unit (CGU) was established to highlight the importance of 
                improving students{"'"} employability and career readiness. It includes student-led 
                clubs such as CSDS, Adventure Club, and Vikings Club, which provide diverse 
                opportunities for skill development, leadership, teamwork, and personal growth 
                beyond academics.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
