import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TableTopicsAdmin } from "./admin-client";

export const dynamic = "force-dynamic";

export default async function TTVoteAdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin");
  }

  return <TableTopicsAdmin username={session.username || "Admin"} />;
}
