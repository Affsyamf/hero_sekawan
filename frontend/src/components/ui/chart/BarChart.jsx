// components/ui/chart/BarChart.jsx
import { useTheme } from "../../../contexts/ThemeContext";

export function BarChart({ data, title, subtitle, showTrend = true }) {
  const { colors } = useTheme();

  // Find max value for scaling
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="w-full h-full p-1">
      {/* Chart Area */}
      <div className="relative h-48 mb-4">
        <div className="flex items-end justify-between h-full px-2">
          {data.map((item, index) => {
            const height = Math.max((item.value / maxValue) * 90, 4);
            const isProjection = item.type === "projection";

            return (
              <div
                key={index}
                className="relative flex flex-col items-center flex-1 group max-w-8"
              >
                {/* Tooltip */}
                <div className="absolute z-10 px-2 py-1 text-xs text-white transition-opacity transform -translate-x-1/2 bg-gray-900 rounded-md opacity-0 -top-10 left-1/2 group-hover:opacity-100 whitespace-nowrap">
                  {item.label}
                </div>

                {/* Bar */}
                <div
                  className="w-full transition-all duration-300 cursor-pointer rounded-t-md hover:opacity-80"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isProjection
                      ? `${colors.primary}40`
                      : colors.primary,
                    minHeight: "8px",
                  }}
                />

                {/* Label */}
                <div
                  className="mt-2 text-xs text-center"
                  style={{ color: colors.text.secondary }}
                >
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[25, 50, 75].map((percent) => (
            <div
              key={percent}
              className="absolute w-full border-t"
              style={{
                top: `${100 - percent}%`,
                borderColor: colors.border.primary,
                opacity: 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-xs">
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-sm mr-1.5"
            style={{ backgroundColor: colors.primary }}
          />
          <span style={{ color: colors.text.secondary }}>Actual</span>
        </div>
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-sm mr-1.5"
            style={{ backgroundColor: `${colors.primary}40` }}
          />
          <span style={{ color: colors.text.secondary }}>Projection</span>
        </div>
      </div>
    </div>
  );
}
