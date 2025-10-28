import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowDown,
  Database,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import { useTheme } from "../../../contexts/ThemeContext";

export default function GuideImportPurchasingModal({ isOpen, onClose }) {
  const { colors } = useTheme();

  const actions = (
    <button
      onClick={onClose}
      className="px-4 py-2 text-sm font-medium rounded-lg"
      style={{
        backgroundColor: colors.primary,
        color: colors.text.inverse,
      }}
    >
      Mengerti
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Panduan Import Data Pembelian"
      subtitle="Pelajari langkah-langkah dan persyaratan import transaksi pembelian"
      size="xl"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Prerequisites Warning */}
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: `${colors.status.error}15`,
            borderWidth: "2px",
            borderColor: colors.status.error,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="flex-shrink-0 w-6 h-6 mt-0.5"
              style={{ color: colors.status.error }}
            />
            <div>
              <h4
                className="mb-2 text-base font-bold"
                style={{ color: colors.status.error }}
              >
                PENTING! Persyaratan Sebelum Import Pembelian
              </h4>
              <p
                className="mb-2 text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                Anda <strong>WAJIB</strong> import Data Master terlebih dahulu
                sebelum import data pembelian. Jika tidak, proses import akan
                gagal.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Flow */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5" style={{ color: colors.primary }} />
            <h3
              className="text-lg font-bold"
              style={{ color: colors.text.primary }}
            >
              Langkah-Langkah Import (Wajib Berurutan)
            </h3>
          </div>

          {/* Step 1 */}
          <div
            className="p-4 mb-3 rounded-lg"
            style={{
              backgroundColor: colors.background.secondary,
              borderWidth: "1px",
              borderColor: colors.border.primary,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.text.inverse,
                }}
              >
                1
              </div>
              <div className="flex-1">
                <h4
                  className="mb-2 text-base font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Import Data Master dari Laporan Pembelian
                </h4>
                <p
                  className="mb-3 text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Lokasi: <strong>Menu Product → Import Data Master</strong>
                </p>
                <div
                  className="p-3 rounded"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <p
                    className="mb-2 text-xs font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    Data yang akan di-import:
                  </p>
                  <ul
                    className="space-y-1 text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    <li className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3 h-3"
                        style={{ color: colors.status.success }}
                      />
                      Account (Akun)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3 h-3"
                        style={{ color: colors.status.success }}
                      />
                      Product (Produk)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3 h-3"
                        style={{ color: colors.status.success }}
                      />
                      Supplier (Pemasok)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-2">
            <ArrowDown
              className="w-6 h-6"
              style={{ color: colors.text.secondary }}
            />
          </div>

          {/* Step 2 */}
          <div
            className="p-4 mb-3 rounded-lg"
            style={{
              backgroundColor: colors.background.secondary,
              borderWidth: "1px",
              borderColor: colors.border.primary,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.text.inverse,
                }}
              >
                2
              </div>
              <div className="flex-1">
                <h4
                  className="mb-2 text-base font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Import Data Master dari Laporan Chemical
                </h4>
                <p
                  className="mb-3 text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Lokasi: <strong>Menu Product → Import Data Master</strong>
                </p>
                <div
                  className="p-3 rounded"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <p
                    className="mb-2 text-xs font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    Data yang akan di-import:
                  </p>
                  <ul
                    className="space-y-1 text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    <li className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3 h-3"
                        style={{ color: colors.status.success }}
                      />
                      Product Chemical (Produk Kimia)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-2">
            <ArrowDown
              className="w-6 h-6"
              style={{ color: colors.text.secondary }}
            />
          </div>

          {/* Step 3 */}
          <div
            className="p-4 mb-3 rounded-lg"
            style={{
              backgroundColor: colors.background.secondary,
              borderWidth: "1px",
              borderColor: colors.border.primary,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.text.inverse,
                }}
              >
                3
              </div>
              <div className="flex-1">
                <h4
                  className="mb-2 text-base font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Import Data Master dari Laporan CK
                </h4>
                <p
                  className="mb-3 text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Lokasi: <strong>Menu Product → Import Data Master</strong>
                </p>
                <div
                  className="p-3 rounded"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <p
                    className="mb-2 text-xs font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    Data yang akan di-import:
                  </p>
                  <ul
                    className="space-y-1 text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    <li className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3 h-3"
                        style={{ color: colors.status.success }}
                      />
                      Product Aux (Produk Auxiliary)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3 h-3"
                        style={{ color: colors.status.success }}
                      />
                      Product Goods (Produk Barang)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-2">
            <ArrowDown
              className="w-6 h-6"
              style={{ color: colors.status.success }}
            />
          </div>

          {/* Step 4 */}
          <div
            className="p-4 mb-3 rounded-lg"
            style={{
              backgroundColor: colors.background.secondary,
              borderWidth: "1px",
              borderColor: colors.border.primary,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.text.inverse,
                }}
              >
                4
              </div>
              <div className="flex-1">
                <h4
                  className="mb-2 text-base font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Import Data Opening Balance dari Laporan Chemical
                </h4>
                <p
                  className="mb-3 text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Lokasi:{" "}
                  <strong>Menu Purchasing → Import Opening Balance.</strong>
                  <strong> File yang di upload Laporan Chemical.</strong>
                </p>
                <div
                  className="p-3 rounded"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <p
                    className="mb-2 text-xs font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    Data yang akan di-import:
                  </p>
                  <ul
                    className="space-y-1 text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    <li className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3 h-3"
                        style={{ color: colors.status.success }}
                      />
                      Stock Awal Opening Balance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 - Final Step */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.success}15`,
              borderWidth: "2px",
              borderColor: colors.status.success,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold rounded-full"
                style={{
                  backgroundColor: colors.status.success,
                  color: colors.text.inverse,
                }}
              >
                5
              </div>
              <div className="flex-1">
                <h4
                  className="mb-2 text-base font-semibold"
                  style={{ color: colors.status.success }}
                >
                  Import Data Transaksi Pembelian
                </h4>
                <p
                  className="mb-2 text-sm"
                  style={{ color: colors.text.primary }}
                >
                  Lokasi:{" "}
                  <strong>Menu Purchasing → Button "Import from Excel"</strong>
                </p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  Setelah semua data master berhasil di-import, Anda dapat
                  melakukan import transaksi pembelian.{" "}
                  <strong>File yang di upload Laporan Pembelian.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Catatan Penting */}
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: `${colors.status.warning}15`,
            borderWidth: "1px",
            borderColor: colors.status.warning,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="flex-shrink-0 w-5 h-5 mt-0.5"
              style={{ color: colors.status.warning }}
            />
            <div>
              <h4
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Catatan Penting
              </h4>
              <ul
                className="space-y-1 text-xs"
                style={{ color: colors.text.secondary }}
              >
                <li>
                  • <strong>WAJIB</strong> import data master terlebih dahulu
                  sesuai urutan (Pembelian → Chemical → CK)
                </li>
                <li>
                  • Pastikan nama produk di file pembelian sama persis dengan
                  nama produk di data master
                </li>
                <li>
                  • Pastikan nama supplier di file pembelian sama persis dengan
                  nama supplier di data master
                </li>
                <li>
                  • Jika ada data yang tidak cocok, baris tersebut akan
                  diabaikan saat import
                </li>
                <li>
                  • Format tanggal harus konsisten (DD/MM/YYYY atau DD-MM-YYYY)
                </li>
                <li>
                  • Satu nomor bukti bisa memiliki beberapa detail barang
                  (multi-line)
                </li>
                <li>
                  • Backup data Anda sebelum melakukan import untuk antisipasi
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
