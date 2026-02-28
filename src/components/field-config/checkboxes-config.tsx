"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SortableList } from "@/components/ui/sortable-list";
import { CheckboxesOptions } from "@/types/field-config";
import { ConfigComponentProps } from "./types";
import { Trash2, GripVertical } from "lucide-react";

type OptionWithId = {
  id: string;
  value: string;
  label: string;
};

export function CheckboxesConfig({
  value,
  onChange,
}: ConfigComponentProps<CheckboxesOptions | undefined>) {
  const config = value || { options: [] };
  const options = useMemo(() => config.options || [], [config.options]);
  const [showValidation, setShowValidation] = useState(false);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const prevLengthRef = useRef(options.length);

  // Add stable IDs for drag-and-drop (not persisted to DB)
  const optionsWithIds: OptionWithId[] = useMemo(
    () =>
      options.map((opt, index) => ({
        id: `option-${index}`,
        value: opt.value,
        label: opt.label,
      })),
    [options]
  );

  const duplicateValues = useMemo(() => {
    const counts = new Map<string, number>();
    for (const opt of options) {
      const v = opt.value.trim();
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([v]) => v);
  }, [options]);

  const hasDuplicateValues = duplicateValues.length > 0;

  // Focus the last input when a new option is added
  useEffect(() => {
    if (options.length > prevLengthRef.current) {
      setTimeout(() => {
        lastInputRef.current?.focus();
      }, 0);
    }
    prevLengthRef.current = options.length;
  }, [options.length]);

  const handleOptionChange = (id: string, newValue: string) => {
    const index = optionsWithIds.findIndex((opt) => opt.id === id);
    if (index === -1) return;

    const updatedOptions = [...options];
    updatedOptions[index] = { value: newValue, label: newValue };
    onChange({ ...config, options: updatedOptions });
  };

  const handleReorder = (ids: string[]) => {
    const reordered = ids
      .map((id) => {
        const opt = optionsWithIds.find((o) => o.id === id);
        return opt ? { value: opt.value, label: opt.label } : null;
      })
      .filter((opt): opt is { value: string; label: string } => opt !== null);

    onChange({ ...config, options: reordered });
  };

  const handleAddOption = () => {
    onChange({ ...config, options: [...options, { value: "", label: "" }] });
  };

  const handleRemoveOption = (id: string) => {
    const index = optionsWithIds.findIndex((opt) => opt.id === id);
    if (index === -1) return;

    const updatedOptions = options.filter((_, i) => i !== index);
    if (updatedOptions.length === 0) {
      onChange(undefined);
    } else {
      onChange({ ...config, options: updatedOptions });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
        >
          Add Option
        </Button>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add options for this checkbox group.
        </p>
      ) : (
        <>
          <SortableList
            items={optionsWithIds}
            onReorder={handleReorder}
            renderItem={({ item, dragHandleProps }) => (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      {...dragHandleProps}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Drag to reorder</TooltipContent>
                </Tooltip>
                <Input
                  ref={
                    item.id === optionsWithIds[optionsWithIds.length - 1]?.id
                      ? lastInputRef
                      : undefined
                  }
                  value={item.label}
                  onChange={(e) => handleOptionChange(item.id, e.target.value)}
                  onBlur={() => setShowValidation(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!hasDuplicateValues) {
                        handleAddOption();
                      }
                    }
                  }}
                  placeholder="Option name"
                  className="flex-1"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveOption(item.id)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove option</TooltipContent>
                </Tooltip>
              </div>
            )}
          />

          {showValidation && hasDuplicateValues && (
            <p className="text-sm text-destructive">
              Options must be unique. Choose a different name.
            </p>
          )}
        </>
      )}
    </div>
  );
}
