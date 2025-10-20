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
import { importApi } from "../../../services/import_service";

export default function ImportStockMovementModal({
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

  const [preview, setPreview] = useState({
    movements: [],
    total_rows: 0,
    valid_rows: 0,
    skipped: 0,
    total_movements: 0,
    errors: [],
  });

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
    setPreview({
      movements: [],
      total_rows: 0,
      valid_rows: 0,
      skipped: 0,
      total_movements: 0,
      errors: [],
    });
    setError(null);
    setProcessing(false);
    setTab("preview");
  };

  const close = () => {
    reset();
    onClose();
  };

  // 🔹 Preview from backend
  const fetchPreview = async (f) => {
    setProcessing(true);
    try {
      const res = await importApi.previewLapChemical(f);
      const data = res.data?.data || res.data;
      setPreview({
        movements: data.movements || [],
        total_rows: data.total_rows || 0,
        valid_rows: data.valid_rows || 0,
        skipped: data.skipped || 0,
        total_movements: data.total_movements || 0,
        errors: data.errors || [],
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate preview");
      setPreview({
        movements: [],
        total_rows: 0,
        valid_rows: 0,
        skipped: 0,
        total_movements: 0,
        errors: [],
      });
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 Auto-fetch when entering Step 2
  useEffect(() => {
    if (step === 2 && file && !preview.movements.length && !processing) {
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
    if (step === 1 && !file) return setError("Select file first");
    if (step === 2 && !preview.movements.length)
      return setError("No valid data found");
    setError(null);
    setStep((p) => p + 1);
  };

  const back = () => {
    setError(null);
    setStep((p) => p - 1);
  };

  const doImport = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await importApi.importLapChemical(file);
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

  // --- Step 1
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
            Select .xlsx file with stock movement data
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={selectFile}
            className="hidden"
            id="file-stock"
          />
          <label
            htmlFor="file-stock"
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
            <strong>Format:</strong> Sheet "CHEMICAL" with NOBUKTI, TANGGAL,
            QTY, NAMABRG columns
          </p>
        </div>
      </div>
    </div>
  );

  // --- Step 2: backend preview
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

    if (!preview.movements.length)
      return (
        <div
          className="py-10 text-sm text-center"
          style={{ color: colors.text.secondary }}
        >
          No preview data available.
        </div>
      );

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
            <strong>{preview.valid_rows}</strong> valid rows,{" "}
            <strong>{preview.skipped}</strong> skipped,{" "}
            <strong>{preview.total_movements}</strong> movement(s)
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
            onClick={() => setTab("errors")}
            className={cn(
              "px-4 py-2 text-sm font-medium",
              tab === "errors" && "border-b-2"
            )}
            style={{
              borderColor:
                tab === "errors" ? colors.status.warning : "transparent",
              color:
                tab === "errors"
                  ? colors.status.warning
                  : colors.text.secondary,
            }}
          >
            <ListX className="inline w-4 h-4 mr-1" /> Errors
          </button>
        </div>

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
                      "Code",
                      "Date",
                      "Product",
                      "Qty",
                      "Unit Cost",
                      "Total Cost",
                    ].map((c) => (
                      <th
                        key={c}
                        className="px-2 py-2 font-semibold text-left whitespace-nowrap"
                        style={{ color: colors.text.secondary }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.movements.slice(0, 10).flatMap((m, i) =>
                    m.details.map((d, j) => (
                      <tr
                        key={`${i}-${j}`}
                        style={{
                          borderBottomWidth: "1px",
                          borderColor: colors.border.primary,
                        }}
                      >
                        <td className="px-2 py-2">{i + 1}</td>
                        <td className="px-2 py-2">{m.code}</td>
                        <td className="px-2 py-2">{m.date}</td>
                        <td className="px-2 py-2 font-medium">
                          {d.product_name}
                        </td>
                        <td className="px-2 py-2 text-right">{d.quantity}</td>
                        <td className="px-2 py-2 text-right">
                          {d.unit_cost_used?.toFixed?.(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {d.total_cost?.toFixed?.(2)}
                        </td>
                      </tr>
                    ))
                  )}
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
              Showing first 10 movements
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
                    {["Row", "Code", "Reason", "Qty"].map((c) => (
                      <th
                        key={c}
                        className="px-2 py-2 font-semibold text-left whitespace-nowrap"
                        style={{ color: colors.text.secondary }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.errors.slice(0, 30).map((e, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                      }}
                    >
                      <td className="px-2 py-2">{e.row}</td>
                      <td className="px-2 py-2">{e.code}</td>
                      <td className="px-2 py-2 text-red-500">{e.reason}</td>
                      <td className="px-2 py-2 text-right">{e.qty}</td>
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
              Showing {preview.errors.length} error(s)
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
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            {preview.valid_rows} valid rows → {preview.total_movements}{" "}
            movements
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
          {result.movements} movements, {result.details} details,{" "}
          {result.skipped} skipped
        </p>
      </div>
    );
  };

  // --- Footer actions
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
          onClick={close}
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
                  (step === 2 && !preview.movements.length)
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
      onClose={close}
      title="Import Stock Movement"
      subtitle="Preview and import chemical stock movement data"
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
