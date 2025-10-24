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
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-20 hover:text-blue-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
