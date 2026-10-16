"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { updateSite } from "@/actions/admin/sites";
import {
  parseSiteSettings,
  RUNBOOK_OVERLAY_MAX_LENGTH,
  SITE_BRANCH_MAX_LENGTH,
  SITE_LOCKED_FIELD_MAX_LENGTH,
  SITE_NAME_MAX_LENGTH,
  SITE_URL_MAX_LENGTH,
  type FieldErrors,
  type SiteSettingsInput,
} from "@/lib/sites";

type Field = keyof SiteSettingsInput;
type Row = { id: string; value: string };

export function SiteSettingsForm({ siteId, initial }: { siteId: string; initial: SiteSettingsInput }) {
  const { toast } = useToast();
  // Stable row keys: saved values by position, added rows from a counter read in the click handler.
  const nextId = useRef(0);
  const toRows = (prefix: string, values: string[]) => values.map((value, i) => ({ id: `${prefix}${i}`, value }));
  const newRow = () => ({ id: `new${nextId.current++}`, value: "" });

  const [values, setValues] = useState(initial);
  const [hostnameRows, setHostnameRows] = useState<Row[]>(() => toRows("host", initial.productionHostnames));
  const [lockedRows, setLockedRows] = useState<Row[]>(() => toRows("lock", initial.lockedFields));
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors<SiteSettingsInput>>({});
  const [isPending, startTransition] = useTransition();

  const input: SiteSettingsInput = {
    ...values,
    productionHostnames: hostnameRows.map((r) => r.value),
    lockedFields: lockedRows.map((r) => r.value),
  };
  const parsed = parseSiteSettings(input);
  const errors: FieldErrors<SiteSettingsInput> = parsed.ok ? {} : parsed.errors;
  const showError = (f: Field) => ((touched[f] || submitted) && errors[f]) || serverErrors[f];
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  function set(f: Exclude<Field, "productionHostnames" | "lockedFields">, value: string) {
    setValues((v) => ({ ...v, [f]: value }));
    setServerErrors((s) => ({ ...s, [f]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!parsed.ok) return;

    startTransition(async () => {
      const result = await updateSite(siteId, input);
      if ("error" in result) {
        setServerErrors(result.fieldErrors ?? {});
        if (!result.fieldErrors) toast.error(result.error);
        return;
      }
      toast.success("Site saved.");
    });
  }

  function text(f: "name" | "repoUrl" | "defaultBranch" | "contractVersion" | "umamiWebsiteId", label: string, opts: {
    required?: boolean;
    maxLength?: number;
    placeholder?: string;
    mono?: boolean;
  } = {}) {
    const id = `site-${f}`;
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {opts.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <Input
          id={id}
          value={values[f]}
          maxLength={opts.maxLength}
          placeholder={opts.placeholder}
          className={opts.mono ? "font-mono" : undefined}
          onChange={(e) => set(f, e.target.value)}
          onBlur={() => touch(f)}
          aria-invalid={!!showError(f)}
        />
        {showError(f) && <p className="text-sm text-destructive">{showError(f)}</p>}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          {text("name", "Name", { required: true, maxLength: SITE_NAME_MAX_LENGTH })}
          {text("repoUrl", "Repository URL", {
            maxLength: SITE_URL_MAX_LENGTH,
            placeholder: "https://github.com/org/repo",
          })}
          {text("defaultBranch", "Default branch", { required: true, maxLength: SITE_BRANCH_MAX_LENGTH, mono: true })}
          {text("contractVersion", "Contract version", { placeholder: "0.1.0", mono: true })}

          <ListInput
            label="Production hostnames"
            hint="Without https://"
            placeholder="example.com"
            addLabel="Add hostname"
            removeLabel="Remove hostname"
            rows={hostnameRows}
            error={showError("productionHostnames")}
            onChange={(rows) => {
              setHostnameRows(rows);
              setServerErrors((s) => ({ ...s, productionHostnames: undefined }));
            }}
            onBlur={() => touch("productionHostnames")}
            newRow={newRow}
          />

          <ListInput
            label="Locked fields"
            hint="Content paths no edit may change, such as site.contact.phone"
            placeholder="site.contact.phone"
            addLabel="Add field"
            removeLabel="Remove field"
            mono
            maxLength={SITE_LOCKED_FIELD_MAX_LENGTH}
            rows={lockedRows}
            error={showError("lockedFields")}
            onChange={setLockedRows}
            onBlur={() => touch("lockedFields")}
            newRow={newRow}
          />

          <div className="space-y-2">
            <Label htmlFor="site-runbookOverlay">Runbook overlay</Label>
            <Textarea
              id="site-runbookOverlay"
              value={values.runbookOverlay}
              maxLength={RUNBOOK_OVERLAY_MAX_LENGTH}
              rows={8}
              className="min-h-40 font-mono"
              onChange={(e) => set("runbookOverlay", e.target.value)}
              onBlur={() => touch("runbookOverlay")}
              aria-invalid={!!showError("runbookOverlay")}
            />
            {showError("runbookOverlay") ? (
              <p className="text-sm text-destructive">{showError("runbookOverlay")}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                This client&apos;s business facts, voice, and constraints, added to quick edit&apos;s instructions.
              </p>
            )}
          </div>

          {text("umamiWebsiteId", "Umami website ID", {
            placeholder: "00000000-0000-0000-0000-000000000000",
            mono: true,
          })}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

type ListInputProps = {
  label: string;
  hint: string;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  rows: Row[];
  error?: string | false;
  mono?: boolean;
  maxLength?: number;
  onChange: (rows: Row[]) => void;
  onBlur: () => void;
  newRow: () => Row;
};

/** One input per value, a remove button per row, and the Add button below the list. */
function ListInput({ label, hint, placeholder, addLabel, removeLabel, rows, error, mono, maxLength, onChange, onBlur, newRow }: ListInputProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            value={row.value}
            placeholder={placeholder}
            maxLength={maxLength}
            aria-label={`${label} ${index + 1}`}
            aria-invalid={!!error}
            className={mono ? "font-mono" : undefined}
            onChange={(e) => onChange(rows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)))}
            onBlur={onBlur}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={removeLabel}
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{removeLabel}</TooltipContent>
          </Tooltip>
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : <p className="text-xs text-muted-foreground">{hint}</p>}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-3 text-primary hover:text-primary hover:bg-primary/10"
        onClick={() => onChange([...rows, newRow()])}
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
