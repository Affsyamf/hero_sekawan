import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const HighchartsProgress = ({
  label = "",
  value,
  maxValue,
  color = "primary",
  showLabel = false,
}) => {
  // Color mapping
  const colorMap = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
  };

  const barColor = colorMap[color] || colorMap.primary;
  const percentage = ((value / maxValue) * 100).toFixed(1);

  const options = {
    chart: {
      type: "bar",
      backgroundColor: "transparent",
      height: 40,
      margin: [0, 0, 0, 0],
      spacing: [0, 0, 0, 0],
    },
    title: {
      text: null,
    },
    xAxis: {
      visible: false,
      categories: [""],
    },
    yAxis: {
      visible: false,
      min: 0,
      max: maxValue,
    },
    plotOptions: {
      bar: {
        groupPadding: 0,
        pointPadding: 0,
        borderWidth: 0,
        borderRadius: 4,
        dataLabels: {
          enabled: false,
        },
        enableMouseTracking: false,
      },
      series: {
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
      },
    },
    legend: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      enabled: false,
    },
    series: [
      {
        data: [value],
        color: barColor,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="w-full">
      {showLabel && label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">{label}</span>
          <span className="text-xs font-semibold text-gray-900">
            {percentage}%
          </span>
        </div>
      )}
      <div className="relative w-full overflow-hidden bg-gray-200 rounded-full">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{ style: { height: "8px", width: "100%" } }}
        />
      </div>
    </div>
  );
};

export default HighchartsProgress;
