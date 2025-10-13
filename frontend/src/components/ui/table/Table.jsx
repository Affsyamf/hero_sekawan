import { useEffect, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Search,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { useTheme } from "../../../contexts/ThemeContext";
import Button from "../button/Button";

export default function Table({
  columns = [],
  fetchData,
  actions,
  onCreate,
  pageSizeOptions = [5, 10, 20, 50],
  dateFilterKey = "date",
  showNumbering = true,
  showDateRangeFilter = false, // New prop untuk mengontrol date range filter
}) {
  const { colors } = useTheme();

  const [displayColumns, setDisplayColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);

  useEffect(() => {
    if (showNumbering) {
      const numberingColumn = {
        key: "_number",
        label: "No.",
        sortable: false,
        render: (_, __, index) => (
          <span
            className="font-medium"
            style={{ color: colors.text.secondary }}
          >
            {(page - 1) * pageSize + index + 1}.
          </span>
        ),
      };

      setDisplayColumns([numberingColumn, ...columns]);
    } else {
      setDisplayColumns(columns);
    }
  }, [showNumbering, columns, page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = Object.fromEntries(
        Object.entries({
          page,
          page_size: pageSize,
          q: search,
          filters,
          sortBy: sortConfig.key,
          sortDir: sortConfig.direction,
          ...(showDateRangeFilter && { dateRange }), // Only include dateRange if filter is enabled
        }).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );

      const response = await fetchData(params);

      // Handle response structure: { success, message, data, meta }
      if (response.status == 200) {
        const result = response.data;

        setRows(result.data || []);

        // Extract pagination info from meta
        if (result.meta?.pagination) {
          const { total: totalRecords, total_pages } = result.meta.pagination;
          setTotal(totalRecords || 0);
          setTotalPages(total_pages || 0);
        } else {
          // Fallback jika meta tidak ada
          setTotal(result.data?.length || 0);
          setTotalPages(1);
        }
      } else {
        setError(response.message || "Failed to fetch data");
        setRows([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Table fetch error:", err);
      setError(err.message || "An error occurred while fetching data");
      setRows([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, search, filters, sortConfig, dateRange]);

  const clearDateRange = () => {
    setDateRange({ start: "", end: "" });
    setSearch("");
    setPage(1);
  };

  // Update hasActiveFilters to only check dateRange if showDateRangeFilter is true
  const hasActiveFilters = showDateRangeFilter
    ? dateRange.start || dateRange.end || search
    : search;

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1); // Reset ke halaman pertama
    setShowPageSizeMenu(false);
  };

  return (
    <div
      className="overflow-hidden shadow-sm rounded-xl"
      style={{
        background: colors.background.card,
        border: `1px solid ${colors.border.primary}`,
      }}
    >
      {/* Toolbar */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: colors.border.primary }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={{
                background: colors.background.primary,
                border: `1px solid ${colors.border.primary}`,
                color: colors.text.primary,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Date Range Filter - Conditional Rendering */}
            {showDateRangeFilter && (
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-all duration-200",
                    (dateRange.start || dateRange.end) &&
                      "ring-2 ring-blue-500/20"
                  )}
                  style={{
                    background: colors.background.primary,
                    border: `1px solid ${colors.border.primary}`,
                    color: colors.text.primary,
                  }}
                >
                  <Calendar size={16} />
                  <span>Date Range</span>
                  {(dateRange.start || dateRange.end) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>

                {/* Dropdown Filter */}
                {showFilters && (
                  <div
                    className="absolute right-0 z-10 p-4 mt-2 rounded-lg shadow-lg top-full w-80"
                    style={{
                      background: colors.background.card,
                      border: `1px solid ${colors.border.primary}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-sm font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        Filter by Date
                      </span>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label
                          className="block text-xs mb-1.5"
                          style={{ color: colors.text.secondary }}
                        >
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => {
                            setDateRange((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }));
                            setPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm transition-all rounded-lg"
                          style={{
                            background: colors.background.primary,
                            border: `1px solid ${colors.border.primary}`,
                            color: colors.text.primary,
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-xs mb-1.5"
                          style={{ color: colors.text.secondary }}
                        >
                          End Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => {
                            setDateRange((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }));
                            setPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm transition-all rounded-lg"
                          style={{
                            background: colors.background.primary,
                            border: `1px solid ${colors.border.primary}`,
                            color: colors.text.primary,
                          }}
                        />
                      </div>

                      {(dateRange.start || dateRange.end) && (
                        <button
                          onClick={clearDateRange}
                          className="w-full py-2 text-sm text-red-500 transition-all rounded-lg hover:bg-red-50"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create Button */}
            {onCreate && (
              <Button icon={Plus} label="Create" onClick={onCreate} />
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        {/* Overlay Loading untuk subsequent loads (ketika sudah ada data) */}
        {loading && rows.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <span
                className="text-sm"
                style={{ color: colors.text.secondary }}
              >
                Loading...
              </span>
            </div>
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr
              className="border-b-2"
              style={{
                background: colors.background.card,
                borderColor: colors.border.primary,
              }}
            >
              {displayColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() =>
                    col.sortable &&
                    setSortConfig((prev) => {
                      if (prev.key === col.key) {
                        return {
                          key: col.key,
                          direction: prev.direction === "asc" ? "desc" : "asc",
                        };
                      }
                      return { key: col.key, direction: "asc" };
                    })
                  }
                  className={cn(
                    "px-6 py-4 text-left text-sm font-semibold",
                    col.sortable &&
                      "cursor-pointer select-none transition-all hover:bg-gray-50"
                  )}
                  style={{ color: colors.text.primary }}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={cn(
                            "transition-all",
                            sortConfig.key === col.key &&
                              sortConfig.direction === "asc"
                              ? "text-blue-500"
                              : "text-gray-300"
                          )}
                        />
                        <ChevronDown
                          size={12}
                          className={cn(
                            "transition-all -mt-1",
                            sortConfig.key === col.key &&
                              sortConfig.direction === "desc"
                              ? "text-blue-500"
                              : "text-gray-300"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th
                  className="px-6 py-4 text-sm font-semibold text-left"
                  style={{ color: colors.text.primary }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length + (actions ? 1 : 0)}
                  className="py-16 text-sm text-center"
                  style={{ color: colors.text.secondary }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={displayColumns.length + (actions ? 1 : 0)}
                  className="py-16 text-sm text-center"
                  style={{ color: "#ef4444" }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-full"
                      style={{ background: "#fee2e2" }}
                    >
                      <X size={20} style={{ color: "#ef4444" }} />
                    </div>
                    <span>{error}</span>
                    <button
                      onClick={loadData}
                      className="px-4 py-2 mt-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="transition-all duration-150 border-b"
                  style={{
                    borderColor: colors.border.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      colors.background.primary + "20";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {displayColumns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {col.render
                        ? col.render(row[col.key], row, i)
                        : row[col.key] ?? "-"}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-sm">{actions(row)}</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={displayColumns.length + (actions ? 1 : 0)}
                  className="py-16 text-sm text-center"
                  style={{ color: colors.text.secondary }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-full"
                      style={{ background: colors.background.primary }}
                    >
                      <Filter
                        size={20}
                        style={{ color: colors.text.secondary }}
                      />
                    </div>
                    <span>No data found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between px-6 py-4 border-t"
        style={{ borderColor: colors.border.primary }}
      >
        {/* Left: Rows per page + Results info */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center gap-3">
            <span
              className="text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              {pageSize}
            </span>
            <button
              onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
              className="p-1 transition-all rounded hover:bg-gray-100"
            >
              <ChevronDown
                size={16}
                style={{ color: colors.text.secondary }}
                className={cn(
                  "transition-transform",
                  showPageSizeMenu && "rotate-180"
                )}
              />
            </button>

            {/* Page Size Menu */}
            {showPageSizeMenu && (
              <div
                className="absolute left-0 z-10 w-20 py-1 mb-1 rounded-lg shadow-lg bottom-full"
                style={{
                  background: colors.background.card,
                  border: `1px solid ${colors.border.primary}`,
                }}
              >
                {pageSizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                    className={cn(
                      "w-full px-4 py-2 text-sm text-left transition-all hover:bg-gray-100",
                      size === pageSize &&
                        "bg-blue-50 text-blue-600 font-medium"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-sm" style={{ color: colors.text.secondary }}>
            {total > 0 ? (
              <>
                Results: {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, total)} of {total}
              </>
            ) : (
              "No results"
            )}
          </span>
        </div>

        {/* Right: Page navigation */}
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-medium transition-all rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
            style={{
              color: colors.text.secondary,
            }}
          >
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {/* First page */}
            {page > 2 && (
              <>
                <button
                  onClick={() => setPage(1)}
                  className="min-w-[28px] h-7 text-sm font-medium transition-all rounded-md hover:bg-gray-100 px-2"
                  style={{
                    background: colors.background.primary,
                    color: colors.text.primary,
                  }}
                >
                  1
                </button>
                {page > 3 && (
                  <span
                    className="px-1 text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    ...
                  </span>
                )}
              </>
            )}

            {/* Previous page */}
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="min-w-[28px] h-7 text-sm font-medium transition-all rounded-md hover:bg-gray-100 px-2"
                style={{
                  background: colors.background.primary,
                  color: colors.text.primary,
                }}
              >
                {page - 1}
              </button>
            )}

            {/* Current page */}
            <button
              className="min-w-[28px] h-7 text-sm font-medium rounded-md px-2"
              style={{
                background: colors.background.primary,
                color: colors.primary,
                border: `1.5px solid ${colors.primary}`,
              }}
            >
              {page}
            </button>

            {/* Next page */}
            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                className="min-w-[28px] h-7 text-sm font-medium transition-all rounded-md hover:bg-gray-100 px-2"
                style={{
                  background: colors.background.primary,
                  color: colors.text.primary,
                }}
              >
                {page + 1}
              </button>
            )}

            {/* Last pages */}
            {page < totalPages - 1 && (
              <>
                {page < totalPages - 2 && (
                  <span
                    className="px-1 text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    ...
                  </span>
                )}
                <button
                  onClick={() => setPage(totalPages)}
                  className="min-w-[28px] h-7 text-sm font-medium transition-all rounded-md hover:bg-gray-100 px-2"
                  style={{
                    background: colors.background.primary,
                    color: colors.text.primary,
                  }}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-medium transition-all rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
            style={{
              color: colors.text.primary,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
