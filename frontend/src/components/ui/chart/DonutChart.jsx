// components/ui/chart/DonutChart.jsx
import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import Card from "../card/Card";

export function DonutChart({
  data,
  title = "Data Overview",
  subtitle,
  centerText, // { value: "16,424", label: "Total kg" }
  centerLabel = "Total", // Fallback if centerText not provided
  filterOptions = [],
  onFilterChange,
  className = "",
}) {
  const { colors } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(
    filterOptions[0]?.value || "all"
  );

  // Fallback colors
  const primaryColor = colors?.primary || "#3b82f6";
  const warningColor = colors?.status?.warning || "#f59e0b";
  const successColor = colors?.status?.success || "#10b981";
  const borderPrimary = colors?.border?.primary || "#e5e7eb";
  const bgPrimary = colors?.background?.primary || "#ffffff";
  const bgSecondary = colors?.background?.secondary || "#f9fafb";
  const textPrimary = colors?.text?.primary || "#111827";
  const textSecondary = colors?.text?.secondary || "#6b7280";

  const chartColors = [
    primaryColor,
    warningColor,
    "#64B5F6", // Light Blue
    "#FFD54F", // Yellow
    "#BA68C8", // Purple
    "#F48FB1", // Pink
    successColor,
    "#FFB74D", // Amber
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  let cumulativePercentage = 0;

  return (
    <Card className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold truncate md:text-base"
            style={{ color: textPrimary }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="mt-0.5 text-xs truncate"
              style={{ color: textSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Filter Dropdown */}
        {filterOptions.length > 0 && (
          <div className="flex items-center ml-2">
            <select
              value={selectedFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-2.5 py-1 text-xs border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              style={{
                backgroundColor: bgPrimary,
                color: textPrimary,
                borderColor: borderPrimary,
              }}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg
            width="180"
            height="180"
            viewBox="0 0 42 42"
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={borderPrimary}
              strokeWidth="3"
              opacity="0.3"
            />

            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              const isHovered = hoveredIndex === index;

              const result = (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={isHovered ? "3.5" : "3"}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );

              cumulativePercentage += percentage;
              return result;
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {centerText ? (
                <>
                  <div
                    className="text-xl font-bold md:text-2xl"
                    style={{ color: textPrimary }}
                  >
                    {centerText.value}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: textSecondary }}
                  >
                    {centerText.label}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="text-xl font-bold md:text-2xl"
                    style={{ color: textPrimary }}
                  >
                    {formatValue(total)}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: textSecondary }}
                  >
                    {centerLabel}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute top-0 z-10 px-2.5 py-1.5 mb-2 text-xs transform -translate-x-1/2 -translate-y-full rounded-lg shadow-lg left-1/2 whitespace-nowrap"
              style={{
                backgroundColor: textPrimary,
                color: bgPrimary,
              }}
            >
              <div className="font-medium">{data[hoveredIndex].label}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold">
                  {formatValue(data[hoveredIndex].value)}
                </span>
                <span style={{ opacity: 0.7 }}>
                  ({((data[hoveredIndex].value / total) * 100).toFixed(1)}%)
                </span>
              </div>
              {/* Arrow */}
              <div className="absolute bottom-0 transform -translate-x-1/2 translate-y-full left-1/2">
                <div
                  className="border-4 border-transparent"
                  style={{ borderTopColor: textPrimary }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col w-full gap-2 lg:min-w-[180px] lg:max-w-[220px]">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-1.5 transition-all duration-200 rounded-lg cursor-pointer"
                style={{
                  backgroundColor: isHovered
                    ? bgSecondary
                    : "transparent",
                  opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center flex-1 min-w-0 gap-1.5">
                  <div
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: textPrimary }}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center flex-shrink-0 gap-1.5 ml-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: textPrimary }}
                  >
                    {formatValue(item.value)}
                  </span>
                  <span
                    className="text-xs min-w-[40px] text-right"
                    style={{ color: textSecondary }}
                  >
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}