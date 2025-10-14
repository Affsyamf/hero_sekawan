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

// ===== MOCK DATA GENERATOR =====
const generateMockData = (period) => {
  const getMonthCount = () => {
    if (period === "1 Bulan") return 4;
    if (period === "3 Bulan") return 12;
    return 24;
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

  const generateMonths = () => {
    const months = [];
    const currentMonth = 9;
    for (let i = monthCount - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      months.push(`${monthNames[monthIndex]} 2025`);
    }
    return months;
  };

  const months = generateMonths();

  // Purchase trend data
  const purchase_trend = months.map((month, i) => ({
    month,
    goods: 45000000 + Math.random() * 15000000 + i * 800000,
    jasa: 12000000 + Math.random() * 5000000 + i * 300000,
  }));

  const totalPurchases = purchase_trend.reduce(
    (sum, d) => sum + d.goods + d.jasa,
    0
  );
  const totalGoods = purchase_trend.reduce((sum, d) => sum + d.goods, 0);
  const totalJasa = purchase_trend.reduce((sum, d) => sum + d.jasa, 0);

  return {
    metrics: {
      total_purchases: {
        value: totalPurchases,
        trend: 18.5,
      },
      total_jasa: {
        value: totalJasa,
        trend: 12.3,
      },
      total_goods: {
        value: totalGoods,
        trend: 20.8,
      },
    },
    purchase_trend,
    goods_vs_jasa: [
      { label: "Goods (Product)", value: totalGoods },
      { label: "Jasa (Services)", value: totalJasa },
    ],
    top_suppliers: [
      {
        name: "PT Kimia Prima Sentosa",
        total_purchases: 285000000,
        purchase_count: 48,
        rating: 4.8,
        category: "Dye & Chemicals",
      },
      {
        name: "CV Aneka Bahan Tekstil",
        total_purchases: 198000000,
        purchase_count: 35,
        rating: 4.6,
        category: "Auxiliary Materials",
      },
      {
        name: "PT Global Chemical Indo",
        total_purchases: 165000000,
        purchase_count: 28,
        rating: 4.7,
        category: "Dye & Chemicals",
      },
      {
        name: "UD Sumber Makmur",
        total_purchases: 142000000,
        purchase_count: 31,
        rating: 4.5,
        category: "Packaging",
      },
      {
        name: "PT Indo Jasa Printing",
        total_purchases: 128000000,
        purchase_count: 22,
        rating: 4.4,
        category: "Printing Services",
      },
    ],
    top_purchases: [
      {
        label: "PO-2025-0892",
        value: 48500000,
        date: "Oct 12, 2025",
        supplier: "PT Kimia Prima",
      },
      {
        label: "PO-2025-0876",
        value: 42300000,
        date: "Oct 08, 2025",
        supplier: "CV Aneka Bahan",
      },
      {
        label: "PO-2025-0845",
        value: 38700000,
        date: "Sep 28, 2025",
        supplier: "PT Global Chemical",
      },
      {
        label: "PO-2025-0823",
        value: 35200000,
        date: "Sep 22, 2025",
        supplier: "UD Sumber Makmur",
      },
      {
        label: "PO-2025-0801",
        value: 32800000,
        date: "Sep 15, 2025",
        supplier: "PT Indo Jasa",
      },
    ],
    most_purchased: [
      { label: "Reactive Blue 19", value: 3250.5, unit: "kg", maxValue: 4000 },
      { label: "Sodium Alginate", value: 2980.3, unit: "kg", maxValue: 4000 },
      { label: "Reactive Red 195", value: 2750.8, unit: "kg", maxValue: 4000 },
      { label: "Urea", value: 2520.2, unit: "kg", maxValue: 4000 },
      {
        label: "Reactive Yellow 145",
        value: 2280.6,
        unit: "kg",
        maxValue: 4000,
      },
    ],
  };
};

export default function DashboardPurchasing() {
  const [purchasingData, setPurchasingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1 Bulan");
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchPurchasingData();
  }, [period]);

  const fetchPurchasingData = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockData = generateMockData(period);
      setPurchasingData(mockData);
    } catch (error) {
      console.error("Error fetching purchasing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Export successful!");
      alert("Export berhasil! (Mock data)");
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
              <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-md">
                MOCK DATA
              </span>
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
          {/* Purchase Trend - 2/3 width - HIGHCHARTS BAR */}
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

          {/* Goods vs Jasa Donut - 1/3 width - HIGHCHARTS DONUT */}
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
              {top_suppliers.map((supplier, index) => (
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
                          {supplier.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-xs font-semibold">
                        {supplier.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Total Purchases</p>
                      <p className="font-bold text-gray-900">
                        {formatCompactCurrency(supplier.total_purchases)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">PO Count</p>
                      <p className="font-semibold text-gray-900">
                        {supplier.purchase_count} PO
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
                  Top 5 Purchases Value
                </h3>
                <p className="text-xs text-gray-600">
                  PO dengan nilai pembelian tertinggi
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {top_purchases.map((purchase, index) => (
                <div
                  key={index}
                  className="p-4 transition-all border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-green-600 bg-green-100 rounded-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {purchase.label}
                        </p>
                        <p className="text-xs text-gray-600">
                          {purchase.supplier}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCompactCurrency(purchase.value)}
                      </p>
                      <p className="text-xs text-gray-600">{purchase.date}</p>
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
              ))}
            </div>
          </Card>
        </div>

        {/* Most Purchased Products - HIGHCHARTS PROGRESS */}
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
                kg
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {most_purchased.map((item, index) => (
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
            ))}
          </div>
        </Card>

        {/* Info Section */}
        <Card className="border-purple-200 bg-purple-50">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
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
              <h4 className="mb-2 font-semibold text-purple-900">
                Informasi Purchasing
              </h4>
              <div className="space-y-2 text-sm text-purple-800">
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
                <div className="pt-2 mt-3 border-t border-purple-200">
                  <p className="text-xs text-purple-700">
                    <strong>Catatan:</strong> Data saat ini menggunakan MOCK
                    DATA. Supplier rating dan category adalah contoh data untuk
                    development.
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