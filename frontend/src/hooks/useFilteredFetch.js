// hooks/useFilteredFetch.js
import { useCallback, useEffect, useRef } from "react";
import { useGlobalFilter } from "../contexts/GlobalFilterContext";

/**
 * Custom hook untuk auto-inject global date filter ke API calls
 * Compatible dengan axios params structure
 *
 * @param {Function} fetchFunction - Original fetch function dari service
 * @param {string} dateFieldName - Nama field date di backend (default: 'date')
 * @returns {Function} Enhanced fetch function dengan auto-inject date filter
 */
export const useFilteredFetch = (fetchFunction, dateFieldName = "date") => {
  const { dateRange } = useGlobalFilter();

  // Track previous dateRange untuk trigger re-render
  const prevDateRangeRef = useRef(dateRange);

  const filteredFetch = useCallback(
    async (filter = {}) => {
      // Merge original filter dengan global date filter
      const enhancedFilter = { ...filter };

      // Inject global date filter jika ada
      if (dateRange.startDate && dateRange.endDate) {
        enhancedFilter.start_date = dateRange.startDate;
        enhancedFilter.end_date = dateRange.endDate;
        // Optional: jika backend butuh field name
        // enhancedFilter.date_field = dateFieldName;
      }

    //   console.log("🔍 Enhanced Filter:", enhancedFilter);
    //   console.log("📅 Date Range:", dateRange);

      // Call original fetch function dengan filter yang sudah di-enhance
      return await fetchFunction(enhancedFilter);
    },
    [fetchFunction, dateRange.startDate, dateRange.endDate, dateFieldName]
  );

  // Update ref untuk tracking
  useEffect(() => {
    prevDateRangeRef.current = dateRange;
  }, [dateRange]);

  return filteredFetch;
};
