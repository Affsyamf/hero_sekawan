import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
import {
  DollarSign,
  Download,
  Droplets,
  Palette,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { MainLayout } from "../../layouts";
import { useEffect, useState } from "react";
// import {
//   getDashboardData,
//   exportTransactions,
//   downloadCSVFile,
//   getFilenameFromHeaders,
// } from "../../services/dashboard_service";
import {
  formatNumber,
  formatCompactCurrency,
  capitalize,
} from "../../utils/helpers";

// ===== MOCK DATA GENERATOR =====
const generateMockData = (period) => {
  const getMonthCount = () => {
    if (period === "1 Bulan") return 4; // 4 weeks
    if (period === "3 Bulan") return 12; // 12 weeks
    return 24; // 6 months = 24 weeks
  };

  const monthCount = getMonthCount();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Generate months based on period
  const generateMonths = () => {
    const months = [];
    const currentMonth = 9; // October (0-indexed)
    for (let i = monthCount - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      months.push(`${monthNames[monthIndex]} 2025`);
    }
    return months;
  };

  const months = generateMonths();

  // Stock flow data
  const stock_flow = months.map((month, i) => ({
    month,
    stockMasuk: 12000 + Math.random() * 5000 + i * 200, // Trending up
    stockTerpakai: 10000 + Math.random() * 4000 + i * 150, // Trending up
  }));

  // Cost trend data
  const cost_trend = months.map((month, i) => ({
    month,
    value: 6500000 + Math.random() * 2500000 + i * 150000, // Trending up
  }));

  // Calculate metrics
  const totalPurchasing = stock_flow.reduce(
    (sum, d) => sum + d.stockMasuk * 15000,
    0
  );
  const totalStockTerpakai = stock_flow.reduce(
    (sum, d) => sum + d.stockTerpakai * 12000,
    0
  );
  const totalCostProduksi = cost_trend.reduce((sum, d) => sum + d.value, 0);
  const totalJobs = 35; // Mock job count
  const avgCostPerJob = totalCostProduksi / totalJobs;

  return {
    metrics: {
      total_purchasing: {
        value: totalPurchasing,
        trend: 15.3,
      },
      total_stock_terpakai: {
        value: totalStockTerpakai,
        trend: 12.8,
      },
      total_cost_produksi: {
        value: totalCostProduksi,
        trend: 18.5,
      },
      avg_cost_per_job: {
        value: avgCostPerJob,
        trend: -5.2,
      },
    },
    stock_flow,
    cost_trend,
    most_used_dye: [
      { label: "Reactive Blue 19", value: 1250.5, maxValue: 1500 },
      { label: "Reactive Red 195", value: 1100.3, maxValue: 1500 },
      { label: "Reactive Yellow 145", value: 980.7, maxValue: 1500 },
      { label: "Reactive Black 5", value: 850.2, maxValue: 1500 },
      { label: "Reactive Orange 16", value: 720.8, maxValue: 1500 },
    ],
    most_used_aux: [
      { label: "Sodium Alginate", value: 2150.3, maxValue: 2500 },
      { label: "Urea", value: 1980.5, maxValue: 2500 },
      { label: "Soda Ash", value: 1750.8, maxValue: 2500 },
      { label: "Acetic Acid", value: 1520.2, maxValue: 2500 },
      { label: "Water Glass", value: 1280.6, maxValue: 2500 },
    ],
  };
};

export default function OverviewOld() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1 Bulan");
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // Fetch dashboard data - USING MOCK DATA
  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // TODO: Replace with real API call
      // const response = await getDashboardData(period);
      // setDashboardData(response.data.data);

      // Using mock data for now
      const mockData = generateMockData(period);
      setDashboardData(mockData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Export function - MOCK
  const handleExport = async () => {
    try {
      setExporting(true);
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Replace with real API call
      // const response = await exportTransactions();
      // const filename = getFilenameFromHeaders(response.headers);
      // downloadCSVFile(response.data, filename);

      console.log("Export successful!");
      alert("Export berhasil! (Mock data)");
    } catch (error) {
      console.error("Error exporting data:", error);
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

  const { metrics, cost_trend, stock_flow, most_used_dye, most_used_aux } =
    dashboardData;

  // Calculate total cost for trend chart
  const totalCostProduksi = cost_trend.reduce((sum, d) => sum + d.value, 0);

  return (
    <MainLayout>
      <div className="max-w-full space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                Dashboard Produksi
              </h1>
              <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-md">
                MOCK DATA
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Overview Stock, Cost, dan Usage Produksi Kain Printing
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
              label={exporting ? "Exporting..." : "Export Data"}
              variant="primary"
              onClick={handleExport}
              disabled={exporting}
            />
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Chart.Metric
            title="Total Purchasing"
            value={formatCompactCurrency(metrics.total_purchasing.value)}
            trend={formatTrend(metrics.total_purchasing.trend)}
            icon={ShoppingCart}
          />

          <Chart.Metric
            title="Total Stock Terpakai"
            value={formatCompactCurrency(metrics.total_stock_terpakai.value)}
            trend={formatTrend(metrics.total_stock_terpakai.trend)}
            icon={TrendingDown}
          />

          <Chart.Metric
            title="Total Cost Produksi"
            value={formatCompactCurrency(metrics.total_cost_produksi.value)}
            trend={formatTrend(metrics.total_cost_produksi.trend)}
            icon={DollarSign}
          />

          <Chart.Metric
            title="Avg Cost per Job"
            value={formatCompactCurrency(metrics.avg_cost_per_job.value)}
            trend={formatTrend(metrics.avg_cost_per_job.trend)}
            icon={Palette}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Stock Flow Chart - Stock Masuk vs Terpakai */}
          <Card className="w-full h-full">
            <Chart.Bar
              initialData={stock_flow}
              title="Trend Stock Masuk vs Terpakai"
              subtitle="Perbandingan purchasing dan usage di Color Kitchen"
              datasets={[
                {
                  key: "stockMasuk",
                  label: "Stock Masuk (Purchasing)",
                  color: "success",
                },
                {
                  key: "stockTerpakai",
                  label: "Stock Terpakai (CK Usage)",
                  color: "primary",
                },
              ]}
              periods={["6 Bulan", "3 Bulan", "1 Bulan"]}
              onFetchData={() => stock_flow}
              showSummary={true}
            />
          </Card>

          {/* Cost Produksi Trend */}
          <Chart.Line
            data={cost_trend.map((d) => d.value)}
            value={formatCompactCurrency(totalCostProduksi)}
            trend={
              cost_trend.length > 1
                ? (
                    ((cost_trend[cost_trend.length - 1].value -
                      cost_trend[0].value) /
                      cost_trend[0].value) *
                    100
                  ).toFixed(1)
                : 0
            }
            title="Trend Cost Produksi (Dye + Aux)"
          />
        </div>

        {/* Product Usage Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Most Used Dye */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Most Used Dye (Dyestuff)
                  </h3>
                  <p className="text-xs text-gray-600">
                    Top 5 pewarna paling banyak digunakan
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Usage</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatNumber(
                    most_used_dye.reduce((sum, item) => sum + item.value, 0)
                  )}{" "}
                  kg
                </p>
              </div>
            </div>
            <div className="space-y-5">
              {most_used_dye.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                    <span className="text-sm font-bold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formatNumber(item.value)} kg
                      </span>
                    </div>
                    <Chart.Progress
                      label=""
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

          {/* Most Used Auxiliary */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Most Used Auxiliary (AUX)
                  </h3>
                  <p className="text-xs text-gray-600">
                    Top 5 bahan auxiliary paling banyak digunakan
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Usage</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatNumber(
                    most_used_aux.reduce((sum, item) => sum + item.value, 0)
                  )}{" "}
                  kg
                </p>
              </div>
            </div>
            <div className="space-y-5">
              {most_used_aux.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50">
                    <span className="text-sm font-bold text-purple-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formatNumber(item.value)} kg
                      </span>
                    </div>
                    <Chart.Progress
                      label=""
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
        </div>

        {/* Info Section */}
        <Card className="border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="mb-2 font-semibold text-blue-900">
                Penjelasan Metrics Dashboard
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="font-semibold">📦 Total Purchasing</p>
                    <p className="text-xs">
                      Total nilai pembelian bahan baku (Product) dari supplier
                      ke gudang
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📤 Total Stock Terpakai</p>
                    <p className="text-xs">
                      Total nilai stock yang dipindahkan dari gudang ke kitchen
                      (Stock Movement)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">💰 Total Cost Produksi</p>
                    <p className="text-xs">
                      Total biaya produksi aktual (Dye + Auxiliary) di proses
                      Color Kitchen
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📊 Avg Cost per Job</p>
                    <p className="text-xs">
                      Rata-rata biaya per Order Produksi Jadi (OPJ/CK Entry)
                    </p>
                  </div>
                </div>
                <div className="pt-2 mt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Catatan:</strong> Data saat ini menggunakan MOCK
                    DATA untuk development. Integrasi dengan backend API akan
                    dilakukan pada tahap berikutnya.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
