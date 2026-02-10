"use client";

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

  const handleChange = (key: keyof EmailValidation, newValue: any) => {
    const updated = { ...validation };

    if (key === "normalize") {
      if (newValue) {
        updated[key] = true;
      } else {
        delete updated[key];
      }
    } else if (key === "domainRules") {
      if (newValue && (newValue.allow?.length > 0 || newValue.block?.length > 0)) {
        updated[key] = newValue;
      } else {
        delete updated[key];
      }
    }

    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  const domainRules = validation.domainRules || {};
  const ruleType = domainRules.allow ? "allow" : domainRules.block ? "block" : "none";

  const handleDomainRuleTypeChange = (type: string) => {
    if (type === "none") {
      handleChange("domainRules", undefined);
    } else {
      handleChange("domainRules", {
        [type]: [],
      });
    }
  };

  const handleDomainListChange = (list: string) => {
    const domains = list
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    
    if (domains.length === 0) {
      handleChange("domainRules", undefined);
    } else {
      handleChange("domainRules", {
        [ruleType]: domains,
      });
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
            <SelectItem value="allow">Allow only (whitelist)</SelectItem>
            <SelectItem value="block">Block (blacklist)</SelectItem>
          </SelectContent>
        </Select>
        {ruleType !== "none" && (
          <>
            <Textarea
              value={
                ruleType === "allow"
                  ? (domainRules.allow || []).join("\n")
                  : (domainRules.block || []).join("\n")
              }
              onChange={(e) => handleDomainListChange(e.target.value)}
              placeholder={
                ruleType === "allow"
                  ? "example.com\ncompany.com\none domain per line"
                  : "gmail.com\nyahoo.com\none domain per line"
              }
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {ruleType === "allow"
                ? "Only emails from these domains will be accepted."
                : "Emails from these domains will be rejected."}
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
            Auto-lowercase (normalize for consistency)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Automatically convert email addresses to lowercase before storing.
        </p>
      </div>
    </div>
  );
}
