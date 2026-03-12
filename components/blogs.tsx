"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const podcasts = [
  {
    title: "The Art of Public Speaking",
    episode: "Season 1",
    videoId: "fjatziEfMKE",
    url: "https://www.youtube.com/watch?v=fjatziEfMKE&list=PLvdU290sAuY7Pxap4Wbd_qoAitx56js5_",
  },
  {
    title: "Leadership Insights",
    episode: "Season 2",
    videoId: "h2Po1IGiRQM",
    url: "https://www.youtube.com/watch?v=h2Po1IGiRQM&list=PLvdU290sAuY75ne_yWaj9yHiCN_33qZC7",
  },
];

export function BlogsSection() {
  const ref = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section id="podcasts" className="py-20 bg-[#FCFCFD]" style={{ perspective: "1000px" }}>
      <div className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#781007] to-[#000000] bg-clip-text text-transparent">
                Blogs
              </span>
            </h2>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="rounded-full border-border hover:border-[#781007] hover:text-[#781007]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="rounded-full border-border hover:border-[#781007] hover:text-[#781007]"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Podcasts Carousel */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {podcasts.map((podcast, index) => (
            <motion.div
              key={podcast.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="flex-shrink-0 w-72 snap-start group"
            >
              <a
                href={podcast.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full rounded-2xl bg-white border border-border hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* YouTube Thumbnail */}
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${podcast.videoId}/maxresdefault.jpg`}
                    alt={podcast.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#781007] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <span className="text-xs text-[#781007] font-medium">
                    {podcast.episode}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-1">{podcast.title}</h3>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
