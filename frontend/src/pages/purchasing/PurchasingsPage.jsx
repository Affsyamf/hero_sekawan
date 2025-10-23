// pages/purchasing/PurchasingsPage.jsx
import MainLayout from "../../layouts/MainLayout/MainLayout";
import Table from "../../components/ui/table/Table";
import PurchasingForm from "../../components/features/purchasing/PurchasingForm";
import ImportPurchasingModal from "../../components/features/purchasing/ImportPurchasingModal";
import ImportPurchasingTransactionModal from "../../components/features/purchasing/ImportPurchasingTransactionModal";
import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye, Upload, Database } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import {
  createPurchasing,
  deletePurchasing,
  searchPurchasing,
  updatePurchasing,
} from "../../services/purchasing_service";
import { searchSupplier } from "../../services/supplier_service";
import { useFilteredFetch } from "../../hooks/useFilteredFetch";
import { useGlobalFilter } from "../../contexts/GlobalFilterContext";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";

export default function PurchasingsPage() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportMDOpen, setIsImportMDOpen] = useState(false);
  const [isImportTrxOpen, setIsImportTrxOpen] = useState(false);
  const [selectedPurchasing, setSelectedPurchasing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [suppliers, setSuppliers] = useState([]);

  //filter global
  const { dateRange } = useGlobalFilter();
  const filteredSearchPurchasing = useFilteredFetch(searchPurchasing, "date");

  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await searchSupplier({});
        setSuppliers(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    };
    fetchSuppliers();
  }, []);

  const columns = [
    {
      key: "code",
      label: "No Bukti",
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
      key: "purchase_order",
      label: "PO Number",
      sortable: true,
      render: (v) => <span className="text-secondary-text">{v || "-"}</span>,
    },
    {
      key: "supplier_name",
      label: "Supplier",
      sortable: true,
    },
    {
      key: "total_amount",
      label: "Total Amount",
      sortable: false,
      render: (v) => (
        <span className="font-medium text-primary">
          {formatCurrency(v || 0)}
        </span>
      ),
    },
  ];

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setSelectedPurchasing(row);
          navigate(`/purchasings/detail/${row.id}`);
        }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelectedPurchasing(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-all"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleSave = async (purchasingData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(purchasingData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updatePurchasing(payload.id, payload);
      } else {
        await createPurchasing(payload);
      }

      setRefreshKey((prev) => prev + 1);
      setIsModalOpen(false);
      setSelectedPurchasing(null);
    } catch (error) {
      alert("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Delete purchasing ${row.code}?`)) {
      try {
        await deletePurchasing(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Purchasing Management
          </h1>
          <p className="mb-2 text-secondary-text">
            Manage product purchases with global date filter
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
              onClick={() => setIsImportTrxOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            />
          </div>

          {/* ✅ Pass filtered fetch function */}
          <Table
            key={refreshKey}
            columns={columns}
            fetchData={filteredSearchPurchasing} // ✅ Pakai wrapped function
            actions={renderActions}
            onCreate={() => {
              setSelectedPurchasing(null);
              setIsModalOpen(true);
            }}
            pageSizeOptions={[10, 20, 50, 100]}
            showNumbering={true}
            showDateRangeFilter={false}
          />

          <PurchasingForm
            purchasing={selectedPurchasing}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPurchasing(null);
            }}
            onSave={handleSave}
          />

          <ImportPurchasingTransactionModal
            isOpen={isImportTrxOpen}
            onClose={() => setIsImportTrxOpen(false)}
            onImportSuccess={() => setRefreshKey((p) => p + 1)}
          />
        </div>
      </div>
    </MainLayout>
  );
}
