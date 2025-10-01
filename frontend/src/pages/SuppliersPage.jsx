import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import SupplierForm from "../components/features/supplier/SupplierForm";
import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useTemp } from "../hooks/useTemp";

const SAMPLE_SUPPLIERS = [];

export default function SuppliersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const { value: suppliers = SAMPLE_SUPPLIERS, set: setSuppliers } = useTemp(
    "suppliers:working-list",
    SAMPLE_SUPPLIERS
  );

  // Fetch function for Table component
  const fetchSuppliers = async (params) => {
    const { page, pageSize, search, sortBy, sortDir } = params;

    let filtered = [...suppliers];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.code?.toLowerCase().includes(searchLower) ||
          s.name?.toLowerCase().includes(searchLower) ||
          s.contact_info?.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy] || "";
        let bVal = b[sortBy] || "";

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
      label: "Supplier Code",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "name",
      label: "Supplier Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "contact_info",
      label: "Contact Info",
      sortable: false,
      render: (value) => (
        <span className="text-secondary-text">{value || "-"}</span>
      ),
    },
  ];

  // CRUD Handlers
  const handleAdd = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedSupplier(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedSupplier(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    if (
      window.confirm(`Are you sure you want to delete supplier ${row.name}?`)
    ) {
      setSuppliers((prev) => prev.filter((s) => s.id !== row.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  // Save handler
  const handleSave = (supplierData) => {
    const nextId = (arr) =>
      arr.length ? Math.max(...arr.map((s) => s.id || 0)) + 1 : 1;

    setSuppliers((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (supplierData.id) {
        // Update existing
        return current.map((s) =>
          s.id === supplierData.id ? { ...s, ...supplierData } : s
        );
      }
      // Create new
      return [...current, { ...supplierData, id: nextId(current) }];
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
            Supplier Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Manage your suppliers with contact information and details.
          </p>

          <Table
            columns={columns}
            fetchData={fetchSuppliers}
            actions={renderActions}
            onCreate={handleAdd}
            pageSizeOptions={[10, 20, 50, 100]}
          />

          <SupplierForm
            supplier={selectedSupplier}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        </div>
      </div>
    </MainLayout>
  );
}
