// components/common/GlobalDateFilter.jsx
import { Calendar } from "lucide-react";
import { Card } from "../ui/Card";
import { useGlobalFilter } from "../../contexts/GlobalFilterContext";

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function GlobalDateFilter() {
  const { filters, dateRange, updateFilters } = useGlobalFilter();

  const {
    filterMode,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
  } = filters;

  // Generate year options (last 5 years to next year)
  const yearOptions = Array.from(
    { length: 7 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  const getFilterDisplayText = () => {
    const { startDate, endDate } = dateRange;

    switch (filterMode) {
      case "month_year":
        return `${monthOptions[selectedMonth - 1]} ${selectedYear}`;
      case "year_only":
        return `Year ${selectedYear}`;
      case "ytd":
        return `YTD (${startDate} to ${endDate})`;
      case "custom":
        return customStartDate && customEndDate
          ? `${customStartDate} to ${customEndDate}`
          : "Select custom range";
      default:
        return "No filter";
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg bg-opacity-20">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-white text-opacity-90">
              Global Date Filter
            </h3>
            <p className="text-sm font-bold text-white">
              {getFilterDisplayText()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Mode Tabs */}
          <div className="flex p-0.5 rounded-lg bg-white bg-opacity-20">
            <button
              onClick={() => updateFilters({ filterMode: "month_year" })}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === "month_year"
                  ? "bg-white text-blue-600"
                  : "text-white hover:bg-white hover:bg-opacity-10"
              }`}
            >
              Month & Year
            </button>
            <button
              onClick={() => updateFilters({ filterMode: "year_only" })}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === "year_only"
                  ? "bg-white text-blue-600"
                  : "text-white hover:bg-white hover:bg-opacity-10"
              }`}
            >
              Year Only
            </button>
            <button
              onClick={() => updateFilters({ filterMode: "ytd" })}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === "ytd"
                  ? "bg-white text-blue-600"
                  : "text-white hover:bg-white hover:bg-opacity-10"
              }`}
            >
              YTD
            </button>
            <button
              onClick={() => updateFilters({ filterMode: "custom" })}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === "custom"
                  ? "bg-white text-blue-600"
                  : "text-white hover:bg-white hover:bg-opacity-10"
              }`}
            >
              Custom
            </button>
          </div>

          {/* Month & Year Selectors */}
          {filterMode === "month_year" && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) =>
                  updateFilters({ month: parseInt(e.target.value) })
                }
                className="px-2.5 py-1 text-xs bg-white text-gray-700 border-0 rounded-lg"
              >
                {monthOptions.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) =>
                  updateFilters({ year: parseInt(e.target.value) })
                }
                className="px-2.5 py-1 text-xs bg-white text-gray-700 border-0 rounded-lg"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Year Only Selector */}
          {filterMode === "year_only" && (
            <select
              value={selectedYear}
              onChange={(e) =>
                updateFilters({ year: parseInt(e.target.value) })
              }
              className="px-2.5 py-1 text-xs bg-white text-gray-700 border-0 rounded-lg"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}

          {/* Custom Date Range */}
          {filterMode === "custom" && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
                className="px-2.5 py-1 text-xs bg-white text-gray-700 border-0 rounded-lg"
              />
              <span className="text-xs font-medium text-white">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
                className="px-2.5 py-1 text-xs bg-white text-gray-700 border-0 rounded-lg"
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
