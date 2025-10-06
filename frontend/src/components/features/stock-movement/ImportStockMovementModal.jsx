import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
import { importApi } from "../../../services/endpoints";

export default function ImportStockMovementModal({ isOpen, onClose, onImportSuccess }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { n: 1, l: "Upload File" },
    { n: 2, l: "Preview Data" },
    { n: 3, l: "Confirm Import" },
  ];

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview([]);
    setResult(null);
    setError(null);
    setProcessing(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const selectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please upload .xlsx file");
      return;
    }
    setFile(f);
    setError(null);
    parse(f);
  };

  const parse = (f) => {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const d = new Uint8Array(e.target.result);
        const wb = XLSX.read(d, { type: "array" });
        const ws = wb.Sheets["CHEMICAL"];
        if (!ws) {
          setError('Sheet "CHEMICAL" not found');
          setPreview([]);
          return;
        }

        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", range: 4 });
        const hdr = json[0] || [];
        const getIdx = (n) => hdr.findIndex(h => String(h).trim().toUpperCase().includes(n.toUpperCase()));
        
        const idx = {
          nobukti: getIdx("NOBUKTI"),
          tanggal: getIdx("TANGGAL"),
          qty: getIdx("QTY"),
          namabrg: getIdx("NAMABRG")
        };

        const rows = [];
        json.slice(1).forEach(row => {
          const clean = row.slice(0, -2);
          const code = clean[idx.nobukti];
          const date = clean[idx.tanggal];
          const qty = clean[idx.qty];
          const prod = clean[idx.namabrg];

          if (code && date && qty && prod) {
            rows.push({
              code: String(code).trim(),
              date: formatDate(date),
              qty: parseFloat(qty) || 0,
              product: String(prod).trim().toUpperCase()
            });
          }
        });

        setPreview(rows);
        setError(null);
      } catch (err) {
        setError("Parse failed: " + err.message);
        setPreview([]);
      }
    };
    r.readAsArrayBuffer(f);
  };

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = typeof d === "number" ? new Date((d - 25569) * 86400 * 1000) : new Date(d);
    return dt.toISOString().split("T")[0];
  };

  const next = () => {
    if (step === 1 && !file) {
      setError("Select file");
      return;
    }
    if (step === 2 && !preview.length) {
      setError("No data");
      return;
    }
    setError(null);
    setStep(p => p + 1);
  };

  const back = () => {
    setError(null);
    setStep(p => p - 1);
  };

  const doImport = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      
      const res = await importApi.importLapChemical(file);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Import failed");
      setResult(data);
      if (onImportSuccess) onImportSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const renderIndicator = () => (
    <div className="px-6 py-4 border-b" style={{ borderColor: colors.border.primary, backgroundColor: colors.background.secondary }}>
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-semibold", step >= s.n && "ring-2")}
                style={{
                  backgroundColor: step >= s.n ? colors.primary : colors.background.primary,
                  color: step >= s.n ? colors.text.inverse : colors.text.secondary,
                  borderWidth: step >= s.n ? 0 : "2px",
                  borderColor: colors.border.primary
                }}>
                {result && s.n === 3 ? <CheckCircle className="w-5 h-5" /> : s.n}
              </div>
              <span className="mt-2 text-sm font-medium" style={{ color: step >= s.n ? colors.primary : colors.text.secondary }}>{s.l}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-1 mx-2 rounded" style={{ backgroundColor: step > s.n ? colors.primary : colors.border.primary }} />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="p-8 text-center border-2 border-dashed rounded-lg" style={{ borderColor: colors.border.primary }}>
          <Upload className="w-16 h-16 mx-auto mb-4" style={{ color: colors.text.secondary }} />
          <h3 className="mb-2 text-lg font-semibold" style={{ color: colors.text.primary }}>Upload Excel File</h3>
          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>Select .xlsx file with stock movement data</p>
          <input type="file" accept=".xlsx" onChange={selectFile} className="hidden" id="file-stock" />
          <label htmlFor="file-stock" className="inline-block px-4 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: colors.primary, color: colors.text.inverse }}>Choose File</label>
          {file && (
            <div className="flex items-center gap-3 p-3 mt-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <FileSpreadsheet className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{file.name}</span>
            </div>
          )}
        </div>
        <div className="p-4 mt-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            <strong>Format:</strong> Sheet "CHEMICAL" with NOBUKTI, TANGGAL, QTY, NAMABRG columns
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const mvMap = new Map();
    preview.forEach(r => {
      const k = `${r.code}|${r.date}`;
      if (!mvMap.has(k)) mvMap.set(k, []);
      mvMap.get(k).push(r);
    });

    return (
      <div>
        <div className="p-4 mb-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15`, borderWidth: "1px", borderColor: colors.primary }}>
          <p className="text-sm" style={{ color: colors.text.primary }}>
            <strong>{preview.length}</strong> detail(s) → <strong>{mvMap.size}</strong> movement(s)
          </p>
        </div>
        <div className="overflow-hidden border rounded-lg" style={{ borderColor: colors.border.primary }}>
          <table className="w-full">
            <thead style={{ backgroundColor: colors.background.secondary, borderBottomWidth: "1px", borderColor: colors.border.primary }}>
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>No</th>
                <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>Code</th>
                <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>Date</th>
                <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>Product</th>
                <th className="px-3 py-2 text-xs font-semibold text-right" style={{ color: colors.text.secondary }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((r, i) => (
                <tr key={i} style={{ borderBottomWidth: "1px", borderColor: colors.border.primary }}>
                  <td className="px-3 py-2 text-xs" style={{ color: colors.text.secondary }}>{i + 1}</td>
                  <td className="px-3 py-2 text-xs font-medium" style={{ color: colors.text.primary }}>{r.code}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: colors.text.secondary }}>{r.date}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: colors.text.primary }}>{r.product}</td>
                  <td className="px-3 py-2 text-xs text-right" style={{ color: colors.text.primary }}>{r.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 50 && (
            <div className="p-3 text-sm text-center" style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}>
              Showing 50 of {preview.length}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-md text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
            <h3 className="mb-2 text-lg font-semibold" style={{ color: colors.text.primary }}>Ready to Import</h3>
            <p className="mb-6 text-sm" style={{ color: colors.text.secondary }}>{preview.length} detail(s) will be imported</p>
            <div className="p-4 space-y-2 text-left rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
              <p className="text-sm" style={{ color: colors.text.primary }}><strong>File:</strong> {file?.name}</p>
              <p className="text-sm" style={{ color: colors.text.primary }}><strong>Details:</strong> {preview.length}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: colors.status.success }} />
            <h3 className="mb-2 text-lg font-semibold" style={{ color: colors.text.primary }}>Import Success!</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.status.success}15`, borderWidth: "1px", borderColor: colors.status.success }}>
              <p className="text-sm" style={{ color: colors.status.success }}>
                <strong className="text-2xl">{result.movements}</strong> movement(s) created
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15`, borderWidth: "1px", borderColor: colors.primary }}>
              <p className="text-sm" style={{ color: colors.primary }}>
                <strong className="text-2xl">{result.details}</strong> detail(s) added
              </p>
            </div>
            {result.skipped > 0 && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.status.warning}15`, borderWidth: "1px", borderColor: colors.status.warning }}>
                <p className="text-sm" style={{ color: colors.status.warning }}>
                  <strong>{result.skipped}</strong> skipped
                </p>
              </div>
            )}
            {result.errors?.length > 0 && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.status.error}15`, borderWidth: "1px", borderColor: colors.status.error }}>
                <p className="mb-2 text-sm" style={{ color: colors.status.error }}>
                  <strong>{result.errors.length}</strong> error(s)
                </p>
                <div className="space-y-1 text-xs" style={{ color: colors.text.secondary }}>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <p key={i}>Row {e.row}: {e.reason}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const actions = (
    <>
      {step > 1 && !result && (
        <button onClick={back} disabled={processing} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ color: colors.text.primary }}>Back</button>
      )}
      <div className="flex gap-3 ml-auto">
        <button onClick={close} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: colors.background.primary, color: colors.text.primary, borderWidth: "1px", borderColor: colors.border.primary }}>
          {result ? "Close" : "Cancel"}
        </button>
        {!result && (
          <>
            {step < 3 && <Button icon={ChevronRight} label="Next" onClick={next} disabled={!file || (step === 2 && !preview.length)} />}
            {step === 3 && (
              <button onClick={doImport} disabled={processing} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: colors.status.success, color: colors.text.inverse }}>
                {processing ? "Importing..." : "Import"}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={close} title="Import Stock Movement" subtitle="Import stock movements from Excel" size="xl" actions={actions} closeOnOverlayClick={!processing}>
      {renderIndicator()}
      <div className="mt-6">
        {error && (
          <div className="flex items-start gap-3 p-4 mb-4 rounded-lg" style={{ backgroundColor: `${colors.status.error}15`, borderWidth: "1px", borderColor: colors.status.error }}>
            <AlertCircle className="flex-shrink-0 w-5 h-5" style={{ color: colors.status.error }} />
            <p className="text-sm" style={{ color: colors.status.error }}>{error}</p>
          </div>
        )}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </Modal>
  );
}