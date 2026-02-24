"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmailValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function EmailConfig({
  value,
  onChange,
}: ConfigComponentProps<EmailValidation | undefined>) {
  const validation = value || {};

  const domainRules = validation.domainRules || {};
  const ruleType = domainRules.allow ? "allow" : domainRules.block ? "block" : "none";

  // Local state for the raw textarea text so trailing newlines are preserved while typing
  const [domainText, setDomainText] = useState(() => {
    if (domainRules.allow) return domainRules.allow.join("\n");
    if (domainRules.block) return domainRules.block.join("\n");
    return "";
  });


  const handleChange = (key: keyof EmailValidation, newValue: any) => {
    const updated = { ...validation };

    if (key === "normalize") {
      if (newValue) {
        updated[key] = true;
      } else {
        delete updated[key];
      }
    } else if (key === "domainRules") {
      if (newValue) {
        updated[key] = newValue;
      } else {
        delete updated[key];
      }
    }

    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  const handleDomainRuleTypeChange = (type: string) => {
    if (type === "none") {
      handleChange("domainRules", undefined);
    } else {
      // Preserve the existing domain list when switching between allow/block
      const domains = domainText
        .split("\n")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      handleChange("domainRules", { [type]: domains });
    }
  };

  const handleDomainListChange = (raw: string) => {
    setDomainText(raw);
    const domains = raw
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (domains.length === 0) {
      handleChange("domainRules", undefined);
    } else {
      handleChange("domainRules", { [ruleType]: domains });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="domain-rules">
          Domain Rules
        </Label>
        <Select value={ruleType} onValueChange={handleDomainRuleTypeChange}>
          <SelectTrigger id="domain-rules">
            <SelectValue placeholder="No restrictions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No restrictions</SelectItem>
            <SelectItem value="allow">Allow only</SelectItem>
            <SelectItem value="block">Block list</SelectItem>
          </SelectContent>
        </Select>
        {ruleType !== "none" && (
          <>
            <Textarea
              value={domainText}
              onChange={(e) => handleDomainListChange(e.target.value)}
              placeholder={
                ruleType === "allow"
                  ? "example.com\ncompany.com"
                  : "gmail.com\nyahoo.com"
              }
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {ruleType === "allow"
                ? "One domain per line. Only emails from these domains will be accepted. Only one of allow or block can be used at a time."
                : "One domain per line. Emails from these domains will be rejected. Only one of allow or block can be used at a time."}
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="email-normalize"
            checked={validation.normalize || false}
            onChange={(e) => handleChange("normalize", e.target.checked)}
            className="h-4 w-4"
          />
          <Label
            htmlFor="email-normalize"
            className="text-sm font-normal cursor-pointer"
          >
            Normalize Case
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Automatically convert email addresses to lowercase before storing.
        </p>
      </div>
    </div>
  );
}
