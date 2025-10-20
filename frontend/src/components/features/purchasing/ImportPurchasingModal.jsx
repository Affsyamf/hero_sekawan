import { useState, useEffect } from "react";
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
// import { importApi } from "../../../services/import_service";

export default function ImportPurchasingModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState({
    rows: [],
    counts: { accounts: 0, products: 0, suppliers: 0 },
  });
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
    setPreviewData({
      rows: [],
      counts: { accounts: 0, products: 0, suppliers: 0 },
    });
    setImportResult(null);
    setError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const fetchBackendPreview = async (file) => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await importApi.previewMasterDataLapPembelian(file);
      const data = res.data;

      // Map backend data to your existing preview structure
      const rows = [
        ...(data.samples?.accounts || []).map((a) => ({
          accountNo: a.account_no,
          accountName: a.name,
          productName: "-",
          unit: "-",
          supplierCode: "-",
          supplierName: "-",
        })),
        ...(data.samples?.products || []).map((p) => ({
          accountNo: p.account_no,
          accountName: p.account_name,
          productName: p.name,
          unit: p.unit,
          supplierCode: "-",
          supplierName: "-",
        })),
        ...(data.samples?.suppliers || []).map((s) => ({
          accountNo: "-",
          accountName: "-",
          productName: "-",
          unit: "-",
          supplierCode: s.code,
          supplierName: s.name,
        })),
      ];

      setPreviewData({
        rows,
        counts: {
          accounts: data.summary?.accounts_to_insert ?? 0,
          products: data.summary?.products_to_insert ?? 0,
          suppliers: data.summary?.suppliers_to_insert ?? 0,
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to fetch preview");
      setPreviewData({
        rows: [],
        counts: { accounts: 0, products: 0, suppliers: 0 },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
        setError("Please upload an .xlsx file");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const normalizeAccountName = (name) => {
    if (!name) return "";
    let value = String(name).replace(/\./g, " ");
    value = value.trim().replace(/\s+/g, "_");
    return value.toUpperCase();
  };

  const normalizeProductName = (name) => {
    if (!name) return "";
    return String(name).trim().toUpperCase().replace(/\s+/g, " ");
  };

  const normalizeSupplierName = (name) => {
    if (!name) return "";
    return String(name).trim().replace(/\s+/g, " ").toUpperCase();
  };

  const handleNext = () => {
    if (currentStep === 1 && !file) {
      setError("Please select a file");
      return;
    }
    if (currentStep === 2) {
      if (previewData.rows.length === 0) {
        setError("No valid data to import");
        return;
      }
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

      const response = await importApi.importMasterDataLapPembelian(file);

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

  useEffect(() => {
    if (currentStep === 2 && file && previewData.rows.length === 0) {
      fetchBackendPreview(file);
    }
  }, [currentStep]);

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
            Select an .xlsx file containing purchasing data
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload-purchasing"
          />
          <label
            htmlFor="file-upload-purchasing"
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
          <p className="mb-2 text-xs" style={{ color: colors.text.secondary }}>
            <strong>Expected format:</strong> Excel file with columns:
          </p>
          <ul
            className="space-y-1 text-xs list-disc list-inside"
            style={{ color: colors.text.secondary }}
          >
            <li>NO.ACC, ACCOUNT (for accounts)</li>
            <li>NAMA BARANG, SATUAN (for products)</li>
            <li>KODE SUPPLIER, SUPPLIER (for suppliers)</li>
          </ul>
          <p className="mt-2 text-xs" style={{ color: colors.text.secondary }}>
            <strong>Note:</strong> All sheets in the file will be processed
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const totalRecords = previewData.rows.length;
    const { accounts, products, suppliers } = previewData.counts;

    return (
      <div>
        {isProcessing && (
          <p
            className="mb-3 text-sm text-center"
            style={{ color: colors.text.secondary }}
          >
            Loading preview...
          </p>
        )}
        <div
          className="p-4 mb-4 rounded-lg"
          style={{
            backgroundColor: `${colors.primary}15`,
            borderWidth: "1px",
            borderColor: colors.primary,
          }}
        >
          <p className="mb-2 text-sm" style={{ color: colors.text.primary }}>
            <strong>{totalRecords}</strong> row(s) will be processed containing:
          </p>
          <div
            className="flex gap-4 text-xs"
            style={{ color: colors.text.secondary }}
          >
            <span>
              <strong>{accounts}</strong> unique accounts
            </span>
            <span>
              <strong>{products}</strong> unique products
            </span>
            <span>
              <strong>{suppliers}</strong> unique suppliers
            </span>
          </div>
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
                    className="px-3 py-2 text-xs font-semibold text-left"
                    style={{ color: colors.text.secondary }}
                  >
                    No
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-left"
                    style={{ color: colors.text.secondary }}
                  >
                    Account No
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-left"
                    style={{ color: colors.text.secondary }}
                  >
                    Account Name
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-left"
                    style={{ color: colors.text.secondary }}
                  >
                    Product Name
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-left"
                    style={{ color: colors.text.secondary }}
                  >
                    Unit
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-left"
                    style={{ color: colors.text.secondary }}
                  >
                    Supplier Code
                  </th>
                  <th
                    className="px-3 py-2 text-xs font-semibold text-left"
                    style={{ color: colors.text.secondary }}
                  >
                    Supplier Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.rows.slice(0, 50).map((row, index) => (
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
                      className="px-3 py-2 text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {index + 1}
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: colors.text.primary }}
                    >
                      {row.accountNo}
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: colors.text.primary }}
                    >
                      {row.accountName}
                    </td>
                    <td
                      className="px-3 py-2 text-xs font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {row.productName}
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {row.unit}
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: colors.text.primary }}
                    >
                      {row.supplierCode}
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: colors.text.primary }}
                    >
                      {row.supplierName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.rows.length > 50 && (
            <div
              className="p-3 text-center border-t"
              style={{
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
              }}
            >
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Showing first 50 of {previewData.rows.length} records
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    if (!importResult) {
      const totalRecords = previewData.rows.length;
      const { accounts, products, suppliers } = previewData.counts;

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
              {totalRecords} row(s) will be processed. This action cannot be
              undone.
            </p>
            <div
              className="p-4 space-y-2 text-left rounded-lg"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <p className="text-sm" style={{ color: colors.text.primary }}>
                <strong>File:</strong> {file?.name}
              </p>
              <p className="text-sm" style={{ color: colors.text.primary }}>
                <strong>Total Rows:</strong> {totalRecords}
              </p>
              <hr style={{ borderColor: colors.border.primary }} />
              <p className="text-sm" style={{ color: colors.text.primary }}>
                <strong>Unique Accounts:</strong> {accounts}
              </p>
              <p className="text-sm" style={{ color: colors.text.primary }}>
                <strong>Unique Products:</strong> {products}
              </p>
              <p className="text-sm" style={{ color: colors.text.primary }}>
                <strong>Unique Suppliers:</strong> {suppliers}
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
            {/* Accounts Result */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Accounts
              </p>
              <div className="flex gap-4 text-sm">
                <span style={{ color: colors.status.success }}>
                  <strong>{importResult.accounts.inserted}</strong> inserted
                </span>
                <span style={{ color: colors.status.warning }}>
                  <strong>{importResult.accounts.skipped}</strong> skipped
                </span>
              </div>
            </div>

            {/* Products Result */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Products
              </p>
              <div className="flex gap-4 text-sm">
                <span style={{ color: colors.status.success }}>
                  <strong>{importResult.products.inserted}</strong> inserted
                </span>
                <span style={{ color: colors.status.warning }}>
                  <strong>{importResult.products.skipped}</strong> skipped
                </span>
              </div>
            </div>

            {/* Suppliers Result */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Suppliers
              </p>
              <div className="flex gap-4 text-sm">
                <span style={{ color: colors.status.success }}>
                  <strong>{importResult.suppliers.inserted}</strong> inserted
                </span>
                <span style={{ color: colors.status.warning }}>
                  <strong>{importResult.suppliers.skipped}</strong> skipped
                </span>
              </div>
            </div>
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
          disabled={isProcessing}
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
                label={isProcessing ? "Loading..." : "Next"}
                onClick={handleNext}
                disabled={
                  isProcessing ||
                  !file ||
                  (currentStep === 2 && previewData.rows.length === 0)
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
      title="Import Purchasing Data"
      subtitle="Import accounts, products, and suppliers from Excel file"
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
