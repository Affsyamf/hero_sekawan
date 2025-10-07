import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import PurchasingForm from "../components/features/purchasing/PurchasingForm";
import ImportPurchasingModal from "../components/features/purchasing/ImportPurchasingModal";
import ImportPurchasingTransactionModal from "../components/features/purchasing/ImportPurchasingTransactionModal";
import { useState } from "react";
import { Edit2, Trash2, Eye, Upload, Database } from "lucide-react";
import { useTemp } from "../hooks/useTemp";
import { formatCurrency, formatDate } from "../utils/helpers";

const SAMPLE_PURCHASINGS = [];

export default function PurchasingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportMDOpen, setIsImportMDOpen] = useState(false);
  const [isImportTrxOpen, setIsImportTrxOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const { value: purchasings = SAMPLE_PURCHASINGS, set: setPurchasings } = useTemp("purchasings:working-list", SAMPLE_PURCHASINGS);
  const { value: suppliers = [] } = useTemp("suppliers:working-list", []);

  const fetchPurchasings = async (params) => {
    const { page, pageSize, search, sortBy, sortDir, dateRange } = params;
    let filtered = [...purchasings];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((p) => p.code?.toLowerCase().includes(s) || p.purchase_order?.toLowerCase().includes(s) || suppliers.find((su) => su.id === p.supplier_id)?.name?.toLowerCase().includes(s));
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((p) => {
        const d = new Date(p.date);
        return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
      });
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy], bVal = b[sortBy];
        if (sortBy === "supplier_id") {
          aVal = suppliers.find((s) => s.id === a.supplier_id)?.name || "";
          bVal = suppliers.find((s) => s.id === b.supplier_id)?.name || "";
        }
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
    { key: "code", label: "No Bukti", sortable: true, render: (v) => <span className="font-medium text-primary-text">{v}</span> },
    { key: "date", label: "Date", sortable: true, render: (v) => <span className="text-secondary-text">{formatDate(v)}</span> },
    { key: "purchase_order", label: "PO Number", sortable: true, render: (v) => <span className="text-secondary-text">{v || "-"}</span> },
    { key: "supplier_id", label: "Supplier", sortable: true, render: (v) => <span className="text-primary-text">{suppliers.find((s) => s.id === v) ? `${suppliers.find((s) => s.id === v).code} - ${suppliers.find((s) => s.id === v).name}` : "-"}</span> },
    { key: "details", label: "Items", sortable: false, render: (v) => <span className="text-secondary-text">{v?.length || 0}</span> },
    { key: "details", label: "Total Amount", sortable: false, render: (v) => <span className="font-medium text-primary">{formatCurrency(v?.reduce((s, d) => s + (d.subtotal || 0), 0) || 0)}</span> }
  ];

  const actions = (row) => (
    <div className="flex items-center gap-2">
      <button onClick={() => { setSelected(row); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
      <button onClick={() => { setSelected(row); setIsModalOpen(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
      <button onClick={() => { if (confirm(`Delete ${row.code}?`)) setPurchasings((p) => p.filter((pu) => pu.id !== row.id)); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  const save = (data) => {
    setPurchasings((prev) => {
      const c = Array.isArray(prev) ? prev : [];
      if (data.id) return c.map((p) => (p.id === data.id ? { ...p, ...data } : p));
      const id = c.length ? Math.max(...c.map((p) => p.id || 0)) + 1 : 1;
      return [...c, { ...data, id }];
    });
    setIsModalOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">Purchasing Management</h1>
          <p className="mb-6 text-secondary-text">Manage product purchases from suppliers with detailed tracking and calculations.</p>

          <div className="flex gap-3 mb-4">
            <button onClick={() => setIsImportMDOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Database className="w-4 h-4" />Import Data Master
            </button>
            <button onClick={() => setIsImportTrxOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
              <Upload className="w-4 h-4" />Import Purchasing
            </button>
          </div>

          <Table key={refresh} columns={columns} fetchData={fetchPurchasings} actions={actions} onCreate={() => { setSelected(null); setIsModalOpen(true); }} pageSizeOptions={[10, 20, 50, 100]} dateFilterKey="date" />

          <PurchasingForm purchasing={selected} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelected(null); }} onSave={save} />
          <ImportPurchasingModal isOpen={isImportMDOpen} onClose={() => setIsImportMDOpen(false)} onImportSuccess={() => setRefresh(p => p + 1)} />
          <ImportPurchasingTransactionModal isOpen={isImportTrxOpen} onClose={() => setIsImportTrxOpen(false)} onImportSuccess={() => setRefresh(p => p + 1)} />
        </div>
      </div>
    </MainLayout>
  );
}