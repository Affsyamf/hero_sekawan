import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
import { importApi } from "../../../services/import_service";

export default function ImportOpeningBalanceModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
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
    setPreview(null);
    setResult(null);
    setError(null);
    setProcessing(false);
  };

  // --- Fetch preview from backend ---
  const fetchPreview = async (f) => {
    setProcessing(true);
    try {
      const res = await importApi.previewOpeningBalance(f);
      const data = res.data?.data;

      setPreview(data);
      setError(null);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Preview failed");
      setPreview(null);
    } finally {
      setProcessing(false);
    }
  };

  const selectFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Upload .xlsx file");
      return;
    }
    setFile(f);
    setError(null);
    await fetchPreview(f);
  };

  const next = () => {
    if (step === 1 && !file) {
      setError("Select file");
      return;
    }
    if (step === 2 && !preview?.summary?.valid_products) {
      setError("No valid data to import");
      return;
    }
    setError(null);
    setStep((p) => p + 1);
  };

  const back = () => {
    setError(null);
    setStep((p) => p - 1);
  };

  // --- Perform actual import ---
  const doImport = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await importApi.importOpeningBalance(file);
      const data = res.data?.data || res.data;

      setResult(data);
      if (onImportSuccess) onImportSuccess(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to import data"
      );
    } finally {
      setProcessing(false);
    }
  };

  // --- Render Step Indicator ---
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

  // --- Step 1: Upload ---
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
            Select .xlsx with opening balance data (Sheet: GUDANG BESAR)
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={selectFile}
            className="hidden"
            id="file-opening-balance"
            disabled={processing}
          />
          <label
            htmlFor="file-opening-balance"
            className={cn(
              "inline-block px-4 py-2 rounded-lg",
              processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            {processing ? "Processing..." : "Choose File"}
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
      </div>
    </div>
  );

  // --- Step 2: Preview ---
  const renderStep2 = () => {
    if (!preview) {
      return (
        <div
          className="py-6 text-sm text-center"
          style={{ color: colors.text.secondary }}
        >
          No preview data available
        </div>
      );
    }

    const { summary, preview_rows = [], skipped_sample = [] } = preview;
    const displayed = preview_rows.slice(0, 30);

    return (
      <div>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.primary}15`,
              borderWidth: "1px",
              borderColor: colors.primary,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Total Rows
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              {summary?.total_rows || 0}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.success}15`,
              borderWidth: "1px",
              borderColor: colors.status.success,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Valid Products
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary?.valid_products || 0}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.warning}15`,
              borderWidth: "1px",
              borderColor: colors.status.warning,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Skipped
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.warning }}
            >
              {summary?.skipped_products || 0}
            </p>
          </div>
        </div>

        {/* Skipped Products Warning */}
        {skipped_sample.length > 0 && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.warning}15`,
              borderWidth: "1px",
              borderColor: colors.status.warning,
            }}
          >
            <AlertTriangle
              className="flex-shrink-0 w-5 h-5 mt-0.5"
              style={{ color: colors.status.warning }}
            />
            <div className="flex-1">
              <p
                className="mb-2 text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {skipped_sample.length} product(s) will be skipped:
              </p>
              <div className="space-y-1 overflow-y-auto max-h-32">
                {skipped_sample.slice(0, 10).map((item, idx) => (
                  <p
                    key={idx}
                    className="text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    • {item.name} - {item.reason}
                  </p>
                ))}
                {skipped_sample.length > 10 && (
                  <p
                    className="text-xs italic"
                    style={{ color: colors.text.secondary }}
                  >
                    ... and {skipped_sample.length - 10} more
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Table */}
        {processing ? (
          <div
            className="py-6 text-sm text-center"
            style={{ color: colors.text.secondary }}
          >
            Loading preview...
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
                    {[
                      "No",
                      "Product",
                      "Quantity",
                      "Unit Price",
                      "DPP",
                      "PPN (11%)",
                      "Total",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 font-semibold text-left whitespace-nowrap"
                        style={{ color: colors.text.secondary }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                      }}
                    >
                      <td
                        className="px-3 py-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {i + 1}
                      </td>
                      <td
                        className="px-3 py-2 font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {r.product}
                      </td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{ color: colors.text.primary }}
                      >
                        {r.quantity?.toLocaleString() || 0}
                      </td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{ color: colors.text.primary }}
                      >
                        {r.unit_price?.toLocaleString() || 0}
                      </td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{ color: colors.text.primary }}
                      >
                        {r.dpp?.toLocaleString() || 0}
                      </td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{ color: colors.text.primary }}
                      >
                        {r.ppn?.toLocaleString() || 0}
                      </td>
                      <td
                        className="px-3 py-2 font-medium text-right"
                        style={{ color: colors.text.primary }}
                      >
                        {r.total?.toLocaleString() || 0}
                      </td>
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
              Showing {displayed.length} of {summary?.valid_products || 0} valid
              products
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Step 3: Confirm/Result ---
  const renderStep3 = () => {
    if (!result) {
      const validProducts = preview?.summary?.valid_products || 0;
      const skippedProducts = preview?.summary?.skipped_products || 0;

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
          <div className="space-y-2 text-center">
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              <strong style={{ color: colors.status.success }}>
                {validProducts}
              </strong>{" "}
              products will be imported
            </p>
            {skippedProducts > 0 && (
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                <strong style={{ color: colors.status.warning }}>
                  {skippedProducts}
                </strong>{" "}
                products will be skipped
              </p>
            )}
          </div>
        </div>
      );
    }

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
        <div className="mt-4 space-y-2 text-center">
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            <strong style={{ color: colors.status.success }}>
              {result.added || 0}
            </strong>{" "}
            products imported successfully
          </p>
          {result.skipped > 0 && (
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              <strong style={{ color: colors.status.warning }}>
                {result.skipped}
              </strong>{" "}
              products were skipped
            </p>
          )}
        </div>
      </div>
    );
  };

  // --- Actions ---
  const actions = (
    <>
      {step > 1 && !result && (
        <button
          onClick={back}
          disabled={processing}
          className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
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
                label="Next"
                onClick={next}
                disabled={
                  !file || (step === 2 && !preview?.summary?.valid_products)
                }
              />
            )}
            {step === 3 && (
              <button
                onClick={doImport}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
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
      title="Import Opening Balance"
      subtitle="Import opening balance from Excel (Sheet: GUDANG BESAR)"
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
