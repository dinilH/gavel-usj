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

        {/* About Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Gavel Club Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
          >
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

            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-3">
                Gavel Club of University of Sri Jayewardenepura
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                The Gavel Club of University of Sri Jayewardenepura stands as one
                of the prestigious clubs within the university. Affiliated with
                Toastmasters International, the Club serves as a structured
                platform for undergraduates to develop effective communication
                and public speaking skills.
                <br /><br />
                With a legacy spanning over 14 years, the Club operates under
                the guidance of the Career Guidance Unit (CGU) and has made
                substantial contributions to enhancing the professional
                communication competencies of the student community.
                <br /><br />
                Over the years, the Club has produced accomplished speakers and
                leaders who have represented the University with distinction
                across diverse platforms, upholding its reputation for
                excellence and professionalism.
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

            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-3">
                Career Guidance Unit
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                The Career Guidance Unit (CGU) was established to highlight the
                importance of improving students' employability and career
                readiness. It includes student-led clubs such as CSDS,
                Adventure Club, and Vikings Club, which provide diverse
                opportunities for skill development, leadership, teamwork, and
                personal growth beyond academics.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Vision & Mission */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          
          {/* Vision */}
          <div className="mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#781007] to-[#000000] bg-clip-text text-transparent">
                Our Vision
              </span>
            </h3>

            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              To create a safe and empowering space where individuals discover
              their voice, grow in confidence, and lead with purpose — shaping
              communicators who inspire positive change in the world.
            </p>
          </div>

          {/* Mission */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#781007] to-[#000000] bg-clip-text text-transparent">
                Our Mission
              </span>
            </h3>

            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              To foster an inclusive and supportive community that nurtures
              confident communication and compassionate leadership. Through
              meaningful engagement and experiential learning, empowering
              individuals to express themselves with clarity, empathy, and
              purpose, creating impact both within and beyond the Gavel space.
            </p>
          </div>

        </motion.div>

      </div>
    </section>
  );
}