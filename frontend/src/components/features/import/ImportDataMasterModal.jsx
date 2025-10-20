import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
import {
  importDataMasterLapChemical,
  importDataMasterLapChemicalPreview,
  importDataMasterLapPembelian,
  importDataMasterLapPembelianPreview,
  importDataMasterLapCk,
  importDataMasterLapCkPreview,
} from "../../../services/import_data_master_service";

export default function ImportDataMasterModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);

  // State untuk setiap data master
  const [chemicalFile, setChemicalFile] = useState(null);
  const [chemicalPreview, setChemicalPreview] = useState([]);
  const [chemicalResult, setChemicalResult] = useState(null);
  const [chemicalError, setChemicalError] = useState(null);

  const [pembelianFile, setPembelianFile] = useState(null);
  const [pembelianPreview, setPembelianPreview] = useState([]);
  const [pembelianResult, setPembelianResult] = useState(null);
  const [pembelianError, setPembelianError] = useState(null);

  const [ckFile, setCkFile] = useState(null);
  const [ckPreview, setCkPreview] = useState([]);
  const [ckResult, setCkResult] = useState(null);
  const [ckError, setCkError] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [subStep, setSubStep] = useState("upload"); // upload, preview, confirm, result

  const steps = [
    { number: 1, label: "Laporan Pembelian", key: "pembelian" },
    { number: 2, label: "Laporan Chemical", key: "chemical" },
    { number: 3, label: "Laporan CK", key: "ck" },
  ];

  const getCurrentStepConfig = () => {
    switch (currentStep) {
      case 1:
        return {
          key: "pembelian",
          file: pembelianFile,
          setFile: setPembelianFile,
          preview: pembelianPreview,
          setPreview: setPembelianPreview,
          result: pembelianResult,
          setResult: setPembelianResult,
          error: pembelianError,
          setError: setPembelianError,
          sheetName: "AGUSTUS",
          columns: ["NAMA BARANG", "KODE SUPPLIER", "TANGGAL", "NO.BUKTI"],
          title: "Import Data Master - Laporan Pembelian",
          description: "Upload file Excel dari Laporan Pembelian",
          importApi: importDataMasterLapPembelian,
          previewApi: importDataMasterLapPembelianPreview,
          skipSheetValidation: true,
        };
      case 2:
        return {
          key: "chemical",
          file: chemicalFile,
          setFile: setChemicalFile,
          preview: chemicalPreview,
          setPreview: setChemicalPreview,
          result: chemicalResult,
          setResult: setChemicalResult,
          error: chemicalError,
          setError: setChemicalError,
          sheetName: "CHEMICAL",
          columns: ["KDBRG", "NAMABRG"],
          title: "Import Data Master - Laporan Chemical",
          description: "Upload file Excel dari Laporan Chemical",
          importApi: importDataMasterLapChemical,
          previewApi: importDataMasterLapChemicalPreview,
        };
      case 3:
        return {
          key: "ck",
          file: ckFile,
          setFile: setCkFile,
          preview: ckPreview,
          setPreview: setCkPreview,
          result: ckResult,
          setResult: setCkResult,
          error: ckError,
          setError: setCkError,
          sheetName: "CK",
          columns: ["KDBRG", "NAMABRG", "KATEGORI"],
          title: "Import Data Master - Laporan CK",
          description: "Upload file Excel dari Laporan CK",
          importApi: importDataMasterLapCk,
          previewApi: importDataMasterLapCkPreview,
        };
      default:
        return null;
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setSubStep("upload");

    setChemicalFile(null);
    setChemicalPreview([]);
    setChemicalResult(null);
    setChemicalError(null);

    setPembelianFile(null);
    setPembelianPreview([]);
    setPembelianResult(null);
    setPembelianError(null);

    setCkFile(null);
    setCkPreview([]);
    setCkResult(null);
    setCkError(null);

    setIsProcessing(false);
  };

  const handleClose = () => {
    if (isProcessing) return;
    resetModal();
    onClose();
  };

  const handleFileSelect = (e) => {
    const config = getCurrentStepConfig();
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
        config.setError("Please upload an .xlsx file");
        return;
      }
      config.setFile(selectedFile);
      config.setError(null);
      parseExcelFile(selectedFile, config);
    }
  };

  const parseExcelFile = (file, config) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Ambil sheet pertama yang ada (karena nama sheet bisa berbeda-beda)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          config.setError("No valid sheet found in the file");
          config.setPreview([]);
          return;
        }

        // Tentukan header row berdasarkan tipe import
        // Untuk Pembelian: header di row 6 (index 5)
        // Untuk Chemical & CK: header di row 5 (index 4)
        const headerRowIndex = config.key === "pembelian" ? 6 : 4;

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          range: headerRowIndex, // Start from correct header row
        });

        const headerRow = jsonData[0] || [];

        console.log("Header row:", headerRow); // Debug: lihat header yang terbaca

        // Find all required columns
        const columnIndices = {};
        const missingColumns = [];

        config.columns.forEach((col) => {
          const index = headerRow.findIndex(
            (h) =>
              String(h).trim().toUpperCase().replace(/\./g, "") ===
              col.toUpperCase().replace(/\./g, "")
          );
          if (index === -1) {
            missingColumns.push(col);
          } else {
            columnIndices[col] = index;
          }
        });

        if (missingColumns.length > 0) {
          config.setError(
            `Column(s) not found: ${missingColumns.join(
              ", "
            )}. Available columns: ${headerRow.join(", ")}`
          );
          config.setPreview([]);
          return;
        }

        // Process data rows (skip header)
        const processed = jsonData
          .slice(1)
          .filter((row) => {
            // Untuk Chemical dan CK: Must have code and name
            if (config.key === "chemical" || config.key === "ck") {
              return (
                row[columnIndices["KDBRG"]] && row[columnIndices["NAMABRG"]]
              );
            }
            // Untuk Pembelian: Must have product name
            if (config.key === "pembelian") {
              const productName = row[columnIndices["NAMA BARANG"]];
              return productName && String(productName).trim().length > 0;
            }
            return false;
          })
          .map((row) => {
            if (config.key === "pembelian") {
              return {
                productName: normalizeText(row[columnIndices["NAMA BARANG"]]),
                supplierCode: normalizeText(
                  row[columnIndices["KODE SUPPLIER"]]
                ),
                date: row[columnIndices["TANGGAL"]]
                  ? String(row[columnIndices["TANGGAL"]])
                  : "",
                docNo: normalizeText(row[columnIndices["NO.BUKTI"]]),
              };
            } else {
              const item = {
                code: normalizeCode(row[columnIndices["KDBRG"]]),
                name: normalizeProductName(row[columnIndices["NAMABRG"]]),
              };

              // Add additional columns if they exist
              if (columnIndices["VENDOR"] !== undefined) {
                item.vendor = normalizeText(row[columnIndices["VENDOR"]]);
              }
              if (columnIndices["KATEGORI"] !== undefined) {
                item.category = normalizeText(row[columnIndices["KATEGORI"]]);
              }

              return item;
            }
          });

        // Remove duplicates untuk Chemical dan CK
        if (config.key === "chemical" || config.key === "ck") {
          const unique = [];
          const seen = new Set();
          processed.forEach((item) => {
            if (!seen.has(item.code)) {
              seen.add(item.code);
              unique.push(item);
            }
          });
          config.setPreview(unique);
        } else {
          config.setPreview(processed);
        }

        config.setError(null);
        setSubStep("preview");
      } catch (err) {
        config.setError("Failed to parse Excel file: " + err.message);
        config.setPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const normalizeCode = (code) => {
    if (!code) return "";
    return String(code).trim().toUpperCase();
  };

  const normalizeProductName = (name) => {
    if (!name) return "";
    return String(name).trim().toUpperCase().replace(/\s+/g, " ");
  };

  const normalizeText = (text) => {
    if (!text) return "";
    return String(text).trim().replace(/\s+/g, " ");
  };

  const handleNextSubStep = () => {
    const config = getCurrentStepConfig();

    if (subStep === "upload" && !config.file) {
      config.setError("Please select a file");
      return;
    }
    if (subStep === "preview" && config.preview.length === 0) {
      config.setError("No valid data to import");
      return;
    }

    config.setError(null);

    if (subStep === "upload") {
      // File already parsed, should be in preview
      if (config.preview.length > 0) {
        setSubStep("preview");
      }
    } else if (subStep === "preview") {
      setSubStep("confirm");
    }
  };

  const handleBackSubStep = () => {
    const config = getCurrentStepConfig();
    config.setError(null);

    if (subStep === "preview") {
      setSubStep("upload");
    } else if (subStep === "confirm") {
      setSubStep("preview");
    } else if (subStep === "result") {
      // Can't go back from result
      return;
    }
  };

  const handleImport = async () => {
    const config = getCurrentStepConfig();
    if (!config.file) return;

    setIsProcessing(true);
    config.setError(null);

    try {
      console.log(
        "Uploading file:",
        config.file.name,
        "Size:",
        config.file.size
      ); // Debug

      // Pass file object langsung
      const response = await config.importApi(config.file);

      console.log("Import response:", response.data); // Debug

      const result = response.data;

      config.setResult(result);
      setSubStep("result");

      if (onImportSuccess) {
        onImportSuccess(result);
      }
    } catch (err) {
      console.error("Import error:", err); // Debug
      console.error("Error response:", err.response?.data); // Debug

      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to import data";

      config.setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextStep = () => {
    const config = getCurrentStepConfig();

    // Validasi: harus sudah import sebelum ke step berikutnya
    if (!config.result) {
      config.setError(
        "Please complete the import before proceeding to the next step"
      );
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setSubStep("upload");
    }
  };

  const canProceedToNextStep = () => {
    const config = getCurrentStepConfig();
    return config.result !== null;
  };

  const renderStepIndicator = () => (
    <div
      className="px-6 py-4 border-b"
      style={{
        borderColor: colors.border.primary,
        backgroundColor: colors.background.secondary,
      }}
    >
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                  currentStep >= step.number ? "ring-2" : ""
                )}
                style={{
                  backgroundColor:
                    currentStep > step.number
                      ? colors.status.success
                      : currentStep === step.number
                      ? colors.primary
                      : colors.background.primary,
                  color:
                    currentStep >= step.number
                      ? colors.text.inverse
                      : colors.text.secondary,
                  borderWidth: currentStep >= step.number ? 0 : "2px",
                  borderColor: colors.border.primary,
                  ringColor:
                    currentStep > step.number
                      ? colors.status.success
                      : colors.primary,
                }}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className="mt-2 text-xs font-medium text-center"
                style={{
                  color:
                    currentStep >= step.number
                      ? currentStep > step.number
                        ? colors.status.success
                        : colors.primary
                      : colors.text.secondary,
                }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="flex-1 h-1 mx-2 transition-all rounded"
                style={{
                  backgroundColor:
                    currentStep > step.number
                      ? colors.status.success
                      : colors.border.primary,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderErrorAlert = (error) => {
    if (!error) return null;

    return (
      <div
        className="flex items-start gap-3 p-4 mb-4 rounded-lg"
        style={{
          backgroundColor: `${colors.status.error}15`,
          borderWidth: "1px",
          borderColor: colors.status.error,
        }}
      >
        <AlertCircle
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: colors.status.error }}
        />
        <p className="text-sm" style={{ color: colors.status.error }}>
          {error}
        </p>
      </div>
    );
  };

  const renderUploadStep = () => {
    const config = getCurrentStepConfig();

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div
            className="p-8 text-center transition-colors border-2 border-dashed rounded-lg"
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
              {config.description}
            </h3>
            <p
              className="mb-4 text-sm"
              style={{ color: colors.text.secondary }}
            >
              Select an .xlsx file containing {config.key} data
            </p>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id={`file-upload-${config.key}`}
            />
            <label
              htmlFor={`file-upload-${config.key}`}
              className="inline-block px-4 py-2 transition-colors rounded-lg cursor-pointer"
              style={{
                backgroundColor: colors.primary,
                color: colors.text.inverse,
              }}
            >
              Choose File
            </label>
            {config.file && (
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
                  {config.file.name}
                </span>
              </div>
            )}
          </div>
          <div
            className="p-4 mt-4 rounded-lg"
            style={{ backgroundColor: colors.background.secondary }}
          >
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              <strong>Expected format:</strong> Excel file with sheet "
              {config.sheetName}" containing columns:{" "}
              {config.columns.join(", ")}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => {
    const config = getCurrentStepConfig();

    return (
      <div>
        <div
          className="p-4 mb-4 rounded-lg"
          style={{
            backgroundColor: `${colors.primary}15`,
            borderWidth: "1px",
            borderColor: colors.primary,
          }}
        >
          <p className="text-sm" style={{ color: colors.text.primary }}>
            <strong>{config.preview.length}</strong> record(s) will be imported
          </p>
        </div>
        <div
          className="overflow-hidden border rounded-lg"
          style={{ borderColor: colors.border.primary }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                style={{
                  backgroundColor: colors.background.secondary,
                  borderBottomWidth: "1px",
                  borderColor: colors.border.primary,
                }}
              >
                <tr>
                  <th
                    className="px-4 py-3 text-xs font-semibold text-left uppercase"
                    style={{ color: colors.text.secondary }}
                  >
                    No
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold text-left uppercase"
                    style={{ color: colors.text.secondary }}
                  >
                    Code
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold text-left uppercase"
                    style={{ color: colors.text.secondary }}
                  >
                    Name
                  </th>
                  {config.columns.includes("VENDOR") && (
                    <th
                      className="px-4 py-3 text-xs font-semibold text-left uppercase"
                      style={{ color: colors.text.secondary }}
                    >
                      Vendor
                    </th>
                  )}
                  {config.columns.includes("KATEGORI") && (
                    <th
                      className="px-4 py-3 text-xs font-semibold text-left uppercase"
                      style={{ color: colors.text.secondary }}
                    >
                      Category
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {config.preview.slice(0, 50).map((item, index) => (
                  <tr
                    key={index}
                    className="transition-colors"
                    style={{
                      borderBottomWidth: "1px",
                      borderColor: colors.border.primary,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        colors.background.secondary)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {index + 1}
                    </td>
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {item.code}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {item.name}
                    </td>
                    {item.vendor !== undefined && (
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: colors.text.primary }}
                      >
                        {item.vendor}
                      </td>
                    )}
                    {item.category !== undefined && (
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: colors.text.primary }}
                      >
                        {item.category}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {config.preview.length > 50 && (
            <div
              className="p-3 text-center border-t"
              style={{
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
              }}
            >
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Showing first 50 of {config.preview.length} records
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConfirmStep = () => {
    const config = getCurrentStepConfig();

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
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
            {config.preview.length} record(s) from {config.key} will be
            imported.
          </p>
          <div
            className="p-4 text-left rounded-lg"
            style={{ backgroundColor: colors.background.secondary }}
          >
            <p className="text-sm" style={{ color: colors.text.primary }}>
              <strong>File:</strong> {config.file?.name}
            </p>
            <p className="mt-1 text-sm" style={{ color: colors.text.primary }}>
              <strong>Total Records:</strong> {config.preview.length}
            </p>
            <p className="mt-1 text-sm" style={{ color: colors.text.primary }}>
              <strong>Source:</strong> {config.title}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderResultStep = () => {
    const config = getCurrentStepConfig();

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <CheckCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: colors.status.success }}
            />
            <h3
              className="mb-2 text-lg font-semibold"
              style={{ color: colors.text.primary }}
            >
              Import Successful!
            </h3>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Data from {config.label} has been imported successfully
            </p>
          </div>
          <div className="space-y-3">
            {config.result?.inserted > 0 && (
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${colors.status.success}15`,
                  borderWidth: "1px",
                  borderColor: colors.status.success,
                }}
              >
                <p className="text-sm" style={{ color: colors.status.success }}>
                  <strong className="text-2xl">{config.result.inserted}</strong>{" "}
                  record(s) inserted
                </p>
              </div>
            )}
            {config.result?.updated > 0 && (
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  borderWidth: "1px",
                  borderColor: colors.primary,
                }}
              >
                <p className="text-sm" style={{ color: colors.primary }}>
                  <strong className="text-2xl">{config.result.updated}</strong>{" "}
                  record(s) updated
                </p>
              </div>
            )}
            {config.result?.skipped_count > 0 && (
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${colors.status.warning}15`,
                  borderWidth: "1px",
                  borderColor: colors.status.warning,
                }}
              >
                <p
                  className="mb-2 text-sm"
                  style={{ color: colors.status.warning }}
                >
                  <strong>{config.result.skipped_count}</strong> record(s)
                  skipped
                </p>
                {config.result.skipped_samples &&
                  config.result.skipped_samples.length > 0 && (
                    <div className="mt-2">
                      <p
                        className="mb-1 text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        Sample codes:
                      </p>
                      <p
                        className="font-mono text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {config.result.skipped_samples.join(", ")}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {currentStep < 3 && (
            <div
              className="p-4 mt-6 rounded-lg"
              style={{
                backgroundColor: `${colors.primary}15`,
                borderWidth: "1px",
                borderColor: colors.primary,
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: colors.primary }}
              >
                Click "Next Step" to continue with {steps[currentStep].label}
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div
              className="p-4 mt-6 rounded-lg"
              style={{
                backgroundColor: `${colors.status.success}15`,
                borderWidth: "1px",
                borderColor: colors.status.success,
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: colors.status.success }}
              >
                ✓ All data master imports completed successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const config = getCurrentStepConfig();

    return (
      <>
        {renderErrorAlert(config.error)}
        {subStep === "upload" && renderUploadStep()}
        {subStep === "preview" && renderPreviewStep()}
        {subStep === "confirm" && renderConfirmStep()}
        {subStep === "result" && renderResultStep()}
      </>
    );
  };

  const modalActions = (
    <>
      {subStep !== "upload" && subStep !== "result" && (
        <button
          onClick={handleBackSubStep}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium transition-colors rounded-lg disabled:opacity-50"
          style={{ color: colors.text.primary }}
        >
          <ChevronLeft className="inline w-4 h-4 mr-1" />
          Back
        </button>
      )}
      <div className="flex gap-3 ml-auto">
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium transition-colors rounded-lg"
          style={{
            backgroundColor: colors.background.primary,
            color: colors.text.primary,
            borderWidth: "1px",
            borderColor: colors.border.primary,
          }}
        >
          {currentStep === 3 && subStep === "result" ? "Finish" : "Cancel"}
        </button>

        {subStep === "upload" && getCurrentStepConfig().preview.length > 0 && (
          <Button
            icon={ChevronRight}
            label="Preview"
            onClick={handleNextSubStep}
            disabled={!getCurrentStepConfig().file}
          />
        )}

        {subStep === "preview" && (
          <Button
            icon={ChevronRight}
            label="Confirm"
            onClick={handleNextSubStep}
            disabled={getCurrentStepConfig().preview.length === 0}
          />
        )}

        {subStep === "confirm" && (
          <button
            onClick={handleImport}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium transition-colors rounded-lg disabled:opacity-50"
            style={{
              backgroundColor: colors.status.success,
              color: colors.text.inverse,
            }}
          >
            {isProcessing ? "Importing..." : "Import Now"}
          </button>
        )}

        {subStep === "result" && currentStep < 3 && (
          <Button
            icon={ChevronRight}
            label="Next Step"
            onClick={handleNextStep}
            disabled={!canProceedToNextStep()}
          />
        )}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data Master"
      subtitle="Import data master from 3 different reports sequentially"
      size="xl"
      actions={modalActions}
      closeOnOverlayClick={!isProcessing}
    >
      {renderStepIndicator()}
      <div className="mt-6">{renderContent()}</div>
    </Modal>
  );
}
