import React, { useRef, useState, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
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
  valueFormatter,
}) => {
  const { colors } = useTheme();
  const [visibleData, setVisibleData] = useState([]);
  const [showRaw, setShowRaw] = useState(false);

  const othersCache = useRef([]);

  const formatValue =
    valueFormatter ||
    ((val) => {
      if (val == null) return "-";
      if (typeof val === "number")
        return val.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        });
      return String(val);
    });

  const getMaxN = (data) => {
    const MAX_SLICES = 2;
    const BUFFER = 2;

    const sortedData = [...(data || [])].sort((a, b) => b.value - a.value);
    const topSlices = sortedData.slice(0, MAX_SLICES + BUFFER);
    const others = sortedData.slice(MAX_SLICES + BUFFER);

    let finalData = topSlices.map((item) => ({
      name: item.key,
      y: item.value,
      drilldown: item.drilldown ?? false,
      context: item.context,
    }));

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

  const options = useMemo(
    () => ({
      drilldown: {
        drillUpButton: {
          relativeTo: "spacingBox",
          position: { x: 0, y: 0 },
        },
        navigation: {
          breadcrumbs: { enabled: false },
        },
      },
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        height: 320,
        events: {
          load() {
            setVisibleData(finalData);
          },
          async drilldown(e) {
            if (!onDrilldownRequest) return;
            e.preventDefault(); // prevent default drilldown
            const chart = this;
            chart.showLoading("Loading...");

            try {
              let depth = chart.drilldownLevels?.length || 0;
              let frozen = false;

              for (const lvl of chart.drilldownLevels || []) {
                const context = lvl.pointOptions?.context?.toLowerCase?.();
                if (context === "others") {
                  frozen = true;
                } else if (!frozen) {
                  depth = lvl.levelNumber + 1;
                } else if (context !== "others") {
                  frozen = false;
                  depth += 1;
                }
              }

              if (e.point.name === "Others") {
                const othersData = othersCache.current || [];
                if (othersData.length > 0) {
                  const drillData = getMaxN(othersData);
                  chart.addSingleSeriesAsDrilldown(e.point, {
                    id: "others",
                    name: "Others",
                    data: drillData.map((d) => ({
                      name: d.label || d.name,
                      y: d.value || d.y,
                      context: d.context,
                      drilldown: d.drilldown ?? false,
                    })),
                  });
                  chart.applyDrilldown();
                  setVisibleData(drillData);
                }
                return;
              }

              const res = await onDrilldownRequest({
                name: e.point.name,
                context: e.point.options.context,
                depth,
              });

              const drillData = getMaxN(res);

              chart.addSingleSeriesAsDrilldown(e.point, {
                id: e.point.name,
                name: e.point.name,
                data: drillData.map((d) => ({
                  name: d.name,
                  y: d.y,
                  context: d.context,
                  drilldown: d.drilldown ?? false,
                })),
              });

              chart.applyDrilldown(); // render the drilldown
              setVisibleData(res);
            } catch (err) {
              console.error("Drilldown fetch error:", err);
            } finally {
              chart.hideLoading();
            }
          },
          drillup() {
            const chart = this;
            // Get the most recent parent level (the one we just returned to)
            const lastLevel =
              chart.drilldownLevels?.[chart.drilldownLevels.length - 1];
            if (
              lastLevel &&
              lastLevel.lowerSeriesOptions &&
              lastLevel.lowerSeriesOptions.data
            ) {
              const parentData = lastLevel.lowerSeriesOptions.data.map((p) => ({
                name: p.name,
                y: p.y,
                context: p.context,
              }));
              setVisibleData(parentData);
            } else {
              // fallback: top level
              const top = chart.series[0]?.data?.map((p) => ({
                name: p.name,
                y: p.y,
                context: p.options.context,
              }));
              setVisibleData(top || []);
            }
          },
        },
      },
      title: { text: null },
      tooltip: {
        useHTML: true,
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 6,
        padding: 10,
        formatter: function () {
          return `
            <div style="font-size: 12px;">
              <div style="font-weight: 600; margin-bottom: 3px;">${
                this.point.name
              }</div>
              <div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">
                Nilai: <span style="font-weight: 600; color: #111827;">${formatValue(
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
              fontSize: "11px",
              fontWeight: "500",
              color: "#374151",
              textOutline: "none",
            },
            distance: 12,
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
          fontSize: "11px",
          color: "#374151",
          fontWeight: "500",
        },
        itemHoverStyle: { color: "#111827" },
      },
      credits: { enabled: false },
      series: [{ name: "Value", data: finalData }],
    }),
    [data, onDrilldownRequest, enableDataLabels]
  );

  return (
    <div className={`p-1 ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 md:text-base">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>
          )}
        </div>

        <button
          onClick={() => setShowRaw((prev) => !prev)}
          className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
        >
          {showRaw ? "Hide Raw Data" : "Show Raw Data"}
        </button>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <HighchartsReact highcharts={Highcharts} options={options} />

        {/* Center Text Overlay */}
        {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center" style={{ marginBottom: "40px" }}>
              <p className="text-xl font-bold text-gray-900 md:text-2xl">
                {centerText.value}
              </p>
              <p className="text-xs text-gray-600">{centerText.label}</p>
            </div>
          </div>
        )}
      </div>

      {/* Current Data Display */}
      {showRaw && visibleData.length > 0 && (
        <div className="mt-4 p-3 border rounded bg-gray-50 text-xs">
          <p className="font-semibold mb-2 text-gray-700">Current Data:</p>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="py-1">Name</th>
                <th className="py-1 text-right">Value</th>
                <th className="py-1 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {visibleData.map((item, idx) => {
                const total = visibleData.reduce(
                  (sum, d) => sum + (d.y || d.value || 0),
                  0
                );
                console.log(item);
                const percentage =
                  total > 0
                    ? (((item.y || item.value) / total) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-100 transition"
                  >
                    <td className="py-1 text-gray-800">
                      {item.key || item.name}
                    </td>
                    <td className="py-1 text-right text-gray-700">
                      {formatValue(item.y || item.value || 0)}
                    </td>
                    <td className="py-1 text-right text-gray-500">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Cards */}
      {showSummary && data.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data?.map((item, index) => (
            <div
              key={index}
              className="p-2.5 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-1.5 mb-1">
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
                {formatValue(item.value)}
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
