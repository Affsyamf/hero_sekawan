import { useEffect, useState, useMemo, useRef } from "react";
import {
  searchAccountParent,
  updateAccountParent,
} from "../../services/account_service";
import KanbanBoard from "../../components/ui/kanban-board/KanbanBoard";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function AccountCategoryBoard() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState(null);
  const scrollRef = useRef(null); // ✅ Ref for Kanban scroll div

  useEffect(() => {
    searchAccountParent({ page: 1, page_size: 100 }).then((res) => {
      const a = res.data.data;
      const data = a.map((item) => ({
        ...item,
        children: item.accounts || [],
        name: `${item.account_no} ${item.name ? " (" + item.name + ")" : ""}`,
      }));

      const grouped = {
        chemical: [],
        sparepart: [],
        batubara: [],
        other: [],
        none: [],
      };

      data.forEach((acc) => {
        const type = acc.account_type || "none";
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(acc);
      });

      setColumns(grouped);
    });
  }, []);

  const columnMeta = useMemo(
    () => ({
      chemical: { title: "Chemical", tint: "bg-yellow-50" },
      sparepart: { title: "Sparepart", tint: "bg-indigo-50" },
      batubara: { title: "Batubara", tint: "bg-emerald-50" },
      other: { title: "Other", tint: "bg-lime-50" },
      none: { title: "None", tint: "bg-gray-200" },
    }),
    []
  );

  // ✅ Auto-scroll horizontally while dragging near edges
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleDragMove = (event) => {
      if (!event?.clientX) return;
      const { clientX } = event;
      const rect = container.getBoundingClientRect();
      const scrollSpeed = 15;

      if (clientX < rect.left + 80) container.scrollLeft -= scrollSpeed;
      else if (clientX > rect.right - 80) container.scrollLeft += scrollSpeed;
    };

    window.addEventListener("dragover", handleDragMove);
    return () => window.removeEventListener("dragover", handleDragMove);
  }, []);

  if (!columns) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface transition-all cursor-pointer"
          title="Back"
        >
          <ChevronLeft size={22} className="text-secondary-text" />
        </button>
        <h1 className="text-lg font-bold mb-2 text-gray-900">
          Account Category Mapping
        </h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Drag accounts into the correct bucket below.
      </p>

      {/* Scroll container for Kanban only */}
      <div
        ref={scrollRef}
        className="overflow-x-auto p-2 overflow-y-visible kanban-scroll-container"
      >
        <div className="min-w-max">
          <KanbanBoard
            columns={columns}
            columnMeta={columnMeta}
            onMove={async (item, from, to) => {
              await updateAccountParent(item.id, { account_type: to });
            }}
          />
        </div>
      </div>
    </div>
  );
}
