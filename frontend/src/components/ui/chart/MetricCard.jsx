// components/ui/chart/MetricCard.jsx
import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* -- cara penggunaan
// 4 cards - Full responsive
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
</div>

// 3 cards
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
</div>

// 2 cards
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
  <Chart.Metric title="..." value="..." />
  <Chart.Metric title="..." value="..." />
</div> */

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

  const getColorLight = () => {
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

  const getTrendInfo = () => {
    if (trend === undefined || trend === null)
      return { icon: Minus, color: colors.text.tertiary, isPositive: null };

    const isPositive = trend > 0;
    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? colors.status.success : colors.status.error,
      isPositive,
    };
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;
  const mainColor = getColorValue();
  const lightColor = getColorLight();

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      } ${animateOnMount ? "animate-fadeInUp" : ""}`}
      style={{
        backgroundColor: colors.background.card,
        borderColor: isHovered ? mainColor : colors.border.primary,
        transform: isPressed
          ? "scale(0.98)"
          : isHovered
          ? "scale(1.02)"
          : "scale(1)",
        boxShadow: isHovered
          ? `0 12px 24px -10px ${mainColor}40`
          : colors.shadow.sm,
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
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Title & Subtitle */}
          <div className="flex-1">
            <p
              className="mb-1 text-sm font-medium transition-colors duration-200"
              style={{
                color: isHovered ? mainColor : colors.text.secondary,
              }}
            >
              {title}
            </p>
            {subtitle && (
              <p className="text-xs" style={{ color: colors.text.tertiary }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div
              className="flex items-center justify-center w-12 h-12 transition-all duration-300 rounded-xl"
              style={{
                backgroundColor: isHovered ? mainColor : lightColor,
                transform: isHovered
                  ? "rotate(10deg) scale(1.1)"
                  : "rotate(0deg) scale(1)",
              }}
            >
              <Icon
                size={24}
                style={{
                  color: isHovered ? "#ffffff" : mainColor,
                  transition: "color 0.3s ease",
                }}
              />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-3">
          <h3
            className="text-3xl font-bold tracking-tight transition-colors duration-200"
            style={{
              color: isHovered ? mainColor : colors.text.primary,
            }}
          >
            {value}
          </h3>
        </div>

        {/* Trend & Progress */}
        <div className="flex items-center justify-between">
          {/* Trend Indicator */}
          {trend !== undefined && trend !== null && (
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center justify-center w-6 h-6 transition-all duration-200 rounded-full"
                style={{
                  backgroundColor: `${trendInfo.color}20`,
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}
              >
                <TrendIcon size={14} style={{ color: trendInfo.color }} />
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-sm font-semibold"
                  style={{ color: trendInfo.color }}
                >
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </span>
                <span
                  className="text-xs"
                  style={{ color: colors.text.tertiary }}
                >
                  {trendLabel}
                </span>
              </div>
            </div>
          )}

          {/* Click Indicator */}
          {onClick && (
            <div
              className="text-xs font-medium transition-all duration-200"
              style={{
                color: mainColor,
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? "translateX(0)" : "translateX(-10px)",
              }}
            >
              View Details →
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-4">
            <div
              className="h-1.5 rounded-full overflow-hidden"
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
