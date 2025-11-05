import { useEffect, useState, useMemo } from "react";
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

  useEffect(() => {
    searchAccountParent({ page: 1, page_size: 100 }).then((res) => {
      const a = res.data.data;

      const data = a.map((item) => ({
        ...item,
        children: item.accounts || [],
        name: `${item.account_no} ${item.name ? " (" + item.name + ")" : ""}`,
      }));

      const grouped = { chemical: [], sparepart: [], other: [], none: [] };

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
      chemical: { title: "Chemical", tint: "bg-blue-50" },
      sparepart: { title: "Sparepart", tint: "bg-emerald-50" },
      other: { title: "Other", tint: "bg-lime-50" },
      none: { title: "None", tint: "bg-gray-100" },
    }),
    []
  );

  if (!columns) return <div>Loading...</div>;

  return (
    <div className="p-6">
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
      <p className="text-sm text-gray-500 mb-6">
        Drag accounts into the correct bucket below.
      </p>

      <KanbanBoard
        columns={columns}
        columnMeta={columnMeta}
        onMove={async (item, from, to) => {
          await updateAccountParent(item.id, { account_type: to });
        }}
      />
    </div>
  );
}
