import MainLayout from "../../layouts/MainLayout/MainLayout";
import Table from "../../components/ui/table/Table";
import Button from "../../components/ui/button/Button";
import ProductForm from "../../components/features/product/ProductForm";
import ImportProductModal from "../../components/features/product/ImportProductModal";
import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye, Upload } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  searchProduct,
  updateProduct,
} from "../../services/product_service";
import { searchAccount } from "../../services/account_service";
import ImportDataMasterModal from "../../components/features/import/ImportDataMasterModal";

// const SAMPLE_PRODUCTS = [];

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await searchAccount({}); // bisa tambahkan filter jika ada
        setAccounts(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  const columns = [
    {
      key: "code",
      label: "Product Code",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value || "-"}</span>
      ),
    },
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "unit",
      label: "Unit",
      sortable: true,
      render: (value) => (
        <span className="text-secondary-text">{value || "-"}</span>
      ),
    },
    {
      key: "account_id",
      label: "Account",
      sortable: true,
      render: (value) => {
        const account = (accounts || []).find((a) => a.id === value);
        return (
          <span className="text-primary-text">
            {account ? `${account.account_no} - ${account.name}` : "-"}
          </span>
        );
      },
    },
  ];

  // CRUD Handlers
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Save handler
  const handleSave = async (productData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(productData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateProduct(payload.id, payload);
      } else {
        await createProduct(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save product: " + error.message);
    }
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to delete product ${row.name}?`)
    ) {
      try {
        await deleteProduct(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
    }
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleImportSuccess = (result) => {
    // Refresh table data after successful import
    setRefreshKey((prev) => prev + 1);
  };

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setSelectedProduct(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setSelectedProduct(row);
          setIsModalOpen(true);
        }}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-all duration-200"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all duration-200"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screena bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Product Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Manage your products with codes, units, and account associations.
          </p>

          {/* Import Button */}
          <div className="mb-4">
            <Button
              icon={Upload}
              label="Import from Excel"
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700"
            />
          </div>

          <Table
            key={refreshKey}
            columns={columns}
            fetchData={searchProduct}
            actions={renderActions}
            onCreate={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            pageSizeOptions={[10, 20, 50, 100]}
            showDateRangeFilter={false}
          />

          <ProductForm
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />

          {/* <ImportProductModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSuccess}
          /> */}

          <ImportDataMasterModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSuccess}
          />
        </div>
      </div>
    </MainLayout>
  );
}
