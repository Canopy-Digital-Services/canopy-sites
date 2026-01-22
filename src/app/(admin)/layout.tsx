import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { FileText, Settings, BookOpen, LogOut } from "lucide-react";

async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" variant="ghost" className="w-full justify-start">
        <LogOut className="mr-2 h-4 w-4" />
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

  const nav = (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-bold">Can-O-Forms</h1>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
      </div>
      <nav className="space-y-2">
        <Link href="/forms">
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Forms
          </Button>
        </Link>
        <Link href="/settings/sites">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Sites
          </Button>
        </Link>
        <Link href="/docs">
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="mr-2 h-4 w-4" />
            Help
          </Button>
        </Link>
        <SignOutButton />
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40 p-6">
        {nav}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
