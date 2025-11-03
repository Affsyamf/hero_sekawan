import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Generic expandable chip card
 *
 * @param {string} title - Main text or label for the chip
 * @param {Array} items - Optional list of strings or objects to show inside
 * @param {boolean} dragging - Visual state if used with drag-and-drop
 * @param {function} renderItem - Optional custom renderer for each item
 */
export default function ExpandableChip({
  title,
  items = ["a", "b", "c"],
  dragging = false,
  renderItem,
}) {
  const [open, setOpen] = useState(false);
  const hasItems = items?.length > 0;

  return (
    <div
      className={`text-sm rounded-lg border cursor-grab active:cursor-grabbing shadow-sm select-none ${
        dragging
          ? "bg-blue-100 border-blue-300"
          : "bg-white border-gray-200 hover:bg-blue-50"
      }`}
    >
      {/* Header / main row */}
      <div
        className="flex justify-between items-center p-2.5"
        onClick={(e) => {
          e.stopPropagation(); // prevent drag when toggling
          if (hasItems) setOpen((o) => !o);
        }}
      >
        <span className="text-sm font-medium text-gray-800">{title}</span>
        {hasItems && (
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {/* Expandable content */}
      {hasItems && (
        <div
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
            open ? "max-h-48" : "max-h-0"
          }`}
        >
          <div className="px-3 pb-2 text-xs text-gray-600 space-y-0.5">
            {items.map((item, i) =>
              renderItem ? (
                renderItem(item, i)
              ) : (
                <div key={i}>{typeof item === "string" ? item : item.name}</div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
