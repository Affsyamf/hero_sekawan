import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import ColorKitchenForm from "../components/features/color-kitchen/ColorKitchenForm";
import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useTemp } from "../hooks/useTemp";
import { formatDate } from "../utils/helpers";

const SAMPLE_COLOR_KITCHEN_ENTRIES = [];

export default function ColorKitchensPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const { value: entries = SAMPLE_COLOR_KITCHEN_ENTRIES, set: setEntries } =
    useTemp("color-kitchen-entries:working-list", SAMPLE_COLOR_KITCHEN_ENTRIES);

  const { value: designs = [] } = useTemp("designs:working-list", []);

  const fetchEntries = async (params) => {
    const { page, pageSize, search, sortBy, sortDir, dateRange } = params;

    let filtered = [...entries];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.code?.toLowerCase().includes(searchLower) ||
          designs
            .find((d) => d.id === e.design_id)
            ?.code?.toLowerCase()
            .includes(searchLower)
      );
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((e) => {
        const date = new Date(e.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return date >= start && date <= end;
      });
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortBy === "design_id") {
          const designA = designs.find((d) => d.id === a.design_id);
          const designB = designs.find((d) => d.id === b.design_id);
          aVal = designA?.code || "";
          bVal = designB?.code || "";
        }

        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return { rows, total };
  };

  const columns = [
    {
      key: "code",
      label: "No OPJ",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value) => (
        <span className="text-secondary-text">{formatDate(value)}</span>
      ),
    },
    {
      key: "design_id",
      label: "Design",
      sortable: true,
      render: (value) => {
        const design = designs.find((d) => d.id === value);
        return (
          <span className="text-primary-text">
            {design ? design.code : "-"}
          </span>
        );
      },
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      render: (value) => <span className="text-secondary-text">{value}</span>,
    },
    {
      key: "paste_quantity",
      label: "Paste Qty",
      sortable: true,
      render: (value) => <span className="text-secondary-text">{value}</span>,
    },
    {
      key: "details",
      label: "Items",
      sortable: false,
      render: (value) => (
        <span className="text-secondary-text">{value?.length || 0}</span>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedEntry(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedEntry(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedEntry(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    if (window.confirm(`Are you sure you want to delete entry ${row.code}?`)) {
      setEntries((prev) => prev.filter((e) => e.id !== row.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleSave = (entryData) => {
    const nextId = (arr) =>
      arr.length ? Math.max(...arr.map((e) => e.id || 0)) + 1 : 1;

    setEntries((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (entryData.id) {
        return current.map((e) =>
          e.id === entryData.id ? { ...e, ...entryData } : e
        );
      }
      return [...current, { ...entryData, id: nextId(current) }];
    });

    handleCloseModal();
  };

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleDetail(row)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(row)}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-all duration-200"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all duration-200"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Color Kitchen Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Manage color kitchen entries with design and product details.
          </p>

          <Table
            columns={columns}
            fetchData={fetchEntries}
            actions={renderActions}
            onCreate={handleAdd}
            pageSizeOptions={[10, 20, 50, 100]}
            dateFilterKey="date"
          />

          <ColorKitchenForm
            entry={selectedEntry}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        </div>
      </div>
    </MainLayout>
  );
}
