import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import DesignTypeForm from "../components/features/design-type/DesignTypeForm";
import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useTemp } from "../hooks/useTemp";

const SAMPLE_DESIGN_TYPES = [];

export default function DesignTypesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesignType, setSelectedDesignType] = useState(null);

  const { value: designTypes = SAMPLE_DESIGN_TYPES, set: setDesignTypes } =
    useTemp("design-types:working-list", SAMPLE_DESIGN_TYPES);

  const fetchDesignTypes = async (params) => {
    const { page, pageSize, search, sortBy, sortDir } = params;

    let filtered = [...designTypes];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((dt) =>
        dt.name?.toLowerCase().includes(searchLower)
      );
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy] || "";
        let bVal = b[sortBy] || "";

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
      key: "name",
      label: "Design Type Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedDesignType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedDesignType(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedDesignType(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    if (
      window.confirm(`Are you sure you want to delete design type ${row.name}?`)
    ) {
      setDesignTypes((prev) => prev.filter((dt) => dt.id !== row.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDesignType(null);
  };

  const handleSave = (designTypeData) => {
    const nextId = (arr) =>
      arr.length ? Math.max(...arr.map((dt) => dt.id || 0)) + 1 : 1;

    setDesignTypes((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (designTypeData.id) {
        return current.map((dt) =>
          dt.id === designTypeData.id ? { ...dt, ...designTypeData } : dt
        );
      }
      return [...current, { ...designTypeData, id: nextId(current) }];
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
            Design Type Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Manage design type categories for your designs.
          </p>

          <Table
            columns={columns}
            fetchData={fetchDesignTypes}
            actions={renderActions}
            onCreate={handleAdd}
            pageSizeOptions={[10, 20, 50, 100]}
          />

          <DesignTypeForm
            designType={selectedDesignType}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        </div>
      </div>
    </MainLayout>
  );
}
