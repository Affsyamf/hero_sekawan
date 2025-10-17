// contexts/GlobalFilterContext.jsx
import { createContext, useContext, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const GlobalFilterContext = createContext();

export const GlobalFilterProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filter dari URL
  const filters = useMemo(
    () => ({
      filterMode: searchParams.get("filterMode") || "month_year",
      selectedMonth:
        parseInt(searchParams.get("month")) || new Date().getMonth() + 1,
      selectedYear:
        parseInt(searchParams.get("year")) || new Date().getFullYear(),
      customStartDate: searchParams.get("startDate") || "",
      customEndDate: searchParams.get("endDate") || "",
    }),
    [searchParams]
  );

  // Calculate actual date range based on filter mode
  const getDateRange = useCallback(() => {
    const {
      filterMode,
      selectedMonth,
      selectedYear,
      customStartDate,
      customEndDate,
    } = filters;

    switch (filterMode) {
      case "month_year": {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(
          2,
          "0"
        )}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(
          2,
          "0"
        )}-${lastDay}`;
        return { startDate, endDate };
      }

      case "year_only": {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;
        return { startDate, endDate };
      }

      case "ytd": {
        const currentYear = new Date().getFullYear();
        const startDate = `${currentYear}-01-01`;
        const today = new Date();
        const endDate = today.toISOString().split("T")[0];
        return { startDate, endDate };
      }

      case "custom": {
        return {
          startDate: customStartDate || "",
          endDate: customEndDate || "",
        };
      }

      default:
        return { startDate: "", endDate: "" };
    }
  }, [filters]);

  // Update filters ke URL
  const updateFilters = useCallback(
    (newFilters) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      // Preserve other query params (like pagination)
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Reset to default (current month & year)
  const resetFilters = useCallback(() => {
    const now = new Date();
    updateFilters({
      filterMode: "month_year",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  }, [updateFilters]);

  const value = useMemo(
    () => ({
      filters,
      dateRange: getDateRange(),
      updateFilters,
      resetFilters,
    }),
    [filters, getDateRange, updateFilters, resetFilters]
  );

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error("useGlobalFilter must be used within GlobalFilterProvider");
  }
  return context;
};
