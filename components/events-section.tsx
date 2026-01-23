"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export function EventsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="events" className="py-20 bg-[#FCFCFD]">
      <div className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-6xl" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#781007] to-[#000000] bg-clip-text text-transparent">
              Events
            </span>
          </h2>
        </motion.div>

        {/* Events Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Gavel Educational Meeting */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group"
          >
            <div className="h-full rounded-2xl bg-white border border-border overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image at top */}
              <div className="aspect-video overflow-hidden relative">
                <Image
                  src="/events/1.jpg"
                  alt="Gavel Educational Meeting"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                  Gavel Educational Meeting
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gavel Educational Meetings are the heart of our club, providing a 
                  supportive platform to practice public speaking. Our weekly meetings 
                  include prepared speeches, Table Topics for impromptu speaking, and 
                  Round Robin evaluations, helping members consistently improve 
                  communication, confidence, and leadership skills.
                </p>
              </div>
            </div>
          </motion.div>

          {/* CC Marathon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group"
          >
            <div className="h-full rounded-2xl bg-white border border-border overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image at top */}
              <div className="aspect-video overflow-hidden relative">
                <Image
                  src="/events/2.jpg"
                  alt="CC Marathon"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                  CC Marathon
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  CC Marathon is an intensive program where members complete all 10 
                  communication projects, strengthening public speaking skills through 
                  continuous practice, feedback, and personal growth.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
