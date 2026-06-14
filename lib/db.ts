import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "blogs.json");

// Ensure the directory and file exist
async function ensureDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore folder creation errors (might exist)
  }
  
  try {
    await fs.access(DATA_FILE);
  } catch (e) {
    // File doesn't exist, create it with empty array
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function getBlogs(): Promise<BlogPost[]> {
  await ensureDb();
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const blogs = JSON.parse(data) as BlogPost[];
    // Sort by createdAt descending
    return blogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Error reading blogs database", e);
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const blogs = await getBlogs();
  return blogs.find((b) => b.slug === slug) || null;
}

export async function getBlogById(id: string): Promise<BlogPost | null> {
  const blogs = await getBlogs();
  return blogs.find((b) => b.id === id) || null;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

export async function createBlog(blogData: Omit<BlogPost, "id" | "slug" | "createdAt" | "updatedAt">): Promise<BlogPost> {
  await ensureDb();
  const blogs = await getBlogs();
  
  const id = crypto.randomUUID();
  let baseSlug = slugify(blogData.title) || "blog-post";
  let slug = baseSlug;
  let counter = 1;
  
  while (blogs.some((b) => b.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  const now = new Date().toISOString();
  const newBlog: BlogPost = {
    ...blogData,
    id,
    slug,
    createdAt: now,
    updatedAt: now,
  };
  
  blogs.push(newBlog);
  await fs.writeFile(DATA_FILE, JSON.stringify(blogs, null, 2), "utf-8");
  return newBlog;
}

export async function updateBlog(
  id: string,
  blogData: Partial<Omit<BlogPost, "id" | "createdAt" | "updatedAt">>
): Promise<BlogPost | null> {
  await ensureDb();
  const blogs = await getBlogs();
  const index = blogs.findIndex((b) => b.id === id);
  if (index === -1) return null;
  
  const existingBlog = blogs[index];
  let slug = existingBlog.slug;
  
  // If title changed and slug is not locked/manually specified, regenerate it
  if (blogData.title && blogData.title !== existingBlog.title && !blogData.slug) {
    let baseSlug = slugify(blogData.title) || "blog-post";
    slug = baseSlug;
    let counter = 1;
    while (blogs.some((b) => b.slug === slug && b.id !== id)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  } else if (blogData.slug && blogData.slug !== existingBlog.slug) {
    // If slug is manually edited, ensure uniqueness
    let baseSlug = slugify(blogData.slug);
    slug = baseSlug;
    let counter = 1;
    while (blogs.some((b) => b.slug === slug && b.id !== id)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  
  const updatedBlog: BlogPost = {
    ...existingBlog,
    ...blogData,
    slug,
    updatedAt: new Date().toISOString(),
  };
  
  blogs[index] = updatedBlog;
  await fs.writeFile(DATA_FILE, JSON.stringify(blogs, null, 2), "utf-8");
  return updatedBlog;
}

export async function deleteBlog(id: string): Promise<boolean> {
  await ensureDb();
  const blogs = await getBlogs();
  const filtered = blogs.filter((b) => b.id !== id);
  if (filtered.length === blogs.length) return false;
  
  await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}
