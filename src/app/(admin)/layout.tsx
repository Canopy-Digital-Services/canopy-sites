// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { TopNavLayout } from "@/components/patterns/top-nav-layout";
import { UserMenu } from "@/components/patterns/user-menu";
import { NotificationBell } from "@/components/notification-bell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/Forms%20Just%20Swoops.png')" }}
    >
      <TopNavLayout
        logo={
          <Link href="/forms">
            <BrandMark size="sm" className="gap-2" />
          </Link>
        }
        userMenu={
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu email={session.user?.email} />
          </div>
        }
      >
        {children}
      </TopNavLayout>
    </div>
  );
}
