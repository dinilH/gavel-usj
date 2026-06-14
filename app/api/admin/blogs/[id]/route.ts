import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateBlog, deleteBlog } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updated = await updateBlog(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const deleted = await deleteBlog(id);
    if (!deleted) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
