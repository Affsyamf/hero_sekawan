import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import PurchasingForm from "../components/features/purchasing/PurchasingForm";
import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useTemp } from "../hooks/useTemp";
import { formatCurrency, formatDate } from "../utils/helpers";

const SAMPLE_PURCHASINGS = [];

export default function PurchasingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchasing, setSelectedPurchasing] = useState(null);

  const { value: purchasings = SAMPLE_PURCHASINGS, set: setPurchasings } =
    useTemp("purchasings:working-list", SAMPLE_PURCHASINGS);

  const { value: suppliers = [] } = useTemp("suppliers:working-list", []);

  // Fetch function for Table component
  const fetchPurchasings = async (params) => {
    const { page, pageSize, search, sortBy, sortDir, dateRange } = params;

    let filtered = [...purchasings];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.code?.toLowerCase().includes(searchLower) ||
          p.purchase_order?.toLowerCase().includes(searchLower) ||
          suppliers
            .find((s) => s.id === p.supplier_id)
            ?.name?.toLowerCase()
            .includes(searchLower)
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((p) => {
        const date = new Date(p.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return date >= start && date <= end;
      });
    }

    // Sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortBy === "supplier_id") {
          const supplierA = suppliers.find((s) => s.id === a.supplier_id);
          const supplierB = suppliers.find((s) => s.id === b.supplier_id);
          aVal = supplierA?.name || "";
          bVal = supplierB?.name || "";
        }

        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return { rows, total };
  };

  const columns = [
    {
      key: "code",
      label: "No Bukti",
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
      key: "purchase_order",
      label: "PO Number",
      sortable: true,
      render: (value) => (
        <span className="text-secondary-text">{value || "-"}</span>
      ),
    },
    {
      key: "supplier_id",
      label: "Supplier",
      sortable: true,
      render: (value) => {
        const supplier = suppliers.find((s) => s.id === value);
        return (
          <span className="text-primary-text">
            {supplier ? `${supplier.code} - ${supplier.name}` : "-"}
          </span>
        );
      },
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
      label: "Total Amount",
      sortable: false,
      render: (value) => {
        const total =
          value?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0;
        return (
          <span className="font-medium text-primary">
            {formatCurrency(total)}
          </span>
        );
      },
    },
  ];

  // CRUD Handlers - Parent only orchestrates data
  const handleAdd = () => {
    setSelectedPurchasing(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedPurchasing(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedPurchasing(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    if (
      window.confirm(`Are you sure you want to delete purchasing ${row.code}?`)
    ) {
      setPurchasings((prev) => prev.filter((p) => p.id !== row.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPurchasing(null);
  };

  // Save handler - Parent manages the data state
  const handleSave = (purchasingData) => {
    const nextId = (arr) =>
      arr.length ? Math.max(...arr.map((p) => p.id || 0)) + 1 : 1;

    setPurchasings((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (purchasingData.id) {
        // Update existing
        return current.map((p) =>
          p.id === purchasingData.id ? { ...p, ...purchasingData } : p
        );
      }
      // Create new
      return [...current, { ...purchasingData, id: nextId(current) }];
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
            Purchasing Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Manage product purchases from suppliers with detailed tracking and
            calculations.
          </p>

          <Table
            columns={columns}
            fetchData={fetchPurchasings}
            actions={renderActions}
            onCreate={handleAdd}
            pageSizeOptions={[10, 20, 50, 100]}
            dateFilterKey="date"
          />

          <PurchasingForm
            purchasing={selectedPurchasing}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        </div>
      </div>
    </MainLayout>
  );
}