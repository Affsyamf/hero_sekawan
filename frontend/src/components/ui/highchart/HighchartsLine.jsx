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

  // Color mapping
  const colorMap = {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
  };

  // Prepare data for Highcharts
  const categories = data?.map((item) => item.month) || [];

  const series = datasets?.map((dataset) => ({
    name: dataset.label,
    data: data?.map((item) => item[dataset.key]) || [],
    color: colorMap[dataset.color] || colorMap.primary,
    marker: {
      radius: 4,
      symbol: "circle",
    },
  })) || [];

  // Calculate summary
  const summary = datasets?.map((dataset) => {
    const total = data?.reduce((sum, item) => sum + (item[dataset.key] || 0), 0) || 0;
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
      height: 350,
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
          fontSize: "12px",
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
          fontSize: "12px",
        },
      },
      labels: {
        formatter: function () {
          return formatCompactCurrency(this.value);
        },
        style: {
          fontSize: "12px",
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
      borderRadius: 8,
      padding: 12,
      shadow: {
        color: "rgba(0, 0, 0, 0.1)",
        width: 5,
        offsetX: 0,
        offsetY: 2,
      },
      formatter: function () {
        let tooltip = `<div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #111827;">${this.x}</div>`;
        this.points.forEach((point) => {
          tooltip += `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${point.color};"></span>
              <span style="color: #6b7280; font-size: 12px;">${point.series.name}:</span>
              <span style="font-weight: 600; font-size: 12px; color: #111827;">${formatCompactCurrency(point.y)}</span>
            </div>
          `;
        });
        return tooltip;
      },
    },
    plotOptions: {
      line: {
        lineWidth: 3,
        marker: {
          enabled: true,
          radius: 4,
          lineWidth: 2,
          lineColor: "#ffffff",
        },
        states: {
          hover: {
            lineWidth: 4,
            marker: {
              radius: 6,
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
        fontSize: "12px",
        color: "#374151",
        fontWeight: "500",
      },
      itemHoverStyle: {
        color: "#111827",
      },
      itemMarginBottom: 8,
    },
    credits: {
      enabled: false,
    },
    series: series,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {periods && periods.length > 0 && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="grid grid-cols-1 gap-4 pt-6 mt-6 border-t border-gray-200 md:grid-cols-2 lg:grid-cols-3">
          {summary.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm font-medium text-gray-700">
                  {item.label}
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCompactCurrency(item.total)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Rata-rata</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCompactCurrency(item.average)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Terakhir</p>
                    <p className="text-sm font-semibold text-gray-900">
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