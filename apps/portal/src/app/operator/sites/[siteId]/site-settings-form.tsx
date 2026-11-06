"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateSite } from "@/actions/admin/sites";
import {
  parseSiteSettings,
  SITE_BRANCH_MAX_LENGTH,
  SITE_LOCKED_FIELD_MAX_LENGTH,
  SITE_NAME_MAX_LENGTH,
  SITE_URL_MAX_LENGTH,
  type FieldErrors,
  type SiteSettingsInput,
} from "@/lib/sites";
import { ListInput, type Row } from "../list-input";

type Field = keyof SiteSettingsInput;

export function SiteSettingsForm({ siteId, initial }: { siteId: string; initial: SiteSettingsInput }) {
  const { toast } = useToast();
  // Stable row keys: saved values by position, added rows from a counter read in the click handler.
  const nextId = useRef(0);
  const toRows = (prefix: string, values: string[]) => values.map((value, i) => ({ id: `${prefix}${i}`, value }));
  const newRow = () => ({ id: `new${nextId.current++}`, value: "" });

  const [values, setValues] = useState(initial);
  const [hostnameRows, setHostnameRows] = useState<Row[]>(() => toRows("host", initial.productionHostnames));
  const [lockedRows, setLockedRows] = useState<Row[]>(() => toRows("lock", initial.lockedFields));
  const [fixedRows, setFixedRows] = useState<Row[]>(() => toRows("fixed", initial.fixedLists));
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors<SiteSettingsInput>>({});
  const [isPending, startTransition] = useTransition();

  const input: SiteSettingsInput = {
    ...values,
    productionHostnames: hostnameRows.map((r) => r.value),
    lockedFields: lockedRows.map((r) => r.value),
    fixedLists: fixedRows.map((r) => r.value),
  };
  const parsed = parseSiteSettings(input);
  const errors: FieldErrors<SiteSettingsInput> = parsed.ok ? {} : parsed.errors;
  const showError = (f: Field) => ((touched[f] || submitted) && errors[f]) || serverErrors[f];
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  function set(f: Exclude<Field, "productionHostnames" | "lockedFields" | "fixedLists">, value: string) {
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

  function text(f: "name" | "repoUrl" | "defaultBranch" | "umamiWebsiteId", label: string, opts: {
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
            hint="Field addresses no owner edit may change, with * for any entry, such as site/contact/phone"
            placeholder="site/contact/phone"
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

          <ListInput
            label="Fixed lists"
            hint="Lists whose entries no owner edit adds, removes, or reorders, such as classes. Pages and sections always are."
            placeholder="classes"
            addLabel="Add list"
            removeLabel="Remove list"
            mono
            maxLength={SITE_LOCKED_FIELD_MAX_LENGTH}
            rows={fixedRows}
            error={showError("fixedLists")}
            onChange={setFixedRows}
            onBlur={() => touch("fixedLists")}
            newRow={newRow}
          />

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
