"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createSite } from "@/actions/admin/sites";
import type { SiteAccountOption } from "@/lib/data-access/sites";
import {
  parseNewSite,
  suggestSlug,
  SITE_NAME_MAX_LENGTH,
  SITE_SLUG_MAX_LENGTH,
  type FieldErrors,
  type NewSiteInput,
} from "@/lib/sites";

type Field = "accountId" | keyof NewSiteInput;

export function NewSiteButton({ accounts }: { accounts: SiteAccountOption[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors<NewSiteInput>>({});
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const parsed = parseNewSite({ name, slug });
  const errors: Partial<Record<Field, string>> = {
    accountId: accountId ? undefined : "Choose an account",
    ...(parsed.ok ? {} : parsed.errors),
  };
  const showError = (f: Field) =>
    (touched[f] || submitted) && (errors[f] || serverErrors[f as keyof NewSiteInput]);
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  function handleOpenChange(next: boolean) {
    if (next) {
      setAccountId(accounts.length === 1 ? accounts[0].id : "");
      setName("");
      setSlug("");
      setSlugEdited(false);
      setTouched({});
      setSubmitted(false);
      setServerErrors({});
      setFormError("");
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError("");
    if (errors.accountId || !parsed.ok) return;

    startTransition(async () => {
      const result = await createSite(accountId, { name, slug });
      if ("error" in result) {
        setServerErrors(result.fieldErrors ?? {});
        if (!result.fieldErrors) setFormError(result.error);
        return;
      }
      toast.success("Site created.");
      setOpen(false);
      router.push(`/operator/sites/${result.siteId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New site
        </Button>
      </DialogTrigger>
      <DialogContent>
        {accounts.length === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>New site</DialogTitle>
              <DialogDescription>
                Every account on the Sites plan already has a site. Move an account to the Sites plan first.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>New site</DialogTitle>
              <DialogDescription>No repository, DNS, or Umami website is created.</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="site-account">
                Account<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Select
                value={accountId}
                onValueChange={(v) => {
                  setAccountId(v);
                  touch("accountId");
                }}
              >
                <SelectTrigger id="site-account" aria-invalid={!!showError("accountId")} onBlur={() => touch("accountId")}>
                  <SelectValue placeholder="Choose an account on the Sites plan" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.ownerEmail ?? a.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showError("accountId") && <p className="text-sm text-destructive">{showError("accountId")}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-name">
                Name<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="site-name"
                value={name}
                maxLength={SITE_NAME_MAX_LENGTH}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugEdited) setSlug(suggestSlug(e.target.value));
                }}
                onBlur={() => touch("name")}
                aria-invalid={!!showError("name")}
              />
              {showError("name") && <p className="text-sm text-destructive">{showError("name")}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-slug">
                Slug<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="site-slug"
                value={slug}
                maxLength={SITE_SLUG_MAX_LENGTH}
                className="font-mono"
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                  setServerErrors((s) => ({ ...s, slug: undefined }));
                }}
                onBlur={() => touch("slug")}
                aria-invalid={!!showError("slug")}
              />
              {showError("slug") ? (
                <p className="text-sm text-destructive">{showError("slug")}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Fixed once created.</p>
              )}
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create site"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
