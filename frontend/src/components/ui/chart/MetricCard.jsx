// components/ui/chart/MetricCard.jsx
import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* CARA PENGGUNAAN - OTOMATIS RESPONSIVE
// Gunakan MetricGrid wrapper untuk auto-responsive berdasarkan jumlah card

import { MetricGrid } from "./MetricCard";

// 1 card - Full width
<MetricGrid>
  <Chart.Metric title="..." value="..." />
</MetricGrid>

// 2 cards - 2 kolom
<MetricGrid>
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
</MetricGrid>

// 3 cards - 3 kolom
<MetricGrid>
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
</MetricGrid>

// 4 cards - 4 kolom
<MetricGrid>
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
</MetricGrid>

// 5+ cards - 4 kolom max, wrap ke baris baru
<MetricGrid>
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
</MetricGrid>
*/

// Wrapper Grid Component - Auto responsive
export function MetricGrid({ children, className = "" }) {
  const childCount = Array.isArray(children) ? children.length : 1;
  
  // Tentukan grid cols berdasarkan jumlah children
  const getGridCols = () => {
    if (childCount === 1) return "grid-cols-1";
    if (childCount === 2) return "grid-cols-1 md:grid-cols-2";
    if (childCount === 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    // 4 atau lebih - max 4 kolom
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
  };

  return (
    <div className={`grid gap-3 md:gap-4 ${getGridCols()} ${className}`}>
      {children}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel = "vs last month",
  color = "primary",
  onClick,
  showProgress = false,
  progressValue = 0,
  animateOnMount = true,
}) {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getColorValue = () => {
    switch (color) {
      case "success":
        return colors?.status?.success || "#10b981";
      case "warning":
        return colors?.status?.warning || "#f59e0b";
      case "error":
        return colors?.status?.error || "#ef4444";
      case "info":
        return colors?.status?.info || "#3b82f6";
      default:
        return colors?.primary || "#3b82f6";
    }
  };

  const getColorLight = () => {
    switch (color) {
      case "success":
        return colors?.status?.successLight || "#d1fae5";
      case "warning":
        return colors?.status?.warningLight || "#fef3c7";
      case "error":
        return colors?.status?.errorLight || "#fee2e2";
      case "info":
        return colors?.status?.infoLight || "#dbeafe";
      default:
        return colors?.primaryLight || "#dbeafe";
    }
  };

  const getTrendInfo = () => {
    if (trend === undefined || trend === null)
      return { 
        icon: Minus, 
        color: colors?.text?.tertiary || "#9ca3af", 
        isPositive: null 
      };

    const isPositive = trend > 0;
    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive 
        ? (colors?.status?.success || "#10b981")
        : (colors?.status?.error || "#ef4444"),
      isPositive,
    };
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;
  const mainColor = getColorValue();
  const lightColor = getColorLight();
  
  // Fallback colors jika theme context tidak ada
  const bgColor = colors?.background?.card || "#ffffff";
  const borderColor = colors?.border?.primary || "#e5e7eb";
  const textPrimary = colors?.text?.primary || "#111827";
  const textSecondary = colors?.text?.secondary || "#6b7280";
  const textTertiary = colors?.text?.tertiary || "#9ca3af";
  const shadowSm = colors?.shadow?.sm || "0 1px 2px 0 rgb(0 0 0 / 0.05)";

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      } ${animateOnMount ? "animate-fadeInUp" : ""}`}
      style={{
        backgroundColor: bgColor,
        borderColor: isHovered ? mainColor : borderColor,
        transform: isPressed
          ? "scale(0.98)"
          : isHovered
          ? "scale(1.01)"
          : "scale(1)",
        boxShadow: isHovered
          ? `0 8px 16px -6px ${mainColor}40`
          : shadowSm,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => onClick && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${mainColor}08 0%, transparent 50%)`,
        }}
      />

      {/* Animated Border Gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${mainColor}20 0%, transparent 50%)`,
        }}
      />

      {/* Content */}
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0 pr-2">
            <p
              className="mb-0.5 text-xs font-medium transition-colors duration-200 truncate"
              style={{
                color: isHovered ? mainColor : textSecondary,
              }}
            >
              {title}
            </p>
            {subtitle && (
              <p 
                className="text-xs truncate" 
                style={{ color: textTertiary }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div
              className="flex items-center justify-center flex-shrink-0 w-10 h-10 transition-all duration-300 rounded-lg"
              style={{
                backgroundColor: isHovered ? mainColor : lightColor,
                transform: isHovered
                  ? "rotate(10deg) scale(1.1)"
                  : "rotate(0deg) scale(1)",
              }}
            >
              <Icon
                size={20}
                style={{
                  color: isHovered ? "#ffffff" : mainColor,
                  transition: "color 0.3s ease",
                }}
              />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <h3
            className="text-xl font-bold tracking-tight truncate transition-colors duration-200 md:text-2xl"
            style={{
              color: isHovered ? mainColor : textPrimary,
            }}
          >
            {value}
          </h3>
        </div>

        {/* Trend & Progress */}
        <div className="flex items-center justify-between">
          {/* Trend Indicator */}
          {trend !== undefined && trend !== null && (
            <div className="flex items-center min-w-0 gap-1">
              <div
                className="flex items-center justify-center flex-shrink-0 w-5 h-5 transition-all duration-200 rounded-full"
                style={{
                  backgroundColor: `${trendInfo.color}20`,
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}
              >
                <TrendIcon size={12} style={{ color: trendInfo.color }} />
              </div>
              <div className="flex items-baseline min-w-0 gap-1">
                <span
                  className="flex-shrink-0 text-xs font-semibold"
                  style={{ color: trendInfo.color }}
                >
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </span>
                <span
                  className="text-xs truncate"
                  style={{ color: textTertiary }}
                >
                  {trendLabel}
                </span>
              </div>
            </div>
          )}

          {/* Click Indicator */}
          {onClick && (
            <div
              className="flex-shrink-0 text-xs font-medium transition-all duration-200"
              style={{
                color: mainColor,
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? "translateX(0)" : "translateX(-10px)",
              }}
            >
              →
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-3">
            <div
              className="h-1 overflow-hidden rounded-full"
              style={{ backgroundColor: `${mainColor}15` }}
            >
              <div
                className="h-full transition-all duration-1000 ease-out rounded-full"
                style={{
                  width: `${progressValue}%`,
                  backgroundColor: mainColor,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Shimmer Effect on Hover */}
      <div
        className="absolute inset-0 transition-opacity duration-700 opacity-0 pointer-events-none group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${mainColor}10, transparent)`,
          transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
          transition: "transform 0.7s ease",
        }}
      />
    </div>
  );
}