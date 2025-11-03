import React, { useMemo, useState } from "react";
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
import { MainLayout } from "../../layouts";

// ---------- Sample data ----------
const initialData = {
  chemical: [
    { id: "CK", name: "CK" },
    { id: "DYESTUFF", name: "DYESTUFF" },
    { id: "FINISHING", name: "FINISHING" },
  ],
  sparepart: [
    { id: "SP1", name: "PERSEDIAAN_SPAREPART" },
    { id: "ENGRAVING_1", name: "ENGRAVING" },
  ],
  none: [
    { id: "BOILER", name: "BOILER" },
    { id: "ATK", name: "BIAYA_ALAT_TULIS_KANTOR" },
  ],
};

// ---------- Small helpers ----------
const findContainer = (columns, id) => {
  if (id in columns) return id; // the id is a container id
  return Object.keys(columns).find((key) =>
    columns[key].some((item) => item.id === id)
  );
};

const getActiveItem = (columns, activeId) => {
  const container = findContainer(columns, activeId);
  if (!container) return null;
  return columns[container].find((i) => i.id === activeId) || null;
};

// ---------- Board ----------
const AccountCategoryBoard = () => {
  const [columns, setColumns] = useState(initialData);
  const [activeId, setActiveId] = useState(null); // for DragOverlay

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // reduces accidental drags
    })
  );

  const columnMeta = useMemo(
    () => ({
      chemical: { title: "Chemical", tint: "bg-blue-50" },
      sparepart: { title: "Sparepart", tint: "bg-emerald-50" },
      none: { title: "Others", tint: "bg-gray-50" },
    }),
    []
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const from = findContainer(columns, active.id);
    const to = findContainer(columns, over.id);
    if (!from || !to) return;

    // Reorder within same column
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

    // Move between columns
    const movedItem = columns[from].find((i) => i.id === active.id);
    if (!movedItem) return;

    setColumns((prev) => ({
      ...prev,
      [from]: prev[from].filter((i) => i.id !== active.id),
      [to]: [movedItem, ...prev[to]],
    }));

    // TODO: call API to persist mapping (movedItem.id -> to)
    // e.g., await api.updateAccountCategory(movedItem.id, to)
    // console.log(`Moved ${movedItem.name} → ${to.toUpperCase()}`);
  };

  // The item shown while dragging (prevents “disappearing”)
  const activeItem = getActiveItem(columns, activeId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">
          Account Category Mapping
        </h1>
        <p className="text-sm text-gray-500">
          Drag accounts into the correct bucket below.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(columns).map((id) => (
            <DroppableColumn
              key={id}
              id={id}
              title={columnMeta[id].title}
              tint={columnMeta[id].tint}
              items={columns[id]}
            />
          ))}
        </div>

        {/* Prevents item from vanishing while dragging */}
        <DragOverlay>
          {activeItem ? <CardChip name={activeItem.name} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

// ---------- Columns ----------
const DroppableColumn = ({ id, title, tint, items }) => {
  // Make the whole column a drop target (works even when empty)
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

      {/* Sortable list for items inside this column */}
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
              <SortableItem key={item.id} id={item.id} name={item.name} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// ---------- Items ----------
const SortableItem = ({ id, name }) => {
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
      <CardChip name={name} />
    </div>
  );
};

const CardChip = ({ name, dragging = false }) => (
  <div
    className={`p-2.5 text-sm rounded-lg border cursor-grab active:cursor-grabbing shadow-sm select-none ${
      dragging
        ? "bg-blue-100 border-blue-300"
        : "bg-white border-gray-200 hover:bg-blue-50"
    }`}
  >
    {name}
  </div>
);

export default AccountCategoryBoard;
