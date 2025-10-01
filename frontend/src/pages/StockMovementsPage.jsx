import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import StockMovementForm from "../components/features/stock-movement/StockMovementForm";
import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useTemp } from "../hooks/useTemp";
import { formatDate } from "../utils/helpers";

const SAMPLE_STOCK_MOVEMENTS = [];

export default function StockMovementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStockMovement, setSelectedStockMovement] = useState(null);

  const {
    value: stockMovements = SAMPLE_STOCK_MOVEMENTS,
    set: setStockMovements,
  } = useTemp("stock-movements:working-list", SAMPLE_STOCK_MOVEMENTS);

  const { value: products = [] } = useTemp("products:working-list", []);

  const fetchStockMovements = async (params) => {
    const { page, pageSize, search, sortBy, sortDir, dateRange } = params;

    let filtered = [...stockMovements];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((sm) =>
        sm.code?.toLowerCase().includes(searchLower)
      );
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((sm) => {
        const date = new Date(sm.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return date >= start && date <= end;
      });
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

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
      label: "Movement Code",
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
      key: "details",
      label: "Items",
      sortable: false,
      render: (value) => (
        <span className="text-secondary-text">{value?.length || 0}</span>
      ),
    },
    {
      key: "details",
      label: "Total Quantity",
      sortable: false,
      render: (value) => {
        const total =
          value?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0;
        return <span className="font-medium text-primary">{total}</span>;
      },
    },
  ];

  const handleAdd = () => {
    setSelectedStockMovement(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedStockMovement(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedStockMovement(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    if (
      window.confirm(
        `Are you sure you want to delete stock movement ${row.code}?`
      )
    ) {
      setStockMovements((prev) => prev.filter((sm) => sm.id !== row.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStockMovement(null);
  };

  const handleSave = (stockMovementData) => {
    const nextId = (arr) =>
      arr.length ? Math.max(...arr.map((sm) => sm.id || 0)) + 1 : 1;

    setStockMovements((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (stockMovementData.id) {
        return current.map((sm) =>
          sm.id === stockMovementData.id ? { ...sm, ...stockMovementData } : sm
        );
      }
      return [...current, { ...stockMovementData, id: nextId(current) }];
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
            Stock Movement Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Track stock movements with detailed product quantities.
          </p>

          <Table
            columns={columns}
            fetchData={fetchStockMovements}
            actions={renderActions}
            onCreate={handleAdd}
            pageSizeOptions={[10, 20, 50, 100]}
            dateFilterKey="date"
          />

          <StockMovementForm
            stockMovement={selectedStockMovement}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        </div>
      </div>
    </MainLayout>
  );
}
