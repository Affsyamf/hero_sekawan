// components/ui/hightchart/HighChart.jsx
import {
  HighchartsBar,
  HighchartsLine,
  HighchartsDonut,
  HighchartsProgress,
} from "./index";

const Highchart = {
  HighchartsBar,      // ✅
  HighchartsLine,     // ✅ bukan HighchartsBar lagi
  HighchartsDonut,    // ✅ bukan HighchartsBar lagi
  HighchartsProgress,
};

export default Highchart;