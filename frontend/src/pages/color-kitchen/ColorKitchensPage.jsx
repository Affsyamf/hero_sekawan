import MainLayout from "../../layouts/MainLayout/MainLayout";
import Table from "../../components/ui/table/Table";
import ColorKitchenForm from "../../components/features/color-kitchen/ColorKitchenForm";
import ImportColorKitchenModal from "../../components/features/color-kitchen/ImportColorKitchenModal";
import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye, Upload } from "lucide-react";
import { formatDate } from "../../utils/helpers";
import {
  createColorKitchen,
  searchColorKitchen,
  updateColorKitchen,
} from "../../services/color_kitchen_service";
import { searchDesign } from "../../services/design_service";
import { useFilteredFetch } from "../../hooks/useFilteredFetch";
import { useGlobalFilter } from "../../contexts/GlobalFilterContext";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";

export default function ColorKitchensPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [designs, setDesigns] = useState([]);

  //filter global
  const { dateRange } = useGlobalFilter();
  const filteredSearchColorKitchen = useFilteredFetch(
    searchColorKitchen,
    "date"
  );

  useEffect(() => {
    setRefresh((prev) => prev + 1);
  }, [dateRange.startDate, dateRange.endDate]);

  const columns = [
    {
      key: "code",
      label: "No OPJ",
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
      key: "design_name",
      label: "Design",
      sortable: true,
    },
    {
      key: "rolls",
      label: "Quantity (Roll)",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v}</span>,
    },
    {
      key: "paste_quantity",
      label: "Paste Qty",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v}</span>,
    },
  ];

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setSelected(row);
          navigate(`/color-kitchens/detail/${row.id}`);
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
          if (confirm(`Delete ${row.code}?`))
            // setEntries((p) => p.filter((e) => e.id !== row.id));
            console.log("Delete", row.id);
        }}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleSave = async (colorKitchenData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(colorKitchenData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateColorKitchen(payload.id, payload);
      } else {
        await createColorKitchen(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save color kitchen: " + error.message);
    }
  };

  return (
    <MainLayout>
      <div className="bg-background mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Color Kitchen Management
        </h1>
        <p className="mb-2 text-secondary-text">
          Manage color kitchen entries with design and product details.
        </p>
        {dateRange.startDate && dateRange.endDate && (
          <p className="mt-1 mb-4 text-xs text-blue-600">
            📅 Filtered: {formatDate(dateRange.startDate)} to{" "}
            {formatDate(dateRange.endDate)}
          </p>
        )}

        <div className="mb-4">
          <Button
            icon={Upload}
            label="Import from Excel"
            onClick={() => setIsImportOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          />
        </div>

        <Table
          key={refresh}
          columns={columns}
          fetchData={filteredSearchColorKitchen}
          actions={renderActions}
          onCreate={() => {
            setSelected(null);
            setIsModalOpen(true);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        <ColorKitchenForm
          entry={selected}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelected(null);
          }}
          onSave={handleSave}
        />
        <ImportColorKitchenModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={() => setRefresh((p) => p + 1)}
        />
      </div>
    </MainLayout>
  );
}
