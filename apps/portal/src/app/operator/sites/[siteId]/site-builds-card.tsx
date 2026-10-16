"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { publishSiteFromRepo, resetDemoSite, setSiteDemo } from "@/actions/admin/site-builds";

export function SiteBuildsCard({ siteId, isDemo, hasRepo }: { siteId: string; isDemo: boolean; hasRepo: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: true; message: string } | { error: string }>) {
    startTransition(async () => {
      const result = await action();
      if ("error" in result) toast.error(result.error);
      else toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing</CardTitle>
        <CardDescription>
          {isDemo
            ? "This is the demo site, served at /demo. Reset puts its content back at the demo-baseline tag."
            : "Build and publish what the repository holds, e.g. for the site's first build."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Working with the builder…
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button disabled={isPending || !hasRepo} onClick={() => run(() => publishSiteFromRepo(siteId))}>
          Build and publish
        </Button>
        {isDemo ? (
          <ConfirmDialog
            title="Reset demo"
            description="Puts the demo's content back at its baseline and publishes it. Edits made since, and the demo's change history and quick edit conversations, are removed."
            onConfirm={() => run(() => resetDemoSite(siteId))}
            trigger={
              <Button variant="outline" disabled={isPending || !hasRepo}>
                Reset demo
              </Button>
            }
            destructive
          />
        ) : null}
        <Button variant="ghost" disabled={isPending} onClick={() => run(() => setSiteDemo(siteId, !isDemo))}>
          {isDemo ? "Not a demo site" : "Mark as demo site"}
        </Button>
      </CardFooter>
    </Card>
  );
}
