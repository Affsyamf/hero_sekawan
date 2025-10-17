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

export default function ColorKitchensPage() {
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

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const response = await searchDesign({});
        setDesigns(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch designs:", error);
      }
    };
    fetchDesigns();
  }, []);

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
      key: "design_id",
      label: "Design",
      sortable: true,
      render: (value) => {
        const design = (designs || []).find((a) => a.id === value);
        return (
          <span className="text-primary-text">
            {design ? `${design.code}` : "-"}
          </span>
        );
      },
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v}</span>,
    },
    {
      key: "paste_quantity",
      label: "Paste Qty",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v}</span>,
    },
    {
      key: "details",
      label: "Items",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.length || 0}</span>
      ),
    },
  ];

  const renderActions = (row) => (
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
          if (confirm(`Delete ${row.code}?`))
            setEntries((p) => p.filter((e) => e.id !== row.id));
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
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
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
      </div>
    </MainLayout>
  );
}
