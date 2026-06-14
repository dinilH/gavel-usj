import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLoginForm } from "./login-form";

export default async function AdminPage() {
  const session = await getSession();
  
  if (session) {
    redirect("/admin/dashboard");
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0c0201] via-[#1a0504] to-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AdminLoginForm />
      </div>
    </main>
  );
}
