# dnd-kit - Drag and Drop Toolkit

**Version:** @dnd-kit/core 6.3.1, @dnd-kit/sortable 9.0.0  
**Official docs:** https://docs.dndkit.com  
**Project usage:** Sortable lists with drag-and-drop reordering

---

## Overview

dnd-kit is a modern, lightweight drag-and-drop toolkit for React. In this project, we use it exclusively for **sortable list reordering** with a consistent UI pattern across the application.

## Project Pattern: SortableList Component

We've created a reusable `SortableList` component (`src/components/ui/sortable-list.tsx`) that wraps dnd-kit functionality with our standard UI patterns.

### Standard UI Pattern

All reorderable lists in the app follow this pattern:
- **Left**: Drag handle icon (`GripVertical` from lucide-react)
- **Middle**: List item content
- **Right**: Action buttons (edit, delete) as icon buttons

**Never use Up/Down buttons for reordering** - always use drag-and-drop.

### Basic Usage

```tsx
import { SortableList, DragHandle } from "@/components/ui/sortable-list";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Items must have stable `id` properties
const items = [
  { id: "item-1", name: "First" },
  { id: "item-2", name: "Second" },
  { id: "item-3", name: "Third" },
];

<SortableList
  items={items}
  onReorder={(ids) => {
    // ids is array of reordered IDs: ["item-2", "item-1", "item-3"]
    handleReorder(ids);
  }}
  renderItem={({ item, dragHandleProps, isDragging }) => (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <DragHandle dragHandleProps={dragHandleProps} />
        </TooltipTrigger>
        <TooltipContent>Drag to reorder</TooltipContent>
      </Tooltip>
      
      <span className="flex-1">{item.name}</span>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => deleteItem(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  )}
/>
```

## Key Features Used

- **Vertical-only movement**: Items restricted to vertical axis with `restrictToVerticalAxis` modifier
- **Keyboard support**: Built-in keyboard navigation for accessibility
- **Pointer and keyboard sensors**: Works with mouse, touch, and keyboard
- **Smooth animations**: Automatic transition animations during reordering
- **Visual feedback**: Opacity change during drag (isDragging state)

## Stable IDs for Options (Component State Only)

When working with non-persistent items (like select field options that don't have database IDs), generate stable IDs in component state:

```tsx
// Add stable IDs for drag-and-drop (not persisted to DB)
const optionsWithIds = useMemo(
  () =>
    options.map((opt, index) => ({
      id: `option-${index}`, // Stable within this render
      value: opt.value,
      label: opt.label,
    })),
  [options]
);
```

This prevents React key instability and ensures drag-and-drop IDs remain consistent during typing.

## Current Usage in Project

1. **Form Fields List** (`src/components/field-list.tsx`)
   - Reorder form fields with server persistence via `reorderFields()` action
   - Optimistic UI updates with rollback on error

2. **Select Field Options** (`src/components/field-config/select-config.tsx`)
   - Reorder dropdown options within field editor modal
   - Uses stable component-state IDs (not persisted separately)

## Accessibility

- All drag handles have `aria-label="Drag to reorder"`
- Keyboard navigation supported via arrow keys
- Tooltips on all interactive elements (drag handle, action buttons)
- Focus management handled by dnd-kit

## Important Notes

- **Movement is restricted to vertical axis only** - horizontal dragging is disabled
- **Items array must have unique, stable `id` properties** - don't use array indices directly
- **Tooltips are required** - wrap drag handles and icon buttons in Tooltip components
- **Use ghost variant** for icon-only buttons (edit, delete) on the right side

## Dependencies

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^9.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@dnd-kit/modifiers": "^8.0.0"
}
```

## Migration from Up/Down Buttons

If you find existing Up/Down button patterns:
1. Replace with `SortableList` component
2. Change `onMove(id, direction)` to `onReorder(ids: string[])`
3. Add drag handle icon on left + trash icon on right
4. Wrap interactive elements in Tooltip components
5. Use stable IDs (database IDs or component-state IDs)

---

**Remember:** The `SortableList` component is the **standard pattern** for all reorderable lists. Don't create custom drag-and-drop implementations - use this component for consistency.
