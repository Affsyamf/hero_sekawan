import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCompactCurrency } from "../../../utils/helpers";

const HighchartsBar = ({
  initialData,
  title,
  subtitle,
  datasets,
  periods,
  onFetchData,
  showSummary = true,
}) => {
  const [period, setPeriod] = useState(periods?.[0] || "6 Bulan");
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (onFetchData) {
      const newData = onFetchData(period);
      setData(newData);
    }
  }, [period, onFetchData]);

  // Prepare data for Highcharts
  const categories = data?.map((item) => item.month) || [];

  const series =
    datasets?.map((dataset) => ({
      name: dataset.label,
      data: data?.map((item) => item[dataset.key]) || [],
      color:
        dataset.color === "primary"
          ? "#3b82f6"
          : dataset.color === "warning"
          ? "#f59e0b"
          : "#6b7280",
      type: dataset.type || "column",
      stacking:
        dataset.type === "column" && dataset.stacked ? "normal" : undefined,
    })) || [];

  // Calculate summary
  const summary =
    datasets?.map((dataset) => {
      const total =
        data?.reduce((sum, item) => sum + (item[dataset.key] || 0), 0) || 0;
      return {
        label: dataset.label,
        total,
        color: dataset.color === "primary" ? "#3b82f6" : "#f59e0b",
      };
    }) || [];

  const options = {
    chart: {
      type: "xy",
      backgroundColor: "transparent",
      height: 350,
    },
    title: {
      text: null,
    },
    xAxis: {
      categories: categories,
      crosshair: true,
      labels: {
        style: {
          fontSize: "12px",
          color: "#6b7280",
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "Nilai (Rp)",
        style: {
          color: "#6b7280",
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
      gridLineColor: "#e5e7eb",
    },
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderRadius: 8,
      padding: 12,
      formatter: function () {
        let tooltip = `<div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">${this.x}</div>`;
        this.points.forEach((point) => {
          tooltip += `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${
                point.color
              };"></span>
              <span style="color: #6b7280; font-size: 12px;">${
                point.series.name
              }:</span>
              <span style="font-weight: 600; font-size: 12px;">${formatCompactCurrency(
                point.y
              )}</span>
            </div>
          `;
        });
        return tooltip;
      },
    },
    plotOptions: {
      column: {
        pointPadding: 0.1,
        borderWidth: 0,
        borderRadius: 4,
      },
      spline: {
        marker: { enabled: true },
        lineWidth: 2.5,
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
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
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
        <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-gray-200">
          {summary.map((item, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm font-medium text-gray-700">
                  {item.label}
                </p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCompactCurrency(item.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HighchartsBar;
