import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import ColorKitchenForm from "../components/features/color-kitchen/ColorKitchenForm";
import ImportColorKitchenModal from "../components/features/color-kitchen/ImportColorKitchenModal";
import { useState } from "react";
import { Edit2, Trash2, Eye, Upload } from "lucide-react";
import { useTemp } from "../hooks/useTemp";
import { formatDate } from "../utils/helpers";

const SAMPLE_COLOR_KITCHEN_ENTRIES = [];

export default function ColorKitchensPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const { value: entries = SAMPLE_COLOR_KITCHEN_ENTRIES, set: setEntries } = useTemp("color-kitchen-entries:working-list", SAMPLE_COLOR_KITCHEN_ENTRIES);
  const { value: designs = [] } = useTemp("designs:working-list", []);

  const fetchEntries = async (params) => {
    const { page, pageSize, search, sortBy, sortDir, dateRange } = params;
    let filtered = [...entries];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((e) => e.code?.toLowerCase().includes(s) || designs.find((d) => d.id === e.design_id)?.code?.toLowerCase().includes(s));
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((e) => {
        const d = new Date(e.date);
        return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
      });
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy], bVal = b[sortBy];
        if (sortBy === "design_id") {
          aVal = designs.find((d) => d.id === a.design_id)?.code || "";
          bVal = designs.find((d) => d.id === b.design_id)?.code || "";
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
    { key: "code", label: "No OPJ", sortable: true, render: (v) => <span className="font-medium text-primary-text">{v}</span> },
    { key: "date", label: "Date", sortable: true, render: (v) => <span className="text-secondary-text">{formatDate(v)}</span> },
    { key: "design_id", label: "Design", sortable: true, render: (v) => <span className="text-primary-text">{designs.find((d) => d.id === v)?.code || "-"}</span> },
    { key: "quantity", label: "Quantity", sortable: true, render: (v) => <span className="text-secondary-text">{v}</span> },
    { key: "paste_quantity", label: "Paste Qty", sortable: true, render: (v) => <span className="text-secondary-text">{v}</span> },
    { key: "details", label: "Items", sortable: false, render: (v) => <span className="text-secondary-text">{v?.length || 0}</span> }
  ];

  const actions = (row) => (
    <div className="flex items-center gap-2">
      <button onClick={() => { setSelected(row); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
      <button onClick={() => { setSelected(row); setIsModalOpen(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
      <button onClick={() => { if (confirm(`Delete ${row.code}?`)) setEntries((p) => p.filter((e) => e.id !== row.id)); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  const save = (data) => {
    setEntries((prev) => {
      const c = Array.isArray(prev) ? prev : [];
      if (data.id) return c.map((e) => (e.id === data.id ? { ...e, ...data } : e));
      const id = c.length ? Math.max(...c.map((e) => e.id || 0)) + 1 : 1;
      return [...c, { ...data, id }];
    });
    setIsModalOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">Color Kitchen Management</h1>
          <p className="mb-6 text-secondary-text">Manage color kitchen entries with design and product details.</p>

          <div className="mb-4">
            <button onClick={() => setIsImportOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
              <Upload className="w-4 h-4" />Import from Excel
            </button>
          </div>

          <Table key={refresh} columns={columns} fetchData={fetchEntries} actions={actions} onCreate={() => { setSelected(null); setIsModalOpen(true); }} pageSizeOptions={[10, 20, 50, 100]} dateFilterKey="date" />

          <ColorKitchenForm entry={selected} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelected(null); }} onSave={save} />
          <ImportColorKitchenModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={() => setRefresh(p => p + 1)} />
        </div>
      </div>
    </MainLayout>
  );
}