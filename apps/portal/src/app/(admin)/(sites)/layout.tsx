import { notFound } from "next/navigation";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";

/** Routes that exist only for accounts with Canopy Sites. */
export default async function SitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sitesEnabled } = await getAccountEntitlements(await getCurrentAccountId());
  if (!sitesEnabled) notFound();

  return children;
}
