import React, { useState, useCallback } from "react";
import { Highchart } from "../highchart";

// TODO: fix this shit
export default function DonutDrilldownChart({ data, onDrilldownRequest }) {
  const [depth, setDepth] = useState(0);
  const [path, setPath] = useState([]);
  const [currentDonutData, setCurrentDonutData] = useState(data);
  const [currentDrillData, setCurrentDrillData] = useState([]);
  const [chartType, setChartType] = useState("donut");

  // useCallback so it stays stable for Highcharts event bindings
  const handleDrillRequest = useCallback(
    async ({ name, context, depth: chartDepth }) => {
      console.log(name, context, depth);
      try {
        // 🔹 Ask backend/parent for next-level data
        console.log(context);
        const drillData = await onDrilldownRequest({
          name,
          context,
          depth: chartDepth,
        });

        console.log(drillData);

        // 🔹 Update breadcrumb & depth states
        // setDepth((prev) => prev + 1);
        // setPath((prev) => [...prev, { name, context, data: drillData }]);

        // // 🔹 Auto-switch logic
        if (drillData.length > 30) {
          console.log("asdasd");
          setChartType("bar");
          setCurrentDrillData(drillData);
        }

        // 🔹 Return data back to donut so it can render via addSeriesAsDrilldown
        return drillData;
      } catch (err) {
        console.error("Drilldown error:", err);
        return [];
      }
    },
    [onDrilldownRequest]
  );

  const handleBreadcrumbClick = useCallback(
    (index) => {
      const newPath = path.slice(0, index + 1);
      setPath(newPath);
      setDepth(index);

      const previous = newPath[index];
      const newData = previous?.data || data;
      //   setCurrentData(newData);

      // Re-evaluate chart type
      setChartType(
        Array.isArray(newData) && newData.length > 10 ? "bar" : "donut"
      );
    },
    [path, data]
  );

  // ✅ Fixed reduce return value
  const totalValue = currentDonutData.reduce(
    (sum, item) => sum + (item.value ?? item.y ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* You can add Breadcrumbs here later if needed */}
      {chartType === "donut" ? (
        <Highchart.HighchartsDonut
          data={currentDonutData}
          className="w-full h-full"
          centerText={{
            value: totalValue.toLocaleString(),
            label: "Total",
          }}
          onDrilldownRequest={handleDrillRequest}
        />
      ) : (
        <div>aaa</div>
      )}
    </div>
  );
}
