// components/ui/chart/BarChart.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { formatCompactCurrency } from "../../../utils/helpers";

export function BarChart({
  initialData,
  title,
  subtitle,
  showSummary = true,
  showTrend = true,
  datasets = [],
  periods = [],
  defaultPeriod = null,
  onFetchData,
  isLoading = false,
}) {
  const { colors } = useTheme();

  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod || periods[0]);
  const [chartData, setChartData] = useState(initialData || []);
  const [loading, setLoading] = useState(false);

  const availablePeriods = periods.length > 0 ? periods : ["Jun 2024", "May 2024", "Apr 2024", "Mar 2024", "Feb 2024", "Jan 2024"];

  useEffect(() => {
    if (!selectedPeriod && availablePeriods.length > 0) {
      setSelectedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods]);

  useEffect(() => {
    if (initialData) {
      setChartData(initialData);
    }
  }, [initialData]);

  const handlePeriodChange = async (newPeriod) => {
    setSelectedPeriod(newPeriod);
    if (onFetchData) {
      setLoading(true);
      try {
        const newData = await onFetchData(newPeriod);
        setChartData(newData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    if (onFetchData) {
      setLoading(true);
      try {
        const newData = await onFetchData(selectedPeriod);
        setChartData(newData);
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const isSingleDataset = datasets.length === 0;

  const calculateStats = () => {
    if (chartData.length === 0) {
      return isSingleDataset
        ? { highest: { value: 0, label: "-" }, lowest: { value: 0, label: "-" }, total: 0, average: 0, trend: 0 }
        : { datasets: [] };
    }

    if (isSingleDataset) {
      const values = chartData.map((item) => item.value || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = total / values.length;

      const maxItem = chartData.find((item) => item.value === max);
      const minItem = chartData.find((item) => item.value === min);

      const trend = values.length >= 2 ? ((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2]) * 100 : 0;

      return {
        highest: { value: max, label: maxItem?.label || maxItem?.month || "-" },
        lowest: { value: min, label: minItem?.label || minItem?.month || "-" },
        total,
        average: avg,
        trend,
      };
    } else {
      const datasetStats = datasets.map((dataset) => {
        const values = chartData.map((item) => item[dataset.key] || 0);
        const total = values.reduce((sum, val) => sum + val, 0);
        return { key: dataset.key, label: dataset.label, total, color: dataset.color };
      });
      return { datasets: datasetStats };
    }
  };

  const stats = calculateStats();

  const getColor = (colorKey) => {
    const fallbackColors = {
      primary: "#3b82f6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#0ea5e9"
    };

    if (colorKey === "primary") return colors?.primary || fallbackColors.primary;
    if (colorKey === "success") return colors?.status?.success || fallbackColors.success;
    if (colorKey === "warning") return colors?.status?.warning || fallbackColors.warning;
    if (colorKey === "error") return colors?.status?.error || fallbackColors.error;
    if (colorKey === "info") return colors?.status?.info || fallbackColors.info;
    return colorKey;
  };

  const getMaxValue = () => {
    if (chartData.length === 0) return 1;

    if (isSingleDataset) {
      return Math.max(...chartData.map((item) => item.value || 0), 1);
    } else {
      let max = 0;
      chartData.forEach((item) => {
        datasets.forEach((dataset) => {
          if (item[dataset.key] > max) max = item[dataset.key];
        });
      });
      return max || 1;
    }
  };

  const maxValue = getMaxValue();
  const isChartLoading = loading || isLoading;

  // Fallback colors
  const bgCard = colors?.background?.card || "#ffffff";
  const bgPrimary = colors?.background?.primary || "#ffffff";
  const bgSecondary = colors?.background?.secondary || "#f9fafb";
  const borderPrimary = colors?.border?.primary || "#e5e7eb";
  const textPrimary = colors?.text?.primary || "#111827";
  const textSecondary = colors?.text?.secondary || "#6b7280";
  const textTertiary = colors?.text?.tertiary || "#9ca3af";
  const textInverse = colors?.text?.inverse || "#ffffff";
  const primaryColor = colors?.primary || "#3b82f6";
  const successColor = colors?.status?.success || "#10b981";
  const successLight = colors?.status?.successLight || "#d1fae5";
  const errorColor = colors?.status?.error || "#ef4444";
  const errorLight = colors?.status?.errorLight || "#fee2e2";

  return (
    <div className="relative w-full p-1 rounded-lg" style={{ backgroundColor: bgCard }}>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-2 mb-4 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <h2 className="mb-0.5 text-sm md:text-base font-semibold truncate" style={{ color: textPrimary }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center flex-shrink-0 gap-2">
          {periods.length > 0 && (
            <select
              className="px-2.5 py-1 text-xs rounded-md border outline-none cursor-pointer transition-colors"
              style={{
                borderColor: borderPrimary,
                color: textPrimary,
                backgroundColor: bgPrimary,
              }}
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              disabled={isChartLoading}
            >
              {availablePeriods.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleRefresh}
            disabled={isChartLoading}
            className="p-1 transition-all rounded-md hover:bg-opacity-20 disabled:opacity-50"
            style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}
          >
            <RefreshCw size={14} className={isChartLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isChartLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg" style={{ backgroundColor: `${bgCard}CC` }}>
          <div className="flex flex-col items-center gap-2">
            <RefreshCw size={28} className="animate-spin" style={{ color: primaryColor }} />
            <span className="text-xs" style={{ color: textSecondary }}>Loading data...</span>
          </div>
        </div>
      )}

      {/* Content: Summary + Chart */}
      <div className="relative flex flex-col gap-4 lg:flex-row">
        {/* Summary Section - Compact */}
        {showSummary && (
          <div className="flex-shrink-0 w-full lg:w-40">
            {isSingleDataset ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs" style={{ color: textSecondary }}>
                    {stats.highest.label} has the highest product sales
                  </p>
                  <span className="text-xl font-bold" style={{ color: textPrimary }}>
                    {formatCompactCurrency(stats.highest.value)}
                  </span>
                  {showTrend && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {stats.trend >= 0 ? (
                        <>
                          <div className="flex items-center justify-center w-4 h-4 rounded-full" style={{ backgroundColor: successLight }}>
                            <TrendingUp size={10} style={{ color: successColor }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: successColor }}>
                            +{Math.abs(stats.trend).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center w-4 h-4 rounded-full" style={{ backgroundColor: errorLight }}>
                            <TrendingDown size={10} style={{ color: errorColor }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: errorColor }}>
                            {stats.trend.toFixed(0)}%
                          </span>
                        </>
                      )}
                      <span className="text-xs" style={{ color: textSecondary }}>last month</span>
                    </div>
                  )}
                </div>

                <div className="h-px" style={{ backgroundColor: borderPrimary }} />

                <div>
                  <p className="mb-1.5 text-xs" style={{ color: textSecondary }}>
                    {stats.lowest.label} has the lowest product sales
                  </p>
                  <span className="text-xl font-bold" style={{ color: textPrimary }}>
                    {formatCompactCurrency(stats.lowest.value)}
                  </span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full" style={{ backgroundColor: errorLight }}>
                      <TrendingDown size={10} style={{ color: errorColor }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: errorColor }}>-20%</span>
                    <span className="text-xs" style={{ color: textSecondary }}>last month</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: textPrimary }}>
                  Total Sales Summary
                </p>
                {stats.datasets.map((dataset, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <span className="text-xs" style={{ color: textSecondary }}>{dataset.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-6 rounded-full" style={{ backgroundColor: getColor(dataset.color) }} />
                      <span className="text-lg font-bold" style={{ color: textPrimary }}>
                        {formatCompactCurrency(dataset.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chart Section */}
        <div className="flex-1 w-full min-w-0">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg h-52" style={{ backgroundColor: bgSecondary }}>
              <p className="text-xs" style={{ color: textTertiary }}>No data available</p>
            </div>
          ) : (
            <div className="w-full">
              <div className="relative h-52">
                {/* Y-axis */}
                <div className="absolute top-0 left-0 flex flex-col justify-between w-10 text-xs bottom-6" style={{ color: textTertiary }}>
                  <span className="pr-1.5 text-right">{formatCompactCurrency(maxValue)}</span>
                  <span className="pr-1.5 text-right">{formatCompactCurrency(maxValue * 0.75)}</span>
                  <span className="pr-1.5 text-right">{formatCompactCurrency(maxValue * 0.5)}</span>
                  <span className="pr-1.5 text-right">{formatCompactCurrency(maxValue * 0.25)}</span>
                  <span className="pr-1.5 text-right">$0</span>
                </div>

                {/* Chart bars */}
                <div className="absolute top-0 right-0 overflow-x-auto bottom-6 left-10">
                  <div className="flex items-end justify-around h-full px-2">
                    {chartData.map((item, index) => {
                      const isProjection = item.type === "projection";
                      return (
                        <div key={index} className="relative flex flex-col items-center group" style={{ width: isSingleDataset ? "36px" : "48px" }}>
                          <div className="flex items-end justify-center w-full h-full gap-0.5">
                            {isSingleDataset ? (
                              <div className="relative flex flex-col items-center flex-1">
                                <div className="absolute z-10 px-2 py-1 text-xs transition-opacity rounded-md shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap" style={{ backgroundColor: textPrimary, color: textInverse, bottom: "100%", marginBottom: "6px" }}>
                                  <div className="font-medium">{item.label || item.month}</div>
                                  <div>{formatCompactCurrency(item.value)}</div>
                                </div>
                                <div className="w-full transition-all duration-300 cursor-pointer rounded-t-md hover:opacity-80" style={{ height: `${Math.max((item.value / maxValue) * 100, 2)}%`, backgroundColor: isProjection ? `${primaryColor}40` : primaryColor, minHeight: "3px" }} />
                              </div>
                            ) : (
                              datasets.map((dataset, dsIdx) => {
                                const value = item[dataset.key] || 0;
                                const height = Math.max((value / maxValue) * 100, 2);
                                return (
                                  <div key={dsIdx} className="relative flex flex-col items-center flex-1">
                                    <div className="absolute z-10 px-2 py-1 text-xs transition-opacity rounded-md shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap" style={{ backgroundColor: textPrimary, color: textInverse, bottom: "100%", marginBottom: "6px" }}>
                                      <div className="font-medium">{dataset.label}</div>
                                      <div>{formatCompactCurrency(value)}</div>
                                    </div>
                                    <div className="w-full transition-all duration-300 cursor-pointer rounded-t-md hover:opacity-80" style={{ height: `${height}%`, backgroundColor: getColor(dataset.color), minHeight: "3px" }} />
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <div className="w-full mt-1.5 text-xs font-medium text-center truncate" style={{ color: textSecondary }}>
                            {item.label || item.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <div key={percent} className="absolute w-full" style={{ top: `${100 - percent}%`, borderTop: `1px dashed ${borderPrimary}`, opacity: 0.2 }} />
                  ))}
                </div>
              </div>

              {/* Legend */}
              {!isSingleDataset && chartData.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  {datasets.map((dataset, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getColor(dataset.color) }} />
                      <span className="text-xs" style={{ color: textSecondary }}>{dataset.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}