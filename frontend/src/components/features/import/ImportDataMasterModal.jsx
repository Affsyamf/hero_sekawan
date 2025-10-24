import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
  Package,
  Users,
  FileText,
  Palette,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
import { importApi } from "../../../services/import_service";

const IMPORT_TYPES = {
  CHEMICAL: {
    title: "Import Master Data - Chemical",
    subtitle: "Import products from Chemical sheet",
    sheetName: "CHEMICAL",
    icon: Package,
  },
  PEMBELIAN: {
    title: "Import Master Data - Pembelian",
    subtitle: "Import accounts, products, and suppliers from purchasing data",
    sheetName: "Multiple sheets",
    icon: FileText,
  },
  CK: {
    title: "Import Master Data - Design (CK)",
    subtitle: "Import designs and design types from TEMPLATE QTY",
    sheetName: "TEMPLATE QTY",
    icon: Palette,
  },
};

export default function ImportMasterDataModal({
  isOpen,
  onClose,
  onImportSuccess,
  importType = "CHEMICAL", // "CHEMICAL" | "PEMBELIAN" | "CK"
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const config = IMPORT_TYPES[importType];

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
      let res;
      switch (importType) {
        case "CHEMICAL":
          res = await importApi.previewMasterDataChemical(f);
          break;
        case "PEMBELIAN":
          res = await importApi.previewMasterDataPembelian(f);
          break;
        case "CK":
          res = await importApi.previewMasterDataCk(f);
          break;
        default:
          throw new Error("Invalid import type");
      }

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
    if (step === 2 && !preview) {
      setError("No preview data available");
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
      let res;
      switch (importType) {
        case "CHEMICAL":
          res = await importApi.importMasterDataChemical(file);
          break;
        case "PEMBELIAN":
          res = await importApi.importMasterDataPembelian(file);
          break;
        case "CK":
          res = await importApi.importMasterDataCk(file);
          break;
        default:
          throw new Error("Invalid import type");
      }

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
  const renderStep1 = () => {
    const Icon = config.icon;
    return (
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
            <p
              className="mb-1 text-sm"
              style={{ color: colors.text.secondary }}
            >
              Select .xlsx file
            </p>
            <p className="mb-4 text-xs" style={{ color: colors.text.tertiary }}>
              Sheet: {config.sheetName}
            </p>
            <input
              type="file"
              accept=".xlsx"
              onChange={selectFile}
              className="hidden"
              id={`file-master-${importType}`}
              disabled={processing}
            />
            <label
              htmlFor={`file-master-${importType}`}
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
  };

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

    switch (importType) {
      case "CHEMICAL":
        return renderChemicalPreview();
      case "PEMBELIAN":
        return renderPembelianPreview();
      case "CK":
        return renderCkPreview();
      default:
        return null;
    }
  };

  // --- Chemical Preview ---
  const renderChemicalPreview = () => {
    const {
      summary,
      insert_samples = [],
      update_samples = [],
      skipped_samples = [],
    } = preview;

    return (
      <div>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
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
              To Insert
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary?.to_insert || 0}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.info}15`,
              borderWidth: "1px",
              borderColor: colors.status.info,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              To Update
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.info }}
            >
              {summary?.to_update || 0}
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
              {summary?.skipped || 0}
            </p>
          </div>
        </div>

        {/* Samples Tabs */}
        <div className="space-y-4">
          {/* Insert Samples */}
          {insert_samples.length > 0 && (
            <div>
              <h4
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Products to Insert ({insert_samples.length})
              </h4>
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
                        {["No", "Code", "Name", "Unit", "Account"].map(
                          (col) => (
                            <th
                              key={col}
                              className="px-3 py-2 font-semibold text-left whitespace-nowrap"
                              style={{ color: colors.text.secondary }}
                            >
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {insert_samples.map((item, i) => (
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
                            className="px-3 py-2 font-mono"
                            style={{ color: colors.text.primary }}
                          >
                            {item.code}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.primary }}
                          >
                            {item.name}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.primary }}
                          >
                            {item.unit || "-"}
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ color: colors.text.secondary }}
                          >
                            ID: {item.account_id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Update Samples */}
          {update_samples.length > 0 && (
            <div>
              <h4
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Products to Update ({update_samples.length})
              </h4>
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
                          "Name",
                          "Current Account",
                          "New Account",
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
                      {update_samples.map((item, i) => (
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
                            className="px-3 py-2 font-mono"
                            style={{ color: colors.text.primary }}
                          >
                            {item.code}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.primary }}
                          >
                            {item.name}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.secondary }}
                          >
                            {item.current_account || "None"}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.status.success }}
                          >
                            ID: {item.will_set_account}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Skipped Warning */}
          {skipped_samples.length > 0 && (
            <div
              className="flex items-start gap-3 p-4 rounded-lg"
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
                  {skipped_samples.length} code(s) will be skipped (duplicates)
                </p>
                <div className="flex flex-wrap gap-2">
                  {skipped_samples.slice(0, 15).map((code, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 font-mono text-xs rounded"
                      style={{
                        backgroundColor: colors.background.secondary,
                        color: colors.text.secondary,
                      }}
                    >
                      {code}
                    </span>
                  ))}
                  {skipped_samples.length > 15 && (
                    <span
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      +{skipped_samples.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Pembelian Preview ---
  const renderPembelianPreview = () => {
    const { summary, samples } = preview;

    return (
      <div>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
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
              Accounts to Insert
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary?.accounts_to_insert || 0}
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
              Products to Insert
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary?.products_to_insert || 0}
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
              Suppliers to Insert
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary?.suppliers_to_insert || 0}
            </p>
          </div>
        </div>

        {/* Missing Account Refs Warning */}
        {summary?.missing_account_refs > 0 && (
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
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: colors.status.error }}
              >
                {summary.missing_account_refs} product(s) reference missing
                accounts
              </p>
              {samples?.missing_accounts?.length > 0 && (
                <div className="mt-2 space-y-1 overflow-y-auto max-h-32">
                  {samples.missing_accounts.map((item, idx) => (
                    <p
                      key={idx}
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      • {item.name} - Account #{item.account_no} not found
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs for different entities */}
        <div className="space-y-4">
          {/* Accounts */}
          {samples?.accounts?.length > 0 && (
            <div>
              <h4
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Accounts ({samples.accounts.length})
              </h4>
              <div
                className="overflow-hidden border rounded-lg"
                style={{ borderColor: colors.border.primary }}
              >
                <div className="overflow-x-auto overflow-y-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead
                      style={{
                        backgroundColor: colors.background.secondary,
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <tr>
                        {["No", "Account No", "Name", "Type"].map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 font-semibold text-left"
                            style={{ color: colors.text.secondary }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {samples.accounts.map((item, i) => (
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
                            className="px-3 py-2 font-mono font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {item.account_no}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.primary }}
                          >
                            {item.name}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.secondary }}
                          >
                            {item.account_type}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          {samples?.products?.length > 0 && (
            <div>
              <h4
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Products ({samples.products.length})
              </h4>
              <div
                className="overflow-hidden border rounded-lg"
                style={{ borderColor: colors.border.primary }}
              >
                <div className="overflow-x-auto overflow-y-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead
                      style={{
                        backgroundColor: colors.background.secondary,
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <tr>
                        {["No", "Name", "Unit", "Account", "Status"].map(
                          (col) => (
                            <th
                              key={col}
                              className="px-3 py-2 font-semibold text-left"
                              style={{ color: colors.text.secondary }}
                            >
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {samples.products.map((item, i) => (
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
                            className="px-3 py-2"
                            style={{ color: colors.text.primary }}
                          >
                            {item.name}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.secondary }}
                          >
                            {item.unit || "-"}
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ color: colors.text.secondary }}
                          >
                            {item.account_name ? (
                              <>
                                #{item.account_no} {item.account_name}
                              </>
                            ) : (
                              <span style={{ color: colors.status.error }}>
                                Missing
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {item.has_missing_account ? (
                              <span
                                className="px-2 py-1 text-xs rounded"
                                style={{
                                  backgroundColor: `${colors.status.error}20`,
                                  color: colors.status.error,
                                }}
                              >
                                Missing Acc
                              </span>
                            ) : (
                              <span style={{ color: colors.status.success }}>
                                ✓
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Suppliers */}
          {samples?.suppliers?.length > 0 && (
            <div>
              <h4
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Suppliers ({samples.suppliers.length})
              </h4>
              <div
                className="overflow-hidden border rounded-lg"
                style={{ borderColor: colors.border.primary }}
              >
                <div className="overflow-x-auto overflow-y-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead
                      style={{
                        backgroundColor: colors.background.secondary,
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <tr>
                        {["No", "Code", "Name"].map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 font-semibold text-left"
                            style={{ color: colors.text.secondary }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {samples.suppliers.map((item, i) => (
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
                            className="px-3 py-2 font-mono font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {item.code}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{ color: colors.text.primary }}
                          >
                            {item.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- CK/Design Preview ---
  const renderCkPreview = () => {
    const {
      summary,
      insert_samples = [],
      existing_samples = [],
      skipped_samples = [],
    } = preview;

    return (
      <div>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
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
              To Insert
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary?.to_insert || 0}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.info}15`,
              borderWidth: "1px",
              borderColor: colors.status.info,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Existing
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.info }}
            >
              {summary?.existing || 0}
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
              {summary?.skipped || 0}
            </p>
          </div>
        </div>

        {/* Missing Types Warning */}
        {summary?.missing_types?.length > 0 && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.info}15`,
              borderWidth: "1px",
              borderColor: colors.status.info,
            }}
          >
            <AlertTriangle
              className="flex-shrink-0 w-5 h-5"
              style={{ color: colors.status.info }}
            />
            <div>
              <p
                className="mb-2 text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                New design types will be created: {summary.missing_types.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.missing_types.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: colors.background.secondary,
                      color: colors.text.secondary,
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Designs to Insert */}
        {insert_samples.length > 0 && (
          <div className="mb-4">
            <h4
              className="mb-2 text-sm font-semibold"
              style={{ color: colors.text.primary }}
            >
              Designs to Insert ({insert_samples.length})
            </h4>
            <div
              className="overflow-hidden border rounded-lg"
              style={{ borderColor: colors.border.primary }}
            >
              <div className="overflow-x-auto overflow-y-auto max-h-80">
                <table className="w-full text-xs">
                  <thead
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderBottomWidth: "1px",
                      borderColor: colors.border.primary,
                      position: "sticky",
                      top: 0,
                    }}
                  >
                    <tr>
                      {["No", "Design Code", "Type"].map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 font-semibold text-left"
                          style={{ color: colors.text.secondary }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insert_samples.map((item, i) => (
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
                          {item.code}
                        </td>
                        <td
                          className="px-3 py-2"
                          style={{ color: colors.text.secondary }}
                        >
                          {item.type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Existing Designs */}
        {existing_samples.length > 0 && (
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.info}15`,
              borderWidth: "1px",
              borderColor: colors.status.info,
            }}
          >
            <p
              className="mb-2 text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              {existing_samples.length} design(s) already exist and will be
              skipped
            </p>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-32">
              {existing_samples.slice(0, 20).map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.secondary,
                  }}
                >
                  {item.code}
                </span>
              ))}
              {existing_samples.length > 20 && (
                <span
                  className="text-xs"
                  style={{ color: colors.text.secondary }}
                >
                  +{existing_samples.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Step 3: Confirm/Result ---
  const renderStep3 = () => {
    if (!result) {
      return renderConfirmation();
    }

    return renderResult();
  };

  const renderConfirmation = () => {
    let message = "";

    switch (importType) {
      case "CHEMICAL":
        message = `${
          preview?.summary?.to_insert || 0
        } products will be inserted, ${
          preview?.summary?.to_update || 0
        } will be updated`;
        break;
      case "PEMBELIAN":
        const acc = preview?.summary?.accounts_to_insert || 0;
        const prod = preview?.summary?.products_to_insert || 0;
        const supp = preview?.summary?.suppliers_to_insert || 0;
        message = `${acc} accounts, ${prod} products, ${supp} suppliers will be imported`;
        break;
      case "CK":
        message = `${
          preview?.summary?.to_insert || 0
        } designs will be imported`;
        break;
    }

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
        <p
          className="text-sm text-center"
          style={{ color: colors.text.secondary }}
        >
          {message}
        </p>
      </div>
    );
  };

  const renderResult = () => {
    let message = "";
    let details = [];

    switch (importType) {
      case "CHEMICAL":
        message = "Import completed successfully!";
        details = [
          {
            label: "Inserted",
            value: result.inserted || 0,
            color: colors.status.success,
          },
          {
            label: "Updated",
            value: result.updated || 0,
            color: colors.status.info,
          },
          {
            label: "Skipped",
            value: result.skipped_count || 0,
            color: colors.status.warning,
          },
        ];
        break;
      case "PEMBELIAN":
        message = "Master data imported successfully!";
        details = [
          {
            label: "Accounts",
            value: result.accounts?.inserted || 0,
            color: colors.status.success,
          },
          {
            label: "Products",
            value: result.products?.inserted || 0,
            color: colors.status.success,
          },
          {
            label: "Suppliers",
            value: result.suppliers?.inserted || 0,
            color: colors.status.success,
          },
        ];
        break;
      case "CK":
        message = "Designs imported successfully!";
        details = [
          {
            label: "Added",
            value: result.added || 0,
            color: colors.status.success,
          },
          {
            label: "Skipped",
            value: result.skipped || 0,
            color: colors.status.warning,
          },
        ];
        break;
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
          {message}
        </h3>
        <div className="grid w-full max-w-md grid-cols-3 gap-4 mt-4">
          {details.map((item, idx) => (
            <div key={idx} className="text-center">
              <p
                className="mb-1 text-xs"
                style={{ color: colors.text.secondary }}
              >
                {item.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
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
                disabled={!file || (step === 2 && !preview)}
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
      title={config.title}
      subtitle={config.subtitle}
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
