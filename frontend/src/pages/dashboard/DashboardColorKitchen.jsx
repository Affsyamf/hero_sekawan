import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
// Import Highcharts Components
import { Highchart } from "../../components/ui/highchart";
import {
  Droplets,
  Palette,
  Download,
  Layers,
  FileText,
  Package2,
  DollarSign,
  TrendingUp,
  Calendar,
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

  // CK Trend data
  const ck_trend = months.map((month, i) => ({
    month,
    batch_count: 15 + Math.floor(Math.random() * 10) + i,
    entry_count: 45 + Math.floor(Math.random() * 20) + i * 2,
    total_cost: 8500000 + Math.random() * 3500000 + i * 200000,
  }));

  const totalBatch = ck_trend.reduce((sum, d) => sum + d.batch_count, 0);
  const totalEntries = ck_trend.reduce((sum, d) => sum + d.entry_count, 0);
  const totalCost = ck_trend.reduce((sum, d) => sum + d.total_cost, 0);
  const totalRolls = totalEntries * 8; // Assume avg 8 rolls per entry
  const avgCostPerBatch = totalCost / totalBatch;
  const avgCostPerEntry = totalCost / totalEntries;

  // Cost breakdown for dyes
  const totalDyeCost = totalCost * 0.65; // 65% for dyes
  const totalAuxCost = totalCost * 0.35; // 35% for aux

  return {
    metrics: {
      total_batch: {
        value: totalBatch,
        trend: 12.5,
      },
      total_entries: {
        value: totalEntries,
        trend: 18.3,
      },
      total_rolls: {
        value: totalRolls,
        trend: 15.7,
      },
      avg_cost_per_batch: {
        value: avgCostPerBatch,
        trend: -3.2,
      },
      avg_cost_per_entry: {
        value: avgCostPerEntry,
        trend: -2.8,
      },
      total_cost: {
        value: totalCost,
        trend: 22.4,
      },
    },
    ck_trend,
    top_dyes: [
      {
        label: "Reactive Blue 19",
        quantity: 1250.5,
        cost: totalDyeCost * 0.28,
        percentage: 28,
        maxValue: 1500,
      },
      {
        label: "Reactive Red 195",
        quantity: 1100.3,
        cost: totalDyeCost * 0.24,
        percentage: 24,
        maxValue: 1500,
      },
      {
        label: "Reactive Yellow 145",
        quantity: 980.7,
        cost: totalDyeCost * 0.2,
        percentage: 20,
        maxValue: 1500,
      },
      {
        label: "Reactive Black 5",
        quantity: 850.2,
        cost: totalDyeCost * 0.18,
        percentage: 18,
        maxValue: 1500,
      },
      {
        label: "Reactive Orange 16",
        quantity: 720.8,
        cost: totalDyeCost * 0.1,
        percentage: 10,
        maxValue: 1500,
      },
    ],
    top_aux: [
      {
        label: "Sodium Alginate",
        quantity: 2150.3,
        cost: totalAuxCost * 0.3,
        percentage: 30,
        maxValue: 2500,
      },
      {
        label: "Urea",
        quantity: 1980.5,
        cost: totalAuxCost * 0.26,
        percentage: 26,
        maxValue: 2500,
      },
      {
        label: "Soda Ash",
        quantity: 1750.8,
        cost: totalAuxCost * 0.22,
        percentage: 22,
        maxValue: 2500,
      },
      {
        label: "Acetic Acid",
        quantity: 1520.2,
        cost: totalAuxCost * 0.14,
        percentage: 14,
        maxValue: 2500,
      },
      {
        label: "Water Glass",
        quantity: 1280.6,
        cost: totalAuxCost * 0.08,
        percentage: 8,
        maxValue: 2500,
      },
    ],
    dye_cost_breakdown: [
      { label: "Reactive Blue 19", value: totalDyeCost * 0.28 },
      { label: "Reactive Red 195", value: totalDyeCost * 0.24 },
      { label: "Reactive Yellow 145", value: totalDyeCost * 0.2 },
      { label: "Reactive Black 5", value: totalDyeCost * 0.18 },
      { label: "Others", value: totalDyeCost * 0.1 },
    ],
    aux_cost_breakdown: [
      { label: "Sodium Alginate", value: totalAuxCost * 0.3 },
      { label: "Urea", value: totalAuxCost * 0.26 },
      { label: "Soda Ash", value: totalAuxCost * 0.22 },
      { label: "Acetic Acid", value: totalAuxCost * 0.14 },
      { label: "Others", value: totalAuxCost * 0.08 },
    ],
  };
};

export default function DashboardColorKitchen() {
  const [ckData, setCkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1 Bulan");
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // Date Filter States
  const [filterMode, setFilterMode] = useState("month_year");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Month and Year Options
  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const yearOptions = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    fetchCkData();
  }, [
    period,
    filterMode,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
  ]);

  const getFilterDisplayText = () => {
    switch (filterMode) {
      case "month_year":
        return `${monthOptions[selectedMonth - 1]} ${selectedYear}`;
      case "year_only":
        return `Year ${selectedYear}`;
      case "ytd":
        return `YTD ${selectedYear}`;
      case "custom":
        if (customStartDate && customEndDate) {
          return `${new Date(customStartDate).toLocaleDateString(
            "id-ID"
          )} - ${new Date(customEndDate).toLocaleDateString("id-ID")}`;
        }
        return "Select Date Range";
      default:
        return "Select Filter";
    }
  };

  const fetchCkData = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockData = generateMockData(period);
      setCkData(mockData);
    } catch (error) {
      console.error("Error fetching CK data:", error);
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
            <p className="mt-4 text-gray-600">Loading Color Kitchen data...</p>
          </div>

          {/* Date Filter Header */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg bg-opacity-20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white text-opacity-90">
                    Data Filter
                  </h3>
                  <p className="text-lg font-bold text-white">
                    {getFilterDisplayText()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Mode Tabs */}
                <div className="flex p-1 bg-white rounded-lg bg-opacity-20">
                  <button
                    onClick={() => setFilterMode("month_year")}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      filterMode === "month_year"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    Month & Year
                  </button>
                  <button
                    onClick={() => setFilterMode("year_only")}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      filterMode === "year_only"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    Year Only
                  </button>
                  <button
                    onClick={() => setFilterMode("ytd")}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      filterMode === "ytd"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    YTD
                  </button>
                  <button
                    onClick={() => setFilterMode("custom")}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      filterMode === "custom"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {/* Month & Year Selectors */}
                {filterMode === "month_year" && (
                  <>
                    <select
                      value={selectedMonth}
                      onChange={(e) =>
                        setSelectedMonth(parseInt(e.target.value))
                      }
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
                      onChange={(e) =>
                        setSelectedYear(parseInt(e.target.value))
                      }
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
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}

                {/* Custom Date Range */}
                {filterMode === "custom" && (
                  <>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    />
                    <span className="text-sm font-medium text-white">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    />
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!ckData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
            <button
              onClick={fetchCkData}
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
    ck_trend,
    top_dyes,
    top_aux,
    dye_cost_breakdown,
    aux_cost_breakdown,
  } = ckData;

  return (
    <MainLayout>
      <div className="max-w-full space-y-6">
        {/* Date Filter Header */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Mode Tabs */}
              <div className="flex p-1 rounded-lg bg-primary bg-opacity-20">
                <button
                  onClick={() => setFilterMode("month_year")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterMode === "month_year"
                      ? "bg-primary text-blue-600"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Month & Year
                </button>
                <button
                  onClick={() => setFilterMode("year_only")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterMode === "year_only"
                      ? "bg-primary text-blue-600"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Year Only
                </button>
                <button
                  onClick={() => setFilterMode("ytd")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterMode === "ytd"
                      ? "bg-primary text-blue-600"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  YTD
                </button>
                <button
                  onClick={() => setFilterMode("custom")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterMode === "custom"
                      ? "bg-primary text-blue-600"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Month & Year Selectors */}
              {filterMode === "month_year" && (
                <>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
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
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}

              {/* Custom Date Range */}
              {filterMode === "custom" && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  />
                  <span className="text-sm font-medium text-white">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  />
                </>
              )}
            </div>
          </div>
        </Card>
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                Color Kitchen Dashboard
              </h1>
              <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-md">
                MOCK DATA
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Monitor produksi, usage dye & auxiliary, dan cost analysis
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

        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Chart.Metric
            title="Total Batch"
            subtitle="Berapa kali jalan mesin"
            value={`${formatNumber(metrics.total_batch.value)} Batch`}
            trend={formatTrend(metrics.total_batch.trend)}
            icon={Layers}
          />
          <Chart.Metric
            title="Total Entries"
            subtitle="Berapa job ticket (OPJ)"
            value={`${formatNumber(metrics.total_entries.value)} Jobs`}
            trend={formatTrend(metrics.total_entries.trend)}
            icon={FileText}
          />
          <Chart.Metric
            title="Total Rolls Processed"
            subtitle="Total rolls yang diproses"
            value={`${formatNumber(metrics.total_rolls.value)} Rolls`}
            trend={formatTrend(metrics.total_rolls.trend)}
            icon={Package2}
          />
        </div>

        {/* KPI Cards Row 2 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Chart.Metric
            title="Avg Cost per Batch"
            subtitle="Rata-rata biaya per batch"
            value={formatCompactCurrency(metrics.avg_cost_per_batch.value)}
            trend={formatTrend(metrics.avg_cost_per_batch.trend)}
            icon={DollarSign}
          />
          <Chart.Metric
            title="Avg Cost per Entry"
            subtitle="Rata-rata biaya per job"
            value={formatCompactCurrency(metrics.avg_cost_per_entry.value)}
            trend={formatTrend(metrics.avg_cost_per_entry.trend)}
            icon={TrendingUp}
          />
          <Chart.Metric
            title="Total Cost"
            subtitle="Total biaya produksi CK"
            value={formatCompactCurrency(metrics.total_cost.value)}
            trend={formatTrend(metrics.total_cost.trend)}
            icon={DollarSign}
          />
        </div>

        {/* Cost Breakdown - Donut Charts - HIGHCHARTS DONUT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Cost of Dyes */}
          <Card className="h-full">
            <Highchart.HighchartsDonut
              data={dye_cost_breakdown}
              centerText={{
                value: formatCompactCurrency(
                  dye_cost_breakdown.reduce((sum, item) => sum + item.value, 0)
                ),
                label: "Total Dye Cost",
              }}
              title="Cost of Dyes (Dyestuff)"
              subtitle="Breakdown biaya pewarna"
              className="w-full h-full"
            />
          </Card>

          {/* Cost of Aux */}
          <Card className="h-full">
            <Highchart.HighchartsDonut
              data={aux_cost_breakdown}
              centerText={{
                value: formatCompactCurrency(
                  aux_cost_breakdown.reduce((sum, item) => sum + item.value, 0)
                ),
                label: "Total Aux Cost",
              }}
              title="Cost of Auxiliary (AUX)"
              subtitle="Breakdown biaya auxiliary"
              className="w-full h-full"
            />
          </Card>
        </div>

        {/* Top Dyes & Top Aux - HIGHCHARTS PROGRESS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top 5 Dyes */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Top 5 Dyes (Dyestuff)
                  </h3>
                  <p className="text-xs text-gray-600">
                    Pewarna paling banyak digunakan
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCompactCurrency(
                    top_dyes.reduce((sum, item) => sum + item.cost, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {top_dyes.map((item, index) => (
                <div
                  key={index}
                  className="p-3 transition-all border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-blue-600 bg-blue-100 rounded-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {item.label}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600">
                          {formatNumber(item.quantity)} kg
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          {formatCompactCurrency(item.cost)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-600">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <Highchart.HighchartsProgress
                    label=""
                    value={item.quantity}
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
              ))}
            </div>
          </Card>

          {/* Top 5 Aux */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Top 5 Auxiliary (AUX)
                  </h3>
                  <p className="text-xs text-gray-600">
                    Auxiliary paling banyak digunakan
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCompactCurrency(
                    top_aux.reduce((sum, item) => sum + item.cost, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {top_aux.map((item, index) => (
                <div
                  key={index}
                  className="p-3 transition-all border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-purple-600 bg-purple-100 rounded-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {item.label}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600">
                          {formatNumber(item.quantity)} kg
                        </span>
                        <span className="text-xs font-semibold text-purple-600">
                          {formatCompactCurrency(item.cost)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-purple-600">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <Highchart.HighchartsProgress
                    label=""
                    value={item.quantity}
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
              ))}
            </div>
          </Card>
        </div>

        {/* Production Trend - HIGHCHARTS BAR */}
        <Card className="w-full">
          <Highchart.HighchartsBar
            initialData={ck_trend}
            title="Production Activity Trend"
            subtitle="Trend aktivitas batch dan entries per periode"
            datasets={[
              { key: "batch_count", label: "Batch Count", color: "primary" },
              { key: "entry_count", label: "Entry Count", color: "success" },
            ]}
            periods={["6 Bulan", "3 Bulan", "1 Bulan"]}
            onFetchData={() => ck_trend}
            showSummary={true}
          />
        </Card>

        {/* Info Section */}
        <Card className="border-indigo-200 bg-indigo-50">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg">
              <svg
                className="w-6 h-6 text-indigo-600"
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
              <h4 className="mb-2 font-semibold text-indigo-900">
                Informasi Color Kitchen
              </h4>
              <div className="space-y-2 text-sm text-indigo-800">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="font-semibold">🎨 Batch</p>
                    <p className="text-xs">
                      Group produksi untuk dyestuff (shared resources)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📋 Entry/Job</p>
                    <p className="text-xs">
                      Individual OPJ dengan auxiliary masing-masing
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">📦 Rolls</p>
                    <p className="text-xs">Total rolls kain yang diproses</p>
                  </div>
                  <div>
                    <p className="font-semibold">💧 Dye Cost</p>
                    <p className="text-xs">
                      Biaya pewarna dari ColorKitchenBatchDetail
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">🧪 Aux Cost</p>
                    <p className="text-xs">
                      Biaya auxiliary dari ColorKitchenEntryDetail
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">💰 Total Cost</p>
                    <p className="text-xs">Total biaya dye + auxiliary</p>
                  </div>
                </div>
                <div className="pt-2 mt-3 border-t border-indigo-200">
                  <p className="text-xs text-indigo-700">
                    <strong>Catatan:</strong> Data menggunakan MOCK DATA.
                    Percentage dihitung dari total cost masing-masing kategori.
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
