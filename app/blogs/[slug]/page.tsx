import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getBlogBySlug } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const dynamic = "force-dynamic";

interface BlogDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetailsPage({ params }: BlogDetailsPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  // If blog not found or not published, show 404
  if (!blog || !blog.published) {
    notFound();
  }

  // Calculate reading time
  const wordCount = blog.content ? blog.content.split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col font-sans">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-6 sm:px-6 lg:px-8 max-w-4xl py-28">
        {/* Back Button */}
        <Link
          href="/blogs"
          className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-[#781007] transition-colors gap-2 mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blogs
        </Link>

        {/* Article Container */}
        <article className="space-y-8">
          {/* Header Metadata */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 leading-tight tracking-tight text-left">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5 font-sans">
                <Calendar className="w-4 h-4 text-[#781007]" />
                {new Date(blog.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#781007]" />
                By {blog.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#781007]" />
                {readTime} min read ({wordCount} words)
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {blog.coverImage && (
            <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-lg border border-zinc-100 bg-zinc-50">
              <Image
                src={blog.coverImage}
                alt={blog.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          )}

          {/* Excerpt Summary Box */}
          {blog.excerpt && (
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 italic text-zinc-600 text-base leading-relaxed text-left">
              <strong className="text-zinc-800 not-italic block text-sm uppercase tracking-wider mb-1">Summary</strong>
              &ldquo;{blog.excerpt}&rdquo;
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose-custom max-w-none break-words pt-4 text-left">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
