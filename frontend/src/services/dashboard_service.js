// // frontend/src/services/dashboardService.js
import api from "./api";

export const getDashboardData = async (filters = {}) => {
  // backend kamu pakai POST /dashboard/overview
  const response = await api.post("dashboard/overview", {
    filters: {
      start_date: filters.start_date,
      end_date: filters.end_date,
      granularity: filters.granularity || "monthly",
    },
  });
  return response.data; 
};

// /**
//  * Get dashboard data with metrics, charts, and summaries
//  * @param {string} period - Period filter: "1 Bulan", "3 Bulan", "6 Bulan"
//  * @returns {Promise} Response with dashboard data
//  */
// export const getDashboardData = async (period = "1 Bulan") => {
//   const response = await api.get("/dashboard", {
//     params: { period },
//   });
//   return response;
// };

// /**
//  * Get transaction history with pagination and filters
//  * @param {Object} params - Query parameters
//  * @param {number} params.page - Page number (default: 1)
//  * @param {number} params.page_size - Items per page (default: 10)
//  * @param {number} [params.product_id] - Filter by product ID (optional)
//  * @param {string} [params.ref_type] - Filter by reference type (optional)
//  * @param {string} [params.start_date] - Filter by start date in ISO format (optional)
//  * @param {string} [params.end_date] - Filter by end date in ISO format (optional)
//  * @returns {Promise} Response with paginated transactions
//  *
//  * @example
//  * // Basic usage
//  * const result = await getTransactions({ page: 1, page_size: 10 });
//  *
//  * // With filters
//  * const filtered = await getTransactions({
//  *   page: 1,
//  *   page_size: 20,
//  *   product_id: 5,
//  *   ref_type: "purchasing",
//  *   start_date: "2024-01-01",
//  *   end_date: "2024-12-31"
//  * });
//  */
// export const getTransactions = async (params) => {
//   const response = await api.get("/dashboard/transactions", {
//     params: {
//       page: params.page || 1,
//       page_size: params.page_size || 10,
//       ...(params.product_id && { product_id: params.product_id }),
//       ...(params.ref_type && { ref_type: params.ref_type }),
//       ...(params.start_date && { start_date: params.start_date }),
//       ...(params.end_date && { end_date: params.end_date }),
//     },
//   });
//   return response;
// };

// /**
//  * Export transactions to CSV file
//  * @param {Object} [filters] - Optional filter parameters
//  * @param {number} [filters.product_id] - Filter by product ID
//  * @param {string} [filters.ref_type] - Filter by reference type
//  * @param {string} [filters.start_date] - Filter by start date in ISO format
//  * @param {string} [filters.end_date] - Filter by end date in ISO format
//  * @returns {Promise} Response with CSV file blob
//  *
//  * @example
//  * // Export all transactions
//  * const csv = await exportTransactions();
//  *
//  * // Export with filters
//  * const csvFiltered = await exportTransactions({
//  *   product_id: 5,
//  *   start_date: "2024-01-01",
//  *   end_date: "2024-12-31"
//  * });
//  */
// export const exportTransactions = async (filters = {}) => {
//   const response = await api.get("/dashboard/transactions/export", {
//     params: {
//       ...(filters.product_id && { product_id: filters.product_id }),
//       ...(filters.ref_type && { ref_type: filters.ref_type }),
//       ...(filters.start_date && { start_date: filters.start_date }),
//       ...(filters.end_date && { end_date: filters.end_date }),
//     },
//     responseType: "blob", // Important for file download
//   });
//   return response;
// };

// /**
//  * Download CSV file from blob response
//  * @param {Blob} blob - File blob from API response
//  * @param {string} filename - Filename for downloaded file
//  *
//  * @example
//  * const response = await exportTransactions();
//  * downloadCSVFile(response.data, "transactions.csv");
//  */
// export const downloadCSVFile = (blob, filename) => {
//   const url = window.URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.setAttribute("download", filename);
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   window.URL.revokeObjectURL(url);
// };

// /**
//  * Extract filename from Content-Disposition header
//  * @param {Object} headers - Response headers object
//  * @returns {string} Extracted filename or default filename
//  *
//  * @example
//  * const filename = getFilenameFromHeaders(response.headers);
//  * // Returns: "transactions_export_20241013.csv"
//  */
// export const getFilenameFromHeaders = (headers) => {
//   const contentDisposition = headers["content-disposition"];
//   let filename = `transactions_${new Date().toISOString().split("T")[0]}.csv`;

//   if (contentDisposition) {
//     const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
//     if (filenameMatch && filenameMatch[1]) {
//       filename = filenameMatch[1];
//     }
//   }

//   return filename;
// };
