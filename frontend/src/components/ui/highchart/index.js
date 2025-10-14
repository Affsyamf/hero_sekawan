// src/components/ui/highchart/index.js
// Export semua komponen Highcharts dalam satu namespace

import HighchartsBar from "./HighchartsBar";
import HighchartsLine from "./HighchartsLine";
import HighchartsDonut from "./HighchartsDonut";
import HighchartsProgress from "./HighchartsProgress";

export const Highchart = {
  HighchartsBar,
  HighchartsLine,
  HighchartsDonut,
  HighchartsProgress,
};

// Alternative export jika mau import individual
export { HighchartsBar, HighchartsLine, HighchartsDonut, HighchartsProgress };