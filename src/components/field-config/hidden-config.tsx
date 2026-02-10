"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HiddenOptions } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function HiddenConfig({
  value,
  onChange,
}: ConfigComponentProps<HiddenOptions | undefined>) {
  const options = value || { valueSource: "static" };

  const handleSourceChange = (newSource: string) => {
    const source = newSource as HiddenOptions["valueSource"];
    
    if (source === "static") {
      onChange({ valueSource: source, staticValue: options.staticValue || "" });
    } else if (source === "urlParam") {
      onChange({ valueSource: source, paramName: options.paramName || "" });
    } else {
      onChange({ valueSource: source });
    }
  };

  const handleStaticValueChange = (newValue: string) => {
    onChange({ ...options, staticValue: newValue });
  };

  const handleParamNameChange = (newValue: string) => {
    onChange({ ...options, paramName: newValue });
  };

  return (
    <div className="space-y-3">
      <Label>Hidden Field Configuration</Label>

      <div className="space-y-2">
        <Label htmlFor="hidden-source" className="text-sm font-normal">
          Value Source
        </Label>
        <Select value={options.valueSource} onValueChange={handleSourceChange}>
          <SelectTrigger id="hidden-source">
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">Static Value</SelectItem>
            <SelectItem value="urlParam">URL Parameter</SelectItem>
            <SelectItem value="pageUrl">Page URL</SelectItem>
            <SelectItem value="referrer">Referrer URL</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {options.valueSource === "static" && "A fixed value that's always submitted."}
          {options.valueSource === "urlParam" && "Read value from a URL parameter (e.g., ?utm_source=google)."}
          {options.valueSource === "pageUrl" && "Capture the full URL of the page containing the form."}
          {options.valueSource === "referrer" && "Capture the URL that referred the visitor to this page."}
        </p>
      </div>

      {options.valueSource === "static" && (
        <div className="space-y-2">
          <Label htmlFor="hidden-static" className="text-sm font-normal">
            Static Value
          </Label>
          <Input
            id="hidden-static"
            value={options.staticValue || ""}
            onChange={(e) => handleStaticValueChange(e.target.value)}
            placeholder="e.g., department=sales"
          />
          <p className="text-xs text-muted-foreground">
            This value will be submitted with every form submission.
          </p>
        </div>
      )}

      {options.valueSource === "urlParam" && (
        <div className="space-y-2">
          <Label htmlFor="hidden-param" className="text-sm font-normal">
            Parameter Name
          </Label>
          <Input
            id="hidden-param"
            value={options.paramName || ""}
            onChange={(e) => handleParamNameChange(e.target.value)}
            placeholder="e.g., utm_source"
          />
          <p className="text-xs text-muted-foreground">
            The name of the URL parameter to read (without the ? or &).
          </p>
        </div>
      )}
    </div>
  );
}
