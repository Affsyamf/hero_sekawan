import { chartColors } from "./chartColors";

export function buildDatasetsFromData(dataArray, ignoredKeys) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return [];

  const defaultIgnoredKeys = ["key", "date", "period"];

  // Collect all unique keys across all data points
  const allKeys = new Set();
  for (const item of dataArray) {
    Object.keys(item || {}).forEach((key) => {
      if (!ignoredKeys.includes(key) && !defaultIgnoredKeys.includes(key)) {
        allKeys.add(key);
      }
    });
  }

  // Convert to array and make sure 'total' stays last
  const sortedKeys = Array.from(allKeys)
    .filter((k) => k !== "total")
    .sort()
    .concat("total");

  // Build datasets config
  return sortedKeys.map((key, i) => {
    const isTotal = key === "total";
    const color = isTotal ? "neutral" : chartColors[i % chartColors.length];
    return {
      key,
      label: isTotal ? "Total" : key,
      color,
      type: isTotal ? "spline" : "column",
      stacked: !isTotal,
    };
  });
}

export function hydrateDataForChart(dataArray, ignoredKeys) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return dataArray;

  // Collect all possible keys
  const allKeys = new Set();
  for (const row of dataArray) {
    Object.keys(row || {}).forEach((key) => {
      if (!ignoredKeys.includes(key)) {
        allKeys.add(key);
      }
    });
  }

  // Return new array with all missing keys filled as 0
  const ret = dataArray.map((row) => {
    const filled = { ...row };
    for (const key of allKeys) {
      if (filled[key] === undefined || filled[key] === null) {
        filled[key] = 0;
      }
    }
    return filled;
  });

  return ret;
}
