import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Plus, Search, Calendar, Filter, X } from "lucide-react";
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
}) {
  const { colors } = useTheme();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        search,
        filters,
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
        dateRange,
      };
      const result = await fetchData(params);
      setRows(result.rows);
      setTotal(result.total);
    } catch (err) {
      console.error("Table fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, search, filters, sortConfig, dateRange]);

  const totalPages = Math.ceil(total / pageSize);

  const clearDateRange = () => {
    setDateRange({ start: "", end: "" });
  };

  const hasActiveFilters = dateRange.start || dateRange.end || search;

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
            {/* Date Range Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-all duration-200",
                  hasActiveFilters && "ring-2 ring-blue-500/20"
                )}
                style={{
                  background: colors.background.primary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary,
                }}
              >
                <Calendar size={16} />
                <span>Date Range</span>
                {hasActiveFilters && (
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
                    <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
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
                      <label className="block text-xs mb-1.5" style={{ color: colors.text.secondary }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) =>
                          setDateRange((prev) => ({ ...prev, start: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm transition-all rounded-lg"
                        style={{
                          background: colors.background.primary,
                          border: `1px solid ${colors.border.primary}`,
                          color: colors.text.primary,
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: colors.text.secondary }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) =>
                          setDateRange((prev) => ({ ...prev, end: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm transition-all rounded-lg"
                        style={{
                          background: colors.background.primary,
                          border: `1px solid ${colors.border.primary}`,
                          color: colors.text.primary,
                        }}
                      />
                    </div>

                    {hasActiveFilters && (
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

            {/* Create Button */}
            {onCreate && <Button icon={Plus} label="Create" onClick={onCreate} />}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr 
              className="border-b-2"
              style={{ 
                background: colors.background.card,
                borderColor: colors.border.primary 
              }}
            >
              {columns.map((col) => (
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
                    col.sortable && "cursor-pointer select-none transition-all"
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
                            sortConfig.key === col.key && sortConfig.direction === "asc"
                              ? "text-blue-500" 
                              : "text-gray-300"
                          )}
                        />
                        <ChevronDown 
                          size={12} 
                          className={cn(
                            "transition-all -mt-1",
                            sortConfig.key === col.key && sortConfig.direction === "desc"
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
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-16 text-sm text-center"
                  style={{ color: colors.text.secondary }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="transition-all duration-150 border-b"
                  style={{
                    borderColor: colors.border.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.background.primary + "20";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
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
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-16 text-sm text-center"
                  style={{ color: colors.text.secondary }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ background: colors.background.primary }}>
                      <Filter size={20} style={{ color: colors.text.secondary }} />
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
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
              {pageSize}
            </span>
            <button className="p-1 transition-all rounded hover:bg-opacity-10">
              <ChevronUp size={16} style={{ color: colors.text.secondary }} />
            </button>
          </div>
          
          <span className="text-sm" style={{ color: colors.text.secondary }}>
            Results: {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} of {total}
          </span>
        </div>

        {/* Right: Page navigation */}
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-medium transition-all rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-80"
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
                  className="w-6 h-6 text-sm font-medium transition-all rounded-md hover:bg-opacity-80"
                  style={{
                    background: colors.background.primary,
                    color: colors.text.primary,
                  }}
                >
                  1
                </button>
                {page > 3 && (
                  <span className="px-1 text-sm" style={{ color: colors.text.secondary }}>...</span>
                )}
              </>
            )}

            {/* Previous page */}
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="w-6 h-6 text-sm font-medium transition-all rounded-md hover:bg-opacity-80"
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
              className="w-6 h-6 text-sm font-medium rounded-md"
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
                className="w-6 h-6 text-sm font-medium transition-all rounded-md hover:bg-opacity-80"
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
                  <span className="px-1 text-sm" style={{ color: colors.text.secondary }}>...</span>
                )}
                <button
                  onClick={() => setPage(totalPages)}
                  className="w-6 h-6 text-sm font-medium transition-all rounded-md hover:bg-opacity-80"
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
            className="px-4 py-2 text-sm font-medium transition-all rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-80"
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