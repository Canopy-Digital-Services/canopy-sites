"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// The options a Dropdown or Checkboxes field offers, one box each. Enter adds
// an option below, Backspace in an empty one removes it, and pasting several
// lines makes one option per line. "Other", whose answer the visitor types,
// is a checkbox below the list: the form always lists it last.

import { useEffect, useId, useRef, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SortableList } from "@/components/ui/sortable-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSelectStandIn } from "@/hooks/use-select-stand-in";
import { isStarterOption } from "@/lib/field-rules";
import {
  OTHER_LABEL,
  choiceKey,
  clashingChoices,
  type ChoiceOption,
  type ChoiceOptions,
} from "../../../embed/src/choices";

const blank: ChoiceOption = { value: "", label: "" };

/** An option's place in the list, kept apart from the option (which saves
    without one) so that React and the drag list follow a row as it moves,
    not a position: a box inserted mid-list must be a new box. */
type Row = { id: string; option: ChoiceOption };
let rowCount = 0;
const newRowId = () => `option-${++rowCount}`;

export function ChoiceOptionsEditor({
  value,
  onChange,
  onFocusOption,
}: {
  value: ChoiceOptions;
  onChange: (next: ChoiceOptions) => void;
  /** The option being edited (its index, or "other" while Other is
      included), for the preview's mark; null on leaving it. */
  onFocusOption?: (option: number | "other" | null) => void;
}) {
  const otherId = useId();
  const options = value.options;
  const clashes = clashingChoices(value);

  // Row ids follow the options through every change made here; a change
  // from outside (closing the row drops blank options) re-fits them.
  const [ids, setIds] = useState(() => options.map(newRowId));
  if (ids.length !== options.length) {
    setIds(options.map((_, i) => ids[i] ?? newRowId()));
  }
  const rows: Row[] = options.map((option, i) => ({ id: ids[i] ?? `pending-${i}`, option }));
  const items = rows.map((row, index) => ({ id: row.id, index, ...row.option }));

  const selectStarter = useSelectStandIn(isStarterOption);

  // The box to focus once the list has rendered its change.
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focusNext = useRef<number | null>(null);
  useEffect(() => {
    if (focusNext.current === null) return;
    const input = inputs.current[focusNext.current];
    focusNext.current = null;
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  });

  const setRows = (next: Row[], focus?: number, defaultValue = value.defaultValue) => {
    if (focus !== undefined) focusNext.current = focus;
    setIds(next.map((row) => row.id));
    const config: ChoiceOptions = { ...value, options: next.map((row) => row.option) };
    if (defaultValue === undefined) delete config.defaultValue;
    else config.defaultValue = defaultValue;
    onChange(config);
  };
  const newRows = (added: ChoiceOption[]) => added.map((option) => ({ id: newRowId(), option }));

  const rename = (index: number, text: string) => {
    const old = options[index];
    // A default follows its option to the new name.
    const defaultValue = value.defaultValue === old.value ? text : value.defaultValue;
    setRows(
      rows.map((row, i) => (i === index ? { ...row, option: { value: text, label: text } } : row)),
      undefined,
      defaultValue
    );
  };

  const insert = (at: number, added: ChoiceOption[], focus: number) =>
    setRows([...rows.slice(0, at), ...newRows(added), ...rows.slice(at)], focus);

  const remove = (index: number, focus?: number) => {
    const defaultValue = value.defaultValue === options[index].value ? undefined : value.defaultValue;
    setRows(rows.filter((_, i) => i !== index), focus, defaultValue);
  };

  const reorder = (order: string[]) => setRows(order.flatMap((id) => rows.filter((row) => row.id === id)));

  const addAtEnd = () => {
    // An empty box at the end is the one to type in, not another.
    const last = options.length - 1;
    if (last >= 0 && !options[last].label.trim()) {
      inputs.current[last]?.focus();
      return;
    }
    insert(options.length, [blank], options.length);
  };

  // Several lines pasted at once are a list of options.
  const paste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const lines = e.clipboardData
      .getData("text")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    const keep = options[index].label.trim() ? [rows[index]] : [];
    const added = newRows(lines.map((line) => ({ value: line, label: line })));
    setRows(
      [...rows.slice(0, index), ...keep, ...added, ...rows.slice(index + 1)],
      index + keep.length + added.length - 1
    );
  };

  const setOther = (on: boolean) => {
    const config = { ...value };
    if (on) config.allowOther = true;
    else delete config.allowOther;
    onChange(config);
    onFocusOption?.(on ? "other" : null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {options.length > 0 && (
          <SortableList
            items={items}
            onReorder={reorder}
            className="space-y-2"
            renderItem={({ item, dragHandleProps }) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  {...dragHandleProps}
                  className="shrink-0 cursor-grab touch-none text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <Input
                  ref={(el) => {
                    inputs.current[item.index] = el;
                  }}
                  value={item.label}
                  placeholder="Option"
                  aria-invalid={clashes.has(choiceKey(item.label)) || undefined}
                  onChange={(e) => rename(item.index, e.target.value)}
                  {...selectStarter}
                  onFocus={() => onFocusOption?.(item.index)}
                  onBlur={() => onFocusOption?.(null)}
                  onPaste={(e) => paste(item.index, e)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (item.label.trim()) insert(item.index + 1, [blank], item.index + 1);
                    } else if (e.key === "Backspace" && item.label === "" && options.length > 1) {
                      e.preventDefault();
                      remove(item.index, Math.max(0, item.index - 1));
                    }
                  }}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.label.trim() || "option"}`}
                      onClick={() => remove(item.index)}
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
        )}

        {/* The list's last row, as Add field is the Fields list's, in line
            with the boxes. */}
        <div className="flex items-center gap-2">
          <span className="w-4 shrink-0" aria-hidden />
          <button
            type="button"
            onClick={addAtEnd}
            className="flex h-9 flex-1 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary hover:bg-muted/50"
          >
            <Plus className="h-4 w-4" />
            Add option
          </button>
          <span className="size-7 shrink-0" aria-hidden />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={otherId}
          checked={value.allowOther === true}
          onCheckedChange={(checked) => setOther(checked === true)}
          onFocus={() => value.allowOther && onFocusOption?.("other")}
          onBlur={() => onFocusOption?.(null)}
        />
        <Label htmlFor={otherId} className="cursor-pointer font-normal">
          Include &quot;{OTHER_LABEL}&quot;
        </Label>
      </div>
    </div>
  );
}
