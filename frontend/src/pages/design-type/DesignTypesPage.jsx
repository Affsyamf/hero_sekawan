import { Edit2, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import DesignTypeForm from "../../components/features/design-type/DesignTypeForm";
import Table from "../../components/ui/table/Table";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import {
  createDesignType,
  deleteDesignType,
  searchDesignType,
  updateDesignType,
} from "../../services/design_type_service";

export default function DesignTypesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesignType, setSelectedDesignType] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDesignType(null);
  };

  const handleSave = async (designTypeData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(designTypeData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateDesignType(payload.id, payload);
      } else {
        await createDesignType(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save design type: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to delete design type ${row.name}?`)
    ) {
      try {
        await deleteDesignType(row.id);
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
            key={refreshKey}
            columns={columns}
            fetchData={searchDesignType}
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
