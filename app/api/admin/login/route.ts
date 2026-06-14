import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const expectedUsername = process.env.ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    if (username === expectedUsername && password === expectedPassword) {
      await setSession(username);
      return NextResponse.json({ success: true, message: "Logged in successfully" });
    }
    
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
