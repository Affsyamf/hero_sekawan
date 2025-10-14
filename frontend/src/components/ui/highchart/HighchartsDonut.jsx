import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCompactCurrency } from "../../utils/helpers";

const HighchartsDonut = ({
  data,
  centerText,
  title,
  subtitle,
  className = "",
}) => {
  // Prepare data for Highcharts
  const chartData =
    data?.map((item) => ({
      name: item.label,
      y: item.value,
    })) || [];

  const options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 400,
    },
    title: {
      text: null,
    },
    tooltip: {
      useHTML: true,
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderRadius: 8,
      padding: 12,
      formatter: function () {
        return `
          <div style="font-size: 13px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${
              this.point.name
            }</div>
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">
              Nilai: <span style="font-weight: 600; color: #111827;">${formatCompactCurrency(
                this.point.y
              )}</span>
            </div>
            <div style="color: #6b7280; font-size: 12px;">
              Persentase: <span style="font-weight: 600; color: #111827;">${this.point.percentage.toFixed(
                1
              )}%</span>
            </div>
          </div>
        `;
      },
    },
    plotOptions: {
      pie: {
        innerSize: "65%",
        depth: 45,
        dataLabels: {
          enabled: true,
          format: "{point.name}: {point.percentage:.1f}%",
          style: {
            fontSize: "12px",
            fontWeight: "500",
            color: "#374151",
            textOutline: "none",
          },
          distance: 15,
        },
        showInLegend: true,
        colors: ["#3b82f6", "#f59e0b"],
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
    series: [
      {
        name: "Value",
        data: chartData,
      },
    ],
  };

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>

      {/* Chart Container */}
      <div className="relative">
        <HighchartsReact highcharts={Highcharts} options={options} />

        {/* Center Text Overlay */}
        {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center" style={{ marginBottom: "40px" }}>
              <p className="text-2xl font-bold text-gray-900">
                {centerText.value}
              </p>
              <p className="text-sm text-gray-600">{centerText.label}</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {data?.map((item, index) => (
          <div
            key={index}
            className="p-3 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: index === 0 ? "#3b82f6" : "#f59e0b",
                }}
              />
              <p className="text-xs font-medium text-gray-700">{item.label}</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatCompactCurrency(item.value)}
            </p>
            <p className="text-xs text-gray-600">
              {(
                (item.value / data.reduce((sum, d) => sum + d.value, 0)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighchartsDonut;
