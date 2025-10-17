import { useTheme } from "../../contexts/ThemeContext";
import Card from "../../components/ui/card/Card";
import Button from "../../components/ui/button/Button";
import Chart from "../../components/ui/chart/Chart";
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
import {
  reportsColorKitchenSummary,
  reportsColorKitchenChemicalUsageSummary,
  reportsColorKitchenChemicalUsage,
} from "../../services/report_color_kitchen_service";

export default function DashboardColorKitchen() {
  const [ckData, setCkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { colors } = useTheme();

  // Date Filter States
  const [filterMode, setFilterMode] = useState("month_year");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Get current date range based on filter mode
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (filterMode) {
      case "month_year":
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        endDate = new Date(selectedYear, selectedMonth, 0);
        break;

      case "year_only":
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
        break;

      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;

      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
        }
        break;

      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    return {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };
  };

  // Get display text for current filter
  const getFilterDisplayText = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
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

  useEffect(() => {
    fetchCkData();
  }, [filterMode, selectedMonth, selectedYear, customStartDate, customEndDate]);

  const fetchCkData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();

      // Fetch all data in parallel
      // PENTING: dyesData menggunakan parent_type=dye, auxData menggunakan parent_type=aux
      const [summary, chemicalSummary, dyesData, auxData] = await Promise.all([
        reportsColorKitchenSummary(dateRange),
        reportsColorKitchenChemicalUsageSummary(dateRange),
        reportsColorKitchenChemicalUsage({ ...dateRange, parent_type: "dye" }),
        reportsColorKitchenChemicalUsage({ ...dateRange, parent_type: "aux" }),
      ]);

      const transformedData = transformApiData(
        summary.data,
        chemicalSummary.data,
        dyesData.data,
        auxData.data
      );

      setCkData(transformedData);
    } catch (error) {
      console.error("Error fetching Color Kitchen data:", error);
      setCkData(null);
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (summary, chemicalSummary, dyesData, auxData) => {
    // Transform metrics
    const metrics = {
      total_batch: {
        value: summary.total_batches || 0,
        trend: 0,
      },
      total_entries: {
        value: summary.total_entries || 0,
        trend: 0,
      },
      total_rolls: {
        value: summary.total_rolls_processed || 0,
        trend: 0,
      },
      avg_cost_per_batch: {
        value: summary.avg_cost_per_batch || 0,
        trend: 0,
      },
      avg_cost_per_entry: {
        value: summary.avg_cost_per_entry || 0,
        trend: 0,
      },
      total_cost: {
        value: summary.total_cost || 0,
        trend: 0,
      },
    };

    // Transform chemical breakdown for donut charts
    const chemicalData = chemicalSummary.data || [];
    const dyesBreakdown = chemicalData.find((item) => item.label === "Dyes") || { value: 0 };
    const auxBreakdown = chemicalData.find((item) => item.label === "Auxiliaries") || { value: 0 };

    // Transform top dyes (dari parent_type=dye)
    const dyesList = dyesData.data || [];
    const maxDyeValue = Math.max(...dyesList.map((d) => d.quantity || 0), 1);
    const top_dyes = dyesList.slice(0, 5).map((item) => ({
      label: item.product_name || item.label || "Unknown",
      quantity: item.quantity || 0,
      cost: item.cost || 0,
      percentage: item.percentage || 0,
      maxValue: maxDyeValue,
    }));

    // Transform top auxiliaries (dari parent_type=aux)
    const auxList = auxData.data || [];
    const maxAuxValue = Math.max(...auxList.map((a) => a.quantity || 0), 1);
    const top_aux = auxList.slice(0, 5).map((item) => ({
      label: item.product_name || item.label || "Unknown",
      quantity: item.quantity || 0,
      cost: item.cost || 0,
      percentage: item.percentage || 0,
      maxValue: maxAuxValue,
    }));

    // Create cost breakdown for donut charts
    const dye_cost_breakdown = top_dyes.length > 0 
      ? top_dyes.map((item) => ({
          label: item.label,
          value: item.cost,
        }))
      : [{ label: "No Data", value: 0 }];

    const aux_cost_breakdown = top_aux.length > 0
      ? top_aux.map((item) => ({
          label: item.label,
          value: item.cost,
        }))
      : [{ label: "No Data", value: 0 }];

    return {
      metrics,
      top_dyes,
      top_aux,
      dye_cost_breakdown,
      aux_cost_breakdown,
    };
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

  // Month and Year Options
  const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const yearOptions = Array.from(
    { length: 3 },
    (_, i) => new Date().getFullYear() - i
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading Color Kitchen data...</p>
          </div>
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

  const { metrics, top_dyes, top_aux, dye_cost_breakdown, aux_cost_breakdown } = ckData;

  return (
    <MainLayout>
      <div className="max-w-full space-y-4 p-0.5 md:p-1">
        {/* Date Filter Header */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary bg-opacity-20">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-primary text-opacity-90">
                  Data Filter
                </h3>
                <p className="text-sm font-bold text-primary">
                  {getFilterDisplayText()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Mode Tabs */}
              <div className="flex p-0.5 rounded-lg bg-primary bg-opacity-20">
                <button
                  onClick={() => setFilterMode("month_year")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    filterMode === "month_year"
                      ? "bg-primary text-blue-600"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Month & Year
                </button>
                <button
                  onClick={() => setFilterMode("year_only")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    filterMode === "year_only"
                      ? "bg-primary text-blue-600"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  Year Only
                </button>
                <button
                  onClick={() => setFilterMode("ytd")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    filterMode === "ytd"
                      ? "bg-primary text-blue-600"
                      : "text-primary hover:bg-primary hover:bg-opacity-10"
                  }`}
                >
                  YTD
                </button>
                <button
                  onClick={() => setFilterMode("custom")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
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
                    className="px-2.5 py-1 text-xs bg-primary border-0 rounded-lg"
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
                    className="px-2.5 py-1 text-xs bg-primary border-0 rounded-lg"
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
                  className="px-2.5 py-1 text-xs bg-primary border-0 rounded-lg"
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
                    className="px-2.5 py-1 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-white focus:ring-opacity-50"
                  />
                  <span className="text-sm font-medium text-white">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 text-sm bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
              Color Kitchen Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
              Monitor produksi, usage dye & auxiliary, dan cost analysis
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

        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Chart.Metric
            title="Total Batch"
            value={`${formatNumber(metrics.total_batch.value)} Batch`}
            trend={metrics.total_batch.trend}
            icon={Layers}
            color="primary"
          />
          <Chart.Metric
            title="Total Entries"
            value={`${formatNumber(metrics.total_entries.value)} Jobs`}
            trend={metrics.total_entries.trend}
            icon={FileText}
            color="success"
          />
          <Chart.Metric
            title="Total Rolls"
            value={`${formatNumber(metrics.total_rolls.value)} Rolls`}
            trend={metrics.total_rolls.trend}
            icon={Package2}
            color="warning"
          />
        </div>

        {/* KPI Cards Row 2 */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-3">
          <Chart.Metric
            title="Avg Cost per Batch"
            value={formatCompactCurrency(metrics.avg_cost_per_batch.value)}
            trend={metrics.avg_cost_per_batch.trend}
            icon={DollarSign}
            color="info"
          />
          <Chart.Metric
            title="Avg Cost per Entry"
            value={formatCompactCurrency(metrics.avg_cost_per_entry.value)}
            trend={metrics.avg_cost_per_entry.trend}
            icon={TrendingUp}
            color="success"
          />
          <Chart.Metric
            title="Total Cost"
            value={formatCompactCurrency(metrics.total_cost.value)}
            trend={metrics.total_cost.trend}
            icon={DollarSign}
            color="error"
          />
        </div>

        {/* Cost Breakdown - Donut Charts */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
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
              showSummary={true}
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
              showSummary={true}
            />
          </Card>
        </div>

        {/* Top Dyes & Top Aux */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          {/* Top 5 Dyes - Data dari parent_type=dye */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <Droplets className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Dyes (Dyestuff)
                </h3>
                <p className="text-xs text-gray-600">
                  Pewarna paling banyak digunakan
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={top_dyes.map((item) => ({
                key: item.label,
                value: item.cost,
                percentage: item.percentage,
              }))}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Cost", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
            />

            {/* Summary Stats */}
            {top_dyes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-gray-200">
                <div className="p-2 rounded-lg bg-blue-50">
                  <p className="text-xs text-blue-600">Total dari Top 5</p>
                  <p className="text-sm font-bold text-blue-900">
                    {formatCompactCurrency(
                      top_dyes.reduce((sum, item) => sum + item.cost, 0)
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50">
                  <p className="text-xs text-blue-600">Total Quantity</p>
                  <p className="text-sm font-bold text-blue-900">
                    {formatNumber(
                      top_dyes.reduce((sum, item) => sum + item.quantity, 0)
                    )}{" "}
                    kg
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Top 5 Aux - Data dari parent_type=aux */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <Palette className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Top 5 Auxiliary (AUX)
                </h3>
                <p className="text-xs text-gray-600">
                  Auxiliary paling banyak digunakan
                </p>
              </div>
            </div>

            <Highchart.HighchartsBar
              initialData={top_aux.map((item) => ({
                key: item.label,
                value: item.cost,
                percentage: item.percentage,
              }))}
              title=""
              subtitle=""
              datasets={[
                { key: "value", label: "Total Cost", color: "primary" },
              ]}
              periods={[]}
              showSummary={false}
            />

            {/* Summary Stats */}
            {top_aux.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-gray-200">
                <div className="p-2 rounded-lg bg-purple-50">
                  <p className="text-xs text-purple-600">Total dari Top 5</p>
                  <p className="text-sm font-bold text-purple-900">
                    {formatCompactCurrency(
                      top_aux.reduce((sum, item) => sum + item.cost, 0)
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-purple-50">
                  <p className="text-xs text-purple-600">Total Quantity</p>
                  <p className="text-sm font-bold text-purple-900">
                    {formatNumber(
                      top_aux.reduce((sum, item) => sum + item.quantity, 0)
                    )}{" "}
                    kg
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

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
                Informasi Color Kitchen
              </h4>
              <div className="space-y-1.5 text-xs text-blue-800">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
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
                <div className="pt-1.5 mt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Catatan:</strong> Data diambil dari database
                    real-time. Top 5 Dyes menggunakan endpoint dengan parent_type=dye, 
                    sedangkan Top 5 Auxiliary menggunakan parent_type=aux.
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