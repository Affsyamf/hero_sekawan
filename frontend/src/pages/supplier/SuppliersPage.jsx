import { Edit2, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import SupplierForm from "../../components/features/supplier/SupplierForm";
import Table from "../../components/ui/table/Table";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import {
  createSupplier,
  deleteSupplier,
  searchSupplier,
  updateSupplier,
} from "../../services/supplier_service";

export default function SuppliersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch function for Table component
  // const fetchSuppliers = async (params) => {
  //   const { page, pageSize, search, sortBy, sortDir } = params;

  //   let filtered = [...suppliers];

  //   // Search filter
  //   if (search) {
  //     const searchLower = search.toLowerCase();
  //     filtered = filtered.filter(
  //       (s) =>
  //         s.code?.toLowerCase().includes(searchLower) ||
  //         s.name?.toLowerCase().includes(searchLower) ||
  //         s.contact_info?.toLowerCase().includes(searchLower)
  //     );
  //   }

  //   // Sorting
  //   if (sortBy) {
  //     filtered.sort((a, b) => {
  //       let aVal = a[sortBy] || "";
  //       let bVal = b[sortBy] || "";

  //       if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
  //       if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
  //       return 0;
  //     });
  //   }

  //   // Pagination
  //   const total = filtered.length;
  //   const start = (page - 1) * pageSize;
  //   const rows = filtered.slice(start, start + pageSize);

  //   return { rows, total };
  // };

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  // Save handler
  const handleSave = async (supplierData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(supplierData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateSupplier(payload.id, payload);
      } else {
        await createSupplier(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save supplier: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to delete supplier ${row.name}?`)
    ) {
      try {
        await deleteSupplier(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
    }
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Supplier Management
        </h1>
        <p className="mb-6 text-secondary-text">
          Manage your suppliers with contact information and details.
        </p>

        <Table
          key={refreshKey}
          columns={columns}
          fetchData={searchSupplier}
          actions={renderActions}
          onCreate={handleAdd}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        <SupplierForm
          supplier={selectedSupplier}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
