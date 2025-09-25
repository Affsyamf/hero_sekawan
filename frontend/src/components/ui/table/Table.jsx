import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { cn } from "../../../utils/cn";
import { useTheme } from "../../../context/ThemeContext";
import Input from "../input/Input";
import Button from "../button/Button";

export default function Table({
  columns = [],
  fetchData, // 🔑 function(params) -> { rows, total }
  actions,
  onCreate,
  pageSizeOptions = [5, 10, 20, 50],
  dateFilterKey = "date",
}) {
  const { colors } = useTheme();

  // State query params
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Load data
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, filters, sortConfig, dateRange]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: colors.border.primary,
        background: colors.background.card,
      }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-4 border-b"
        style={{ borderColor: colors.border.primary }}
      >
        {/* Search */}
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-xs"
        />

        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="px-2 py-1 text-sm border rounded"
          />
          <span>-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="px-2 py-1 text-sm border rounded"
          />
        </div>

        {/* Create button */}
        {onCreate && <Button icon={Plus} label="Create" onClick={onCreate} />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
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
                    "px-4 py-2 text-left cursor-pointer select-none",
                    col.sortable && "hover:text-primary"
                  )}
                  style={{ color: colors.text.secondary }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable &&
                      sortConfig.key === col.key &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-2">Actions</th>}
            </tr>

            {/* Column filters */}
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2">
                  {col.filterType === "text" && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      value={filters[col.key] || ""}
                      onChange={(e) => {
                        setPage(1);
                        setFilters({ ...filters, [col.key]: e.target.value });
                      }}
                    />
                  )}
                </th>
              ))}
              {actions && <th />}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-6 text-center text-secondary-text"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t"
                  style={{ borderColor: colors.border.primary }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2">
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-2">{actions(row)}</td>}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-6 text-center text-secondary-text"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between p-4 border-t"
        style={{ borderColor: colors.border.primary }}
      >
        <div className="flex items-center gap-2 text-sm">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-sm border rounded"
            style={{ borderColor: colors.border.primary }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
            style={{ borderColor: colors.border.primary }}
          >
            Prev
          </button>
          <span className="text-sm">
            {page} / {totalPages || 1}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
            style={{ borderColor: colors.border.primary }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
