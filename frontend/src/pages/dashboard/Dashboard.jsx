import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Table from "../../components/ui/table/Table";
import Chart from "../../components/ui/chart/Chart";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Download,
  Droplets,
} from "lucide-react";
import { MainLayout } from "../../layouts";
import { useEffect, useState } from "react";
import {
  getDashboardData,
  getTransactions,
  exportTransactions,
  downloadCSVFile,
  getFilenameFromHeaders,
} from "../../services/dashboard_service";
import {
  formatNumber,
  formatCompactCurrency,
  formatDateTime,
  capitalize,
} from "../../utils/helpers";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1 Bulan");
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData(period);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Optional: Add toast notification
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions for table
  const fetchTransactions = async (params) => {
    try {
      const response = await getTransactions({
        page: params.page || 1,
        page_size: params.pageSize || 10,
        ...params.filters,
      });

      return {
        data: response.data.data,
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.page_size,
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };
    }
  };

  // Export function - using backend CSV export
  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportTransactions();

      // Get filename from headers
      const filename = getFilenameFromHeaders(response.headers);

      // Download file
      downloadCSVFile(response.data, filename);

      // Optional: Show success notification
      console.log("Export successful!");
    } catch (error) {
      console.error("Error exporting data:", error);
      // Optional: Show error notification
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Format trend value with sign
  const formatTrend = (trend) => {
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend}%`;
  };

  // Transaction columns definition
  const transactionColumns = [
    {
      key: "date",
      label: "Tanggal",
      sortable: true,
      render: (value) => formatDateTime(value),
    },
    {
      key: "type",
      label: "Tipe",
      render: (value) => {
        const typeColors = {
          Purchasing: "bg-green-100 text-green-800",
          "Stock Movement": "bg-blue-100 text-blue-800",
          "Color Kitchen": "bg-purple-100 text-purple-800",
          "Stock Opname": "bg-orange-100 text-orange-800",
        };
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              typeColors[value] || "bg-gray-100 text-gray-800"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "ref",
      label: "Referensi",
      sortable: true,
    },
    {
      key: "product",
      label: "Product",
      sortable: true,
    },
    {
      key: "qty",
      label: "Qty (kg)",
      sortable: true,
      render: (value) => (
        <span
          className={`font-medium ${
            value > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {value > 0 ? "+" : ""}
          {formatNumber(value)}
        </span>
      ),
    },
    {
      key: "location",
      label: "Lokasi",
      sortable: true,
      render: (value) => capitalize(value),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { metrics, stock_flow, stock_location, top_products, design_cost } =
    dashboardData;

  // Calculate total stock for donut center
  const totalStock = stock_location.reduce((sum, item) => sum + item.value, 0);

  // Calculate design cost trend (using orders count)
  const designCostTrend = design_cost.map((d) => d.orders);

  // Calculate total cost for trend chart
  const totalDesignCost = design_cost.reduce((sum, d) => sum + d.cost, 0);

  return (
    <MainLayout>
      <div className="max-w-full space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard Produksi
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitoring Stock & Cost Produksi Kain Printing
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>1 Bulan</option>
              <option>3 Bulan</option>
              <option>6 Bulan</option>
            </select>
            <Button
              icon={Download}
              label={exporting ? "Exporting..." : "Export"}
              variant="primary"
              onClick={handleExport}
              disabled={exporting}
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Chart.Metric
            title="Total Stock Masuk (Bulan Ini)"
            value={`${formatNumber(metrics.stock_masuk.value)} kg`}
            trend={formatTrend(metrics.stock_masuk.trend)}
            icon={TrendingUp}
          />

          <Chart.Metric
            title="Total Stock Keluar (Bulan Ini)"
            value={`${formatNumber(metrics.stock_keluar.value)} kg`}
            trend={formatTrend(metrics.stock_keluar.trend)}
            icon={TrendingDown}
          />

          <Chart.Metric
            title="Total Cost Produksi"
            value={formatCompactCurrency(metrics.cost_produksi.value)}
            trend={formatTrend(metrics.cost_produksi.trend)}
            icon={DollarSign}
          />

          <Chart.Metric
            title="Selisih Stock Opname"
            value={`${formatNumber(metrics.selisih_opname.value)} kg`}
            trend={formatTrend(metrics.selisih_opname.trend)}
            icon={AlertTriangle}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
          {/* Stock Flow Chart */}
          <div className="lg:col-span-8">
            <Card className="w-full h-full">
              <Chart.Bar
                initialData={stock_flow}
                title="Pergerakan Stock (Masuk vs Keluar)"
                subtitle="Monitoring alur stock purchasing hingga usage"
                datasets={[
                  { key: "stockMasuk", label: "Stock Masuk", color: "success" },
                  {
                    key: "stockKeluar",
                    label: "Stock Keluar",
                    color: "primary",
                  },
                ]}
                periods={["6 Bulan", "3 Bulan", "1 Bulan"]}
                onFetchData={() => stock_flow}
                showSummary={true}
              />
            </Card>
          </div>

          {/* Stock Location Donut */}
          <div className="lg:col-span-4">
            <Chart.Donut
              data={stock_location}
              centerText={{
                value: totalStock.toFixed(0),
                label: "Total %",
              }}
              title="Stock Per Lokasi"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Second Row - Products & Designs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Products by Usage */}
          <Card>
            <h3 className="mb-6 font-semibold text-gray-900">
              Product Paling Cepat Habis
            </h3>
            <div className="space-y-6">
              {top_products.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg">
                    <span className="text-sm font-bold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Chart.Progress
                      label={item.label}
                      value={item.value}
                      maxValue={item.maxValue}
                      color={
                        index === 0
                          ? "error"
                          : index === 1
                          ? "primary"
                          : index === 2
                          ? "warning"
                          : index === 3
                          ? "success"
                          : "info"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Design Production Cost */}
          <Card>
            <h3 className="mb-6 font-semibold text-gray-900">
              Cost Produksi Per Design
            </h3>
            <div className="space-y-3">
              {design_cost.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                      <Droplets className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.design}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatNumber(item.orders)} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCompactCurrency(item.cost)}
                    </p>
                    <p className="text-xs text-gray-600">
                      @
                      {item.orders > 0
                        ? formatCompactCurrency(item.cost / item.orders)
                        : "Rp 0"}
                      /order
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Row - Trend Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Design Cost Trend */}
          <Chart.Line
            data={designCostTrend}
            value={formatCompactCurrency(totalDesignCost)}
            trend={design_cost.length > 1 ? 12.5 : 0}
            title="Trend Cost Produksi"
          />

          {/* Stock Movement by Location */}
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 md:text-base">
              Distribusi Stock Berdasarkan Lokasi
            </h3>
            <div className="space-y-3">
              {stock_location.map((item, idx) => {
                const progressColors = [
                  "#3b82f6",
                  "#8b5cf6",
                  "#10b981",
                  "#f59e0b",
                  "#ef4444",
                ];
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-700 md:text-sm">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-600">
                        {item.value}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full">
                      <div
                        className="h-2.5 transition-all duration-500 rounded-full"
                        style={{
                          width: `${item.value}%`,
                          backgroundColor:
                            progressColors[idx % progressColors.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Transaksi Terakhir
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                History pergerakan stock dari semua proses
              </p>
            </div>
          </div>
          <Table
            columns={transactionColumns}
            fetchData={fetchTransactions}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </Card>
      </div>
    </MainLayout>
  );
}