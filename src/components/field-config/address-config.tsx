"use client";

import { Label } from "@/components/ui/label";
import { AddressOptions } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function AddressConfig({
  value,
  onChange,
}: ConfigComponentProps<AddressOptions>) {
  const options = value || { showLine2: true };

  const handleLine2Toggle = () => {
    onChange({
      ...options,
      showLine2: !options.showLine2,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Address Fields</Label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="address-show-line2"
            checked={options.showLine2 !== false}
            onChange={handleLine2Toggle}
            className="h-4 w-4"
          />
          <Label
            htmlFor="address-show-line2"
            className="text-sm font-normal cursor-pointer"
          >
            Show Address Line 2 (Apt, Suite, etc.)
          </Label>
        </div>
      </div>
    </div>
  );
}
