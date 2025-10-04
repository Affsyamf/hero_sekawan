// components/ui/chart/ProgressBar.jsx
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";

export function ProgressBar({
  label,
  value,
  maxValue,
  color = "primary",
  showPercentage = true,
  showValue = true,
  animate = true,
  trend = null, // 'up', 'down', atau null
  subtitle = null,
  size = "md", // 'sm', 'md', 'lg'
}) {
  const { colors } = useTheme(); 
  const [animatedValue, setAnimatedValue] = useState(0);

  const percentage = (value / maxValue) * 100;  

  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => {
        setAnimatedValue(percentage);
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      setAnimatedValue(percentage);
    }
  }, [percentage, animate]);

  // Fallback colors
  const primaryColor = colors?.primary || "#3b82f6";
  const successColor = colors?.status?.success || "#10b981";
  const successLight = colors?.status?.successLight || "#d1fae5";
  const warningColor = colors?.status?.warning || "#f59e0b";
  const warningLight = colors?.status?.warningLight || "#fef3c7";
  const errorColor = colors?.status?.error || "#ef4444";
  const errorLight = colors?.status?.errorLight || "#fee2e2";
  const infoColor = colors?.status?.info || "#0ea5e9";
  const infoLight = colors?.status?.infoLight || "#e0f2fe";
  const primaryLight = colors?.primaryLight || "#dbeafe";
  const textPrimary = colors?.text?.primary || "#111827";
  const textSecondary = colors?.text?.secondary || "#6b7280";
  const textTertiary = colors?.text?.tertiary || "#9ca3af";

  const getBarColor = () => {
    switch (color) {
      case "success":
        return successColor;
      case "warning":
        return warningColor;
      case "error":
        return errorColor;
      case "info":
        return infoColor;
      default:
        return primaryColor;
    }
  };

  const getBackgroundColor = () => {
    switch (color) {
      case "success":
        return successLight;
      case "warning":
        return warningLight;
      case "error":
        return errorLight;
      case "info":
        return infoLight;
      default:
        return primaryLight;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    const iconStyle = { width: 12, height: 12 };
    if (trend === "up") return <TrendingUp style={iconStyle} />;
    if (trend === "down") return <TrendingDown style={iconStyle} />;
    return <Minus style={iconStyle} />;
  };

  const getBarHeight = () => {
    switch (size) {
      case "sm":
        return "4px";
      case "lg":
        return "10px";
      default:
        return "6px";
    }
  };

  const formatValue = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-medium truncate"
              style={{ color: textPrimary }}
            >
              {label}
            </span>
            {trend && (
              <span style={{ color: getBarColor() }}>{getTrendIcon()}</span>
            )}
          </div>
          {subtitle && (
            <span className="text-xs truncate" style={{ color: textTertiary }}>
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 ml-2 text-right">
          {showPercentage && (
            <div
              className="text-sm font-bold"
              style={{ color: getBarColor() }}
            >
              {percentage.toFixed(0)}%
            </div>
          )}
          {showValue && (
            <div className="text-xs" style={{ color: textSecondary }}>
              {formatValue(value)}
            </div>
          )}
        </div>
      </div>

      <div
        className="w-full overflow-hidden rounded-full"
        style={{
          backgroundColor: getBackgroundColor(),
          height: getBarHeight(),
        }}
      >
        <div
          className="relative h-full overflow-hidden transition-all duration-1000 ease-out rounded-full"
          style={{
            width: `${animatedValue}%`,
            backgroundColor: getBarColor(),
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)`,
              animation: "shimmer 2s infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}