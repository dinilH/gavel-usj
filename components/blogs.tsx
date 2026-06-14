"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/lib/db";

interface BlogsSectionProps {
  blogs: BlogPost[];
}

export function BlogsSection({ blogs = [] }: BlogsSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  // Filter for published blogs and take the 3 most recent
  const publishedBlogs = blogs.filter((blog) => blog.published).slice(0, 3);

  if (publishedBlogs.length === 0) {
    return null; // Don't show the section if no blogs exist
  }

  return (
    <section id="blogs" className="py-24 bg-[#FCFCFD]">
      <div className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-left">
              <span className="bg-gradient-to-r from-[#781007] to-[#000000] bg-clip-text text-transparent">
                Latest Insights
              </span>
            </h2>
            <p className="text-sm text-zinc-500 max-w-md text-left">
              Stay updated with the latest stories, public speaking tips, and achievements from our members.
            </p>
          </div>
          
          <Link href="/blogs" className="mt-4 md:mt-0 inline-flex">
            <Button
              variant="outline"
              className="group border-[#781007] text-[#781007] hover:bg-[#781007] hover:text-white rounded-full px-6 py-5 font-semibold transition-all duration-300 cursor-pointer"
            >
              View All Blogs 
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {publishedBlogs.map((blog, index) => {
            // Rough reading time calculation (approx 200 words per minute)
            const wordCount = blog.content ? blog.content.split(/\s+/).length : 0;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -6 }}
                className="group flex flex-col h-full rounded-2xl bg-white border border-zinc-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <Link href={`/blogs/${blog.slug}`} className="block flex-1 flex flex-col">
                  {/* Cover Image */}
                  <div className="aspect-video relative overflow-hidden bg-zinc-50 border-b border-zinc-50">
                    <Image
                      src={blog.coverImage || "/public/placeholder.jpg"}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[#781007] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <BookOpen className="w-3 h-3" /> {readTime} min read
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs sm:text-sm text-zinc-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(blog.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {blog.author}
                      </span>
                    </div>

                    {/* Title & Excerpt */}
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#781007] transition-colors line-clamp-2 mb-2 leading-snug">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-3 mb-4 leading-relaxed">
                      {blog.excerpt || "Click to read the full blog post and learn more."}
                    </p>

                    {/* Read More Link (Push to bottom) */}
                    <div className="mt-auto pt-2 text-sm font-bold text-[#781007] flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read Article <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
