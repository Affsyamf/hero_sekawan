// components/ui/chart/BarChart.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

export function BarChart({
  initialData, // Data awal dari backend
  title,
  subtitle,
  showSummary = true,
  showTrend = true,
  datasets = [], // Array of dataset configs: [{ key: 'productA', label: 'Product A', color: 'primary' }]
  periods = [], // Array of available periods: ['Jun 2024', 'May 2024', 'Apr 2024']
  defaultPeriod = null, // Default period yang dipilih
  onFetchData, // Callback untuk fetch data dari backend: (period) => Promise<data>
  isLoading = false, // Optional: loading state dari parent
}) {
  const { colors } = useTheme();

  // State internal untuk handle filtering
  const [selectedPeriod, setSelectedPeriod] = useState(
    defaultPeriod || periods[0]
  );
  const [chartData, setChartData] = useState(initialData || []);
  const [loading, setLoading] = useState(false);

  // Default periods if not provided
  const availablePeriods =
    periods.length > 0
      ? periods
      : [
          "Jun 2024",
          "May 2024",
          "Apr 2024",
          "Mar 2024",
          "Feb 2024",
          "Jan 2024",
        ];

  // Set selected period to first available if not set
  useEffect(() => {
    if (!selectedPeriod && availablePeriods.length > 0) {
      setSelectedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods]);

  // Update chart data when initialData changes
  useEffect(() => {
    if (initialData) {
      setChartData(initialData);
    }
  }, [initialData]);

  // Handle period change - fetch new data from backend
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

  // Handle refresh - fetch data for current period
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

  // Jika datasets kosong, gunakan mode single dataset
  const isSingleDataset = datasets.length === 0;

  // Calculate statistics
  const calculateStats = () => {
    if (chartData.length === 0) {
      return isSingleDataset
        ? {
            highest: { value: 0, label: "-" },
            lowest: { value: 0, label: "-" },
            total: 0,
            average: 0,
            trend: 0,
          }
        : { datasets: [] };
    }

    if (isSingleDataset) {
      const values = chartData.map((item) => item.value || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = total / values.length;

      // Find highest and lowest
      const maxItem = chartData.find((item) => item.value === max);
      const minItem = chartData.find((item) => item.value === min);

      // Calculate trend (comparing last vs previous)
      const trend =
        values.length >= 2
          ? ((values[values.length - 1] - values[values.length - 2]) /
              values[values.length - 2]) *
            100
          : 0;

      return {
        highest: { value: max, label: maxItem?.label || maxItem?.month || "-" },
        lowest: { value: min, label: minItem?.label || minItem?.month || "-" },
        total,
        average: avg,
        trend,
      };
    } else {
      // Multi-dataset statistics
      const datasetStats = datasets.map((dataset) => {
        const values = chartData.map((item) => item[dataset.key] || 0);
        const total = values.reduce((sum, val) => sum + val, 0);
        return {
          key: dataset.key,
          label: dataset.label,
          total,
          color: dataset.color,
        };
      });

      return { datasets: datasetStats };
    }
  };

  const stats = calculateStats();

  // Get color from theme
  const getColor = (colorKey) => {
    if (colorKey === "primary") return colors.primary;
    if (colorKey === "success") return colors.status.success;
    if (colorKey === "warning") return colors.status.warning;
    if (colorKey === "error") return colors.status.error;
    if (colorKey === "info") return colors.status.info;
    return colorKey; // Return as is if it's a hex color
  };

  // Find max value for scaling
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

  // Format currency
  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toFixed(2)}`;
  };

  const isChartLoading = loading || isLoading;

  return (
    <div
      className="relative w-full p-2 rounded-lg md:p-2"
      style={{ backgroundColor: colors.background.card }}
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 mb-6 sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0">
          <h2
            className="mb-1 text-xl font-semibold truncate md:text-2xl"
            style={{ color: colors.text.primary }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-xs md:text-sm"
              style={{ color: colors.text.secondary }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center flex-shrink-0 gap-2">
          {periods.length > 0 && (
            <select
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md border outline-none cursor-pointer transition-colors"
              style={{
                borderColor: colors.border.primary,
                color: colors.text.primary,
                backgroundColor: colors.background.primary,
              }}
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              disabled={isChartLoading}
            >
              {availablePeriods.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleRefresh}
            disabled={isChartLoading}
            className="p-1.5 rounded-md hover:bg-opacity-20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              color: colors.primary,
              backgroundColor: `${colors.primary}10`,
            }}
          >
            <RefreshCw
              size={16}
              className={isChartLoading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isChartLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
          style={{ backgroundColor: `${colors.background.card}CC` }}
        >
          <div className="flex flex-col items-center gap-2">
            <RefreshCw
              size={32}
              className="animate-spin"
              style={{ color: colors.primary }}
            />
            <span className="text-sm" style={{ color: colors.text.secondary }}>
              Loading data...
            </span>
          </div>
        </div>
      )}

      {/* Content: Summary + Chart */}
      <div className="relative flex flex-col gap-4 lg:flex-row md:gap-6">
        {/* Summary Section */}
        {showSummary && (
          <div className="flex-shrink-0 w-full lg:w-56 xl:w-64">
            {isSingleDataset ? (
              <div className="space-y-3 md:space-y-4">
                {/* Highest */}
                <div>
                  <p
                    className="mb-2 text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {stats.highest.label} has the highest product sales
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-2xl font-bold md:text-3xl"
                      style={{ color: colors.text.primary }}
                    >
                      {formatCurrency(stats.highest.value)}
                    </span>
                  </div>
                  {showTrend && (
                    <div className="flex items-center gap-1 mt-2">
                      {stats.trend >= 0 ? (
                        <>
                          <div
                            className="flex items-center justify-center w-5 h-5 rounded-full"
                            style={{
                              backgroundColor: colors.status.successLight,
                            }}
                          >
                            <TrendingUp
                              size={12}
                              style={{ color: colors.status.success }}
                            />
                          </div>
                          <span
                            className="text-sm font-medium"
                            style={{ color: colors.status.success }}
                          >
                            +{Math.abs(stats.trend).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <div
                            className="flex items-center justify-center w-5 h-5 rounded-full"
                            style={{
                              backgroundColor: colors.status.errorLight,
                            }}
                          >
                            <TrendingDown
                              size={12}
                              style={{ color: colors.status.error }}
                            />
                          </div>
                          <span
                            className="text-sm font-medium"
                            style={{ color: colors.status.error }}
                          >
                            {stats.trend.toFixed(0)}%
                          </span>
                        </>
                      )}
                      <span
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        last month
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="h-px"
                  style={{ backgroundColor: colors.border.primary }}
                />

                {/* Lowest */}
                <div>
                  <p
                    className="mb-2 text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {stats.lowest.label} has the lowest product sales
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-2xl font-bold md:text-3xl"
                      style={{ color: colors.text.primary }}
                    >
                      {formatCurrency(stats.lowest.value)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <div
                      className="flex items-center justify-center w-5 h-5 rounded-full"
                      style={{ backgroundColor: colors.status.errorLight }}
                    >
                      <TrendingDown
                        size={12}
                        style={{ color: colors.status.error }}
                      />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.status.error }}
                    >
                      -20%
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      last month
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Multi-dataset summary
              <div className="space-y-3">
                <p
                  className="mb-3 text-sm font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Total Sales Summary
                </p>
                {stats.datasets.map((dataset, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {dataset.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div
                        className="w-1 h-6 rounded-full"
                        style={{ backgroundColor: getColor(dataset.color) }}
                      />
                      <span
                        className="text-xl font-bold md:text-2xl"
                        style={{ color: colors.text.primary }}
                      >
                        {formatCurrency(dataset.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chart Section */}
        <div className="flex-1 w-full min-w-0 overflow-hidden">
          {chartData.length === 0 ? (
            <div
              className="flex items-center justify-center h-64 rounded-lg md:h-80"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <p style={{ color: colors.text.tertiary }}>No data available</p>
            </div>
          ) : (
            <div className="w-full">
              <div className="relative h-64 md:h-80 lg:h-96">
                {/* Y-axis labels */}
                <div
                  className="absolute top-0 left-0 flex flex-col justify-between w-10 text-xs bottom-6 md:bottom-8 md:w-12"
                  style={{ color: colors.text.tertiary }}
                >
                  <span className="pr-1 text-right">
                    {formatCurrency(maxValue)}
                  </span>
                  <span className="pr-1 text-right">
                    {formatCurrency(maxValue * 0.75)}
                  </span>
                  <span className="pr-1 text-right">
                    {formatCurrency(maxValue * 0.5)}
                  </span>
                  <span className="pr-1 text-right">
                    {formatCurrency(maxValue * 0.25)}
                  </span>
                  <span className="pr-1 text-right">$0</span>
                </div>

                {/* Chart bars */}
                <div className="absolute top-0 right-0 overflow-x-auto left-10 md:left-12 bottom-6 md:bottom-8">
                  <div
                    className="flex items-end justify-between h-full px-2 md:px-4 min-w-max"
                    style={{
                      minWidth: `${
                        chartData.length * (isSingleDataset ? 50 : 70)
                      }px`,
                    }}
                  >
                    {chartData.map((item, index) => {
                      const isProjection = item.type === "projection";
                      return (
                        <div
                          key={index}
                          className="relative flex flex-col items-center flex-1 group"
                          style={{
                            maxWidth: isSingleDataset ? "50px" : "70px",
                            minWidth: isSingleDataset ? "40px" : "60px",
                          }}
                        >
                          {/* Bars container */}
                          <div className="flex items-end justify-center gap-0.5 md:gap-1 w-full h-full">
                            {isSingleDataset ? (
                              <div className="relative flex flex-col items-center flex-1">
                                {/* Tooltip */}
                                <div
                                  className="absolute z-10 px-2 md:px-3 py-1 md:py-1.5 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg"
                                  style={{
                                    backgroundColor: colors.text.primary,
                                    color: colors.text.inverse,
                                    bottom: "100%",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <div className="font-medium">
                                    {item.label || item.month}
                                  </div>
                                  <div>{formatCurrency(item.value)}</div>
                                </div>

                                <div
                                  className="w-full transition-all duration-300 rounded-t-lg cursor-pointer hover:opacity-80"
                                  style={{
                                    height: `${Math.max(
                                      (item.value / maxValue) * 100,
                                      2
                                    )}%`,
                                    backgroundColor: isProjection
                                      ? `${colors.primary}40`
                                      : colors.primary,
                                    minHeight: "4px",
                                  }}
                                />
                              </div>
                            ) : (
                              datasets.map((dataset, dsIdx) => {
                                const value = item[dataset.key] || 0;
                                const height = Math.max(
                                  (value / maxValue) * 100,
                                  2
                                );
                                return (
                                  <div
                                    key={dsIdx}
                                    className="relative flex flex-col items-center flex-1"
                                  >
                                    {/* Tooltip */}
                                    <div
                                      className="absolute z-10 px-2 md:px-3 py-1 md:py-1.5 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg"
                                      style={{
                                        backgroundColor: colors.text.primary,
                                        color: colors.text.inverse,
                                        bottom: "100%",
                                        marginBottom: "8px",
                                      }}
                                    >
                                      <div className="font-medium">
                                        {dataset.label}
                                      </div>
                                      <div>{formatCurrency(value)}</div>
                                    </div>

                                    <div
                                      className="w-full transition-all duration-300 rounded-t-lg cursor-pointer hover:opacity-80"
                                      style={{
                                        height: `${height}%`,
                                        backgroundColor: getColor(
                                          dataset.color
                                        ),
                                        minHeight: "4px",
                                      }}
                                    />
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Label */}
                          <div
                            className="w-full mt-1 text-xs font-medium text-center truncate md:mt-2"
                            style={{ color: colors.text.secondary }}
                          >
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
                    <div
                      key={percent}
                      className="absolute w-full"
                      style={{
                        top: `${100 - percent}%`,
                        borderTop: `1px dashed ${colors.border.primary}`,
                        opacity: 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Legend (dipindah ke dalam blok chart) */}
              {!isSingleDataset && chartData.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mt-4 md:gap-6">
                  {datasets.map((dataset, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: getColor(dataset.color) }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {dataset.label}
                      </span>
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
