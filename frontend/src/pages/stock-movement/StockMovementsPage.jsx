import { Edit2, Eye, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import ImportStockMovementModal from "../../components/features/stock-movement/ImportStockMovementModal";
import StockMovementForm from "../../components/features/stock-movement/StockMovementForm";
import Button from "../../components/ui/button/Button";
import Table from "../../components/ui/table/Table";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import {
  createStockMovement,
  searchStockMovement,
  updateStockMovement,
} from "../../services/stock_movement_service";
import useDateFilterStore from "../../stores/useDateFilterStore";
import { formatDate } from "../../utils/helpers";

export default function StockMovementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const dateRange = useDateFilterStore((state) => state.dateRange);

  useEffect(() => {
    setRefresh((prev) => prev + 1);
  }, [dateRange]);

  const fetchDataWithDateFilter = async (params) => {
    try {
      const queryParams = { ...params };

      if (dateRange?.dateFrom && dateRange?.dateTo) {
        queryParams.start_date = dateRange.dateFrom;
        queryParams.end_date = dateRange.dateTo;
      }

      const response = await searchStockMovement(queryParams);
      return response;
    } catch (error) {
      console.error("Failed to fetch stock movements:", error);
      throw error;
    }
  };

  const columns = [
    {
      key: "code",
      label: "Movement Code",
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
      key: "details",
      label: "Items",
      sortable: false,
      render: (v) => (
        <span className="text-secondary-text">{v?.length || 0}</span>
      ),
    },
    {
      key: "total",
      label: "Total Qty",
      sortable: false,
      render: (v, row) => (
        <span className="font-medium text-primary">
          {row.details?.reduce((s, d) => s + (d.quantity || 0), 0) || 0}
        </span>
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
          if (confirm(`Delete ${row.code}?`)) {
            // Implement delete functionality here
            setRefresh((prev) => prev + 1);
          }
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

  const handleSave = async (stockMovementData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(stockMovementData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateStockMovement(payload.id, payload);
      } else {
        await createStockMovement(payload);
      }
      setRefresh((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save stock movement: " + error.message);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Stock Movement Management
          </h1>
          <p className="mb-2 text-secondary-text">
            Track stock movements with detailed product quantities.
          </p>

          {/* Display active filter info */}
          {dateRange && (
            <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">📅 Active Filter:</span>{" "}
                {dateRange.mode === "ytd" && `YTD ${new Date().getFullYear()}`}
                {dateRange.mode === "year" && `Year ${dateRange.year}`}
                {dateRange.mode === "month-year" && (
                  <>
                    {new Date(
                      dateRange.year,
                      dateRange.month - 1
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </>
                )}
                {(dateRange.mode === "days" || !dateRange.mode) && (
                  <>
                    {formatDate(dateRange.dateFrom)} to{" "}
                    {formatDate(dateRange.dateTo)}
                    {dateRange.days !== undefined && (
                      <span className="ml-2 text-xs">
                        (
                        {dateRange.days === 0
                          ? "Today"
                          : `Last ${dateRange.days} days`}
                        )
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
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
            fetchData={fetchDataWithDateFilter}
            actions={renderActions}
            onCreate={() => {
              setSelected(null);
              setIsModalOpen(true);
            }}
            pageSizeOptions={[10, 20, 50, 100]}
            showDateRangeFilter={false}
          />

          <StockMovementForm
            stockMovement={selected}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelected(null);
            }}
            onSave={handleSave}
          />
          <ImportStockMovementModal
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            onImportSuccess={() => setRefresh((p) => p + 1)}
          />
        </div>
      </div>
    </MainLayout>
  );
}
