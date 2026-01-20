import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" variant="ghost" className="w-full justify-start">
        Sign out
      </Button>
    </form>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-zinc-50 dark:bg-zinc-900 p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Can-O-Forms</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {session.user.email}
          </p>
        </div>
        <nav className="space-y-2">
          <Link href="/sites">
            <Button variant="ghost" className="w-full justify-start">
              Sites
            </Button>
          </Link>
          <SignOutButton />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
