import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

export function LineChart({
  data, // For single line: Array of numbers, For dual line: Object {current: [], previous: []}
  title,
  value, // Main value to display (optional)
  trend, // Trend percentage (optional)
  trendLabel = "from last period", // Custom trend label
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
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 240 });
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Responsive chart sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setChartDimensions({
          width: Math.max(300, width),
          height: 240
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Default line configuration with fallbacks
  const defaultLineConfig = {
    single: {
      color: colors?.chart?.earning || "#3b82f6",
      label: "Value",
      showArea: true,
    },
    dual: {
      current: {
        color: colors?.primary || "#3b82f6",
        label: "Current Week",
        showArea: true,
      },
      previous: {
        color: colors?.chart?.trend || "#8b5cf6",
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
        className={`rounded-lg p-4 ${className}`}
        style={{
          backgroundColor: colors?.background?.card || "#ffffff",
          boxShadow: colors?.shadow?.sm || "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          border: `1px solid ${colors?.border?.primary || "#e5e7eb"}`,
        }}
      >
        <div
          className="py-8 text-sm text-center"
          style={{ color: colors?.text?.secondary || "#6b7280" }}
        >
          No data available
        </div>
      </div>
    );
  }

  const chartWidth = chartDimensions.width;
  const chartHeight = chartDimensions.height;
  const padding = { top: 20, right: 40, bottom: 50, left: 60 };

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

  // Generate Y-axis labels (4 levels)
  const yAxisLabels = [];
  for (let i = 0; i <= 3; i++) {
    const value = minVal + (range * i) / 3;
    yAxisLabels.push(value);
  }

  // Generate path for line
  const generatePath = (points) => {
    if (!points || points.length === 0) return "";
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
    if (!points || points.length === 0) return "";
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
      const clampedIndex = Math.max(0, Math.min(dataIndex, primaryData.length - 1));

      const hoverData = {
        index: clampedIndex,
        label: xAxisLabels[clampedIndex] || `Point ${clampedIndex + 1}`,
      };

      if (type === "dual") {
        hoverData.current = primaryData[clampedIndex];
        hoverData.previous = chartData.previous ? chartData.previous[clampedIndex] : null;
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

  const trendColor = trend >= 0 
    ? (colors?.status?.success || "#10b981")
    : (colors?.status?.error || "#ef4444");
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;

  // Fallback colors
  const bgCard = colors?.background?.card || "#ffffff";
  const borderPrimary = colors?.border?.primary || "#e5e7eb";
  const bgSecondary = colors?.background?.secondary || "#f9fafb";
  const textPrimary = colors?.text?.primary || "#111827";
  const textSecondary = colors?.text?.secondary || "#6b7280";
  const textTertiary = colors?.text?.tertiary || "#9ca3af";
  const shadowMd = colors?.shadow?.md || "0 4px 6px -1px rgb(0 0 0 / 0.1)";

  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: bgCard,
        boxShadow: shadowMd,
        border: `1px solid ${borderPrimary}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2
            className="mb-1 text-sm font-semibold truncate md:text-base"
            style={{ color: textPrimary }}
          >
            {title}
          </h2>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {type === "single" ? (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs" style={{ color: textSecondary }}>
                  {config.label}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.current.color }}
                  />
                  <span className="text-xs" style={{ color: textSecondary }}>
                    {config.current.label}
                  </span>
                </div>
                {chartData.previous && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config.previous.color }}
                    />
                    <span className="text-xs" style={{ color: textSecondary }}>
                      {config.previous.label}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: bgSecondary,
            border: `1px solid ${borderPrimary}`,
            color: textSecondary,
          }}
        >
          <span className="text-xs font-medium">{period}</span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Value & Trend Display */}
      {(value !== undefined || trend !== undefined) && (
        <div className="mb-4">
          {value !== undefined && (
            <div
              className="mb-1 text-xl font-bold md:text-2xl"
              style={{ color: textPrimary }}
            >
              {typeof value === "number" ? `$${value.toLocaleString()}` : value}
            </div>
          )}

          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mb-1">
              <TrendIcon size={14} style={{ color: trendColor }} />
              <span className="text-xs font-medium" style={{ color: trendColor }}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
              <span className="text-xs" style={{ color: textSecondary }}>
                {trendLabel}
              </span>
            </div>
          )}

          {timestamp && (
            <div className="text-xs" style={{ color: textSecondary }}>
              {timestamp}
            </div>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div ref={containerRef} className="relative w-full" style={{ height: `${chartHeight}px` }}>
        <svg
          ref={svgRef}
          width={chartWidth}
          height={chartHeight}
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Gradients */}
            {type === "single" && (
              <linearGradient id="singleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={config.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={config.color} stopOpacity="0.02" />
              </linearGradient>
            )}

            {type === "dual" && (
              <>
                <linearGradient id="currentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={config.current.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={config.current.color} stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="previousGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={config.previous.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={config.previous.color} stopOpacity="0.02" />
                </linearGradient>
              </>
            )}
          </defs>

          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            <g stroke={borderPrimary} strokeWidth="1">
              {yAxisLabels.map((_, index) => {
                const y = innerHeight - (index / (yAxisLabels.length - 1)) * innerHeight;
                return (
                  <line key={index} x1="0" y1={y} x2={innerWidth} y2={y} opacity="0.3" />
                );
              })}
            </g>

            {/* Y-axis labels */}
            {yAxisLabels.map((label, index) => {
              const y = innerHeight - (index / (yAxisLabels.length - 1)) * innerHeight;
              return (
                <text
                  key={index}
                  x="-12"
                  y={y + 3}
                  textAnchor="end"
                  className="text-xs"
                  style={{ fill: textSecondary }}
                >
                  ${Math.round(label).toLocaleString()}
                </text>
              );
            })}

            {/* Area fills */}
            {type === "single" && config.showArea && (
              <path d={generateAreaPath(primaryData)} fill="url(#singleGradient)" />
            )}

            {type === "dual" && (
              <>
                {chartData.previous && config.previous.showArea && (
                  <path d={generateAreaPath(chartData.previous)} fill="url(#previousGradient)" />
                )}
                {config.current.showArea && (
                  <path d={generateAreaPath(primaryData)} fill="url(#currentGradient)" />
                )}
              </>
            )}

            {/* Lines */}
            {type === "single" ? (
              <path
                d={generatePath(primaryData)}
                fill="none"
                stroke={config.color}
                strokeWidth="2"
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
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <path
                  d={generatePath(primaryData)}
                  fill="none"
                  stroke={config.current.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Data points */}
            {type === "single" ? (
              primaryData.map((point, index) => {
                const x = (index / (primaryData.length - 1)) * innerWidth;
                const y = innerHeight - ((point - minVal) / range) * innerHeight;
                const isHovered = hoveredPoint?.index === index;

                return (
                  <circle
                    key={`single-${index}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3}
                    fill={bgCard}
                    stroke={config.color}
                    strokeWidth="2"
                    className="transition-all cursor-pointer"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
                  />
                );
              })
            ) : (
              <>
                {primaryData.map((point, index) => {
                  const x = (index / (primaryData.length - 1)) * innerWidth;
                  const y = innerHeight - ((point - minVal) / range) * innerHeight;
                  const isHovered = hoveredPoint?.index === index;

                  return (
                    <circle
                      key={`current-${index}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      fill={bgCard}
                      stroke={config.current.color}
                      strokeWidth="2"
                      className="transition-all cursor-pointer"
                    />
                  );
                })}

                {chartData.previous && chartData.previous.map((point, index) => {
                  const x = (index / (chartData.previous.length - 1)) * innerWidth;
                  const y = innerHeight - ((point - minVal) / range) * innerHeight;
                  const isHovered = hoveredPoint?.index === index;

                  return (
                    <circle
                      key={`previous-${index}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      fill={bgCard}
                      stroke={config.previous.color}
                      strokeWidth="2"
                      className="transition-all cursor-pointer"
                    />
                  );
                })}
              </>
            )}

            {/* Hover line */}
            {hoveredPoint && (
              <line
                x1={(hoveredPoint.index / (primaryData.length - 1)) * innerWidth}
                y1="0"
                x2={(hoveredPoint.index / (primaryData.length - 1)) * innerWidth}
                y2={innerHeight}
                stroke={textTertiary}
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />
            )}

            {/* X-axis labels */}
            {xAxisLabels.slice(0, primaryData.length).map((label, index) => {
              const x = (index / (primaryData.length - 1)) * innerWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  className="text-xs"
                  style={{ fill: textSecondary }}
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
            className="absolute z-10 p-2 bg-white border rounded-lg shadow-lg pointer-events-none"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translateX(-50%)",
              borderColor: borderPrimary,
              backgroundColor: bgCard,
              boxShadow: shadowMd,
            }}
          >
            <div className="mb-0.5 text-xs font-medium" style={{ color: textPrimary }}>
              {hoveredPoint.label}
            </div>

            {type === "single" ? (
              <div className="text-xs" style={{ color: textSecondary }}>
                ${hoveredPoint.value?.toLocaleString()}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.current.color }}
                  />
                  <span className="text-xs" style={{ color: textSecondary }}>
                    ${hoveredPoint.current?.toLocaleString()}
                  </span>
                </div>
                {hoveredPoint.previous && (
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.previous.color }}
                    />
                    <span className="text-xs" style={{ color: textSecondary }}>
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
        <div className="mt-4 space-y-2">
          {summaryData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: textSecondary }}>
                {item.label}
              </span>
              <span className="text-xs font-medium" style={{ color: textPrimary }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}