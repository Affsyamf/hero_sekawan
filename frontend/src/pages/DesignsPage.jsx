import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import DesignForm from "../components/features/design/DesignForm";
import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useTemp } from "../hooks/useTemp";

const SAMPLE_DESIGNS = [];

export default function DesignsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);

  const { value: designs = SAMPLE_DESIGNS, set: setDesigns } = useTemp(
    "designs:working-list",
    SAMPLE_DESIGNS
  );

  const { value: designTypes = [] } = useTemp("design-types:working-list", []);

  const fetchDesigns = async (params) => {
    const { page, pageSize, search, sortBy, sortDir } = params;

    let filtered = [...designs];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.code?.toLowerCase().includes(searchLower) ||
          designTypes
            .find((dt) => dt.id === d.type_id)
            ?.name?.toLowerCase()
            .includes(searchLower)
      );
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortBy === "type_id") {
          const typeA = designTypes.find((dt) => dt.id === a.type_id);
          const typeB = designTypes.find((dt) => dt.id === b.type_id);
          aVal = typeA?.name || "";
          bVal = typeB?.name || "";
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
      label: "Design Code",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "type_id",
      label: "Design Type",
      sortable: true,
      render: (value) => {
        const type = designTypes.find((dt) => dt.id === value);
        return (
          <span className="text-primary-text">{type ? type.name : "-"}</span>
        );
      },
    },
  ];

  const handleAdd = () => {
    setSelectedDesign(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedDesign(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedDesign(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    if (window.confirm(`Are you sure you want to delete design ${row.code}?`)) {
      setDesigns((prev) => prev.filter((d) => d.id !== row.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDesign(null);
  };

  const handleSave = (designData) => {
    const nextId = (arr) =>
      arr.length ? Math.max(...arr.map((d) => d.id || 0)) + 1 : 1;

    setDesigns((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (designData.id) {
        return current.map((d) =>
          d.id === designData.id ? { ...d, ...designData } : d
        );
      }
      return [...current, { ...designData, id: nextId(current) }];
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
            Design Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Manage designs with codes and type classifications.
          </p>

          <Table
            columns={columns}
            fetchData={fetchDesigns}
            actions={renderActions}
            onCreate={handleAdd}
            pageSizeOptions={[10, 20, 50, 100]}
          />

          <DesignForm
            design={selectedDesign}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        </div>
      </div>
    </MainLayout>
  );
}
