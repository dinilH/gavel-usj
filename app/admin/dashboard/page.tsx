import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBlogs } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/admin");
  }
  
  const blogs = await getBlogs();
  
  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white">
      <DashboardClient initialBlogs={blogs} username={session.username} />
    </main>
  );
}
