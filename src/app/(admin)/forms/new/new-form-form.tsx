"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Globe, AppWindow, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { handleCreateForm } from "./actions";

type FormTypeChoice = "HOSTED" | "EMBEDDED";

const TYPE_OPTIONS: Array<{
  value: FormTypeChoice;
  title: string;
  description: string;
  Icon: typeof Globe;
}> = [
  {
    value: "HOSTED",
    title: "Hosted",
    description: "A standalone page at a shareable URL.",
    Icon: Globe,
  },
  {
    value: "EMBEDDED",
    title: "Embedded",
    description: "Lives inside your website via a snippet.",
    Icon: AppWindow,
  },
];

export function NewFormForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState<FormTypeChoice | null>(null);
  const [pending, startTransition] = useTransition();

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && type !== null && !pending;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    const data = new FormData();
    data.set("name", trimmedName);
    data.set("type", type!);
    startTransition(() => {
      handleCreateForm(data);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Form name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Newsletter signup, Contact form, Event registration"
          autoFocus
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Form type</legend>
        <div
          role="radiogroup"
          aria-label="Form type"
          className="grid gap-3 sm:grid-cols-2"
        >
          {TYPE_OPTIONS.map(({ value, title, description, Icon }) => {
            const selected = type === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setType(value)}
                className={cn(
                  "group relative flex flex-col items-start gap-3 rounded-lg border bg-card p-5 text-left transition-colors",
                  "hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected
                    ? "border-primary ring-1 ring-primary"
                    : "border-border"
                )}
              >
                <Icon
                  className={cn(
                    "h-8 w-8 transition-colors",
                    selected ? "text-primary" : "text-muted-foreground/60"
                  )}
                  aria-hidden
                />
                <div className="space-y-1">
                  <div className="font-medium">{title}</div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {selected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={!canSubmit}>
          {pending ? "Creating…" : "Create form"}
        </Button>
        <Link href="/forms">
          <Button type="button" variant="link" className="text-muted-foreground">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
