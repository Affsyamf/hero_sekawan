import React, { useState, useRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

export function LineChart({
  data = [450, 380, 320, 420, 460, 350],
  title = "Sales Report",
  monthlyValue = 8097,
  monthlyTrend = 19.6,
  monthlySubtext = "44,214 USD",
  yearlyValue = 312134,
  yearlyTrend = 2.5,
  yearlySubtext = "301,002 USD",
  summaryData = [
    { label: "Los Angeles", value: "201,192" },
    { label: "New York", value: "192,954" },
    { label: "Canada", value: "186,901" },
  ],
  className = "",
}) {
  const { colors } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const chartWidth = 300;
  const chartHeight = 120;

  // Generate SVG path for line
  const generatePath = (points, width = chartWidth, height = chartHeight) => {
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;

    return points
      .map((point, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - ((point - minVal) / range) * height;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Generate area path
  const generateAreaPath = (
    points,
    width = chartWidth,
    height = chartHeight
  ) => {
    const linePath = generatePath(points, width, height);
    const lastX = ((points.length - 1) / (points.length - 1)) * width;
    return `${linePath} L ${lastX} ${height} L 0 ${height} Z`;
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= chartWidth && y >= 0 && y <= chartHeight) {
      const dataIndex = Math.round((x / chartWidth) * (data.length - 1));
      const clampedIndex = Math.max(0, Math.min(dataIndex, data.length - 1));

      setHoveredPoint({
        index: clampedIndex,
        value: data[clampedIndex],
      });

      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 40,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const MonthlyTrendIcon = monthlyTrend >= 0 ? TrendingUp : TrendingDown;
  const YearlyTrendIcon = yearlyTrend >= 0 ? TrendingUp : TrendingDown;

  const monthlyTrendColor =
    monthlyTrend >= 0 ? colors.status.success : colors.status.error;
  const yearlyTrendColor =
    yearlyTrend >= 0 ? colors.status.success : colors.status.error;

  return (
    <div
      className={`bg-white rounded-xl p-6 ${className}`}
      style={{
        backgroundColor: colors.background.card,
        boxShadow: colors.shadow.sm,
        border: `1px solid ${colors.border.primary}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          {title}
        </h3>
        <button
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm"
          style={{
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.border.primary}`,
            color: colors.text.secondary,
          }}
        >
          <span>Period</span>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Chart Container */}
      <div className="relative mb-6">
        <svg
          ref={svgRef}
          width={chartWidth}
          height={chartHeight}
          className="w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Gradient for area fill */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                stopColor={colors.chart.trend}
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor={colors.chart.trend}
                stopOpacity="0.05"
              />
            </linearGradient>

            {/* Dot pattern for background */}
            <pattern
              id="dots"
              patternUnits="userSpaceOnUse"
              width="4"
              height="4"
            >
              <circle
                cx="2"
                cy="2"
                r="0.5"
                fill={colors.border.primary}
                opacity="0.3"
              />
            </pattern>
          </defs>

          {/* Background dots pattern */}
          <rect width="100%" height="100%" fill="url(#dots)" opacity="0.5" />

          {/* Area under line */}
          <path d={generateAreaPath(data)} fill="url(#areaGradient)" />

          {/* Main line */}
          <path
            d={generatePath(data)}
            fill="none"
            stroke={colors.chart.trend}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const maxVal = Math.max(...data);
            const minVal = Math.min(...data);
            const range = maxVal - minVal || 1;
            const x = (index / (data.length - 1)) * chartWidth;
            const y = chartHeight - ((point - minVal) / range) * chartHeight;
            const isHovered = hoveredPoint?.index === index;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isHovered ? 5 : 4}
                fill={colors.background.card}
                stroke={colors.chart.trend}
                strokeWidth="2"
                className="transition-all cursor-pointer"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
              />
            );
          })}

          {/* Hover line */}
          {hoveredPoint && (
            <line
              x1={(hoveredPoint.index / (data.length - 1)) * chartWidth}
              y1="0"
              x2={(hoveredPoint.index / (data.length - 1)) * chartWidth}
              y2={chartHeight}
              stroke={colors.border.secondary}
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.7"
            />
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 px-2 py-1 text-xs font-medium rounded pointer-events-none"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translateX(-50%)",
              backgroundColor: colors.text.primary,
              color: colors.text.inverse,
              boxShadow: colors.shadow.md,
            }}
          >
            {hoveredPoint.value}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Monthly */}
        <div>
          <div className="flex items-center mb-1 space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.status.success }}
            ></div>
            <span
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Monthly
            </span>
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            ${monthlyValue.toLocaleString()}
          </div>
          <div className="flex items-center mt-1">
            <MonthlyTrendIcon size={14} style={{ color: monthlyTrendColor }} />
            <span
              className="ml-1 text-sm font-medium"
              style={{ color: monthlyTrendColor }}
            >
              {monthlyTrend >= 0 ? "+" : ""}
              {monthlyTrend}%
            </span>
            <span
              className="ml-2 text-sm"
              style={{ color: colors.text.tertiary }}
            >
              {monthlySubtext}
            </span>
          </div>
        </div>

        {/* Yearly */}
        <div>
          <div className="flex items-center mb-1 space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.status.warning }}
            ></div>
            <span
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Yearly
            </span>
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            ${yearlyValue.toLocaleString()}
          </div>
          <div className="flex items-center mt-1">
            <YearlyTrendIcon size={14} style={{ color: yearlyTrendColor }} />
            <span
              className="ml-1 text-sm font-medium"
              style={{ color: yearlyTrendColor }}
            >
              {yearlyTrend >= 0 ? "+" : ""}
              {yearlyTrend}%
            </span>
            <span
              className="ml-2 text-sm"
              style={{ color: colors.text.tertiary }}
            >
              {yearlySubtext}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Data */}
      <div className="space-y-3">
        {summaryData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: colors.text.secondary }}>
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
    </div>
  );
}
