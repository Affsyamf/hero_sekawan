import { useState } from "react";
import { Download, FileText, Package } from "lucide-react";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import { useTheme } from "../../contexts/ThemeContext";
import Table from "../../components/ui/table/Table";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";

export default function PurchasingReport() {
  const { colors } = useTheme();
  const [summary, setSummary] = useState({
    totalPurchases: 0,
    totalItems: 0,
    totalValue: 0,
    totalSuppliers: 0,
  });

  const columns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString("id-ID"),
    },
    {
      key: "code",
      label: "No Bukti",
      sortable: true,
      render: (value) => (
        <span className="font-medium" style={{ color: colors.text.primary }}>
          {value}
        </span>
      ),
    },
    {
      key: "purchase_order",
      label: "No PO",
      sortable: true,
      render: (value) => (
        <span className="font-medium" style={{ color: colors.text.primary }}>
          {value}
        </span>
      ),
    },
    {
      key: "supplier_name",
      label: "Supplier",
      sortable: true,
    },
    {
      key: "product_name",
      label: "Product",
      sortable: true,
    },
    {
      key: "quantity",
      label: "Qty",
      sortable: true,
      render: (val, row) => `${parseFloat(val).toLocaleString("id-ID")} ${row.unit || ""}`,
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (val) => `Rp ${parseFloat(val).toLocaleString("id-ID")}`,
    },
    {
      key: "discount",
      label: "Discount",
      sortable: true,
      render: (val) => `Rp ${parseFloat(val).toLocaleString("id-ID")}`,
    },
    {
      key: "ppn",
      label: "PPN",
      sortable: true,
      render: (val) => `Rp ${parseFloat(val).toLocaleString("id-ID")}`,
    },
    {
      key: "dpp",
      label: "DPP",
      sortable: true,
      render: (val) => `Rp ${parseFloat(val).toLocaleString("id-ID")}`,
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (val, row) => {
        const total = (parseFloat(row.quantity) * parseFloat(row.price)) - parseFloat(row.discount) + parseFloat(row.ppn);
        return (
          <span className="font-semibold" style={{ color: colors.primary }}>
            Rp {total.toLocaleString("id-ID")}
          </span>
        );
      },
    },
  ];

  const fetchData = async (params) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/reports/purchasing?${new URLSearchParams(params)}`);
      // const data = await response.json();
      
      const { page, pageSize, search, sortBy, sortDir, dateRange } = params;

      // Simulate API response
      let mockRows = [
        {
          id: 1,
          date: "2024-10-01",
          code: "PB-2024-001",
          purchase_order: "PO-2024-001",
          supplier_name: "PT Supplier A",
          product_name: "Dye Reactive Red",
          quantity: "100",
          unit: "kg",
          price: "50000",
          discount: "0",
          ppn: "550000",
          pph: "0",
          dpp: "5000000",
          tax_no: "FP-001",
        },
        {
          id: 2,
          date: "2024-10-05",
          code: "PB-2024-002",
          purchase_order: "PO-2024-002",
          supplier_name: "PT Supplier B",
          product_name: "Auxiliary Chemical A",
          quantity: "50",
          unit: "liter",
          price: "30000",
          discount: "50000",
          ppn: "165000",
          pph: "0",
          dpp: "1500000",
          tax_no: "FP-002",
        },
        {
          id: 3,
          date: "2024-10-10",
          code: "PB-2024-003",
          purchase_order: "PO-2024-003",
          supplier_name: "PT Supplier A",
          product_name: "Dye Reactive Blue",
          quantity: "75",
          unit: "kg",
          price: "52000",
          discount: "0",
          ppn: "429000",
          pph: "0",
          dpp: "3900000",
          tax_no: "FP-003",
        },
        {
          id: 4,
          date: "2024-10-10",
          code: "PB-2024-004",
          purchase_order: "PO-2024-004",
          supplier_name: "PT Supplier D",
          product_name: "Dye Reactive Blue",
          quantity: "75",
          unit: "kg",
          price: "52000",
          discount: "0",
          ppn: "429000",
          pph: "0",
          dpp: "3900000",
          tax_no: "FP-003",
        },
        {
          id: 5,
          date: "2024-10-10",
          code: "PB-2024-005",
          purchase_order: "PO-2024-005",
          supplier_name: "PT Supplier E",
          product_name: "Dye Reactive Blue",
          quantity: "75",
          unit: "kg",
          price: "52000",
          discount: "0",
          ppn: "429000",
          pph: "0",
          dpp: "3900000",
          tax_no: "FP-003",
        },
        {
          id: 6,
          date: "2024-10-10",
          code: "PB-2024-006",
          purchase_order: "PO-2024-006",
          supplier_name: "PT Supplier C",
          product_name: "Dye Reactive Blue",
          quantity: "75",
          unit: "kg",
          price: "52000",
          discount: "0",
          ppn: "429000",
          pph: "0",
          dpp: "3900000",
          tax_no: "FP-003",
        },
      ];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        mockRows = mockRows.filter(
          (row) =>
            row.code?.toLowerCase().includes(searchLower) ||
            row.purchase_order?.toLowerCase().includes(searchLower) ||
            row.supplier_name?.toLowerCase().includes(searchLower) ||
            row.product_name?.toLowerCase().includes(searchLower)
        );
      }

      // Apply date range filter
      if (dateRange?.start && dateRange?.end) {
        mockRows = mockRows.filter((row) => {
          const rowDate = new Date(row.date);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return rowDate >= startDate && rowDate <= endDate;
        });
      }

      // Apply sorting
      if (sortBy) {
        mockRows.sort((a, b) => {
          let aVal = a[sortBy] || "";
          let bVal = b[sortBy] || "";
          
          if (sortBy === "date") {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          }

          if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
          if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }

      const total = mockRows.length;
      const start = (page - 1) * pageSize;
      const rows = mockRows.slice(start, start + pageSize);

      // Calculate summary
      const summaryData = {
        totalPurchases: mockRows.length,
        totalItems: mockRows.reduce((sum, row) => sum + parseFloat(row.quantity), 0),
        totalValue: mockRows.reduce((sum, row) => {
          const total = (parseFloat(row.quantity) * parseFloat(row.price)) - parseFloat(row.discount) + parseFloat(row.ppn);
          return sum + total;
        }, 0),
        totalSuppliers: new Set(mockRows.map(row => row.supplier_name)).size,
      };

      setSummary(summaryData);

      return { rows, total };
    } catch (error) {
      console.error("Error fetching purchasing report:", error);
      return { rows: [], total: 0 };
    }
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert("Export to Excel - Will be implemented with actual API");
  };

  return (
    <MainLayout>
      <div className="min-h-screen" style={{ background: colors.background.primary }}>
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="mb-1 text-2xl font-bold" style={{ color: colors.text.primary }}>
                Purchasing Report
              </h1>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Laporan pembelian bahan baku dan material
              </p>
            </div>
            <Button 
              icon={Download} 
              label="Export Excel" 
              onClick={handleExportExcel}
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Total Purchases
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: colors.text.primary }}>
                    {summary.totalPurchases}
                  </p>
                </div>
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ background: colors.primary + "20" }}
                >
                  <FileText size={24} style={{ color: colors.primary }} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Total Items
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: colors.text.primary }}>
                    {summary.totalItems.toLocaleString("id-ID")}
                  </p>
                </div>
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ background: "#10b981" + "20" }}
                >
                  <Package size={24} style={{ color: "#10b981" }} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Total Value
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: colors.text.primary }}>
                    Rp {summary.totalValue.toLocaleString("id-ID")}
                  </p>
                </div>
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ background: "#f59e0b" + "20" }}
                >
                  <FileText size={24} style={{ color: "#f59e0b" }} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Total Suppliers
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: colors.text.primary }}>
                    {summary.totalSuppliers}
                  </p>
                </div>
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ background: "#8b5cf6" + "20" }}
                >
                  <FileText size={24} style={{ color: "#8b5cf6" }} />
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            fetchData={fetchData}
            dateFilterKey="date"
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </MainLayout>
  );
}