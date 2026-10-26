import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSignedInHomePath } from "@/lib/auth-utils";
import { getHostProduct, productMetadata } from "@/lib/product";
import { HostProductProvider } from "@/components/auth-brand-mark";

// Signed out, so the hostname brands the title as it brands the logo.
export async function generateMetadata(): Promise<Metadata> {
  return productMetadata(await getHostProduct());
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Signed in with a usable account: go home instead of showing sign-in.
  const home = await getSignedInHomePath();
  if (home) redirect(home);

  const product = await getHostProduct();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/Forms%20Background.png')" }}
    >
      <div className="w-full max-w-md flex-1 flex items-center justify-center px-4 py-8">
        <HostProductProvider product={product}>{children}</HostProductProvider>
      </div>
      <footer className="py-4 text-center text-xs text-muted-foreground/60">
        &copy; 2026 Canopy Digital Services. All rights reserved.
      </footer>
    </div>
  );
}
