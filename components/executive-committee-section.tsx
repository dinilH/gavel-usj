"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Phone } from "lucide-react";
import Image from "next/image";

const executiveMembers = [
  { name: "Hrithika Sarvodayan", position: "President",image: "/exco/18.jpg" },
  { name: "Ranugi Fonseka", position: "Vice President – Education", image: "/exco/17.jpg" },
  { name: "Abina Jude", position: "Vice President – Membership", image: "/exco/16.jpg" },
  { name: "Nabeel Nawzar", position: "Vice President – Public Relations", image: "/exco/15.jpg" },
  { name: "Hajara Ghouse", position: "Secretary", image: "/exco/14.jpg" },
  { name: "Aini Yasir", position: "Co – Treasurer", image: "/exco/13.jpg" },
  { name: "Nirosh Varun", position: "Co – Treasurer", image: "/exco/12.jpg" },
  { name: "Shakira Thameem", position: "Editor", image: "/exco/11.jpg" },
  { name: "Abiram Mathivathanan", position: "Sergeant-At-Arms", image: "/exco/10.jpg" },
  { name: "Sajeela Sameel", position: "Toastmasters and Gavel Club Coordinator", image: "/exco/9.jpg" },
  { name: "Ruwanya Herath", position: "Co - Media Director", image: "/exco/8.jpg" },
  { name: "Malin Dhamsara", position: "Co - Media Director", image: "/exco/7.jpg" },
  { name: "Chamodi Ramanayake", position: "Educational Programs Director", image: "/exco/6.jpg" },
  { name: "Maryam Ariff", position: "Membership Affairs Director", image: "/exco/5.jpg" },
  { name: "Rukshana Rikaz", position: "Events Director", image: "/exco/4.jpg" },
  { name: "Dinil Hansara", position: "Webmaster", image: "/exco/3.jpg" },
  { name: "Minoli Perera", position: "CSR Director", image: "/exco/2.jpg" },
  { name: "Vasegaran Uthayathas", position: "PR Director", image: "/exco/1.jpg" },
];

export function ExecutiveCommitteeSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Parallax effect for desktop
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  // Split members into rows: 4, 4, 4, 4, 2
  const rows = [
    executiveMembers.slice(0, 4),
    executiveMembers.slice(4, 8),
    executiveMembers.slice(8, 12),
    executiveMembers.slice(12, 16),
    executiveMembers.slice(16, 18),
  ];

  return (
    <section id="committee" className="py-20 bg-[#FCFCFD] overflow-hidden">
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
              Executive Committee
            </span>
          </h2>
        </motion.div>

        {/* Cards Grid - 5 rows: 4, 4, 4, 4, 2 */}
        <motion.div style={{ y }} className="hidden md:block">
          <div className="space-y-6">
            {rows.map((row, rowIndex) => (
              <motion.div
                key={rowIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * rowIndex }}
                className={`grid gap-4 ${
                  rowIndex === 4 ? "grid-cols-2 max-w-[50%] mx-auto" : "grid-cols-4"
                }`}
              >
                {row.map((member, index) => (
                  <motion.div
                    key={`${member.name}-${rowIndex}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="flex-shrink-0"
                  >
                    <div className="h-full p-5 rounded-2xl bg-white border border-border hover:shadow-lg transition-all">
                      {/* Avatar with Image */}
                      <div className="flex justify-center mb-2">
                        <div className="w-28 h-28 rounded-full overflow-hidden bg-[#EEF1F4] relative">
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="text-center">
                        <h3 className="text-base font-bold text-foreground mb-1 break-words">
                          {member.name}
                        </h3>
                        <p className="text-[#781007] font-medium text-sm mb-2 line-clamp-2 min-h-[2rem]">
                          {member.position}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mobile Grid - 2 columns */}
        <div className="md:hidden grid grid-cols-2 gap-4">
          {executiveMembers.map((member, index) => (
            <motion.div
              key={`mobile-${member.name}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.05 * index }}
            >
              <div className="h-full p-5 rounded-2xl bg-white border border-border">
                <div className="flex justify-center mb-2">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#EEF1F4] relative">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-foreground mb-1 break-words">
                    {member.name}
                  </h3>
                  <p className="text-[#781007] font-medium text-sm mb-2 line-clamp-2 min-h-[2rem]">
                    {member.position}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
