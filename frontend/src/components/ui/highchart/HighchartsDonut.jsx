import React, { useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCompactCurrency } from "../../../utils/helpers";
import "highcharts/modules/drilldown";
import { useTheme } from "../../../contexts/ThemeContext";
import { chartColors } from "../../../utils/chartColors";

const HighchartsDonut = ({
  data,
  centerText,
  title,
  subtitle,
  className = "",
  showSummary = false,
  onDrilldownRequest,
  enableDataLabels = false,
}) => {
  // const chartData =
  //   data?.map((item) => ({
  //     name: item.label,
  //     y: item.value,
  //     drilldown: item.drilldown ?? false,
  //     ...item,
  //   })) || [];

  const othersCache = useRef([]);

  const getMaxN = (data) => {
    const MAX_SLICES = 2; // show top N + Buffer slices before grouping
    const BUFFER = 2;

    // Sort and separate top + others
    const sortedData = [...(data || [])].sort((a, b) => b.value - a.value);
    const topSlices = sortedData.slice(0, MAX_SLICES + BUFFER);
    const others = sortedData.slice(MAX_SLICES + BUFFER);

    let finalData = topSlices.map((item) => ({
      name: item.label,
      y: item.value,
      drilldown: item.drilldown ?? false,
      context: item.context,
    }));

    // Add "Others" group if needed
    if (others.length > 0) {
      othersCache.current = others;

      finalData.push({
        id: "Others",
        name: "Others",
        y: others.reduce((sum, d) => sum + d.value, 0),
        drilldown: true,
        context: "others",
      });
    }

    return finalData;
  };

  const finalData = getMaxN(data);

  const options = {
    drilldown: {
      drillUpButton: {
        relativeTo: "spacingBox",
        position: { x: 0, y: 0 },
      },
    },
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 320,
      events: {
        drilldown: async function (e) {
          if (!onDrilldownRequest) return;
          const chart = this;
          chart.showLoading("Loading...");

          try {
            let depth = chart.drilldownLevels?.length || 0;

            let frozen = false;

            for (const lvl of chart.drilldownLevels || []) {
              const context = lvl.pointOptions?.context?.toLowerCase?.();
              console.log(lvl);
              if (context === "others") {
                // Once we hit "others", stop increasing depth
                frozen = true;
              } else if (!frozen) {
                // Normal level increment
                depth = lvl.levelNumber + 1;
              } else {
                // If frozen, only unfreeze when we get a non-"others"
                if (context !== "others") {
                  frozen = false;
                  depth += 1;
                }
              }
            }

            if (e.point.name === "Others") {
              const othersData = othersCache.current || [];
              if (othersData.length > 0) {
                const drillData = getMaxN(othersData);

                chart.addSeriesAsDrilldown(e.point, {
                  id: "others",
                  name: "Others",
                  data: drillData.map((d) => ({
                    name: d.label || d.name,
                    y: d.value || d.y,
                    context: d.context,
                    drilldown: d.drilldown ?? false,
                  })),
                });
              }

              return;
            }

            const res = await onDrilldownRequest({
              name: e.point.name,
              context: e.point.options.context,
              depth,
            });

            const drillData = getMaxN(res);

            chart.addSeriesAsDrilldown(e.point, {
              id: e.point.name,
              name: e.point.name,
              data: drillData.map((d) => ({
                name: d.name,
                y: d.y,
                context: d.context,
                drilldown: d.drilldown ?? false,
              })),
            });
          } catch (err) {
            console.error("Drilldown fetch error:", err);
          } finally {
            chart.hideLoading();
          }
        },
        drillup() {
          console.log("Drilled up");
        },
      },
    },
    title: {
      text: null,
    },
    tooltip: {
      useHTML: true,
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderRadius: 6, // 8 → 6
      padding: 10, // 12 → 10
      formatter: function () {
        return `
          <div style="font-size: 12px;">
            <div style="font-weight: 600; margin-bottom: 3px;">${
              this.point.name
            }</div>
            <div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">
              Nilai: <span style="font-weight: 600; color: #111827;">${formatCompactCurrency(
                this.point.y
              )}</span>
            </div>
            <div style="color: #6b7280; font-size: 11px;">
              Persentase: <span style="font-weight: 600; color: #111827;">${this.point.percentage.toFixed(
                1
              )}%</span>
            </div>
          </div>
        `;
      },
    },
    colors: chartColors,
    plotOptions: {
      pie: {
        innerSize: "65%",
        depth: 45,
        dataLabels: {
          enabled: enableDataLabels,
          format: "{point.name}: {point.percentage:.1f}%",
          style: {
            fontSize: "11px", // 12px → 11px
            fontWeight: "500",
            color: "#374151",
            textOutline: "none",
          },
          distance: 12, // 15 → 12
        },
        showInLegend: true,
        colorByPoint: true,
      },
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      itemStyle: {
        fontSize: "11px", // 12px → 11px
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
        data: finalData,
      },
    ],
  };

  return (
    <div className={`p-4 ${className}`}>
      {" "}
      {/* p-6 → p-4 */}
      {/* Header */}
      <div className="mb-3">
        {" "}
        {/* mb-4 → mb-3 */}
        <h3 className="text-sm font-semibold text-gray-900 md:text-base">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>}
      </div>
      {/* Chart Container */}
      <div className="relative">
        <HighchartsReact highcharts={Highcharts} options={options} />

        {/* Center Text Overlay */}
        {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center" style={{ marginBottom: "40px" }}>
              <p className="text-xl font-bold text-gray-900 md:text-2xl">
                {" "}
                {/* text-2xl → text-xl md:text-2xl */}
                {centerText.value}
              </p>
              <p className="text-xs text-gray-600">{centerText.label}</p>
            </div>
          </div>
        )}
      </div>
      {/* Summary Cards */}
      {/* Summary */}
      {showSummary && data.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {" "}
          {/* gap-3 mt-6 → gap-2 mt-4 */}
          {data?.map((item, index) => (
            <div
              key={index}
              className="p-2.5 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {" "}
                {/* gap-2 mb-1 → gap-1.5 mb-0.5 */}
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: index === 0 ? "#3b82f6" : "#f59e0b",
                  }}
                />
                <p className="text-xs font-medium text-gray-700">
                  {item.label}
                </p>
              </div>
              <p className="text-base font-bold text-gray-900">
                {" "}
                {/* text-lg → text-base */}
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
      )}
    </div>
  );
};

export default HighchartsDonut;
