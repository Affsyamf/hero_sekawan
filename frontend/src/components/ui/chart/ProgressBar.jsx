// components/ui/chart/ProgressBar.jsx
import { useTheme } from "../../../contexts/ThemeContext";

export function ProgressBar({ label, value, maxValue, color = "primary", showPercentage = true }) {
  const { colors } = useTheme();
  
  const percentage = (value / maxValue) * 100;
  
  const getBarColor = () => {
    switch (color) {
      case 'success': return colors.status.success;
      case 'warning': return colors.status.warning;
      case 'error': return colors.status.error;
      case 'info': return colors.status.info;
      default: return colors.primary;
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm" style={{ color: colors.text.secondary }}>
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <div 
        className="w-full h-2 rounded-full"
        style={{ backgroundColor: colors.background.tertiary }}
      >
        <div
          className="h-2 transition-all duration-500 rounded-full"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getBarColor()
          }}
        />
      </div>
    </div>
  );
}
