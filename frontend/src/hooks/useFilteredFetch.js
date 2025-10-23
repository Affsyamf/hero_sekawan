// hooks/useFilteredFetch.js
import { useCallback, useEffect, useRef } from "react";
import { useGlobalFilter } from "../contexts/GlobalFilterContext";

export const useFilteredFetch = (fetchFunction, dateFieldName = "date") => {
  const { dateRange } = useGlobalFilter();

  // Track previous dateRange untuk trigger re-render
  const prevDateRangeRef = useRef(dateRange);

  const filteredFetch = useCallback(
    async (filter = {}) => {
      const enhancedFilter = { ...filter };

      // Inject global date filter jika ada
      if (dateRange.startDate && dateRange.endDate) {
        enhancedFilter.start_date = dateRange.startDate;
        enhancedFilter.end_date = dateRange.endDate;
      }

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
