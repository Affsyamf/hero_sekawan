import { useTheme } from "../../contexts/ThemeContext";
import { useGlobalFilter } from "../../contexts/GlobalFilterContext"; // ✅ import global filter
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
import { getDashboardData } from "../../services/dashboard_service";
import {
  formatNumber,
  formatCompactCurrency,
  formatDate,
} from "../../utils/helpers";

export default function OverviewNew() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();
  const { dateRange } = useGlobalFilter(); // ✅ ambil global date range

  // ✅ Refetch data setiap kali filter global berubah
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchDashboardData();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        granularity: "monthly",
      };

      const response = await getDashboardData(params);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      // belum implementasi export
      alert("Export belum diimplementasi");
    } finally {
      setExporting(false);
    }
  };

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

  const totalCostProduksi = cost_trend.reduce((sum, d) => sum + d.value, 0);

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
              Overview Stock, Cost, dan Usage Produksi Kain Printing
            </p>

            {/* ✅ tampilkan tanggal aktif */}
            {dateRange.startDate && dateRange.endDate && (
              <p className="mt-1 text-xs text-blue-600">
                📅 Filtered: {formatDate(dateRange.startDate)} –{" "}
                {formatDate(dateRange.endDate)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
          {/* Stock Flow Chart */}
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
              onFetchData={() => stock_flow}
              showSummary={true}
            />
          </Card>

          {/* Cost Produksi Trend */}
          <Chart.Line
            data={cost_trend}
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

        {/* Product Usage */}
        {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            </div>
            <div className="space-y-5">
              {most_used_dye.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
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
                      value={item.value}
                      maxValue={item.maxValue}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

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
            </div>
            <div className="space-y-5">
              {most_used_aux.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
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
                      value={item.value}
                      maxValue={item.maxValue}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div> */}
        
      </div>
    </MainLayout>
  );
}
