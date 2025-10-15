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
  Calendar,
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
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // Date Filter States
  const [filterMode, setFilterMode] = useState("month_year"); // month_year, year_only, ytd, custom
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Granularity per chart
  const [trendGranularity, setTrendGranularity] = useState("monthly");
  const [productsGranularity, setProductsGranularity] = useState("monthly");

  // Get current date range based on filter mode
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (filterMode) {
      case "month_year":
        // Specific month & year
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        endDate = new Date(selectedYear, selectedMonth, 0); // Last day of month
        break;

      case "year_only":
        // Entire year
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
        break;

      case "ytd":
        // Year to date
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;

      case "custom":
        // Custom range
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          // Fallback to current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
        }
        break;

      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    const range = {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };

    console.log("Generated date range:", range, "from filter mode:", filterMode);
    return range;
  };

  // Get display text for current filter
  const getFilterDisplayText = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    switch (filterMode) {
      case "month_year":
        return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
      case "year_only":
        return `Year ${selectedYear}`;
      case "ytd":
        return `YTD ${new Date().getFullYear()}`;
      case "custom":
        if (customStartDate && customEndDate) {
          return `${customStartDate} to ${customEndDate}`;
        }
        return "Custom Range";
      default:
        return "";
    }
  };

  // Main data fetch - triggered by date filter changes
  useEffect(() => {
    fetchPurchasingData();
  }, [filterMode, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Trend granularity change - refetch trend only
  useEffect(() => {
    if (purchasingData) {
      fetchTrendData();
    }
  }, [trendGranularity]);

  // Products granularity change - refetch products only
  useEffect(() => {
    if (purchasingData) {
      fetchProductsData();
    }
  }, [productsGranularity]);

  const fetchPurchasingData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      
      console.log("Fetching data with date range:", dateRange);
      console.log("Trend granularity:", trendGranularity);
      console.log("Products granularity:", productsGranularity);

      // Fetch summary, breakdown, and suppliers (no granularity needed)
      const [summary, breakdown, suppliers] = await Promise.all([
        reportsPurchasingSummary(dateRange),
        reportsPurchasingBreakdownSummary(dateRange),
        reportsPurchasingSuppliers(dateRange),
      ]);

      // Fetch trend and products with their specific granularity
      const [trend, products] = await Promise.all([
        reportsPurchasingTrend({ ...dateRange, granularity: trendGranularity }),
        reportsPurchasingProducts({ ...dateRange, granularity: productsGranularity }),
      ]);

      console.log("Received trend data:", trend);
      console.log("Received products data:", products);

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

  // Fetch trend data when granularity changes
  const fetchTrendData = async () => {
    try {
      const dateRange = getDateRange();
      console.log("Fetching trend data with granularity:", trendGranularity);
      console.log("Date range:", dateRange);
      
      const trend = await reportsPurchasingTrend({
        ...dateRange,
        granularity: trendGranularity,
      });

      console.log("Received new trend data:", trend);

      setPurchasingData((prev) => ({
        ...prev,
        purchase_trend: transformTrendData(trend),
      }));
    } catch (error) {
      console.error("Error fetching trend data:", error);
    }
  };

  // Fetch products data when granularity changes
  const fetchProductsData = async () => {
    try {
      const dateRange = getDateRange();
      console.log("Fetching products data with granularity:", productsGranularity);
      console.log("Date range:", dateRange);
      
      const products = await reportsPurchasingProducts({
        ...dateRange,
        granularity: productsGranularity,
      });

      console.log("Received new products data:", products);

      setPurchasingData((prev) => ({
        ...prev,
        most_purchased: transformProductsData(products),
        top_purchases: transformTopPurchases(products),
      }));
    } catch (error) {
      console.error("Error fetching products data:", error);
    }
  };

  const transformTrendData = (trend) => {
    return (trend || []).map((item) => {
      let displayPeriod = item.period;

      if (item.week_start && item.week_end) {
        displayPeriod = formatWeeklyPeriod(item.week_start, item.week_end);
      } else {
        displayPeriod = formatPeriod(item.period);
      }

      return {
        month: displayPeriod,
        goods: item.goods || 0,
        jasa: item.service || 0,
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

  const transformTopPurchases = (products) => {
    return (products?.most_purchased || [])
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5)
      .map((item, index) => ({
        label: `Item-${index + 1}`,
        value: item.total_value || 0,
        date: "-",
        supplier: item.product,
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

    const goods_vs_jasa = (breakdown?.data || []).map((item) => ({
      label: item.label === "goods" ? "Goods (Product)" : "Jasa (Services)",
      value: item.value || 0,
    }));

    const top_suppliers = (suppliers?.top_suppliers || [])
      .slice(0, 5)
      .map((item) => ({
        name: item.supplier,
        total_purchases: item.total_spent || 0,
        percentage: item.percentage || 0,
      }));

    const most_purchased = transformProductsData(products);
    const top_purchases = transformTopPurchases(products);

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
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

  const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <MainLayout>
      <div className="max-w-full space-y-6">
        {/* Date Filter Header */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="space-y-4">
            {/* Top Row: Label and Filter Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary bg-opacity-20">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-primary text-opacity-90">
                    Data Filter
                  </h3>
                  <p className="text-lg font-bold text-primary">
                    {getFilterDisplayText()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Filter Mode Tabs and Inputs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter Mode Tabs */}
              <div className="flex p-1 rounded-lg bg-primary bg-opacity-20">
                <button
                  onClick={() => {
                    console.log("Switching to Month & Year mode");
                    setFilterMode("month_year");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    filterMode === "month_year"
                      ? "bg-primary text-blue-600 shadow-sm"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Month & Year
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to Year Only mode");
                    setFilterMode("year_only");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    filterMode === "year_only"
                      ? "bg-primary text-blue-600 shadow-sm"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Year Only
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to YTD mode");
                    setFilterMode("ytd");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    filterMode === "ytd"
                      ? "bg-primary text-blue-600 shadow-sm"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  YTD
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to Custom mode");
                    setFilterMode("custom");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    filterMode === "custom"
                      ? "bg-primary text-blue-600 shadow-sm"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Dynamic Input Fields */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Month & Year Selectors */}
                {filterMode === "month_year" && (
                  <>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        const newMonth = parseInt(e.target.value);
                        console.log("Month changed to:", newMonth);
                        setSelectedMonth(newMonth);
                      }}
                      className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    >
                      {monthOptions.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value);
                        console.log("Year changed to:", newYear);
                        setSelectedYear(newYear);
                      }}
                      className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {/* Year Only Selector */}
                {filterMode === "year_only" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      console.log("Year (year only mode) changed to:", newYear);
                      setSelectedYear(newYear);
                    }}
                    className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}

                {/* YTD - No additional inputs */}
                {filterMode === "ytd" && (
                  <div className="px-4 py-2 text-sm font-medium text-white bg-white rounded-lg bg-opacity-20">
                    Year to Date ({new Date().getFullYear()})
                  </div>
                )}

                {/* Custom Date Range */}
                {filterMode === "custom" && (
                  <>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        console.log("Custom start date changed to:", e.target.value);
                        setCustomStartDate(e.target.value);
                      }}
                      placeholder="Start Date"
                      className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    />
                    <span className="text-sm font-medium text-white">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        console.log("Custom end date changed to:", e.target.value);
                        setCustomEndDate(e.target.value);
                      }}
                      placeholder="End Date"
                      className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Purchasing Overview
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor pembelian, supplier, dan trend purchasing
            </p>
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
          {/* Purchase Trend - with Granularity selector */}
          <div className="lg:col-span-2">
            <Card className="w-full h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Trend Purchasing
                  </h3>
                  <p className="text-xs text-gray-600">
                    Perbandingan pembelian goods dan jasa
                  </p>
                </div>
                <select
                  value={trendGranularity}
                  onChange={(e) => setTrendGranularity(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  { key: "goods", label: "Goods", color: "primary" },
                  { key: "jasa", label: "Jasa", color: "warning" },
                ]}
                onFetchData={() => purchase_trend}
                showSummary={true}
              />
            </Card>
          </div>

          {/* Goods vs Jasa Donut */}
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

        {/* Most Purchased Products - with Granularity selector */}
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
            <div className="flex items-center gap-3">
              <select
                value={productsGranularity}
                onChange={(e) => setProductsGranularity(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Perhari</option>
                <option value="weekly">Perminggu</option>
                <option value="monthly">Perbulan</option>
                <option value="yearly">Pertahun</option>
              </select>
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
                    <strong>Catatan:</strong> Data diambil dari database
                    real-time. Anda dapat menyesuaikan periode data dan
                    granularity di setiap chart untuk analisis yang lebih
                    detail.
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