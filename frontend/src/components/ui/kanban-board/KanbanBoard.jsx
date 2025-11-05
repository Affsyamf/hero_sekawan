import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ExpandableChip from "./ExpandableChip";

// 🔧 Helper functions
const findContainer = (columns, id) => {
  if (id in columns) return id;
  return Object.keys(columns).find((key) =>
    columns[key].some((item) => item.id === id)
  );
};

const getActiveItem = (columns, activeId) => {
  const container = findContainer(columns, activeId);
  if (!container) return null;
  return columns[container].find((i) => i.id === activeId) || null;
};

// ---------- Generic Board ----------
export default function KanbanBoard({
  columns: initialColumns,
  columnMeta,
  onMove,
  renderItem,
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const from = findContainer(columns, active.id);
    const to = findContainer(columns, over.id);
    if (!from || !to) return;

    if (from === to) {
      const oldIndex = columns[from].findIndex((i) => i.id === active.id);
      const newIndex = columns[to].findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      setColumns((prev) => ({
        ...prev,
        [to]: arrayMove(prev[to], oldIndex, newIndex),
      }));
      return;
    }

    const movedItem = columns[from].find((i) => i.id === active.id);
    if (!movedItem) return;

    setColumns((prev) => ({
      ...prev,
      [from]: prev[from].filter((i) => i.id !== active.id),
      [to]: [movedItem, ...prev[to]],
    }));

    if (onMove) await onMove(movedItem, from, to);
  };

  const activeItem = getActiveItem(columns, activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* ✅ Only the grid itself, no overflow styling here */}
      <div className="flex gap-6 min-w-max px-1">
        {Object.keys(columns).map((id) => (
          <div key={id} className="flex-shrink-0 w-[260px]">
            <DroppableColumn
              id={id}
              title={columnMeta[id]?.title || id}
              tint={columnMeta[id]?.tint || "bg-gray-50"}
              items={columns[id]}
              renderItem={renderItem}
            />
          </div>
        ))}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem ? (
          <ExpandableChip
            title={activeItem.name || activeItem.label}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ---------- Column ----------
const DroppableColumn = ({ id, title, tint, items, renderItem }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-gray-200 shadow-sm p-4 ${tint} transition-colors ${
        isOver ? "ring-2 ring-blue-400 bg-white" : ""
      }`}
      style={{ minHeight: 280 }}
    >
      <h2 className="font-semibold text-gray-800 mb-3">{title}</h2>
      <SortableContext
        id={id}
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="text-sm text-gray-400 italic">Drop here</div>
          ) : (
            items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                item={item}
                renderItem={renderItem}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// ---------- Item ----------
const SortableItem = ({ id, item, renderItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderItem ? (
        renderItem(item, isDragging)
      ) : (
        <ExpandableChip
          title={item.name || item.label}
          items={item.children || []}
          dragging={isDragging}
        />
      )}
    </div>
  );
};
