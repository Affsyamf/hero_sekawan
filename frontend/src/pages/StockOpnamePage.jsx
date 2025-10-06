import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import StockOpnameForm from "../components/features/stock-opname/StockOpnameForm";
import ImportStockOpnameModal from "../components/features/stock-opname/ImportStockOpnameModal"
import { useState } from "react";
import { Edit2, Trash2, Eye, Upload} from "lucide-react";
import { useTemp } from "../hooks/useTemp";
import { formatDate } from "../utils/helpers";

const SAMPLE_STOCK_OPNAME_ENTRIES = [];

export default function StockOpnamePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const { value: entries = SAMPLE_STOCK_OPNAME_ENTRIES, set: setEntries } =
    useTemp("stock-opname-entries:working-list", SAMPLE_STOCK_OPNAME_ENTRIES);
  const { value: products = [] } = useTemp("products:working-list", []);

  const fetchEntries = async (params) => {
    const { page, pageSize, search, sortBy, sortDir, dateRange } = params;
    let filtered = [...entries];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.code?.toLowerCase().includes(s) ||
          products
            .find((p) => p.id === e.product_id)
            ?.name?.toLowerCase()
            .includes(s)
      );
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((e) => {
        const d = new Date(e.date);
        return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
      });
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy],
          bVal = b[sortBy];
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { rows: filtered.slice(start, start + pageSize), total };
  };

  const columns = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (v) => <span className="font-medium text-primary-text">{v}</span>,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatDate(v)}</span>
      ),
    },
    {
      key: "details",
      label: "Items",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.length || 0}</span>
      ),
    },
    {
      key: "system_qty",
      label: "System Qty",
      sortable: false,
      render: (_, row) => {
        const total = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.system_quantity) || 0),
          0
        );
        return (
          <span className="text-secondary-text">
            {total?.toFixed(2) || "0.00"}
          </span>
        );
      },
    },
    {
      key: "physical_qty",
      label: "Physical Qty",
      sortable: false,
      render: (_, row) => {
        const total = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.physical_quantity) || 0),
          0
        );
        return (
          <span className="text-secondary-text">
            {total?.toFixed(2) || "0.00"}
          </span>
        );
      },
    },
    {
      key: "difference",
      label: "Difference",
      sortable: false,
      render: (_, row) => {
        const systemTotal = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.system_quantity) || 0),
          0
        );
        const physicalTotal = row.details?.reduce(
          (sum, d) => sum + (parseFloat(d.physical_quantity) || 0),
          0
        );
        const diff = systemTotal - physicalTotal;
        return (
          <span
            className={`font-medium ${
              diff > 0
                ? "text-red-600"
                : diff < 0
                ? "text-green-600"
                : "text-secondary-text"
            }`}
          >
            {diff?.toFixed(2) || "0.00"}
          </span>
        );
      },
    },
  ];

  const actions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setSelected(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelected(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete stock opname ${row.code}?`))
            setEntries((p) => p.filter((e) => e.id !== row.id));
        }}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const save = (data) => {
    setEntries((prev) => {
      const c = Array.isArray(prev) ? prev : [];
      if (data.id)
        return c.map((e) => (e.id === data.id ? { ...e, ...data } : e));
      const id = c.length ? Math.max(...c.map((e) => e.id || 0)) + 1 : 1;
      return [...c, { ...data, id }];
    });
    setIsModalOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Stock Opname Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Record and manage physical inventory counts with system quantity
            comparison.
          </p>

          <div className="mb-4">
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              Import from Excel
            </button>
          </div>

          <Table
            key={refresh}
            columns={columns}
            fetchData={fetchEntries}
            actions={actions}
            onCreate={() => {
              setSelected(null);
              setIsModalOpen(true);
            }}
            pageSizeOptions={[10, 20, 50, 100]}
            dateFilterKey="date"
          />

          <StockOpnameForm
            entry={selected}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelected(null);
            }}
            onSave={save}
          />

          <ImportStockOpnameModal
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            onImportSuccess={() => setRefresh((p) => p + 1)}
          />
        </div>
      </div>
    </MainLayout>
  );
}
