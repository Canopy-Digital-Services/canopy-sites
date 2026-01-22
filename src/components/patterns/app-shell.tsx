import Link from "next/link";
import { Button } from "@/components/ui/button";

export type AppShellNavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

type AppShellProps = {
  header?: React.ReactNode;
  navItems: AppShellNavItem[];
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ header, navItems, footer, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-muted/40 p-6">
        <div className="mb-8">{header}</div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                {item.icon}
                <span>{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>
        {footer ? <div className="mt-8">{footer}</div> : null}
      </aside>
      <main className="flex-1 p-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
