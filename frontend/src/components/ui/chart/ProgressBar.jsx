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

  const getBarColor = () => {
    switch (color) {
      case "success":
        return colors.status.success;
      case "warning":
        return colors.status.warning;
      case "error":
        return colors.status.error;
      case "info":
        return colors.status.info;
      default:
        return colors.primary;
    }
  };

  const getBackgroundColor = () => {
    switch (color) {
      case "success":
        return colors.status.successLight;
      case "warning":
        return colors.status.warningLight;
      case "error":
        return colors.status.errorLight;
      case "info":
        return colors.status.infoLight;
      default:
        return colors.primaryLight;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    const iconStyle = { width: 16, height: 16 };
    if (trend === "up") return <TrendingUp style={iconStyle} />;
    if (trend === "down") return <TrendingDown style={iconStyle} />;
    return <Minus style={iconStyle} />;
  };

  const getBarHeight = () => {
    switch (size) {
      case "sm":
        return "6px";
      case "lg":
        return "12px";
      default:
        return "8px";
    }
  };

  const formatValue = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: colors.secondary }}
            >
              {label}
            </span>
            {trend && (
              <span style={{ color: getBarColor() }}>{getTrendIcon()}</span>
            )}
          </div>
          {subtitle && (
            <span className="text-xs" style={{ color: colors.tertiary }}>
              {subtitle}
            </span>
          )}
        </div>
        <div className="text-right">
          {showPercentage && (
            <div
              className="text-lg font-bold"
              style={{ color: colors.primary }}
            >
              {percentage.toFixed(0)}%
            </div>
          )}
          {showValue && (
            <div className="text-xs" style={{ color: colors.secondary }}>
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
