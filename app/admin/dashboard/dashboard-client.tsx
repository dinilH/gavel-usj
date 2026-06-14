"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BlogPost } from "@/lib/db";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Plus,
  LogOut,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Calendar,
  User,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Quote,
  List,
  ListOrdered,
  ChevronRight,
  ArrowLeft,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DashboardClientProps {
  initialBlogs: BlogPost[];
  username: string;
}

export function DashboardClient({ initialBlogs, username }: DashboardClientProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<BlogPost> | null>(null);
  
  // Editor Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [author, setAuthor] = useState("Gavel USJ");
  const [published, setPublished] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logout Handler
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (response.ok) {
        toast.success("Logged out successfully");
        router.push("/admin");
        router.refresh();
      } else {
        toast.error("Logout failed");
      }
    } catch (e) {
      toast.error("Error logging out");
    }
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCoverImage(data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(data.error || "Image upload failed");
      }
    } catch (err) {
      toast.error("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  // Markdown Formatting Helper
  const insertMarkdown = (tag: string) => {
    const textarea = document.getElementById("editor-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = "";
    switch (tag) {
      case "bold":
        replacement = `**${selected || "bold text"}**`;
        break;
      case "italic":
        replacement = `*${selected || "italic text"}*`;
        break;
      case "h1":
        replacement = `\n# ${selected || "Heading 1"}\n`;
        break;
      case "h2":
        replacement = `\n## ${selected || "Heading 2"}\n`;
        break;
      case "link":
        replacement = `[${selected || "link text"}](https://example.com)`;
        break;
      case "image":
        replacement = `![${selected || "image description"}](${coverImage || "https://example.com/image.png"})`;
        break;
      case "code":
        replacement = `\`\`\`javascript\n${selected || "// code here"}\n\`\`\``;
        break;
      case "quote":
        replacement = `\n> ${selected || "Blockquote"}\n`;
        break;
      case "bullet":
        replacement = `\n- ${selected || "item"}`;
        break;
      case "number":
        replacement = `\n1. ${selected || "item"}`;
        break;
      default:
        return;
    }

    setContent(text.substring(0, start) + replacement + text.substring(end));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  // Open Create Form
  const handleCreateNew = () => {
    setCurrentBlog(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImage("");
    setAuthor("Gavel USJ");
    setPublished(false);
    setActiveTab("edit");
    setIsEditing(true);
  };

  // Open Edit Form
  const handleEdit = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setCoverImage(blog.coverImage || "");
    setAuthor(blog.author);
    setPublished(blog.published);
    setActiveTab("edit");
    setIsEditing(true);
  };

  // Save Blog (Create or Update)
  const handleSave = async (e: React.FormEvent, forcePublishStatus?: boolean) => {
    e.preventDefault();
    if (!title || !content || !author) {
      toast.error("Title, Author, and Content are required");
      return;
    }

    setIsSaving(true);
    const resolvedPublishedStatus = forcePublishStatus !== undefined ? forcePublishStatus : published;

    const payload = {
      title,
      slug: slug || undefined, // database will handle slug generation if empty
      excerpt,
      content,
      coverImage: coverImage || undefined,
      author,
      published: resolvedPublishedStatus,
    };

    try {
      const isNew = !currentBlog?.id;
      const url = isNew ? "/api/admin/blogs" : `/api/admin/blogs/${currentBlog.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isNew ? "Blog created successfully!" : "Blog updated successfully!");
        
        // Refresh local list
        const refreshedRes = await fetch("/api/admin/blogs");
        if (refreshedRes.ok) {
          const updatedBlogs = await refreshedRes.json();
          setBlogs(updatedBlogs);
        }
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save blog");
      }
    } catch (err) {
      toast.error("Error saving blog post");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Blog
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Blog deleted successfully!");
        setBlogs(blogs.filter((b) => b.id !== id));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete blog");
      }
    } catch (e) {
      toast.error("Error deleting blog");
    }
  };

  // Auto-fill slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!currentBlog?.id) {
      // Auto-slugify for new blogs
      const derivedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(derivedSlug);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-[#0e0e11]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#781007] to-black flex items-center justify-center border border-[#781007]/30 shadow-md">
              <Sparkles className="w-5 h-5 text-[#b3190b]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Gavel Club USJ
              </h1>
              <span className="text-xs text-zinc-500 font-medium tracking-widest uppercase">Admin Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:inline-block">
              Logged in as <strong className="text-zinc-200">{username}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-[#781007] hover:border-[#781007] flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!isEditing ? (
            /* Blogs List Panel */
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Blog Management</h2>
                  <p className="text-sm text-zinc-400 mt-1">Publish news, announcements, and articles</p>
                </div>
                <Button
                  onClick={handleCreateNew}
                  className="bg-[#781007] hover:bg-[#9c150a] text-white flex items-center gap-2 font-semibold shadow-lg shadow-[#781007]/20 py-5 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Add New Post
                </Button>
              </div>

              {/* Stats & Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#0f0f12] border-zinc-800 text-zinc-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Total Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-white">{blogs.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#0f0f12] border-zinc-800 text-zinc-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Published Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-green-500">{blogs.filter((b) => b.published).length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#0f0f12] border-zinc-800 text-zinc-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Draft Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-amber-500">{blogs.filter((b) => !b.published).length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Blogs Grid */}
              {blogs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-[#0f0f12]/50">
                  <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300">No blog posts found</h3>
                  <p className="text-sm text-zinc-500 mt-1">Get started by creating your very first article.</p>
                  <Button
                    onClick={handleCreateNew}
                    variant="outline"
                    className="mt-4 border-zinc-800 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                  >
                    Create a post
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {blogs.map((blog) => (
                    <div
                      key={blog.id}
                      className="p-5 rounded-2xl bg-[#0f0f12] border border-zinc-800/80 hover:border-zinc-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base hover:text-[#b3190b] cursor-pointer" onClick={() => handleEdit(blog)}>
                            {blog.title}
                          </h3>
                          {blog.published ? (
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 font-medium">
                              Published
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 line-clamp-1">{blog.excerpt || "No description provided."}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-zinc-500 pt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {blog.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(blog.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span>slug: <code className="text-zinc-400">{blog.slug}</code></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end md:self-auto pt-2 md:pt-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(blog)}
                          className="border-zinc-800 text-zinc-300 hover:text-[#b3190b] hover:bg-zinc-800 rounded-xl cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(blog.id)}
                          className="border-zinc-800 text-zinc-300 hover:text-red-500 hover:bg-zinc-800 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Blog Editor Panel */
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Back Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(false)}
                    className="text-zinc-400 hover:text-white rounded-full cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {currentBlog ? "Edit Blog Post" : "Create New Blog"}
                    </h2>
                    <p className="text-sm text-zinc-400">
                      {currentBlog ? `Editing: ${currentBlog.title}` : "Create an engaging post"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => handleSave(e, false)}
                    disabled={isSaving}
                    className="border-zinc-800 text-amber-500 hover:bg-zinc-900 cursor-pointer"
                  >
                    Save Draft
                  </Button>
                  <Button
                    onClick={(e) => handleSave(e, true)}
                    disabled={isSaving}
                    className="bg-[#781007] hover:bg-[#9c150a] text-white cursor-pointer"
                  >
                    {isSaving ? "Saving..." : currentBlog ? "Update & Publish" : "Publish Post"}
                  </Button>
                </div>
              </div>

              {/* Editor Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Fields Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-zinc-300">Blog Title</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Enter title..."
                        value={title}
                        onChange={handleTitleChange}
                        className="bg-[#0f0f12] border-zinc-800 text-white focus-visible:ring-[#781007] text-lg font-bold py-6 rounded-xl"
                      />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                      <Label htmlFor="excerpt" className="text-zinc-300">Excerpt / Short Description</Label>
                      <Textarea
                        id="excerpt"
                        placeholder="Provide a summary for previews..."
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        className="bg-[#0f0f12] border-zinc-800 text-white focus-visible:ring-[#781007] h-20 rounded-xl"
                      />
                    </div>

                    {/* Markdown Body Textarea or Preview */}
                    <div className="border border-zinc-800 rounded-2xl bg-[#0f0f12] overflow-hidden">
                      {/* Editor Toolbar & Tabs */}
                      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#0e0e11] px-4 py-2 flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("bold")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Bold">
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("italic")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Italic">
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("h1")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold" title="Heading 1">
                            <Heading1 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("h2")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold" title="Heading 2">
                            <Heading2 className="w-4 h-4" />
                          </Button>
                          <span className="w-px h-6 bg-zinc-800 mx-1" />
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("link")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Link">
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("image")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Image Code">
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("code")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Code Block">
                            <Code className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("quote")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Quote">
                            <Quote className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" onClick={() => insertMarkdown("bullet")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Bullet List">
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex bg-zinc-950/80 p-0.5 rounded-xl border border-zinc-800 text-xs">
                          <button
                            type="button"
                            onClick={() => setActiveTab("edit")}
                            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                              activeTab === "edit" ? "bg-[#781007] text-white" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("preview")}
                            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                              activeTab === "preview" ? "bg-[#781007] text-white" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            Preview
                          </button>
                        </div>
                      </div>

                      {/* Content Panel */}
                      <div className="p-4 min-h-[400px]">
                        {activeTab === "edit" ? (
                          <textarea
                            id="editor-content"
                            placeholder="Write blog content in Markdown here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[400px] bg-transparent border-0 outline-none text-zinc-200 placeholder-zinc-600 focus:ring-0 font-mono text-sm resize-y"
                          />
                        ) : (
                          <div className="prose-custom max-w-none break-words min-h-[400px] overflow-y-auto">
                            {content ? (
                              <ReactMarkdown>{content}</ReactMarkdown>
                            ) : (
                              <p className="text-zinc-600 italic">Nothing to preview yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Settings Sidebar Column */}
                <div className="space-y-6">
                  <Card className="bg-[#0f0f12] border-zinc-800 text-zinc-300">
                    <CardHeader className="border-b border-zinc-800/80 py-4">
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#b3190b]" /> Post Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Slug */}
                      <div className="space-y-2">
                        <Label htmlFor="slug" className="text-zinc-400 text-xs">Slug Path</Label>
                        <Input
                          id="slug"
                          type="text"
                          placeholder="e.g. dynamic-public-speaking"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="bg-[#070708] border-zinc-800 text-white focus-visible:ring-[#781007] text-xs h-9 rounded-lg font-mono"
                        />
                      </div>

                      {/* Author */}
                      <div className="space-y-2">
                        <Label htmlFor="author" className="text-zinc-400 text-xs">Author Name</Label>
                        <Input
                          id="author"
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="bg-[#070708] border-zinc-800 text-white focus-visible:ring-[#781007] text-xs h-9 rounded-lg"
                        />
                      </div>

                      {/* Cover Image Upload / URL */}
                      <div className="space-y-2">
                        <Label htmlFor="coverImage" className="text-zinc-400 text-xs">Cover Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="coverImage"
                            type="text"
                            placeholder="https://..."
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            className="bg-[#070708] border-zinc-800 text-white focus-visible:ring-[#781007] text-xs h-9 rounded-lg flex-1"
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white h-9 w-9 rounded-lg cursor-pointer"
                            title="Upload File"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {coverImage && (
                          <div className="mt-3 relative rounded-lg border border-zinc-800 overflow-hidden aspect-video bg-[#070708]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={coverImage}
                              alt="Cover Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setCoverImage("")}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white text-[10px] px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Publication Switch */}
                      <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="publish-status" className="text-zinc-300 font-medium text-xs">Publish Status</Label>
                          <p className="text-[10px] text-zinc-500">Make this post visible to public immediately</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            id="publish-status"
                            type="checkbox"
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0e0e11]/40 py-6 text-center text-xs text-zinc-600 mt-auto">
        <p>© 2026 Gavel Club of University of Sri Jayewardenepura. All rights reserved.</p>
      </footer>
    </div>
  );
}
