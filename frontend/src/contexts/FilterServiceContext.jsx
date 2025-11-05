/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";

const FilterServiceContext = createContext();

export function FilterServiceProvider({ children }) {
  const location = useLocation();
  const [filtersByPage, setFiltersByPage] = useState({});
  const [registeredComponents, setRegisteredComponents] = useState({});

  const currentPage = location.pathname;

  // === Filter CRUD (per route) ===
  const setFilter = useCallback(
    (key, value) => {
      setFiltersByPage((prev) => ({
        ...prev,
        [currentPage]: { ...(prev[currentPage] || {}), [key]: value },
      }));
    },
    [currentPage]
  );

  const getFilters = useCallback(
    () => filtersByPage[currentPage] || {},
    [filtersByPage, currentPage]
  );

  const registerFilters = useCallback(
    (components) => {
      setRegisteredComponents((prev) => ({
        ...prev,
        [currentPage]: components,
      }));
    },
    [currentPage]
  );

  const clearFilters = useCallback(() => {
    setFiltersByPage((prev) => {
      const next = { ...prev };
      delete next[currentPage];
      return next;
    });
    setRegisteredComponents((prev) => {
      const next = { ...prev };
      delete next[currentPage];
      return next;
    });
  }, [currentPage]);

  const hasActiveFilters =
    Object.keys(filtersByPage[currentPage] || {}).length > 0;

  return (
    <FilterServiceContext.Provider
      value={{
        filters: getFilters(),
        setFilter,
        registerFilters,
        clearFilters,
        registeredComponents: registeredComponents[currentPage] || [],
        hasActiveFilters,
      }}
    >
      {children}
    </FilterServiceContext.Provider>
  );
}

export const useFilterService = () => useContext(FilterServiceContext);
