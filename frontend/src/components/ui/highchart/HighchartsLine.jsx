import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCompactCurrency } from "../../../utils/helpers";

const HighchartsLine = ({
  initialData,
  title,
  subtitle,
  datasets,
  periods,
  onFetchData,
  showSummary = true,
  yAxisLabel = "Nilai (Rp)",
}) => {
  const [period, setPeriod] = useState(periods?.[0] || "6 Bulan");
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (onFetchData) {
      const newData = onFetchData(period);
      setData(newData);
    }
  }, [period, onFetchData]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const colorMap = {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
  };

  const categories = data?.map((item) => item.key) || [];

  const series =
    datasets?.map((dataset) => ({
      name: dataset.label || dataset.key,
      data: data?.map((item) => item[dataset.key]) || [],
      color: colorMap[dataset.color] || colorMap.primary,
      marker: {
        radius: 3,
        symbol: "circle",
      },
    })) || [];

  const summary =
    datasets?.map((dataset) => {
      const total =
        data?.reduce((sum, item) => sum + (item[dataset.key] || 0), 0) || 0;
      const average = data?.length ? total / data.length : 0;
      const latestValue = data?.length ? data[data.length - 1][dataset.key] : 0;

      return {
        label: dataset.label,
        total,
        average,
        latestValue,
        color: colorMap[dataset.color] || colorMap.primary,
      };
    }) || [];

  const options = {
    chart: {
      type: "line",
      backgroundColor: "transparent",
      height: 280,
    },
    title: {
      text: null,
    },
    xAxis: {
      categories: categories,
      crosshair: {
        width: 1,
        color: "#e5e7eb",
        dashStyle: "Dash",
      },
      labels: {
        style: {
          fontSize: "11px",
          color: "#6b7280",
        },
      },
      gridLineWidth: 0,
    },
    yAxis: {
      min: 0,
      title: {
        text: yAxisLabel,
        style: {
          color: "#6b7280",
          fontSize: "11px",
        },
      },
      labels: {
        formatter: function () {
          return formatCompactCurrency(this.value);
        },
        style: {
          fontSize: "11px",
          color: "#6b7280",
        },
      },
      gridLineColor: "#f3f4f6",
      gridLineDashStyle: "Dash",
    },
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderRadius: 6,
      padding: 10,
      formatter: function () {
        const header =
          (this.points &&
            this.points[0] &&
            this.points[0].point &&
            this.points[0].point.category) ||
          this.x;
        let tooltip = `<div style="font-size:13px;font-weight:600;margin-bottom:8px;">${header}</div>`;
        this.points.forEach((point) => {
          tooltip += `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${
            point.color
          };"></span>
          <span style="color:#6b7280;font-size:12px;">${
            point.series.name
          }:</span>
          <span style="font-weight:600;font-size:12px;">${formatCompactCurrency(
            point.y
          )}</span>
        </div>`;
        });
        return tooltip;
      },
    },
    plotOptions: {
      line: {
        lineWidth: 2.5,
        marker: {
          enabled: true,
          radius: 3,
          lineWidth: 2,
          lineColor: "#ffffff",
        },
        states: {
          hover: {
            lineWidth: 3,
            marker: {
              radius: 5,
            },
          },
        },
      },
      series: {
        animation: {
          duration: 1000,
          easing: "easeOutQuart",
        },
      },
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      itemStyle: {
        fontSize: "11px",
        color: "#374151",
        fontWeight: "500",
      },
      itemHoverStyle: {
        color: "#111827",
      },
      itemMarginBottom: 6,
    },
    credits: {
      enabled: false,
    },
    series: series,
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate md:text-base">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>
          )}
        </div>
        {periods && periods.length > 0 && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Chart */}
      <div className="w-full">
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>

      {/* Summary */}
      {showSummary && summary.length > 0 && (
        <div className="grid grid-cols-1 gap-3 pt-4 mt-4 border-t border-gray-200 md:grid-cols-2 lg:grid-cols-3">
          {summary.map((item, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs font-medium text-gray-700">
                  {item.label}
                </p>
              </div>
              <div className="space-y-1.5">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-base font-bold text-gray-900">
                    {formatCompactCurrency(item.total)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Rata-rata</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {formatCompactCurrency(item.average)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Terakhir</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {formatCompactCurrency(item.latestValue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HighchartsLine;
