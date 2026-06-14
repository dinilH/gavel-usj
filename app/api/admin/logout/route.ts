import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await clearSession();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
