import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
// import { importApi } from "../../../services/endpoints";

export default function ImportDesignModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { number: 1, label: "Upload File" },
    { number: 2, label: "Preview Data" },
    { number: 3, label: "Confirm Import" },
  ];

  const resetModal = () => {
    setCurrentStep(1);
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
        setError("Please upload an .xlsx file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = "TEMPLATE QTY";
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          setError(`Sheet "${sheetName}" not found in the file`);
          setPreviewData([]);
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          range: 1, // Start from row 2 (index 1), skipping only the header row
        });

        const processed = jsonData
          .filter((row) => row[0])
          .map((row) => ({
            opj: row[0] || "",
            design: normalizeDesignName(row[1] || ""),
            jenisKain: row[2] || "",
            roll: row[3] || "",
            tgl: row[4] || "",
          }))
          .filter((item) => item.design && item.jenisKain);

        const unique = [];
        const seen = new Set();
        processed.forEach((item) => {
          if (!seen.has(item.design)) {
            seen.add(item.design);
            unique.push(item);
          }
        });

        setPreviewData(unique);
        setError(null);
      } catch (err) {
        setError("Failed to parse Excel file: " + err.message);
        setPreviewData([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const normalizeDesignName = (name) => {
    if (!name) return "";
    return String(name).trim().toUpperCase().replace(/\s+/g, " ");
  };

  const handleNext = () => {
    if (currentStep === 1 && !file) {
      setError("Please select a file");
      return;
    }
    if (currentStep === 2 && previewData.length === 0) {
      setError("No valid data to import");
      return;
    }
    setError(null);
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await importApi.importMasterDataDesign(file);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Import failed");
      }

      setImportResult(result);

      if (onImportSuccess) {
        onImportSuccess(result);
      }
    } catch (err) {
      setError(err.message || "Failed to import data");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div
      className="px-6 py-4 border-b"
      style={{
        borderColor: colors.border.primary,
        backgroundColor: colors.background.secondary,
      }}
    >
      <div className="flex items-center justify-between max-w-2xl mx-auto">
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
                    currentStep >= step.number
                      ? colors.primary
                      : colors.background.primary,
                  color:
                    currentStep >= step.number
                      ? colors.text.inverse
                      : colors.text.secondary,
                  borderWidth: currentStep >= step.number ? 0 : "2px",
                  borderColor: colors.border.primary,
                  ringColor: colors.primary,
                }}
              >
                {importResult && step.number === 3 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className="mt-2 text-sm font-medium"
                style={{
                  color:
                    currentStep >= step.number
                      ? colors.primary
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
                      ? colors.primary
                      : colors.border.primary,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (error) {
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
    }
    return null;
  };

  const renderStep1 = () => (
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
            Upload Excel File
          </h3>
          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>
            Select an .xlsx file containing design data
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-4 py-2 transition-colors rounded-lg cursor-pointer"
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
            <strong>Expected format:</strong> Excel file with sheet "TEMPLATE
            QTY" containing columns: OPJ, DESIGN, JENIS KAIN, ROLL, TGL
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
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
          <strong>{previewData.length}</strong> design(s) will be imported
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
                  Design Code
                </th>
                <th
                  className="px-4 py-3 text-xs font-semibold text-left uppercase"
                  style={{ color: colors.text.secondary }}
                >
                  Design Type
                </th>
                <th
                  className="px-4 py-3 text-xs font-semibold text-left uppercase"
                  style={{ color: colors.text.secondary }}
                >
                  OPJ
                </th>
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 50).map((item, index) => (
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
                    {item.design}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: colors.text.primary }}
                  >
                    {item.jenisKain}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {item.opj}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {previewData.length > 50 && (
          <div
            className="p-3 text-center border-t"
            style={{
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.primary,
            }}
          >
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Showing first 50 of {previewData.length} records
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!importResult) {
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
            <p
              className="mb-6 text-sm"
              style={{ color: colors.text.secondary }}
            >
              {previewData.length} design(s) will be imported. This action
              cannot be undone.
            </p>
            <div
              className="p-4 text-left rounded-lg"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <p className="text-sm" style={{ color: colors.text.primary }}>
                <strong>File:</strong> {file?.name}
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: colors.text.primary }}
              >
                <strong>Total Records:</strong> {previewData.length}
              </p>
            </div>
          </div>
        </div>
      );
    }

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
          </div>
          <div className="space-y-3">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: `${colors.status.success}15`,
                borderWidth: "1px",
                borderColor: colors.status.success,
              }}
            >
              <p className="text-sm" style={{ color: colors.status.success }}>
                <strong className="text-2xl">{importResult.added}</strong>{" "}
                design(s) added
              </p>
            </div>
            {importResult.skipped > 0 && (
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${colors.status.warning}15`,
                  borderWidth: "1px",
                  borderColor: colors.status.warning,
                }}
              >
                <p className="text-sm" style={{ color: colors.status.warning }}>
                  <strong>{importResult.skipped}</strong> design(s) skipped
                  (duplicates)
                </p>
              </div>
            )}
            {importResult.unknown_types &&
              importResult.unknown_types.length > 0 && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: `${colors.primary}15`,
                    borderWidth: "1px",
                    borderColor: colors.primary,
                  }}
                >
                  <p
                    className="mb-2 text-sm"
                    style={{ color: colors.text.primary }}
                  >
                    <strong>New design types created:</strong>
                  </p>
                  <ul
                    className="text-xs list-disc list-inside"
                    style={{ color: colors.text.secondary }}
                  >
                    {importResult.unknown_types.map((type, i) => (
                      <li key={i}>{type}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  const modalActions = (
    <>
      {currentStep > 1 && !importResult && (
        <button
          onClick={handleBack}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium transition-colors rounded-lg disabled:opacity-50"
          style={{ color: colors.text.primary }}
        >
          Back
        </button>
      )}
      <div className="flex gap-3 ml-auto">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium transition-colors rounded-lg"
          style={{
            backgroundColor: colors.background.primary,
            color: colors.text.primary,
            borderWidth: "1px",
            borderColor: colors.border.primary,
          }}
        >
          {importResult ? "Close" : "Cancel"}
        </button>
        {!importResult && (
          <>
            {currentStep < 3 && (
              <Button
                icon={ChevronRight}
                label="Next"
                onClick={handleNext}
                disabled={
                  !file || (currentStep === 2 && previewData.length === 0)
                }
              />
            )}
            {currentStep === 3 && (
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
          </>
        )}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Design Data"
      subtitle="Import design data from Excel file in 3 simple steps"
      size="xl"
      actions={modalActions}
      closeOnOverlayClick={!isProcessing}
    >
      {renderStepIndicator()}
      <div className="mt-6">
        {renderContent()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </Modal>
  );
}
