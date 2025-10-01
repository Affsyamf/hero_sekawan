// components/ui/chart/DonutChart.jsx
import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import Card from "../card/Card";

export function DonutChart({
  data,
  title = "Data Overview",
  subtitle,
  centerLabel = "Total",
  filterOptions = [],
  onFilterChange,
  className = "",
}) {
  const { colors } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(
    filterOptions[0]?.value || "all"
  );

  const chartColors = [
    colors.primary,
    colors.status.warning,
    "#64B5F6", // Light Blue
    "#FFD54F", // Yellow
    "#BA68C8", // Purple
    "#F48FB1", // Pink
    colors.status.success,
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
    // <div
    //   className={`rounded-xl shadow-sm border p-4 ${className}`}
    //   style={{
    //     backgroundColor: colors.background.primary,
    //     borderColor: colors.border.primary,
    //   }}
    // >
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="mt-1 text-sm"
              style={{ color: colors.text.secondary }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Filter Dropdown */}
        {filterOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              style={{
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
                borderColor: colors.border.primary,
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
      <div className="flex items-center justify-center gap-8">
        {/* Donut Chart */}
        <div className="relative">
          <svg
            width="260"
            height="260"
            viewBox="0 0 42 42"
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={colors.border.primary}
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
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                {formatValue(total)}
              </div>
              <div
                className="mt-1 text-sm"
                style={{ color: colors.text.secondary }}
              >
                {centerLabel}
              </div>
            </div>
          </div>

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute top-0 z-10 px-3 py-2 mb-2 text-sm transform -translate-x-1/2 -translate-y-full rounded-lg shadow-lg left-1/2 whitespace-nowrap"
              style={{
                backgroundColor: colors.text.primary,
                color: colors.background.primary,
              }}
            >
              <div className="font-medium">{data[hoveredIndex].label}</div>
              <div className="flex items-center gap-2 mt-1">
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
                  style={{ borderTopColor: colors.text.primary }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 transition-all duration-200 rounded-lg cursor-pointer"
                style={{
                  backgroundColor: isHovered
                    ? colors.background.secondary
                    : "transparent",
                  opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center flex-1 gap-2">
                  <div
                    className="flex-shrink-0 w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {formatValue(item.value)}
                  </span>
                  <span
                    className="text-xs min-w-[45px] text-right"
                    style={{ color: colors.text.secondary }}
                  >
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    {/* </div> */}
    </Card>
  );
}
