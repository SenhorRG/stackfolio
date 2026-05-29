'use client';

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  formatSkillCategoryLabel,
  isSkillCategoryHidden,
} from '@stackfolio/shared';
import { Eye, EyeOff, GripVertical } from 'lucide-react';

function SortableCategoryRow({
  id,
  label,
  hidden,
  disabled,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  hidden: boolean;
  disabled?: boolean;
  onToggleVisibility: (category: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-2 rounded border bg-card p-3 ${
        isDragging ? 'opacity-80 shadow-md' : ''
      } ${hidden ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        disabled={disabled}
        {...attributes}
        {...listeners}
        className="cursor-grab disabled:cursor-not-allowed"
        aria-label={`Reorder ${label}`}
      >
        <GripVertical size={16} />
      </button>
      <span className="flex-1 font-medium">
        {formatSkillCategoryLabel(label)}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggleVisibility(label)}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={
          hidden ? `Show ${label} on resume` : `Hide ${label} on resume`
        }
      >
        {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

type Props = {
  categories: string[];
  hiddenCategories: string[];
  disabled?: boolean;
  onReorder: (next: string[]) => void;
  onToggleVisibility: (category: string) => void;
};

export function ProfileSkillCategoryOrderList({
  categories,
  hiddenCategories,
  disabled,
  onReorder,
  onToggleVisibility,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.indexOf(String(active.id));
    const newIndex = categories.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(categories, oldIndex, newIndex));
  };

  if (!categories.length) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Categories appear here after you assign skills to display categories in
        the table above.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categories} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {categories.map((category) => (
            <SortableCategoryRow
              key={category}
              id={category}
              label={category}
              hidden={isSkillCategoryHidden(category, hiddenCategories)}
              disabled={disabled}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
