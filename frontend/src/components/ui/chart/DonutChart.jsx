// components/ui/chart/DonutChart.jsx
import { useTheme } from "../../../contexts/ThemeContext";

export function DonutChart({ data, title, centerText, className = "" }) {
  const { colors } = useTheme();

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartColors = [
    colors.primary,
    colors.status.warning,
    colors.status.error,
    colors.status.success,
  ];

  let cumulativePercentage = 0;

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="flex items-center justify-between h-full">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 42 42">
            {/* Background circle */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={colors.border.primary}
              strokeWidth="2.5"
              opacity="0.1"
            />

            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;

              const result = (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth="2.5"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 21 21)"
                  className="transition-all duration-300 hover:stroke-[3] cursor-pointer"
                />
              );

              cumulativePercentage += percentage;
              return result;
            })}
          </svg>

          {/* Center text */}
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: colors.text.primary }}
                >
                  {centerText.value}
                </div>
                <div
                  className="text-xs"
                  style={{ color: colors.text.secondary }}
                >
                  {centerText.label}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 ml-6 space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(0);
            return (
              <div
                key={index}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full mr-2"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: colors.text.primary }}
                  >
                    {item.label}
                  </span>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
