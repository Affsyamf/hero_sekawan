import { Edit2, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import AccountForm from "../../components/features/account/AccountForm";
import Table from "../../components/ui/table/Table";
import {
  createAccount,
  deleteAccount,
  searchAccount,
  updateAccount,
} from "../../services/account_service";

export default function AccountsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // const fetchAccounts = async (params) => {
  //   const { page, pageSize, search, sortBy, sortDir } = params;

  //   let filtered = [...accounts];

  //   if (search) {
  //     const searchLower = search.toLowerCase();
  //     filtered = filtered.filter(
  //       (a) =>
  //         a.name?.toLowerCase().includes(searchLower) ||
  //         a.account_no?.toString().includes(searchLower) ||
  //         a.alias?.toLowerCase().includes(searchLower)
  //     );
  //   }

  //   if (sortBy) {
  //     filtered.sort((a, b) => {
  //       let aVal = a[sortBy] || "";
  //       let bVal = b[sortBy] || "";

  //       if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
  //       if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
  //       return 0;
  //     });
  //   }

  //   const total = filtered.length;
  //   const start = (page - 1) * pageSize;
  //   const rows = filtered.slice(start, start + pageSize);

  //   return { rows, total };
  // };

  // const fetchAccounts = async (params) => {
  //   try {
  //     const data = await accountApi.search(params);
  //     return { rows: data.rows || data, total: data.total || data.length };
  //   } catch (error) {
  //     console.error("Failed to fetch products:", error);
  //     return { rows: [], total: 0 };
  //   }
  // };

  const columns = [
    {
      key: "account_no",
      label: "Account No",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
    {
      key: "name",
      label: "Account Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary-text">{value}</span>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedAccount(row);
    setIsModalOpen(true);
  };

  const handleDetail = (row) => {
    setSelectedAccount(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to delete product ${row.name}?`)
    ) {
      try {
        await deleteAccount(row.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Failed to delete: " + error.message);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleSave = async (productData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(productData).filter(
          ([_, value]) => value != null && value !== ""
        )
      );

      if (payload.id) {
        await updateAccount(payload.id, payload);
      } else {
        await createAccount(payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (error) {
      alert("Failed to save product: " + error.message);
    }
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
    <div className="bg-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 text-2xl font-bold text-primary-text">
          Account Management
        </h1>
        <p className="mb-6 text-secondary-text">Manage accounts</p>

        <Table
          key={refreshKey}
          columns={columns}
          fetchData={searchAccount}
          actions={renderActions}
          onCreate={handleAdd}
          pageSizeOptions={[10, 20, 50, 100]}
          showDateRangeFilter={false}
        />

        {/* <AccountForm
            account={selectedAccount}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          /> */}
      </div>
    </div>
  );
}
