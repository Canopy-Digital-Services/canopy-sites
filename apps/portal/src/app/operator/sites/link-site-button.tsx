"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkSite } from "@/actions/admin/sites";
import { publishSiteFromRepo } from "@/actions/admin/site-builds";
import {
  parseLinkSite,
  suggestSlugFromRepo,
  SITE_NAME_MAX_LENGTH,
  SITE_SLUG_MAX_LENGTH,
  SITE_URL_MAX_LENGTH,
  type FieldErrors,
  type LinkSiteInput,
} from "@/lib/sites";
import { ListInput, type Row } from "./list-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppRepo } from "@/lib/builder-client";

type Field = keyof LinkSiteInput;
type Text = Exclude<Field, "productionHostnames">;

const EMPTY = { email: "", name: "", repoUrl: "", slug: "", umamiWebsiteId: "" };

/**
 * Links a live site (PRD D49): the client's account, its owner, who hasn't
 * claimed it, and the site row, then the site's first build and publish.
 */
export function LinkSiteButton({ repos }: { repos: AppRepo[] | null }) {
  const router = useRouter();
  const nextId = useRef(0);
  const newRow = (): Row => ({ id: `host${nextId.current++}`, value: "" });

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [hostRows, setHostRows] = useState<Row[]>([]);
  const [slugEdited, setSlugEdited] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors<LinkSiteInput>>({});
  const [formError, setFormError] = useState("");
  const [attachable, setAttachable] = useState(false);
  const [building, setBuilding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const input: LinkSiteInput = { ...values, productionHostnames: hostRows.map((r) => r.value) };
  const parsed = parseLinkSite(input);
  const errors: FieldErrors<LinkSiteInput> = parsed.ok ? {} : parsed.errors;
  const showError = (f: Field) => ((touched[f] || submitted) && errors[f]) || serverErrors[f];
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  function set(f: Text, value: string) {
    setValues((v) => {
      const next = { ...v, [f]: value };
      if (f === "repoUrl" && !slugEdited) next.slug = suggestSlugFromRepo(value);
      return next;
    });
    if (f === "slug") setSlugEdited(true);
    if (f === "email") setAttachable(false);
    setServerErrors((s) => ({ ...s, [f]: undefined, ...(f === "repoUrl" ? { slug: undefined } : {}) }));
    setFormError("");
  }

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (next) {
      setValues(EMPTY);
      setHostRows([newRow()]);
      setSlugEdited(false);
      setTouched({});
      setSubmitted(false);
      setServerErrors({});
      setFormError("");
      setAttachable(false);
      setBuilding(false);
    }
    setOpen(next);
  }

  function submit(attach: boolean) {
    setSubmitted(true);
    setFormError("");
    if (!parsed.ok) return;

    startTransition(async () => {
      const result = await linkSite(input, { attach });
      if ("error" in result) {
        setServerErrors(result.fieldErrors ?? {});
        setAttachable(result.attachable === true);
        if (!result.fieldErrors && !result.attachable) setFormError(result.error);
        return;
      }
      setBuilding(true);
      const built = await publishSiteFromRepo(result.siteId);
      if ("error" in built) toast.error(`Linked. The first build failed: ${built.error}`);
      else toast.success(`Linked and published. ${built.message}`);
      setOpen(false);
      router.push(`/operator/sites/${result.siteId}`);
    });
  }

  function text(f: Text, label: string, opts: { required?: boolean; type?: string; placeholder?: string; maxLength?: number; mono?: boolean; hint?: string } = {}) {
    const id = `link-${f}`;
    const error = showError(f);
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {opts.required ? <span className="text-destructive ml-0.5">*</span> : null}
        </Label>
        <Input
          id={id}
          type={opts.type ?? "text"}
          value={values[f]}
          placeholder={opts.placeholder}
          maxLength={opts.maxLength}
          className={opts.mono ? "font-mono" : undefined}
          onChange={(e) => set(f, e.target.value)}
          onBlur={() => touch(f)}
          aria-invalid={!!error}
          disabled={isPending}
        />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : opts.hint ? (
          <p className="text-xs text-muted-foreground">{opts.hint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Link2 className="h-4 w-4" />
          Link a site
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          noValidate
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Link a site</DialogTitle>
          </DialogHeader>

          {text("email", "Client email", { required: true, type: "email" })}
          {text("name", "Business name", { required: true, maxLength: SITE_NAME_MAX_LENGTH })}
          {repos ? (
            <div className="space-y-2">
              <Label htmlFor="link-repoUrl">
                Repository<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Select
                value={values.repoUrl}
                onValueChange={(v) => {
                  set("repoUrl", v);
                  touch("repoUrl");
                }}
                disabled={isPending || repos.length === 0}
              >
                <SelectTrigger id="link-repoUrl" aria-invalid={!!showError("repoUrl")} onBlur={() => touch("repoUrl")}>
                  <SelectValue placeholder={repos.length ? "Choose a repository" : "Every repository the App reaches is linked"} />
                </SelectTrigger>
                <SelectContent>
                  {repos.map((r) => (
                    <SelectItem key={r.url} value={r.url}>
                      {r.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showError("repoUrl") ? (
                <p className="text-sm text-destructive">{showError("repoUrl")}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Not listed? Add the repository to the Canopy Sites GitHub App.</p>
              )}
            </div>
          ) : (
            text("repoUrl", "Repository", {
              required: true,
              maxLength: SITE_URL_MAX_LENGTH,
              placeholder: "https://github.com/Canopy-Digital-Services/repo",
            })
          )}
          {text("slug", "Slug", { required: true, maxLength: SITE_SLUG_MAX_LENGTH, mono: true, hint: "Fixed once created." })}
          <ListInput
            label="Production hostnames"
            required
            hint="Without https://"
            placeholder="example.com"
            addLabel="Add hostname"
            removeLabel="Remove hostname"
            rows={hostRows}
            error={showError("productionHostnames")}
            onChange={(rows) => {
              setHostRows(rows);
              setServerErrors((s) => ({ ...s, productionHostnames: undefined }));
            }}
            onBlur={() => touch("productionHostnames")}
            newRow={newRow}
          />
          {text("umamiWebsiteId", "Umami website ID", { mono: true })}

          {attachable ? (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-100 px-3.5 py-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p>{values.email.trim()} already has a Sites account with no site.</p>
            </div>
          ) : null}
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          {building ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Building and publishing…
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            {attachable ? (
              <Button type="button" disabled={isPending} onClick={() => submit(true)}>
                {isPending ? "Linking..." : "Link to their account"}
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Linking..." : "Link site"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
