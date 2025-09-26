// components/ui/chart/MetricCard.jsx
import { useTheme } from "../../../contexts/ThemeContext";

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "primary",
}) {
  const { colors } = useTheme();

  const getColorValue = () => {
    switch (color) {
      case "success":
        return colors.status.success;
      case "warning":
        return colors.status.warning;
      case "error":
        return colors.status.error;
      default:
        return colors.primary;
    }
  };

  const getTrendColor = () => {
    if (!trend) return colors.text.secondary;
    return trend.startsWith("+") ? colors.status.success : colors.status.error;
  };

  return (
    <div
      className="p-4 border rounded-lg"
      style={{
        backgroundColor: colors.background.card,
        borderColor: colors.border.primary,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm" style={{ color: colors.text.secondary }}>
            {title}
          </p>
          <h3
            className="mb-1 text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className="mt-1 text-xs" style={{ color: getTrendColor() }}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-4">
            <Icon size={24} style={{ color: getColorValue() }} />
          </div>
        )}
      </div>
    </div>
  );
}
