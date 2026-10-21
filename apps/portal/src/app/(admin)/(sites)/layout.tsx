import { notFound } from "next/navigation";
import { getCurrentEntitlements } from "@/lib/auth-utils";

/** Routes that exist only for accounts with Canopy Sites. */
export default async function SitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sitesEnabled } = await getCurrentEntitlements();
  if (!sitesEnabled) notFound();

  return children;
}
