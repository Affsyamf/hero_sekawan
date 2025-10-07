import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import StockMovementForm from "../components/features/stock-movement/StockMovementForm";
import ImportStockMovementModal from "../components/features/stock-movement/ImportStockMovementModal";
import { useState } from "react";
import { Edit2, Trash2, Eye, Upload } from "lucide-react";
import { useTemp } from "../hooks/useTemp";
import { formatDate } from "../utils/helpers";

const SAMPLE_STOCK_MOVEMENTS = [];

export default function StockMovementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const { value: stockMovements = SAMPLE_STOCK_MOVEMENTS, set: setStockMovements } = useTemp("stock-movements:working-list", SAMPLE_STOCK_MOVEMENTS);
  const { value: products = [] } = useTemp("products:working-list", []);

  const fetchStockMovements = async (params) => {
    const { page, pageSize, search, sortBy, sortDir, dateRange } = params;
    let filtered = [...stockMovements];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((sm) => sm.code?.toLowerCase().includes(s));
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((sm) => {
        const d = new Date(sm.date);
        return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
      });
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy], bVal = b[sortBy];
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { rows: filtered.slice(start, start + pageSize), total };
  };

  const columns = [
    { key: "code", label: "Movement Code", sortable: true, render: (v) => <span className="font-medium text-primary-text">{v}</span> },
    { key: "date", label: "Date", sortable: true, render: (v) => <span className="text-secondary-text">{formatDate(v)}</span> },
    { key: "details", label: "Items", sortable: false, render: (v) => <span className="text-secondary-text">{v?.length || 0}</span> },
    { key: "details", label: "Total Qty", sortable: false, render: (v) => <span className="font-medium text-primary">{v?.reduce((s, d) => s + (d.quantity || 0), 0) || 0}</span> }
  ];

  const actions = (row) => (
    <div className="flex items-center gap-2">
      <button onClick={() => { setSelected(row); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
      <button onClick={() => { setSelected(row); setIsModalOpen(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
      <button onClick={() => { if (confirm(`Delete ${row.code}?`)) setStockMovements((p) => p.filter((sm) => sm.id !== row.id)); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  const save = (data) => {
    setStockMovements((prev) => {
      const c = Array.isArray(prev) ? prev : [];
      if (data.id) return c.map((sm) => (sm.id === data.id ? { ...sm, ...data } : sm));
      const id = c.length ? Math.max(...c.map((sm) => sm.id || 0)) + 1 : 1;
      return [...c, { ...data, id }];
    });
    setIsModalOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">Stock Movement Management</h1>
          <p className="mb-6 text-secondary-text">Track stock movements with detailed product quantities.</p>

          <div className="mb-4">
            <button onClick={() => setIsImportOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
              <Upload className="w-4 h-4" />Import from Excel
            </button>
          </div>

          <Table key={refresh} columns={columns} fetchData={fetchStockMovements} actions={actions} onCreate={() => { setSelected(null); setIsModalOpen(true); }} pageSizeOptions={[10, 20, 50, 100]} dateFilterKey="date" />

          <StockMovementForm stockMovement={selected} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelected(null); }} onSave={save} />
          <ImportStockMovementModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={() => setRefresh(p => p + 1)} />
        </div>
      </div>
    </MainLayout>
  );
}