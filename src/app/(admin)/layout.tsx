// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Suspense } from "react";
import { requireAuth, getCurrentAccountId } from "@/lib/auth-utils";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { TopNavLayout } from "@/components/patterns/top-nav-layout";
import { UserMenu } from "@/components/patterns/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { HelpBubble } from "@/components/help-bubble";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { prisma } from "@/lib/db";
import { PlanResolutionDialog } from "@/components/plan/plan-resolution-dialog";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const accountId = await getCurrentAccountId();
  const entitlements = await getAccountEntitlements(accountId);

  // When a downgrade has unpublished all of the account's forms, block every
  // admin route with the resolution dialog. The user picks which forms stay
  // published (up to the new cap) before anything else is possible.
  const resolutionForms = entitlements.requiresPlanResolution
    ? await prisma.form.findMany({
        where: { accountId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          title: true,
          createdAt: true,
          _count: { select: { submissions: true } },
        },
      })
    : [];

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
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu
              email={session.user?.email}
              isGlobalAdmin={session.user?.role === "GLOBAL_ADMIN"}
            />
          </div>
        }
      >
        {children}
      </TopNavLayout>
      <Suspense fallback={null}>
        <HelpBubble />
      </Suspense>
      {entitlements.requiresPlanResolution && (
        <PlanResolutionDialog
          planDisplayName={entitlements.planDisplayName}
          maxPublishedForms={entitlements.maxPublishedForms}
          forms={resolutionForms.map((f) => ({
            id: f.id,
            name: f.name,
            title: f.title,
            submissionsCount: f._count.submissions,
            createdAt: f.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
