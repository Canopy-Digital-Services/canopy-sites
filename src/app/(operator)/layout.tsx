import { requireOperator } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { Users, LogOut } from "lucide-react";

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

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOperator();

  const nav = (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-bold">Operator Console</h1>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
      </div>
      <nav className="space-y-2">
        <Link href="/operator/accounts">
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Accounts
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
