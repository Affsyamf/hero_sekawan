import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
// import { importApi } from "../../../services/endpoints";

export default function ImportColorKitchenModal({ isOpen, onClose, onImportSuccess }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState({ entries: [], summary: {} });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { n: 1, l: "Upload" },
    { n: 2, l: "Preview" },
    { n: 3, l: "Confirm" },
  ];

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview({ entries: [], summary: {} });
    setResult(null);
    setError(null);
    setProcessing(false);
  };

  const selectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Upload .xlsx file");
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
        const ws = wb.Sheets["TEMPLATE QTY"];
        if (!ws) {
          setError('Sheet "TEMPLATE QTY" not found');
          setPreview({ entries: [], summary: {} });
          return;
        }

        // Read data from row 7 onwards
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", range: 6 });
        const entries = [];
        let batchCount = 0;
        let currentBatch = null;

        json.forEach((row, idx) => {
          const opj = row[0];
          const design = row[1];
          const jenisKain = row[2];
          const rolls = row[3];
          const tgl = row[4];

          // Empty row = batch separator
          if (!opj && !design && !jenisKain && !rolls && !tgl) {
            if (currentBatch) batchCount++;
            currentBatch = null;
            return;
          }

          if (!currentBatch) {
            currentBatch = true;
          }

          if (opj || design) {
            entries.push({
              opj: opj ? String(opj).trim() : "-",
              design: design ? String(design).trim() : "-",
              jenisKain: jenisKain ? String(jenisKain).trim() : "-",
              rolls: rolls || 0,
              date: formatDate(tgl)
            });
          }
        });

        if (currentBatch) batchCount++;

        setPreview({
          entries,
          summary: {
            batches: batchCount,
            entries: entries.length
          }
        });
        setError(null);
      } catch (err) {
        setError("Parse failed: " + err.message);
        setPreview({ entries: [], summary: {} });
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
    if (step === 2 && !preview.entries.length) {
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

      const res = await importApi.importLapCk(file);
      
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
          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>Select .xlsx with color kitchen data</p>
          <input type="file" accept=".xlsx" onChange={selectFile} className="hidden" id="file-ck" />
          <label htmlFor="file-ck" className="inline-block px-4 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: colors.primary, color: colors.text.inverse }}>Choose File</label>
          {file && (
            <div className="flex items-center gap-3 p-3 mt-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <FileSpreadsheet className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{file.name}</span>
            </div>
          )}
        </div>
        <div className="p-4 mt-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            <strong>Format:</strong> Sheet "TEMPLATE QTY" with OPJ, DESIGN, JENIS KAIN, ROLL, TGL
          </p>
          <p className="mt-1 text-xs" style={{ color: colors.text.secondary }}>
            Empty rows separate batches
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="p-4 mb-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15`, borderWidth: "1px", borderColor: colors.primary }}>
        <p className="text-sm" style={{ color: colors.text.primary }}>
          <strong>{preview.entries.length}</strong> entries in <strong>{preview.summary.batches}</strong> batch(es)
        </p>
      </div>
      <div className="overflow-hidden border rounded-lg" style={{ borderColor: colors.border.primary }}>
        <table className="w-full">
          <thead style={{ backgroundColor: colors.background.secondary, borderBottomWidth: "1px", borderColor: colors.border.primary }}>
            <tr>
              <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>No</th>
              <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>OPJ</th>
              <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>Design</th>
              <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>Jenis Kain</th>
              <th className="px-3 py-2 text-xs font-semibold text-right" style={{ color: colors.text.secondary }}>Rolls</th>
              <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: colors.text.secondary }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {preview.entries.slice(0, 50).map((r, i) => (
              <tr key={i} style={{ borderBottomWidth: "1px", borderColor: colors.border.primary }}>
                <td className="px-3 py-2 text-xs" style={{ color: colors.text.secondary }}>{i + 1}</td>
                <td className="px-3 py-2 text-xs font-medium" style={{ color: colors.text.primary }}>{r.opj}</td>
                <td className="px-3 py-2 text-xs" style={{ color: colors.text.primary }}>{r.design}</td>
                <td className="px-3 py-2 text-xs" style={{ color: colors.text.secondary }}>{r.jenisKain}</td>
                <td className="px-3 py-2 text-xs text-right" style={{ color: colors.text.primary }}>{r.rolls}</td>
                <td className="px-3 py-2 text-xs" style={{ color: colors.text.secondary }}>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {preview.entries.length > 50 && (
          <div className="p-3 text-sm text-center" style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}>
            Showing 50 of {preview.entries.length}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-md text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
            <h3 className="mb-2 text-lg font-semibold" style={{ color: colors.text.primary }}>Ready to Import</h3>
            <p className="mb-6 text-sm" style={{ color: colors.text.secondary }}>
              {preview.entries.length} entries in {preview.summary.batches} batches
            </p>
            <div className="p-4 space-y-2 text-left rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
              <p className="text-sm" style={{ color: colors.text.primary }}><strong>File:</strong> {file?.name}</p>
              <p className="text-sm" style={{ color: colors.text.primary }}><strong>Batches:</strong> {preview.summary.batches}</p>
              <p className="text-sm" style={{ color: colors.text.primary }}><strong>Entries:</strong> {preview.entries.length}</p>
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
                Color kitchen data imported successfully
              </p>
            </div>
            {result.missing_products && result.missing_products.length > 0 && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.status.error}15`, borderWidth: "1px", borderColor: colors.status.error }}>
                <p className="mb-2 text-sm" style={{ color: colors.status.error }}>
                  <strong>Missing products:</strong>
                </p>
                <div className="space-y-1 text-xs" style={{ color: colors.text.secondary }}>
                  {result.missing_products.slice(0, 10).map((p, i) => (
                    <p key={i}>{p}</p>
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
        <button onClick={() => { reset(); onClose(); }} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: colors.background.primary, color: colors.text.primary, borderWidth: "1px", borderColor: colors.border.primary }}>
          {result ? "Close" : "Cancel"}
        </button>
        {!result && (
          <>
            {step < 3 && <Button icon={ChevronRight} label="Next" onClick={next} disabled={!file || (step === 2 && !preview.entries.length)} />}
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
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Import Color Kitchen" subtitle="Import batches and entries from Excel" size="xl" actions={actions} closeOnOverlayClick={!processing}>
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