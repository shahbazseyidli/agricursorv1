import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MainLayout } from "@/components/layout/main-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Redirect to login with callback to return to admin after login
    redirect("/login?callbackUrl=/admin");
  }

  if ((session.user as any)?.role !== "ADMIN") {
    // Regular users cannot access admin panel - redirect to home
    redirect("/?error=unauthorized");
  }

  return <MainLayout variant="admin">{children}</MainLayout>;
}
