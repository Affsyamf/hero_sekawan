import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
import { importApi } from "../../../services/endpoints";

export default function ImportStockOpnameModal({ isOpen, onClose, onImportSuccess }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
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
    setPreview([]);
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
        const ws = wb.Sheets["GUDANG BESAR"];
        if (!ws) {
          setError('Sheet "GUDANG BESAR" not found');
          setPreview([]);
          return;
        }

        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", range: 4 });
        const hdr = json[0] || [];
        const getIdx = (n) => hdr.findIndex(h => String(h).trim().toUpperCase().includes(n.toUpperCase()));
        
        const idx = {
          no: getIdx("NO"),
          namabrg: getIdx("NAMA BARANG"),
          saldoAwal: getIdx("SALDO AWAL"),
          mutasiMasuk: getIdx("MUTASI MASUK"),
          mutasiKeluar: getIdx("MUTASI KELUAR"),
          fisik: getIdx("FISIK")
        };

        const rows = [];
        json.slice(1).forEach(row => {
          const no = row[idx.no];
          if (!no) return;

          const saldoAwal = parseFloat(row[idx.saldoAwal]) || 0;
          const mutasiMasuk = parseFloat(row[idx.mutasiMasuk]) || 0;
          const mutasiKeluar = parseFloat(row[idx.mutasiKeluar]) || 0;
          const systemQty = saldoAwal + mutasiMasuk - mutasiKeluar;
          const physicalQty = parseFloat(row[idx.fisik]) || 0;

          rows.push({
            no: String(no).trim(),
            product: String(row[idx.namabrg] || "").trim().toUpperCase(),
            saldoAwal,
            mutasiMasuk,
            mutasiKeluar,
            systemQty,
            physicalQty,
            diff: systemQty - physicalQty
          });
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

      const res = await importApi.importStockOpname(file);

      
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
          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>Select .xlsx with stock opname data</p>
          <input type="file" accept=".xlsx" onChange={selectFile} className="hidden" id="file-so" />
          <label htmlFor="file-so" className="inline-block px-4 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: colors.primary, color: colors.text.inverse }}>Choose File</label>
          {file && (
            <div className="flex items-center gap-3 p-3 mt-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <FileSpreadsheet className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{file.name}</span>
            </div>
          )}
        </div>
        <div className="p-4 mt-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            <strong>Format:</strong> Sheet "GUDANG BESAR" with NO, NAMA BARANG, SALDO AWAL, MUTASI MASUK, MUTASI KELUAR, FISIK
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="p-4 mb-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15`, borderWidth: "1px", borderColor: colors.primary }}>
        <p className="text-sm" style={{ color: colors.text.primary }}>
          <strong>{preview.length}</strong> product(s) will be recorded
        </p>
      </div>
      <div className="overflow-hidden border rounded-lg" style={{ borderColor: colors.border.primary }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ backgroundColor: colors.background.secondary, borderBottomWidth: "1px", borderColor: colors.border.primary }}>
              <tr>
                <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>No</th>
                <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>Nama Barang</th>
                <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>Saldo Awal</th>
                <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>Mutasi +</th>
                <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>Mutasi -</th>
                <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>System Qty</th>
                <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>Fisik</th>
                <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>Diff</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((r, i) => (
                <tr key={i} style={{ borderBottomWidth: "1px", borderColor: colors.border.primary }}>
                  <td className="px-2 py-2" style={{ color: colors.text.secondary }}>{r.no}</td>
                  <td className="px-2 py-2 font-medium" style={{ color: colors.text.primary }}>{r.product}</td>
                  <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.saldoAwal.toFixed(2)}</td>
                  <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.mutasiMasuk.toFixed(2)}</td>
                  <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.mutasiKeluar.toFixed(2)}</td>
                  <td className="px-2 py-2 font-medium text-right" style={{ color: colors.text.primary }}>{r.systemQty.toFixed(2)}</td>
                  <td className="px-2 py-2 font-medium text-right" style={{ color: colors.text.primary }}>{r.physicalQty.toFixed(2)}</td>
                  <td className="px-2 py-2 font-medium text-right" style={{ color: r.diff > 0 ? colors.status.error : r.diff < 0 ? colors.status.success : colors.text.secondary }}>{r.diff.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.length > 50 && (
          <div className="p-3 text-sm text-center" style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}>
            Showing 50 of {preview.length}
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
            <p className="mb-6 text-sm" style={{ color: colors.text.secondary }}>{preview.length} product(s) will be recorded</p>
            <div className="p-4 space-y-2 text-left rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
              <p className="text-sm" style={{ color: colors.text.primary }}><strong>File:</strong> {file?.name}</p>
              <p className="text-sm" style={{ color: colors.text.primary }}><strong>Products:</strong> {preview.length}</p>
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
                <strong className="text-2xl">{result.added}</strong> product(s) recorded
              </p>
            </div>
            {result.skipped > 0 && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.status.warning}15`, borderWidth: "1px", borderColor: colors.status.warning }}>
                <p className="mb-2 text-sm" style={{ color: colors.status.warning }}>
                  <strong>{result.skipped}</strong> skipped (product not found)
                </p>
                {result.skipped_products?.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs" style={{ color: colors.text.secondary }}>
                    {result.skipped_products.slice(0, 5).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
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
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Import Stock Opname" subtitle="Import physical inventory count from Excel" size="xl" actions={actions} closeOnOverlayClick={!processing}>
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