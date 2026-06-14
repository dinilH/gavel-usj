import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBlogs, createBlog } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const blogs = await getBlogs();
    return NextResponse.json(blogs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { title, excerpt, content, coverImage, author, published } = body;
    
    if (!title || !content || !author) {
      return NextResponse.json({ error: "Missing required fields (title, content, author)" }, { status: 400 });
    }
    
    const newBlog = await createBlog({
      title,
      excerpt: excerpt || "",
      content,
      coverImage: coverImage || "",
      author,
      published: published ?? false,
    });
    
    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
