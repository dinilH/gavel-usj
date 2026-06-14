import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getBlogs } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

interface BlogsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10) || 1;
  
  const blogs = await getBlogs();
  const publishedBlogs = blogs.filter((b) => b.published);
  
  const LIMIT = 6;
  const totalBlogs = publishedBlogs.length;
  const totalPages = Math.ceil(totalBlogs / LIMIT) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const offset = (currentPage - 1) * LIMIT;
  const paginatedBlogs = publishedBlogs.slice(offset, offset + LIMIT);

  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col font-sans">
      <Navbar />
      
      {/* Page Header */}
      <section className="relative py-20 bg-gradient-to-br from-[#0c0201] via-[#3a0b07] to-black text-white overflow-hidden mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#781007]/15 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl text-center relative z-10">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors gap-2 mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            The Gavel USJ Blog
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm sm:text-base font-medium">
            Explore articles on public speaking, leadership, Gavel activities, and member achievements.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-8 sm:px-6 lg:px-8 max-w-5xl py-16">
        {publishedBlogs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
            <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-700">No blog posts published yet</h3>
            <p className="text-zinc-500 mt-1 text-sm">Please check back later or visit our home page.</p>
            <Link href="/" className="mt-6 inline-flex">
              <button className="bg-[#781007] hover:bg-[#9c150a] text-white px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer">
                Back to Home
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Blogs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedBlogs.map((blog) => {
                const wordCount = blog.content ? blog.content.split(/\s+/).length : 0;
                const readTime = Math.max(1, Math.ceil(wordCount / 200));

                return (
                  <article
                    key={blog.id}
                    className="group flex flex-col h-full rounded-2xl bg-white border border-zinc-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <Link href={`/blogs/${blog.slug}`} className="block flex-1 flex flex-col">
                      {/* Cover Image */}
                      <div className="aspect-video relative overflow-hidden bg-zinc-50 border-b border-zinc-50">
                        <Image
                          src={blog.coverImage || "/placeholder-blog.jpg"}
                          alt={blog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[#781007] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <BookOpen className="w-3.5 h-3.5" /> {readTime} min read
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
                          {blog.excerpt || "Click to read the full blog post."}
                        </p>

                        {/* Read More Link */}
                        <div className="mt-auto pt-2 text-sm font-bold text-[#781007] flex items-center gap-1 group-hover:gap-2 transition-all font-sans">
                          Read Article <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16 border-t border-[#e5e7eb] pt-8">
                {/* Previous Button */}
                <Link
                  href={`/blogs?page=${currentPage - 1}`}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 transition-all cursor-pointer ${
                    currentPage === 1
                      ? "opacity-50 pointer-events-none text-zinc-400"
                      : "hover:bg-zinc-50 text-zinc-700 hover:border-[#781007] hover:text-[#781007]"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </Link>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNum = index + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <Link
                        key={pageNum}
                        href={`/blogs?page=${pageNum}`}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#781007] border-[#781007] text-white"
                            : "border-zinc-200 hover:bg-zinc-50 text-zinc-700 hover:border-[#781007]"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>

                {/* Next Button */}
                <Link
                  href={`/blogs?page=${currentPage + 1}`}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 transition-all cursor-pointer ${
                    currentPage === totalPages
                      ? "opacity-50 pointer-events-none text-zinc-400"
                      : "hover:bg-zinc-50 text-zinc-700 hover:border-[#781007] hover:text-[#781007]"
                  }`}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
