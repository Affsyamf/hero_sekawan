import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";

export default function ImportPurchasingTransactionModal({ isOpen, onClose, onImportSuccess }) {
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
        
        let allRows = [];
        wb.SheetNames.forEach(sheet => {
          const ws = wb.Sheets[sheet];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", range: 6 });
          
          if (json.length > 0) {
            const hdr = json[0];
            const getIdx = (n) => hdr.findIndex(h => String(h).trim().toUpperCase().includes(n.toUpperCase()));
            
            const idx = {
              nobukti: getIdx("NO.BUKTI"),
              tanggal: getIdx("TANGGAL"),
              supplier: getIdx("KODE SUPPLIER"),
              namabrg: getIdx("NAMA BARANG"),
              qty: getIdx("QTY"),
              harga: getIdx("HARGA"),
              ppn: getIdx("PPN"),
              dpp: getIdx("DPP"),
              pph: getIdx("PPH")
            };

            json.slice(1).forEach(row => {
              const clean = row.slice(0, -2);
              const nobukti = clean[idx.nobukti];
              const product = clean[idx.namabrg];
              
              if (nobukti || product) {
                allRows.push({
                  sheet,
                  nobukti: nobukti ? String(nobukti).trim() : "-",
                  date: formatDate(clean[idx.tanggal]),
                  supplier: clean[idx.supplier] ? String(clean[idx.supplier]).trim() : "-",
                  product: product ? String(product).trim().toUpperCase() : "-",
                  qty: parseFloat(clean[idx.qty]) || 0,
                  price: parseFloat(clean[idx.harga]) || 0,
                  ppn: parseFloat(clean[idx.ppn]) || 0,
                  dpp: parseFloat(clean[idx.dpp]) || 0,
                  pph: parseFloat(clean[idx.pph]) || 0
                });
              }
            });
          }
        });

        setPreview(allRows);
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
    
      const res = await importApi.importLapPembelian(file);
      
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
          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>Select .xlsx with purchasing transactions</p>
          <input type="file" accept=".xlsx" onChange={selectFile} className="hidden" id="file-purch-trx" />
          <label htmlFor="file-purch-trx" className="inline-block px-4 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: colors.primary, color: colors.text.inverse }}>Choose File</label>
          {file && (
            <div className="flex items-center gap-3 p-3 mt-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <FileSpreadsheet className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{file.name}</span>
            </div>
          )}
        </div>
        <div className="p-4 mt-4 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            <strong>Format:</strong> Excel with columns: NO.BUKTI, TANGGAL, KODE SUPPLIER, NAMA BARANG, QTY, HARGA, PPN, DPP, PPH
          </p>
          <p className="mt-1 text-xs" style={{ color: colors.text.secondary }}>All sheets will be processed</p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const grouped = {};
    preview.forEach(r => {
      const k = r.nobukti || r.date;
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(r);
    });
    const purchCount = Object.keys(grouped).length;

    return (
      <div>
        <div className="p-4 mb-4 rounded-lg" style={{ backgroundColor: `${colors.primary}15`, borderWidth: "1px", borderColor: colors.primary }}>
          <p className="text-sm" style={{ color: colors.text.primary }}>
            <strong>{preview.length}</strong> detail(s) → <strong>{purchCount}</strong> purchasing(s)
          </p>
        </div>
        <div className="overflow-hidden border rounded-lg" style={{ borderColor: colors.border.primary }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead style={{ backgroundColor: colors.background.secondary, borderBottomWidth: "1px", borderColor: colors.border.primary }}>
                <tr>
                  <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>No</th>
                  <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>Sheet</th>
                  <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>No Bukti</th>
                  <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>Tanggal</th>
                  <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>Kode Supplier</th>
                  <th className="px-2 py-2 font-semibold text-left whitespace-nowrap" style={{ color: colors.text.secondary }}>Nama Barang</th>
                  <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>Qty</th>
                  <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>Harga</th>
                  <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>PPN</th>
                  <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>DPP</th>
                  <th className="px-2 py-2 font-semibold text-right whitespace-nowrap" style={{ color: colors.text.secondary }}>PPH</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderBottomWidth: "1px", borderColor: colors.border.primary }}>
                    <td className="px-2 py-2" style={{ color: colors.text.secondary }}>{i + 1}</td>
                    <td className="px-2 py-2" style={{ color: colors.text.secondary }}>{r.sheet}</td>
                    <td className="px-2 py-2 font-medium" style={{ color: colors.text.primary }}>{r.nobukti}</td>
                    <td className="px-2 py-2" style={{ color: colors.text.secondary }}>{r.date}</td>
                    <td className="px-2 py-2" style={{ color: colors.text.primary }}>{r.supplier}</td>
                    <td className="px-2 py-2" style={{ color: colors.text.primary }}>{r.product}</td>
                    <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.qty}</td>
                    <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.price.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.ppn.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.dpp.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right" style={{ color: colors.text.primary }}>{r.pph.toLocaleString()}</td>
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

    const totalInserted = Object.values(result.inserted_detail_counts || {}).reduce((a, b) => a + b, 0);

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
                <strong className="text-2xl">{totalInserted}</strong> detail(s) imported
              </p>
            </div>
            {result.skipped_total > 0 && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.status.warning}15`, borderWidth: "1px", borderColor: colors.status.warning }}>
                <p className="mb-2 text-sm" style={{ color: colors.status.warning }}>
                  <strong>{result.skipped_total}</strong> skipped
                </p>
                {result.skipped_sample?.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs" style={{ color: colors.text.secondary }}>
                    {result.skipped_sample.slice(0, 5).map((s, i) => (
                      <p key={i}>Row {s.row}: {s.reason}</p>
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
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Import Purchasing Transactions" subtitle="Import purchasing data with details from Excel" size="xl" actions={actions} closeOnOverlayClick={!processing}>
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