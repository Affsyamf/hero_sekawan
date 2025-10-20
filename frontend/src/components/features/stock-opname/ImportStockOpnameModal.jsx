import { useState, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Table,
  ListX,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
// import { importApi } from "../../../services/import_service";

export default function ImportStockOpnameModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // 🔹 Preview data
  const [preview, setPreview] = useState({
    rows: [],
    summary: null,
    skipped_sample: [],
  });

  // 🔹 Tab view (preview vs skipped)
  const [tab, setTab] = useState("preview");

  const steps = [
    { n: 1, l: "Upload" },
    { n: 2, l: "Preview" },
    { n: 3, l: "Confirm" },
  ];

  const reset = () => {
    setStep(1);
    setFile(null);
    setResult(null);
    setPreview({ rows: [], summary: null, skipped_sample: [] });
    setError(null);
    setProcessing(false);
    setTab("preview");
  };

  // 🔹 Fetch preview from backend
  const fetchPreview = async (f) => {
    setProcessing(true);
    try {
      const res = await importApi.previewStockOpname(f);
      const data = res.data?.data || res.data;
      setPreview({
        rows: data.preview_rows || [],
        summary: data.summary || null,
        skipped_sample: data.skipped_sample || [],
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch preview");
      setPreview({ rows: [], summary: null, skipped_sample: [] });
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 Auto preview when entering Step 2
  useEffect(() => {
    if (step === 2 && file && preview.rows.length === 0 && !processing) {
      fetchPreview(file);
    }
  }, [step]);

  const selectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please upload a .xlsx file");
      return;
    }
    setFile(f);
    setError(null);
  };

  const next = () => {
    if (step === 1 && !file) {
      setError("Select a file first");
      return;
    }
    if (step === 2 && preview.rows.length === 0) {
      setError("No valid data found in file");
      return;
    }
    setStep((p) => p + 1);
  };

  const back = () => {
    setError(null);
    setStep((p) => p - 1);
  };

  // 🔹 Perform actual import
  const doImport = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await importApi.importStockOpname(file);
      const data = res.data || res;
      setResult(data);
      if (onImportSuccess) onImportSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Import failed");
    } finally {
      setProcessing(false);
    }
  };

  // --- Step indicator
  const renderIndicator = () => (
    <div
      className="px-6 py-4 border-b"
      style={{
        borderColor: colors.border.primary,
        backgroundColor: colors.background.secondary,
      }}
    >
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                  step >= s.n && "ring-2"
                )}
                style={{
                  backgroundColor:
                    step >= s.n ? colors.primary : colors.background.primary,
                  color:
                    step >= s.n ? colors.text.inverse : colors.text.secondary,
                  borderWidth: step >= s.n ? 0 : "2px",
                  borderColor: colors.border.primary,
                }}
              >
                {result && s.n === 3 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  s.n
                )}
              </div>
              <span
                className="mt-2 text-sm font-medium"
                style={{
                  color: step >= s.n ? colors.primary : colors.text.secondary,
                }}
              >
                {s.l}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-1 mx-2 rounded"
                style={{
                  backgroundColor:
                    step > s.n ? colors.primary : colors.border.primary,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // --- Step 1: Upload
  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div
          className="p-8 text-center border-2 border-dashed rounded-lg"
          style={{ borderColor: colors.border.primary }}
        >
          <Upload
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.text.secondary }}
          />
          <h3
            className="mb-2 text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            Upload Excel File
          </h3>
          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>
            Select .xlsx with Stock Opname data
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={selectFile}
            className="hidden"
            id="file-so"
          />
          <label
            htmlFor="file-so"
            className="inline-block px-4 py-2 rounded-lg cursor-pointer"
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            Choose File
          </label>
          {file && (
            <div
              className="flex items-center gap-3 p-3 mt-4 rounded-lg"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <FileSpreadsheet
                className="w-5 h-5"
                style={{ color: colors.primary }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {file.name}
              </span>
            </div>
          )}
        </div>
        <div
          className="p-4 mt-4 rounded-lg"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            <strong>Format:</strong> Sheet "GUDANG BESAR" with columns NO, NAMA
            BARANG, SALDO AWAL, MUTASI MASUK, MUTASI KELUAR, and FISIK.
          </p>
        </div>
      </div>
    </div>
  );

  // --- Step 2: Preview
  const renderStep2 = () => {
    if (processing)
      return (
        <div
          className="py-10 text-sm text-center"
          style={{ color: colors.text.secondary }}
        >
          Generating preview...
        </div>
      );

    if (!preview.summary)
      return (
        <div
          className="py-10 text-sm text-center"
          style={{ color: colors.text.secondary }}
        >
          No preview data available.
        </div>
      );

    const total = preview.summary.total_rows;
    const valid = preview.summary.valid_products;
    const skipped = preview.summary.skipped_products;
    const rows = preview.rows.slice(0, 50);

    return (
      <div>
        {/* Summary */}
        <div
          className="p-4 mb-4 rounded-lg"
          style={{
            backgroundColor: `${colors.primary}15`,
            borderWidth: "1px",
            borderColor: colors.primary,
          }}
        >
          <p className="text-sm" style={{ color: colors.text.primary }}>
            <strong>{valid}</strong> valid products, <strong>{skipped}</strong>{" "}
            skipped out of <strong>{total}</strong> rows.
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex mb-3 border-b"
          style={{ borderColor: colors.border.primary }}
        >
          <button
            onClick={() => setTab("preview")}
            className={cn(
              "px-4 py-2 text-sm font-medium",
              tab === "preview" && "border-b-2"
            )}
            style={{
              borderColor: tab === "preview" ? colors.primary : "transparent",
              color: tab === "preview" ? colors.primary : colors.text.secondary,
            }}
          >
            <Table className="inline w-4 h-4 mr-1" /> Preview
          </button>
          <button
            onClick={() => setTab("skipped")}
            className={cn(
              "px-4 py-2 text-sm font-medium",
              tab === "skipped" && "border-b-2"
            )}
            style={{
              borderColor:
                tab === "skipped" ? colors.status.warning : "transparent",
              color:
                tab === "skipped"
                  ? colors.status.warning
                  : colors.text.secondary,
            }}
          >
            <ListX className="inline w-4 h-4 mr-1" /> Skipped
          </button>
        </div>

        {/* Tab content */}
        {tab === "preview" ? (
          <div
            className="overflow-hidden border rounded-lg"
            style={{ borderColor: colors.border.primary }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderBottomWidth: "1px",
                    borderColor: colors.border.primary,
                  }}
                >
                  <tr>
                    {[
                      "No",
                      "Product",
                      "System Qty",
                      "Physical Qty",
                      "Difference",
                      "Movement",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-2 py-2 font-semibold text-left whitespace-nowrap"
                        style={{ color: colors.text.secondary }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                      }}
                    >
                      <td className="px-2 py-2">{i + 1}</td>
                      <td className="px-2 py-2 font-medium">{r.product}</td>
                      <td className="px-2 py-2 text-right">{r.system_qty}</td>
                      <td className="px-2 py-2 text-right">{r.physical_qty}</td>
                      <td
                        className="px-2 py-2 text-right"
                        style={{
                          color:
                            r.difference > 0
                              ? colors.status.error
                              : r.difference < 0
                              ? colors.status.success
                              : colors.text.secondary,
                        }}
                      >
                        {r.difference}
                      </td>
                      <td className="px-2 py-2">{r.movement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="p-3 text-sm text-center"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.secondary,
              }}
            >
              Showing {rows.length} of {preview.rows.length} rows
            </div>
          </div>
        ) : (
          <div
            className="overflow-hidden border rounded-lg"
            style={{ borderColor: colors.border.primary }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderBottomWidth: "1px",
                    borderColor: colors.border.primary,
                  }}
                >
                  <tr>
                    {["No", "Product Name", "Reason"].map((col) => (
                      <th
                        key={col}
                        className="px-2 py-2 font-semibold text-left whitespace-nowrap"
                        style={{ color: colors.text.secondary }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.skipped_sample.slice(0, 30).map((s, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                      }}
                    >
                      <td className="px-2 py-2">{i + 1}</td>
                      <td className="px-2 py-2 font-medium">{s.name}</td>
                      <td className="px-2 py-2 text-red-500">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="p-3 text-sm text-center"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.secondary,
              }}
            >
              Showing {preview.skipped_sample.length} skipped items
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Step 3
  const renderStep3 = () => {
    if (!result)
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.primary }}
          />
          <h3
            className="mb-2 text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            Ready to Import
          </h3>
          <p className="mb-6 text-sm" style={{ color: colors.text.secondary }}>
            {preview.summary?.valid_products || 0} products will be recorded
          </p>
        </div>
      );

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: colors.status.success }}
        />
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          Import Success!
        </h3>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {result.added} added, {result.skipped} skipped.
        </p>
      </div>
    );
  };

  // --- Actions
  const actions = (
    <>
      {step > 1 && !result && (
        <button
          onClick={back}
          disabled={processing}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{ color: colors.text.primary }}
        >
          Back
        </button>
      )}
      <div className="flex gap-3 ml-auto">
        <button
          onClick={() => {
            reset();
            onClose();
          }}
          disabled={processing}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            backgroundColor: colors.background.primary,
            color: colors.text.primary,
            borderWidth: "1px",
            borderColor: colors.border.primary,
          }}
        >
          {result ? "Close" : "Cancel"}
        </button>
        {!result && (
          <>
            {step < 3 && (
              <Button
                icon={ChevronRight}
                label={processing ? "Loading..." : "Next"}
                onClick={next}
                disabled={
                  processing ||
                  !file ||
                  (step === 2 && preview.rows.length === 0)
                }
              />
            )}
            {step === 3 && (
              <button
                onClick={doImport}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  backgroundColor: colors.status.success,
                  color: colors.text.inverse,
                }}
              >
                {processing ? "Importing..." : "Import"}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import Stock Opname"
      subtitle="Import and preview stock opname results from Excel"
      size="xl"
      actions={actions}
      closeOnOverlayClick={!processing}
    >
      {renderIndicator()}
      <div className="mt-6">
        {error && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.error}15`,
              borderWidth: "1px",
              borderColor: colors.status.error,
            }}
          >
            <AlertCircle
              className="flex-shrink-0 w-5 h-5"
              style={{ color: colors.status.error }}
            />
            <p className="text-sm" style={{ color: colors.status.error }}>
              {error}
            </p>
          </div>
        )}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </Modal>
  );
}
