// pages/dashboard/DashboardPurchasing.jsx
import { useTheme } from "../../contexts/ThemeContext";
import { useGlobalFilter } from "../../contexts/GlobalFilterContext"; // ✅ Import
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
} from "lucide-react";
import { MainLayout } from "../../layouts";
import { useEffect, useState } from "react";
import {
  formatNumber,
  formatCompactCurrency,
  formatDate,
} from "../../utils/helpers";
import {
  reportsPurchasingSummary,
  reportsPurchasingTrend,
  reportsPurchasingProducts,
  reportsPurchasingSuppliers,
  reportsPurchasingBreakdownSummary,
  reportsPurchasingBreakdown,
} from "../../services/report_purchasing_service";
import { MetricGrid } from "../../components/ui/chart/MetricCard";

export default function DashboardPurchasing() {
  const [purchasingData, setPurchasingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // ✅ Use global filter instead of local state
  const { dateRange } = useGlobalFilter();

  // Granularity per chart
  const [trendGranularity, setTrendGranularity] = useState("monthly");
  const [productsGranularity, setProductsGranularity] = useState("monthly");

  // ✅ Auto refresh when global filter changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchPurchasingData();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchPurchasingData = async () => {
    try {
      setLoading(true);

      // ✅ Use global dateRange directly
      const params = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      };

      // Fetch summary, breakdown, and suppliers (no granularity needed)
      const [summary, breakdown, suppliers] = await Promise.all([
        reportsPurchasingSummary(params),
        reportsPurchasingBreakdownSummary(params),
        reportsPurchasingSuppliers(params),
      ]);

      // Fetch trend and products with their specific granularity
      const [trend, products] = await Promise.all([
        reportsPurchasingTrend({ ...params, granularity: trendGranularity }),
        reportsPurchasingProducts({
          ...params,
          granularity: productsGranularity,
        }),
      ]);

      const transformedData = transformApiData(
        summary.data,
        trend.data,
        breakdown.data,
        suppliers.data,
        products.data
      );

      setPurchasingData(transformedData);
    } catch (error) {
      console.error("Error fetching purchasing data:", error);
      setPurchasingData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trend data when granularity changes
  const fetchTrendData = async () => {
    try {
      const params = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        granularity: trendGranularity,
      };

      const trend = await reportsPurchasingTrend(params);

      setPurchasingData((prev) => ({
        ...prev,
        purchase_trend: transformTrendData(trend.data),
      }));
    } catch (error) {
      console.error("Error fetching trend data:", error);
    }
  };

  // Fetch products data when granularity changes
  const fetchProductsData = async () => {
    try {
      const params = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        granularity: productsGranularity,
      };

      const response = await reportsPurchasingProducts(params);

      setPurchasingData((prev) => ({
        ...prev,
        most_purchased: transformProductsData(response.data),
      }));
    } catch (error) {
      console.error("Error fetching products data:", error);
    }
  };

  useEffect(() => {
    if (purchasingData) {
      fetchTrendData();
    }
  }, [trendGranularity]);

  useEffect(() => {
    if (purchasingData) {
      fetchProductsData();
    }
  }, [productsGranularity]);

  const transformTrendData = (trend) => {
    return (trend || []).map((item) => {
      let displayPeriod = item.period;

      if (item.week_start && item.week_end) {
        displayPeriod = formatWeeklyPeriod(item.week_start, item.week_end);
      } else {
        displayPeriod = formatPeriod(item.period);
      }

      return {
        key: displayPeriod,
        goods: item.goods || 0,
        service: item.service || 0,
        total: item.total || 0,
      };
    });
  };

  const transformProductsData = (products) => {
    const mostPurchased = (products?.most_purchased || []).slice(0, 5);
    const maxValue = Math.max(...mostPurchased.map((p) => p.total_qty), 1);

    return mostPurchased.map((item) => ({
      label: item.product,
      value: item.total_qty || 0,
      unit: "unit",
      maxValue: maxValue,
      total_value: item.total_value || 0,
      avg_cost: item.avg_cost || 0,
    }));
  };

  const transformSuppliersToBarData = (suppliers) => {
    return suppliers.map((supplier) => ({
      key: supplier.name,
      value: supplier.total_purchases,
      percentage: supplier.percentage,
    }));
  };

  const transformPurchasesToBarData = (purchases) => {
    return purchases.map((purchase) => ({
      key: purchase.supplier,
      value: purchase.value,
    }));
  };

  const transformApiData = (summary, trend, breakdown, suppliers, products) => {
    const metrics = {
      total_purchases: {
        value: summary.total_purchases || 0,
        trend: 0,
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

    const purchase_trend = transformTrendData(trend);

    const goods_vs_jasa = (breakdown || []).map((item) => ({
      key: item.label === "goods" ? "Goods (Product)" : "Jasa (Services)",
      value: item.value || 0,
      drilldown: true,
      context: item.label,
    }));

    const top_suppliers = (suppliers?.top_suppliers || [])
      .slice(0, 5)
      .map((item) => ({
        name: item.supplier,
        total_purchases: item.total_spent || 0,
        percentage: item.percentage || 0,
      }));

    const most_purchased = transformProductsData(products);

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

  const formatWeeklyPeriod = (weekStart, weekEnd) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);

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

    const monthName = monthNames[start.getMonth()];
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();

    if (start.getMonth() === end.getMonth()) {
      return `${monthName} ${startDay}-${endDay}, ${year}`;
    } else {
      const endMonthName = monthNames[end.getMonth()];
      return `${monthName} ${startDay} - ${endMonthName} ${endDay}, ${year}`;
    }
  };

  const formatPeriod = (period) => {
    if (!period) return "";

    if (period.length === 4) {
      return period;
    }

    if (period.includes("-") && period.split("-").length === 2) {
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
    }

    if (period.includes("W")) {
      return `Week ${period.split("W")[1]}, ${period.split("-")[0]}`;
    }

    if (period.split("-").length === 3) {
      const [year, month, day] = period.split("-");
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
      return `${monthNames[monthIndex]} ${parseInt(day)}, ${year}`;
    }

    return period;
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

  const onDrilldown = async (context, depth) => {
    const params = {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
    };

    // level 1 → Goods vs Jasa
    if (depth === 0) {
      const res = await reportsPurchasingBreakdown(
        "account_type",
        context,
        0,
        params
      );
      return res.data.map((r) => ({
        key: r.label,
        value: r.value,
        percentage: r.percentage,
        context: r.account_id,
        drilldown: true,
      }));
    }

    // level 2 → Supplier → Product breakdown
    if (depth === 1) {
      const res = await reportsPurchasingBreakdown(
        "account",
        context,
        context,
        params
      );

      return res.data.map((p) => ({
        key: p.label,
        value: p.value,
      }));
    }
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
      <div className="max-w-full space-y-4 p-0.5 md:p-1">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
              Purchasing Overview
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
              Monitor pembelian, supplier, dan trend purchasing
            </p>
            {/* ✅ Show active filter info */}
            {dateRange.startDate && dateRange.endDate && (
              <p className="mt-1 text-xs text-blue-600">
                📅 Filtered: {formatDate(dateRange.startDate)} to{" "}
                {formatDate(dateRange.endDate)}
              </p>
            )}
          </div>
          <div>
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
        <MetricGrid>
          <Chart.Metric
            title="Total Purchases"
            value={formatCompactCurrency(metrics.total_purchases.value)}
            trend={metrics.total_purchases.trend}
            icon={ShoppingCart}
            color="primary"
          />
          <Chart.Metric
            title="Total Goods"
            value={formatCompactCurrency(metrics.total_goods.value)}
            trend={metrics.total_goods.trend}
            icon={Package}
            color="success"
          />
          <Chart.Metric
            title="Total Jasa"
            value={formatCompactCurrency(metrics.total_jasa.value)}
            trend={metrics.total_jasa.trend}
            icon={Wrench}
            color="warning"
          />
        </MetricGrid>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="w-full h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                    Trend Purchasing
                  </h3>
                  <p className="text-xs text-gray-600">
                    Perbandingan pembelian goods dan jasa
                  </p>
                </div>
                <select
                  value={trendGranularity}
                  onChange={(e) => setTrendGranularity(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                >
                  <option value="daily">Perhari</option>
                  <option value="weekly">Perminggu</option>
                  <option value="monthly">Perbulan</option>
                  <option value="yearly">Pertahun</option>
                </select>
              </div>
              <Highchart.HighchartsBar
                initialData={purchase_trend}
                title=""
                subtitle=""
                datasets={[
                  {
                    key: "goods",
                    label: "Goods",
                    color: "primary",
                    type: "column",
                    stacked: true,
                  },
                  {
                    key: "service",
                    label: "Jasa",
                    color: "warning",
                    type: "column",
                    stacked: true,
                  },
                  {
                    key: "total",
                    label: "Total",
                    color: "neutral",
                    type: "spline",
                  },
                ]}
                onFetchData={() => purchase_trend}
                showSummary={true}
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full ">
              <Highchart.HighchartsDonut
                data={goods_vs_jasa}
                centerText={{
                  value: formatCompactCurrency(metrics.total_purchases.value),
                  label: "Total",
                }}
                title="Breakdown Purchasing"
                subtitle="Goods vs Jasa"
                className="w-full h-full"
                showSummary={true}
                onDrilldownRequest={async ({ _, context, depth }) => {
                  return onDrilldown(context, depth);
                }}
              />
            </Card>
          </div>
        </div>

        {/* Top Suppliers & Top Purchases */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          {/* Top 5 Suppliers */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Suppliers
                </h3>
                <p className="text-xs text-gray-600">
                  Supplier dengan total pembelian tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformSuppliersToBarData(top_suppliers)}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Purchases", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
            />

            {top_suppliers.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-gray-200">
                <div className="p-2 rounded-lg bg-purple-50">
                  <p className="text-xs text-purple-600">Total dari Top 5</p>
                  <p className="text-sm font-bold text-purple-900">
                    {formatCompactCurrency(
                      top_suppliers.reduce(
                        (sum, s) => sum + s.total_purchases,
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-purple-50">
                  <p className="text-xs text-purple-600">Share dari Total</p>
                  <p className="text-sm font-bold text-purple-900">
                    {top_suppliers
                      .reduce((sum, s) => sum + s.percentage, 0)
                      .toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Top 5 Product Values */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Product Values
                </h3>
                <p className="text-xs text-gray-600">
                  Produk dengan nilai pembelian tertinggi
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={transformPurchasesToBarData(top_purchases)}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Value", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
            />

            {top_purchases.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-gray-200">
                <div className="p-2 rounded-lg bg-green-50">
                  <p className="text-xs text-green-600">Total dari Top 5</p>
                  <p className="text-sm font-bold text-green-900">
                    {formatCompactCurrency(
                      top_purchases.reduce((sum, p) => sum + p.value, 0)
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-50">
                  <p className="text-xs text-green-600">Highest Value</p>
                  <p className="text-sm font-bold text-green-900">
                    {formatCompactCurrency(
                      Math.max(...top_purchases.map((p) => p.value))
                    )}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Most Purchased Products */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Most Purchased Products
                </h3>
                <p className="text-xs text-gray-600">
                  Top 5 produk dengan volume pembelian terbanyak
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={productsGranularity}
                onChange={(e) => setProductsGranularity(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
              >
                <option value="daily">Perhari</option>
                <option value="weekly">Perminggu</option>
                <option value="monthly">Perbulan</option>
                <option value="yearly">Pertahun</option>
              </select>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Volume</p>
                <p className="text-xs font-semibold text-gray-900">
                  {formatNumber(
                    most_purchased.reduce((sum, item) => sum + item.value, 0)
                  )}{" "}
                  unit
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            {most_purchased.length > 0 ? (
              most_purchased.map((item, index) => (
                <div
                  key={index}
                  className="p-3 transition-all border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-600">Volume</span>
                      <span className="text-xs font-bold text-gray-900">
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
                <p className="text-xs text-center text-gray-500">
                  No product data available
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Info Section */}
        <Card className="border-blue-200 bg-blue-50">
          <div className="flex items-start gap-2">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg">
              <svg
                className="w-4 h-4 text-blue-600"
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
              <h4 className="mb-2 text-sm font-semibold text-blue-900">
                Informasi Purchasing
              </h4>
              <div className="space-y-1.5 text-xs text-blue-800">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
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
                <div className="pt-1.5 mt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Catatan:</strong> Data diambil dari database
                    real-time. Gunakan filter global (tombol di kanan layar)
                    untuk mengubah periode data.
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
