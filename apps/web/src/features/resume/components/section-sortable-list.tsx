'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ResumeSectionLabel, type ResumeSectionIdValue } from '@stackfolio/shared';
import { GripVertical } from 'lucide-react';

function SortableItem({ id }: { id: ResumeSectionIdValue }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded border border-border bg-card p-3"
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab">
        <GripVertical size={16} />
      </button>
      <span className="font-medium">{ResumeSectionLabel[id]}</span>
    </div>
  );
}

export function SectionSortableList({
  order,
  onReorder,
}: {
  order: ResumeSectionIdValue[];
  onReorder: (next: ResumeSectionIdValue[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as ResumeSectionIdValue);
    const newIndex = order.indexOf(over.id as ResumeSectionIdValue);
    onReorder(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {order.map((id) => (
            <SortableItem key={id} id={id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
