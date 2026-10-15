import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // If already logged in, redirect to admin
  if (session?.user) {
    redirect("/forms");
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/Forms%20Background.png')" }}
    >
      <div className="w-full max-w-md flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>
      <footer className="py-4 text-center text-xs text-muted-foreground/60">
        &copy; 2026 Canopy Digital Services. All rights reserved.
      </footer>
    </div>
  );
}
