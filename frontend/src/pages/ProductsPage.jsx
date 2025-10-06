import MainLayout from "../layouts/MainLayout/MainLayout";
import Table from "../components/ui/table/Table";
import ProductForm from "../components/features/product/ProductForm";
import ImportProductModal from "../components/features/product/ImportProductModal";
import { useState } from "react";
import { Edit2, Trash2, Eye, Upload } from "lucide-react";
import { useTemp } from "../hooks/useTemp";

const SAMPLE_PRODUCTS = [];

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { value: products = SAMPLE_PRODUCTS, set: setProducts } = useTemp(
    "products:working-list",
    SAMPLE_PRODUCTS
  );

  const { value: accounts = [] } = useTemp("accounts:working-list", []);

  // Fetch function for Table component
  const fetchProducts = async (params) => {
    const { page, pageSize, search, sortBy, sortDir } = params;

    let filtered = [...products];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.code?.toLowerCase().includes(searchLower) ||
          p.name?.toLowerCase().includes(searchLower) ||
          p.unit?.toLowerCase().includes(searchLower) ||
          accounts
            .find((a) => a.id === p.account_id)
            ?.name?.toLowerCase()
            .includes(searchLower)
      );
    }

    // Sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortBy === "account_id") {
          const accountA = accounts.find((acc) => acc.id === a.account_id);
          const accountB = accounts.find((acc) => acc.id === b.account_id);
          aVal = accountA?.name || "";
          bVal = accountB?.name || "";
        }

        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return { rows, total };
  };

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
        const account = accounts.find((a) => a.id === value);
        return (
          <span className="text-primary-text">
            {account ? `${account.code} - ${account.name}` : "-"}
          </span>
        );
      },
    },
  ];

  // CRUD Handlers
  const handleAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedProduct(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedProduct(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    if (
      window.confirm(`Are you sure you want to delete product ${row.name}?`)
    ) {
      setProducts((prev) => prev.filter((p) => p.id !== row.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Save handler
  const handleSave = (productData) => {
    const nextId = (arr) =>
      arr.length ? Math.max(...arr.map((p) => p.id || 0)) + 1 : 1;

    setProducts((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (productData.id) {
        // Update existing
        return current.map((p) =>
          p.id === productData.id ? { ...p, ...productData } : p
        );
      }
      // Create new
      return [...current, { ...productData, id: nextId(current) }];
    });

    handleCloseModal();
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleImportSuccess = (result) => {
    // Refresh table data after successful import
    setRefreshKey(prev => prev + 1);
    
    // Log success (you can replace with your notification system)
    console.log("Import successful:", result);
    
    // Optionally reload products from API if you have one
  };

  const renderActions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleDetail(row)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(row)}
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
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-1 text-2xl font-bold text-primary-text">
            Product Management
          </h1>
          <p className="mb-6 text-secondary-text">
            Manage your products with codes, units, and account associations.
          </p>

          {/* Import Button */}
          <div className="mb-4">
            <button
              onClick={handleImport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              Import from Excel
            </button>
          </div>

          <Table
            key={refreshKey}
            columns={columns}
            fetchData={fetchProducts}
            actions={renderActions}
            onCreate={handleAdd}
            pageSizeOptions={[10, 20, 50, 100]}
          />

          <ProductForm
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />

          <ImportProductModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSuccess}
          />
        </div>
      </div>
    </MainLayout>
  );
}