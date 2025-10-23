import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
import HighchartsBar from "../../components/ui/highchart/HighchartsBar";
import HighchartsLine from "../../components/ui/highchart/HighchartsLine";
import {
  DollarSign,
  Download,
  Droplets,
  Palette,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { MainLayout } from "../../layouts";
import { useEffect, useState, useRef } from "react";
import { getDashboardData } from "../../services/dashboard_service";
import {
  formatNumber,
  formatCompactCurrency,
  formatDate,
} from "../../utils/helpers";
import useDateFilterStore from "../../stores/useDateFilterStore";

export default function OverviewNew() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // ✅ Gunakan useDateFilterStore seperti di Stock Movement
  const dateRange = useDateFilterStore((state) => state.dateRange);

  // ✅ Granularity state untuk Cost Trend
  const [costTrendGranularity, setCostTrendGranularity] = useState("monthly");

  // ✅ Gunakan ref untuk mencegah multiple fetch
  const isFetchingRef = useRef(false);
  const lastFetchParams = useRef(null);

  // ✅ Fetch data ketika dateRange berubah
  useEffect(() => {
    console.log("🔍 DateRange changed:", dateRange);

    // Pastikan dateRange valid
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      console.log("⚠️ DateRange not valid, skipping fetch");
      setLoading(false);
      return;
    }

    // Cek apakah params sama dengan fetch terakhir
    const currentParams = `${dateRange.dateFrom}-${dateRange.dateTo}-${costTrendGranularity}`;
    if (lastFetchParams.current === currentParams) {
      console.log("⏭️ Same params, skipping fetch");
      return;
    }

    // Cek apakah sedang fetching
    if (isFetchingRef.current) {
      console.log("⏳ Already fetching, skipping");
      return;
    }

    lastFetchParams.current = currentParams;
    fetchDashboardData();
  }, [dateRange?.dateFrom, dateRange?.dateTo, costTrendGranularity]);

  const fetchDashboardData = async () => {
    if (isFetchingRef.current) {
      console.log("⏳ Fetch already in progress");
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);

      const params = {
        start_date: dateRange?.dateFrom,
        end_date: dateRange?.dateTo,
        granularity: costTrendGranularity,
      };

      console.log("📡 Fetching dashboard data with params:", params);
      const response = await getDashboardData(params);
      console.log("✅ Dashboard data received:", response.data);

      setDashboardData(response.data);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
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
            <p className="mt-2 text-xs text-gray-500">
              Date: {dateRange?.dateFrom} to {dateRange?.dateTo}
            </p>
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
            <p className="mt-2 text-xs text-gray-500">
              DateRange: {JSON.stringify(dateRange)}
            </p>
            <button
              onClick={() => {
                lastFetchParams.current = null;
                fetchDashboardData();
              }}
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

        {/* ✅ Display active filter info - sama seperti Stock Movement */}
        {dateRange && (
          <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">📅 Active Filter:</span>{" "}
              {dateRange.mode === "ytd" && `YTD ${new Date().getFullYear()}`}
              {dateRange.mode === "year" && `Year ${dateRange.year}`}
              {dateRange.mode === "month-year" && (
                <>
                  {new Date(
                    dateRange.year,
                    dateRange.month - 1
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </>
              )}
              {(dateRange.mode === "days" || !dateRange.mode) && (
                <>
                  {formatDate(dateRange.dateFrom)} to{" "}
                  {formatDate(dateRange.dateTo)}
                  {dateRange.days !== undefined && (
                    <span className="ml-2 text-xs">
                      (
                      {dateRange.days === 0
                        ? "Today"
                        : `Last ${dateRange.days} days`}
                      )
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        )}

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
            <HighchartsBar
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
          <Card className="w-full h-full">
            <div className="flex items-center justify-between px-4 pt-4 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Trend Cost Produksi (Dye + Aux)
                </h3>
                <p className="text-xs text-gray-600">
                  Total biaya produksi per periode
                </p>
              </div>
            </div>
            <HighchartsLine
              initialData={cost_trend}
              title=""
              subtitle=""
              datasets={[
                {
                  key: "total_cost",
                  label: "Cost Produksi",
                  color: "primary",
                },
              ]}
              onFetchData={() => cost_trend}
              showSummary={true}
              yAxisLabel="Cost (Rp)"
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
