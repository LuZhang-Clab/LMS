import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { hashPassword, getAdminPassword } from "@/lib/auth";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  return token === hashPassword(getAdminPassword());
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
