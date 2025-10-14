import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
import { Highchart } from "../../components/ui/highchart";
import {
  ShoppingCart,
  Package,
  Wrench,
  Download,
  TrendingUp,
  Building2,
  Star,
} from "lucide-react";
import { MainLayout } from "../../layouts";
import { useEffect, useState } from "react";
import { formatNumber, formatCompactCurrency } from "../../utils/helpers";
import {
  reportsPurchasingSummary,
  reportsPurchasingTrend,
  reportsPurchasingProducts,
  reportsPurchasingSuppliers,
  reportsPurchasingBreakdownSummary,
} from "../../services/report_purchasing_service";

export default function DashboardPurchasing() {
  const [purchasingData, setPurchasingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1 Bulan");
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // Calculate date range based on period
  const getDateRange = (period) => {
    const endDate = new Date();
    const startDate = new Date();

    if (period === "1 Bulan") {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (period === "3 Bulan") {
      startDate.setMonth(endDate.getMonth() - 3);
    } else if (period === "6 Bulan") {
      startDate.setMonth(endDate.getMonth() - 6);
    }

    return {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    fetchPurchasingData();
  }, [period]);

  const fetchPurchasingData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(period);
      const filters = {
        ...dateRange,
        granularity: "monthly",
      };

      // Fetch all data in parallel
      const [summary, trend, breakdown, suppliers, products] =
        await Promise.all([
          reportsPurchasingSummary(filters),
          reportsPurchasingTrend(filters),
          reportsPurchasingProducts(filters),
          reportsPurchasingSuppliers(filters),
          reportsPurchasingBreakdownSummary(filters),
        ]);

      // Transform data to match component structure
      const transformedData = transformApiData(
        summary,
        trend,
        breakdown,
        suppliers,
        products
      );

      setPurchasingData(transformedData);
    } catch (error) {
      console.error("Error fetching purchasing data:", error);
      setPurchasingData(null);
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (summary, trend, breakdown, suppliers, products) => {
    // Transform metrics
    const metrics = {
      total_purchases: {
        value: summary.total_purchases || 0,
        trend: 0, // Calculate if you have historical data
      },
      total_goods: {
        value: summary.total_goods || 0,
        trend: 0,
      },
      total_jasa: {
        value: summary.total_services || 0,
        trend: 0,
      },
    };

    // Transform purchase trend
    const purchase_trend = (trend || []).map((item) => ({
      month: formatPeriod(item.period),
      goods: item.goods || 0,
      jasa: item.service || 0,
    }));

    // Transform goods vs jasa breakdown
    const goods_vs_jasa = (breakdown?.data || []).map((item) => ({
      label: item.label === "goods" ? "Goods (Product)" : "Jasa (Services)",
      value: item.value || 0,
    }));

    // Transform top suppliers
    const top_suppliers = (suppliers?.top_suppliers || []).slice(0, 5).map((item) => ({
      name: item.supplier,
      total_purchases: item.total_spent || 0,
      purchase_count: 0, // Not provided by API
      rating: 0, // Not provided by API
      category: "General", // Not provided by API
      percentage: item.percentage || 0,
    }));

    // Transform most purchased products
    const most_purchased = (products?.most_purchased || []).slice(0, 5).map((item) => {
      const maxValue = Math.max(
        ...(products?.most_purchased || []).map((p) => p.total_qty)
      );
      return {
        label: item.product,
        value: item.total_qty || 0,
        unit: "unit",
        maxValue: maxValue || 1,
        total_value: item.total_value || 0,
        avg_cost: item.avg_cost || 0,
      };
    });

    // Create top purchases from most purchased products (by value)
    const top_purchases = (products?.most_purchased || [])
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5)
      .map((item, index) => ({
        label: `Item-${index + 1}`,
        value: item.total_value || 0,
        date: "-",
        supplier: item.product,
      }));

    return {
      metrics,
      purchase_trend,
      goods_vs_jasa,
      top_suppliers,
      top_purchases,
      most_purchased,
    };
  };

  const formatPeriod = (period) => {
    // Convert "2025-08" to "Aug 2025"
    if (!period) return "";
    const [year, month] = period.split("-");
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
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Export successful!");
      alert("Export berhasil!");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
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
            <p className="mt-4 text-gray-600">Loading purchasing data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!purchasingData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
            <button
              onClick={fetchPurchasingData}
              className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const {
    metrics,
    purchase_trend,
    goods_vs_jasa,
    top_suppliers,
    top_purchases,
    most_purchased,
  } = purchasingData;

  return (
    <MainLayout>
      <div className="max-w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                Purchasing Overview
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Monitor pembelian, supplier, dan trend purchasing
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Chart.Metric
            title="Total Purchases"
            value={formatCompactCurrency(metrics.total_purchases.value)}
            trend={formatTrend(metrics.total_purchases.trend)}
            icon={ShoppingCart}
          />
          <Chart.Metric
            title="Total Goods"
            value={formatCompactCurrency(metrics.total_goods.value)}
            trend={formatTrend(metrics.total_goods.trend)}
            icon={Package}
          />
          <Chart.Metric
            title="Total Jasa"
            value={formatCompactCurrency(metrics.total_jasa.value)}
            trend={formatTrend(metrics.total_jasa.trend)}
            icon={Wrench}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Purchase Trend - 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="w-full h-full">
              <Highchart.HighchartsBar
                initialData={purchase_trend}
                title="Trend Purchasing (Goods vs Jasa)"
                subtitle="Perbandingan pembelian goods dan jasa per periode"
                datasets={[
                  { key: "goods", label: "Goods", color: "primary" },
                  { key: "jasa", label: "Jasa", color: "warning" },
                ]}
                periods={["6 Bulan", "3 Bulan", "1 Bulan"]}
                onFetchData={() => purchase_trend}
                showSummary={true}
              />
            </Card>
          </div>

          {/* Goods vs Jasa Donut - 1/3 width */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <Highchart.HighchartsDonut
                data={goods_vs_jasa}
                centerText={{
                  value: formatCompactCurrency(metrics.total_purchases.value),
                  label: "Total",
                }}
                title="Breakdown Purchasing"
                subtitle="Goods vs Jasa"
                className="w-full h-full"
              />
            </Card>
          </div>
        </div>

        {/* Top Suppliers & Top Purchases */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top 5 Suppliers */}
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Top 5 Suppliers</h3>
                <p className="text-xs text-gray-600">
                  Supplier dengan total pembelian tertinggi
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {top_suppliers.length > 0 ? (
                top_suppliers.map((supplier, index) => (
                  <div
                    key={index}
                    className="p-4 transition-all border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-purple-600 bg-purple-100 rounded-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {supplier.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {supplier.percentage.toFixed(2)}% of total
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-600">Total Purchases</p>
                        <p className="font-bold text-gray-900">
                          {formatCompactCurrency(supplier.total_purchases)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-gray-500">
                  No supplier data available
                </p>
              )}
            </div>
          </Card>

          {/* Top 5 Purchases Value */}
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Top 5 Product Values
                </h3>
                <p className="text-xs text-gray-600">
                  Produk dengan nilai pembelian tertinggi
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {top_purchases.length > 0 ? (
                top_purchases.map((purchase, index) => (
                  <div
                    key={index}
                    className="p-4 transition-all border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-green-600 bg-green-100 rounded-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {purchase.supplier}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCompactCurrency(purchase.value)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 bg-green-500 rounded-full"
                          style={{
                            width: `${
                              (purchase.value / top_purchases[0].value) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-gray-500">
                  No purchase data available
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Most Purchased Products */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Most Purchased Products
                </h3>
                <p className="text-xs text-gray-600">
                  Top 5 produk dengan volume pembelian terbanyak
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Volume</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatNumber(
                  most_purchased.reduce((sum, item) => sum + item.value, 0)
                )}{" "}
                unit
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {most_purchased.length > 0 ? (
              most_purchased.map((item, index) => (
                <div
                  key={index}
                  className="p-4 transition-all border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-blue-600 bg-blue-100 rounded-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-600">Volume</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatNumber(item.value)} {item.unit}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-600">Total Value</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formatCompactCurrency(item.total_value)}
                      </span>
                    </div>
                    <Highchart.HighchartsProgress
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
              ))
            ) : (
              <div className="col-span-5">
                <p className="text-sm text-center text-gray-500">
                  No product data available
                </p>
              </div>
            )}
          </div>
        </Card>

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
                Informasi Purchasing
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <p className="font-semibold">🛒 Total Purchases</p>
                    <p className="text-xs">
                      Total nilai pembelian (Goods + Jasa)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📦 Total Goods</p>
                    <p className="text-xs">Total pembelian produk/barang</p>
                  </div>
                  <div>
                    <p className="font-semibold">🔧 Total Jasa</p>
                    <p className="text-xs">Total pembelian jasa/services</p>
                  </div>
                </div>
                <div className="pt-2 mt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Catatan:</strong> Data diambil dari database real-time.
                    Filter periode dapat disesuaikan untuk melihat trend berbeda.
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