"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const allMemories = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
  { id: 8 },
];

export function MemoriesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showAll, setShowAll] = useState(false);

  // 4 columns x 3 rows = 12 items max initially
  const maxInitialItems = 12;
  const hasMore = allMemories.length > maxInitialItems;
  const displayedMemories = showAll ? allMemories : allMemories.slice(0, maxInitialItems);

  return (
    <section className="py-20 bg-[#EEF1F4]">
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
              Our Memories
            </span>
          </h2>
        </motion.div>

        {/* Gallery Grid - max 3 rows with vertical scroll when expanded */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`${showAll ? "max-h-[600px] overflow-y-auto pr-2" : ""}`}
          style={showAll ? { scrollbarWidth: "thin" } : {}}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayedMemories.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.05 * (index % 12) }}
                whileHover={{ scale: 1.02 }}
                className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer shadow-sm"
              >
                <Image
                  src={`/memories/${item.id}.jpg`}
                  alt={`Memory ${item.id}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Show More Button */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-8"
          >
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              className="border-[#781007] text-[#781007] hover:bg-[#781007] hover:text-white px-8"
            >
              {showAll ? "Show Less" : "Show More"}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
