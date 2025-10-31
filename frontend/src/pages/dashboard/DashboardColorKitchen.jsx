// pages/dashboard/DashboardColorKitchen.jsx
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
  Building2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  formatNumber,
  formatCompactCurrency,
  formatDate,
} from "../../utils/helpers";
import {
  reportsColorKitchenSummary,
  reportsColorKitchenChemicalUsageSummary,
  reportsColorKitchenChemicalUsage,
  reportsColorKitchenTrend,
} from "../../services/report_color_kitchen_service";
import { formatPeriod, formatWeeklyPeriod } from "../../utils/dateHelper";
import useDateFilterStore from "../../stores/useDateFilterStore";

export default function DashboardColorKitchen() {
  const [ckData, setCkData] = useState(null);
  const [trendData, setTrendData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { colors } = useTheme();

  const [trendGranularity, setTrendGranularity] = useState("monthly");

  // ✅ Use useDateFilterStore instead of useGlobalFilter
  const dateRange = useDateFilterStore((state) => state.dateRange);

  // ✅ Fetch data saat mount pertama kali
  // useEffect(() => {
  //   fetchCkData();
  //   fetchCkTrend();
  // }, []);

  // ✅ Auto refresh when dateRange changes
  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchCkData();
    }
  }, [dateRange]);

  useEffect(() => {
    if (dateRange?.dateFrom && dateRange?.dateTo) {
      fetchCkTrend();
    }
  }, [dateRange, trendGranularity]);

  const fetchCkData = async () => {
    // Skip jika dateRange belum ada
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // ✅ Use dateRange from useDateFilterStore
      const params = {
        start_date: dateRange.dateFrom,
        end_date: dateRange.dateTo,
      };

      // Fetch all data in parallel
      const [summary, chemicalSummary, dyesData, auxData] = await Promise.all([
        reportsColorKitchenSummary(params),
        reportsColorKitchenChemicalUsageSummary(params),
        reportsColorKitchenChemicalUsage("dye", { ...params }),
        reportsColorKitchenChemicalUsage("aux", { ...params }),
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

  const fetchCkTrend = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return;

    const params = {
      start_date: dateRange.dateFrom,
      end_date: dateRange.dateTo,
      granularity: trendGranularity,
    };

    const [trend] = await Promise.all([reportsColorKitchenTrend(params)]);

    const trendTransformed = trend.data.map((item) => {
      let displayPeriod = item.period;

      if (item.week_start && item.week_end) {
        displayPeriod = formatWeeklyPeriod(item.week_start, item.week_end);
      } else {
        displayPeriod = formatPeriod(item.period);
      }

      return {
        key: displayPeriod,
        dyes: item.dyes || 0,
        auxiliaries: item.auxiliaries || 0,
        total: item.total || 0,
      };
    });

    setTrendData(trendTransformed);
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
    const chemicalSummaryTransformed = (chemicalSummary.data || []).map(
      (item) => ({
        key: item.label === "Dyes" ? "Dyes" : "Auxiliaries",
        value: item.value || 0,
        drilldown: true,
        context: item.label,
      })
    );

    // Transform top dyes (dari parent_type=dye)
    const dyesList = dyesData.data || [];
    const maxDyeValue = Math.max(...dyesList.map((d) => d.quantity || 0), 1);
    const top_dyes = dyesList.slice(0, 5).map((item) => ({
      label: item.product_name || item.label || "Unknown",
      quantity: item.qty || 0,
      value: item.value || 0,
      percentage: item.percentage || 0,
      maxValue: maxDyeValue,
    }));

    // Transform top auxiliaries (dari parent_type=aux)
    const auxList = auxData.data || [];
    const maxAuxValue = Math.max(...auxList.map((a) => a.quantity || 0), 1);
    const top_aux = auxList.slice(0, 5).map((item) => ({
      label: item.product_name || item.label || "Unknown",
      quantity: item.qty || 0,
      value: item.value || 0,
      percentage: item.percentage || 0,
      maxValue: maxAuxValue,
    }));

    // Create cost breakdown for donut charts
    const dye_cost_breakdown =
      top_dyes.length > 0
        ? top_dyes.map((item) => ({
            label: item.label,
            value: item.cost,
          }))
        : [{ label: "No Data", value: 0 }];

    const aux_cost_breakdown =
      top_aux.length > 0
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
      chemicalSummaryTransformed,
    };
  };

  const handleExport = async () => {
    if (!dateRange?.dateFrom || !dateRange?.dateTo) {
      alert("Please select a date range first");
      return;
    }

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
    if (!dateRange?.dateFrom || !dateRange?.dateTo) return [];

    const params = {
      start_date: dateRange.dateFrom,
      end_date: dateRange.dateTo,
    };

    let res = [];
    // // level 1 → Goods vs Jasa
    if (depth === 0) {
      if (context === "Dyes") {
        res = await reportsColorKitchenChemicalUsage("dye", params);
      } else {
        res = await reportsColorKitchenChemicalUsage("aux", params);
      }
      return res.data.data.map((r) => ({
        key: r.label,
        value: r.value,
        percentage: r.percentage,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-300 rounded-full border-t-primary animate-spin"></div>
          <p className="text-sm text-gray-600">Loading color kitchen data...</p>
        </div>
      </div>
    );
  }

  if (!dateRange?.dateFrom || !dateRange?.dateTo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-2 text-gray-600">No date range selected</p>
          <p className="text-sm text-gray-500">
            Please select a date range from the global filter to view color
            kitchen data
          </p>
        </div>
      </div>
    );
  }

  if (!ckData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="mb-2 text-gray-600">No data available</p>
          <p className="text-sm text-gray-500">
            Please check your date range or try again later
          </p>
        </div>
      </div>
    );
  }

  const transformDataToBar = (data) => {
    return data.map((x) => ({
      ...x,
      key: x.label,
    }));
  };

  const {
    metrics,
    top_dyes,
    top_aux,
    dye_cost_breakdown,
    aux_cost_breakdown,
    chemicalSummaryTransformed,
  } = ckData;

  return (
    <div className="max-w-full space-y-4 p-0.5 md:p-1">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
            Color Kitchen Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-gray-600 md:text-sm">
            Monitor chemical usage, cost analysis, dan trend color kitchen
          </p>
        </div>
        <div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            label={exporting ? "Exporting..." : "Export Report"}
            icon={Download}
            className="text-white bg-green-600 hover:bg-green-700"
          />
        </div>
      </div>

      {/* Active Filter Display */}
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

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg md:w-12 md:h-12 bg-primary/10">
              <Layers className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate md:text-sm">
                Total Batch
              </p>
              <p className="text-base font-bold text-gray-900 truncate md:text-xl">
                {formatNumber(metrics.total_batch.value)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg md:w-12 md:h-12">
              <FileText className="w-5 h-5 text-blue-600 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate md:text-sm">
                Total Entries
              </p>
              <p className="text-base font-bold text-gray-900 truncate md:text-xl">
                {formatNumber(metrics.total_entries.value)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg md:w-12 md:h-12">
              <Package2 className="w-5 h-5 text-purple-600 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate md:text-sm">
                Total Rolls
              </p>
              <p className="text-base font-bold text-gray-900 truncate md:text-xl">
                {formatNumber(metrics.total_rolls.value)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg md:w-12 md:h-12">
              <DollarSign className="w-5 h-5 text-green-600 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate md:text-sm">
                Avg Cost/Batch
              </p>
              <p className="text-base font-bold text-gray-900 truncate md:text-xl">
                {formatCompactCurrency(metrics.avg_cost_per_batch.value)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg md:w-12 md:h-12">
              <TrendingUp className="w-5 h-5 text-orange-600 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate md:text-sm">
                Avg Cost/Entry
              </p>
              <p className="text-base font-bold text-gray-900 truncate md:text-xl">
                {formatCompactCurrency(metrics.avg_cost_per_entry.value)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg md:w-12 md:h-12">
              <DollarSign className="w-5 h-5 text-red-600 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate md:text-sm">
                Total Cost
              </p>
              <p className="text-base font-bold text-gray-900 truncate md:text-xl">
                {formatCompactCurrency(metrics.total_cost.value)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="w-full h-full">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                  Chemical Usage Trend
                </h3>
                <p className="text-xs text-gray-600">
                  Trend penggunaan dyes dan auxiliaries
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
              initialData={trendData}
              title=""
              subtitle=""
              datasets={[
                {
                  key: "dyes",
                  label: "Dyes",
                  color: "primary",
                  type: "column",
                  stacked: true,
                },
                {
                  key: "auxiliaries",
                  label: "Auxiliaries",
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
              onFetchData={() => trendData}
              showSummary={true}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full ">
            <Highchart.HighchartsDonut
              data={chemicalSummaryTransformed}
              // centerText={{
              //   value: formatCompactCurrency(metrics.total_cost.value),
              //   label: "Total Cost",
              // }}
              title="Chemical Cost Breakdown"
              subtitle="Dyes vs Auxiliaries"
              onDrilldownRequest={async ({ _, context, depth }) => {
                return onDrilldown(context, depth);
              }}
              showSummary={true}
            />
          </Card>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        {/* Top 5 Suppliers */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                Top 5 Dyes
              </h3>
              <p className="text-xs text-gray-600">
                Dyes dengan total pemakaian tertinggi
              </p>
            </div>
          </div>

          <Highchart.HighchartsBar
            initialData={transformDataToBar(top_dyes)}
            title=""
            subtitle=""
            datasets={[
              { key: "value", label: "Total Purchases", color: "primary" },
            ]}
            periods={[]}
            showSummary={false}
          />
        </Card>

        {/* Top Auxiliaries */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                Top 5 Aux
              </h3>
              <p className="text-xs text-gray-600">
                Aux dengan total pemakaian tertinggi
              </p>
            </div>
          </div>

          <Highchart.HighchartsBar
            initialData={transformDataToBar(top_aux)}
            title=""
            subtitle=""
            datasets={[
              { key: "value", label: "Total Purchases", color: "primary" },
            ]}
            periods={[]}
            showSummary={false}
          />
        </Card>
      </div>
    </div>
  );
}
