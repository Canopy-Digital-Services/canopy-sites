"use client";

import { ReactNode, useId } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortableItemRenderProps {
  /** The item data being rendered */
  item: any;
  /** Props to spread on the drag handle element */
  dragHandleProps: {
    ref: (element: HTMLElement | null) => void;
    "aria-label": string;
    className: string;
  };
  /** Whether this item is currently being dragged */
  isDragging: boolean;
  /** Additional className for the item wrapper */
  itemClassName?: string;
}

export interface SortableListProps<T extends { id: string }> {
  /** Array of items with stable `id` properties */
  items: T[];
  /** Called when items are reordered with the new array of IDs */
  onReorder: (ids: string[]) => void;
  /** Render function for each item */
  renderItem: (props: SortableItemRenderProps) => ReactNode;
  /** Optional className for the list container */
  className?: string;
  /** Optional className for each item wrapper */
  itemClassName?: string;
}

interface SortableItemProps {
  id: string;
  item: any;
  renderItem: (props: SortableItemRenderProps) => ReactNode;
  itemClassName?: string;
}

function SortableItem({
  id,
  item,
  renderItem,
  itemClassName,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={itemClassName}>
      {renderItem({
        item,
        dragHandleProps: {
          ref: setActivatorNodeRef,
          "aria-label": "Drag to reorder",
          className: "cursor-grab active:cursor-grabbing",
          ...attributes,
          ...listeners,
        },
        isDragging,
        itemClassName,
      })}
    </div>
  );
}

/**
 * Reusable sortable list component with drag-to-reorder functionality.
 *
 * Uses @dnd-kit for accessible drag and drop with vertical-only movement.
 * Provides a consistent drag handle pattern (GripVertical icon) across the app.
 *
 * @example
 * ```tsx
 * <SortableList
 *   items={options}
 *   onReorder={(ids) => reorderOptions(ids)}
 *   renderItem={({ item, dragHandleProps, isDragging }) => (
 *     <div className="flex items-center gap-2">
 *       <button {...dragHandleProps}>
 *         <GripVertical className="h-4 w-4" />
 *       </button>
 *       <Input value={item.label} onChange={...} />
 *       <Button onClick={() => deleteItem(item.id)}>
 *         <Trash2 className="h-4 w-4" />
 *       </Button>
 *     </div>
 *   )}
 * />
 * ```
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
}: SortableListProps<T>) {
  // Use React's useId for stable hydration-safe IDs
  const dndContextId = useId();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorder(reordered.map((item) => item.id));
    }
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("space-y-2", className)}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              item={item}
              renderItem={renderItem}
              itemClassName={itemClassName}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * Standard drag handle button component for use with SortableList.
 * Pre-configured with GripVertical icon and accessible styling.
 */
export function DragHandle(
  props: React.HTMLAttributes<HTMLButtonElement> & {
    dragHandleProps?: SortableItemRenderProps["dragHandleProps"];
  }
) {
  const { dragHandleProps, className, ...rest } = props;

  return (
    <button
      type="button"
      {...dragHandleProps}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        dragHandleProps?.className,
        className
      )}
      {...rest}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
