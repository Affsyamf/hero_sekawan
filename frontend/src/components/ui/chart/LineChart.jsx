import React, { useState, useRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

export function LineChart({
  data, // For single line: Array of numbers, For dual line: Object {current: [], previous: []}
  title,
  value, // Main value to display (optional)
  trend, // Trend percentage (optional)
  trendLabel, // Custom trend label (default: "from last period")
  timestamp, // Timestamp (optional)
  period = "Week", // Period selector
  labels, // X-axis labels (optional, defaults to Mon-Sun)
  summaryData, // Summary data array (optional)
  type = "single", // "single" or "dual"
  lineConfig, // Configuration for lines (optional)
  className = "",
}) {
  const { colors } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Default line configuration
  const defaultLineConfig = {
    single: {
      color: colors.chart.earning,
      label: "Value",
      showArea: true,
    },
    dual: {
      current: {
        color: colors.primary,
        label: "Current Week",
        showArea: true,
      },
      previous: {
        color: colors.chart.trend,
        label: "Previous Week",
        showArea: true,
      },
    },
  };

  const config = lineConfig || defaultLineConfig[type];

  // Normalize data structure
  const chartData =
    type === "dual"
      ? typeof data === "object" && data.current
        ? data
        : { current: data, previous: null }
      : { single: Array.isArray(data) ? data : [] };

  // Validation untuk memastikan data yang diperlukan ada
  const primaryData = type === "dual" ? chartData.current : chartData.single;
  if (!primaryData || !Array.isArray(primaryData) || primaryData.length === 0) {
    return (
      <div
        className={`bg-white rounded-xl p-6 ${className}`}
        style={{
          backgroundColor: colors.background.card,
          boxShadow: colors.shadow.sm,
          border: `1px solid ${colors.border.primary}`,
        }}
      >
        <div
          className="py-8 text-center"
          style={{ color: colors.text.secondary }}
        >
          No data available
        </div>
      </div>
    );
  }

  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 40, right: 60, bottom: 80, left: 80 };

  // Calculate chart dimensions
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Default labels
  const defaultLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const xAxisLabels = labels || defaultLabels;

  // Get all data points for scaling
  let allData = [...primaryData];
  if (type === "dual" && chartData.previous) {
    allData = [...allData, ...chartData.previous];
  }

  const maxVal = Math.max(...allData);
  const minVal = Math.min(...allData);
  const range = maxVal - minVal || 1;

  // Generate Y-axis labels
  const yAxisLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = minVal + (range * i) / 4;
    yAxisLabels.push(value);
  }

  // Generate path for line
  const generatePath = (points) => {
    return points
      .map((point, index) => {
        const x = (index / (points.length - 1)) * innerWidth;
        const y = innerHeight - ((point - minVal) / range) * innerHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Generate area path
  const generateAreaPath = (points) => {
    const linePath = generatePath(points);
    const lastX = ((points.length - 1) / (points.length - 1)) * innerWidth;
    return `${linePath} L ${lastX} ${innerHeight} L 0 ${innerHeight} Z`;
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - padding.left;
    const y = e.clientY - rect.top - padding.top;

    if (x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight) {
      const dataIndex = Math.round((x / innerWidth) * (primaryData.length - 1));
      const clampedIndex = Math.max(
        0,
        Math.min(dataIndex, primaryData.length - 1)
      );

      const hoverData = {
        index: clampedIndex,
        label: xAxisLabels[clampedIndex] || `Point ${clampedIndex + 1}`,
      };

      if (type === "dual") {
        hoverData.current = primaryData[clampedIndex];
        hoverData.previous = chartData.previous
          ? chartData.previous[clampedIndex]
          : null;
      } else {
        hoverData.value = primaryData[clampedIndex];
      }

      setHoveredPoint(hoverData);
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 20,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const trendColor = trend >= 0 ? colors.status.success : colors.status.error;
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className={`bg-white rounded-2xl p-6 ${className}`}
      style={{
        backgroundColor: colors.background.card,
        boxShadow: colors.shadow.md,
        border: `1px solid ${colors.border.primary}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="mb-1 text-xl font-semibold"
            style={{ color: colors.text.primary }}
          >
            {title}
          </h2>

          {/* Legend */}
          <div className="flex items-center space-x-6">
            {type === "single" ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                ></div>
                <span
                  className="text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  {config.label}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.current.color }}
                  ></div>
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {config.current.label}
                  </span>
                </div>
                {chartData.previous && (
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.previous.color }}
                    ></div>
                    <span
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {config.previous.label}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <button
          className="flex items-center px-4 py-2 space-x-2 rounded-lg"
          style={{
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.border.primary}`,
            color: colors.text.secondary,
          }}
        >
          <span className="text-sm font-medium">{period}</span>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Value & Trend Display */}
      {(value !== undefined || trend !== undefined) && (
        <div className="mb-8">
          {value !== undefined && (
            <div
              className="mb-2 text-3xl font-bold"
              style={{ color: colors.text.primary }}
            >
              {typeof value === "number" ? `$${value.toLocaleString()}` : value}
            </div>
          )}

          {trend !== undefined && (
            <div className="flex items-center mb-2 space-x-2">
              <TrendIcon size={16} style={{ color: trendColor }} />
              <span className="font-medium" style={{ color: trendColor }}>
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
              <span
                className="text-sm"
                style={{ color: colors.text.secondary }}
              >
                {trendLabel || "from last period"}
              </span>
            </div>
          )}

          {timestamp && (
            <div className="text-sm" style={{ color: colors.text.secondary }}>
              {timestamp}
            </div>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg
          ref={svgRef}
          width={chartWidth}
          height={chartHeight}
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Single line gradient */}
            {type === "single" && (
              <linearGradient
                id="singleGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.color} stopOpacity="0.2" />
                <stop
                  offset="100%"
                  stopColor={config.color}
                  stopOpacity="0.02"
                />
              </linearGradient>
            )}

            {/* Dual line gradients */}
            {type === "dual" && (
              <>
                <linearGradient
                  id="currentGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={config.current.color}
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor={config.current.color}
                    stopOpacity="0.02"
                  />
                </linearGradient>
                <linearGradient
                  id="previousGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={config.previous.color}
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor={config.previous.color}
                    stopOpacity="0.02"
                  />
                </linearGradient>
              </>
            )}
          </defs>

          {/* Chart area */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            <g stroke={colors.border.primary} strokeWidth="1">
              {yAxisLabels.map((_, index) => {
                const y =
                  innerHeight -
                  (index / (yAxisLabels.length - 1)) * innerHeight;
                return (
                  <line
                    key={index}
                    x1="0"
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    opacity="0.3"
                  />
                );
              })}
            </g>

            {/* Y-axis labels */}
            {yAxisLabels.map((label, index) => {
              const y =
                innerHeight - (index / (yAxisLabels.length - 1)) * innerHeight;
              return (
                <text
                  key={index}
                  x="-20"
                  y={y + 4}
                  textAnchor="end"
                  className="text-sm"
                  style={{ fill: colors.text.secondary }}
                >
                  ${Math.round(label).toLocaleString()}
                </text>
              );
            })}

            {/* Area fills */}
            {type === "single" && config.showArea && (
              <path
                d={generateAreaPath(primaryData)}
                fill="url(#singleGradient)"
              />
            )}

            {type === "dual" && (
              <>
                {chartData.previous && config.previous.showArea && (
                  <path
                    d={generateAreaPath(chartData.previous)}
                    fill="url(#previousGradient)"
                  />
                )}
                {config.current.showArea && (
                  <path
                    d={generateAreaPath(primaryData)}
                    fill="url(#currentGradient)"
                  />
                )}
              </>
            )}

            {/* Lines */}
            {type === "single" ? (
              <path
                d={generatePath(primaryData)}
                fill="none"
                stroke={config.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <>
                {chartData.previous && (
                  <path
                    d={generatePath(chartData.previous)}
                    fill="none"
                    stroke={config.previous.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <path
                  d={generatePath(primaryData)}
                  fill="none"
                  stroke={config.current.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Data points */}
            {type === "single" ? (
              primaryData.map((point, index) => {
                const x = (index / (primaryData.length - 1)) * innerWidth;
                const y =
                  innerHeight - ((point - minVal) / range) * innerHeight;
                const isHovered = hoveredPoint?.index === index;

                return (
                  <circle
                    key={`single-${index}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill={colors.background.card}
                    stroke={config.color}
                    strokeWidth="3"
                    className="transition-all cursor-pointer"
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                  />
                );
              })
            ) : (
              <>
                {/* Current week points */}
                {primaryData.map((point, index) => {
                  const x = (index / (primaryData.length - 1)) * innerWidth;
                  const y =
                    innerHeight - ((point - minVal) / range) * innerHeight;
                  const isHovered = hoveredPoint?.index === index;

                  return (
                    <circle
                      key={`current-${index}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill={colors.background.card}
                      stroke={config.current.color}
                      strokeWidth="3"
                      className="transition-all cursor-pointer"
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      }}
                    />
                  );
                })}

                {/* Previous week points */}
                {chartData.previous &&
                  chartData.previous.map((point, index) => {
                    const x =
                      (index / (chartData.previous.length - 1)) * innerWidth;
                    const y =
                      innerHeight - ((point - minVal) / range) * innerHeight;
                    const isHovered = hoveredPoint?.index === index;

                    return (
                      <circle
                        key={`previous-${index}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill={colors.background.card}
                        stroke={config.previous.color}
                        strokeWidth="3"
                        className="transition-all cursor-pointer"
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                        }}
                      />
                    );
                  })}
              </>
            )}

            {/* Hover line */}
            {hoveredPoint && (
              <line
                x1={
                  (hoveredPoint.index / (primaryData.length - 1)) * innerWidth
                }
                y1="0"
                x2={
                  (hoveredPoint.index / (primaryData.length - 1)) * innerWidth
                }
                y2={innerHeight}
                stroke={colors.text.tertiary}
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.7"
              />
            )}

            {/* X-axis labels */}
            {xAxisLabels.slice(0, primaryData.length).map((label, index) => {
              const x = (index / (primaryData.length - 1)) * innerWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={innerHeight + 30}
                  textAnchor="middle"
                  className="text-sm"
                  style={{ fill: colors.text.secondary }}
                >
                  {label}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 p-3 bg-white border rounded-lg shadow-lg pointer-events-none"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translateX(-50%)",
              borderColor: colors.border.primary,
              backgroundColor: colors.background.card,
              boxShadow: colors.shadow.md,
            }}
          >
            <div
              className="mb-1 text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              {hoveredPoint.label}
            </div>

            {type === "single" ? (
              <div className="text-sm" style={{ color: colors.text.secondary }}>
                ${hoveredPoint.value?.toLocaleString()}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.current.color }}
                  ></div>
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    ${hoveredPoint.current?.toLocaleString()}
                  </span>
                </div>
                {hoveredPoint.previous && (
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.previous.color }}
                    ></div>
                    <span
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      ${hoveredPoint.previous?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Data */}
      {summaryData && summaryData.length > 0 && (
        <div className="mt-8 space-y-3">
          {summaryData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span
                className="text-sm"
                style={{ color: colors.text.secondary }}
              >
                {item.label}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
