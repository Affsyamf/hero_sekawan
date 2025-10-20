// components/common/GlobalFilterDrawer.jsx
import { useState, useEffect } from "react";
import { Calendar, X, Filter } from "lucide-react";
import { useGlobalFilter } from "../../contexts/GlobalFilterContext";
import { cn } from "../../utils/cn";

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

export default function GlobalFilterDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { filters, dateRange, updateFilters, resetFilters } = useGlobalFilter();

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
          : "Select dates";
      default:
        return "No filter";
    }
  };

  const hasActiveFilter = dateRange.startDate && dateRange.endDate;

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      setIsApplying(true);
      const timer = setTimeout(() => setIsApplying(false), 800);
      return () => clearTimeout(timer);
    }
  }, [dateRange]);

  return (
    <>
      {/* Floating Filter Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-40 flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all duration-300 rounded-l-xl shadow-lg",
          "hover:pr-6 group",
          hasActiveFilter ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-800"
        )}
        style={{
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
        }}
      >
        <Filter className="w-5 h-5" />
        <span className="hidden group-hover:inline">
          {hasActiveFilter ? "Filter Active" : "Date Filter"}
        </span>
        {hasActiveFilter && (
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel - Slide from Right */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg bg-opacity-20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Global Date Filter
              </h2>
              <p className="text-xs text-white text-opacity-80">
                Apply filter to all pages
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ height: "calc(100% - 140px)" }}
        >
          {/* Current Filter Display */}
          <div className="p-4 mb-6 rounded-lg bg-blue-50">
            <p className="mb-1 text-xs font-medium text-blue-600">
              Current Filter
            </p>
            <p className="text-sm font-bold text-blue-900">
              {getFilterDisplayText()}
            </p>
            {hasActiveFilter && (
              <p className="mt-2 text-xs text-blue-600">
                📅 {dateRange.startDate} → {dateRange.endDate}
              </p>
            )}
          </div>

          {/* Filter Mode Selection */}
          <div className="mb-6">
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Filter Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateFilters({ filterMode: "month_year" })}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-lg transition-all",
                  filterMode === "month_year"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1" />
                Month & Year
              </button>
              <button
                onClick={() => updateFilters({ filterMode: "year_only" })}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-lg transition-all",
                  filterMode === "year_only"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1" />
                Year Only
              </button>
              <button
                onClick={() => updateFilters({ filterMode: "ytd" })}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-lg transition-all",
                  filterMode === "ytd"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1" />
                Year to Date
              </button>
              <button
                onClick={() => updateFilters({ filterMode: "custom" })}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-lg transition-all",
                  filterMode === "custom"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1" />
                Custom Range
              </button>
            </div>
          </div>

          {/* Filter Inputs */}
          <div className="space-y-4">
            {/* Month & Year Mode */}
            {filterMode === "month_year" && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Select Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) =>
                      updateFilters({ month: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {monthOptions.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Select Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) =>
                      updateFilters({ year: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Year Only Mode */}
            {filterMode === "year_only" && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    updateFilters({ year: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* YTD Mode - Info Only */}
            {filterMode === "ytd" && (
              <div className="p-4 rounded-lg bg-green-50">
                <p className="text-sm font-medium text-green-800">
                  📊 Year-to-Date Mode Active
                </p>
                <p className="mt-1 text-xs text-green-600">
                  Showing data from January 1, {new Date().getFullYear()} to
                  today
                </p>
              </div>
            )}

            {/* Custom Range Mode */}
            {filterMode === "custom" && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) =>
                      updateFilters({ startDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => updateFilters({ endDate: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 mt-6 border-l-4 border-blue-500 rounded-r-lg bg-blue-50">
            <p className="text-xs font-medium text-blue-800">💡 Filter Tips</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-600">
              <li>• Filter applies to all pages automatically</li>
              <li>• Changes are saved in URL for easy sharing</li>
              <li>• Use YTD for current year analysis</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-3 p-6 bg-white border-t">
          <button
            onClick={() => {
              resetFilters();
              setIsOpen(false);
            }}
            disabled={isApplying}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Reset Filter
          </button>
          <button
            onClick={() => setIsOpen(false)}
            disabled={isApplying}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isApplying && (
              <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
            )}
            {isApplying ? "Applying..." : "Apply Filter"}
          </button>
        </div>
      </div>
    </>
  );
}
