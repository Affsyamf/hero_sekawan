// src/services/report_color_kitchen_service.js
import api from "./api";

/**
 * Utility: normalize filters to ensure correct defaults and structure
 */
const normalizeFilters = (filters = {}) => ({
  start_date: filters.start_date || null,
  end_date: filters.end_date || null,
  account_type: filters.account_type || null,
  granularity: filters.granularity || "monthly",
});

/**
 * ColorKitchen Summary — top-level KPIs
 */
export const reportsColorKitchenSummary = async (filters = {}) => {
  const payload = normalizeFilters(filters);
  const response = await api.post("reports/color-kitchen/summary", payload);
  return response.data;
};

/**
 * ColorKitchen Chemical Usage Summary — time-based Chemical Usage Summary (daily, weekly, monthly, yearly)
 */
export const reportsColorKitchenChemicalUsageSummary = async (filters = {}) => {
  const payload = normalizeFilters(filters);
  const response = await api.post(
    "reports/color-kitchen/chemical-usage/summary",
    payload
  );
  return response.data;
};

/**
 * ColorKitchen Chemical Usage Type — time-based type (daily, weekly, monthly, yearly)
 */
export const reportsColorKitchenChemicalUsage = async (
  parent_type,
  filters = {}
) => {
  const payload = normalizeFilters(filters);
  const response = await api.post(
    `reports/color-kitchen/chemical-usage?parent_type=${parent_type}`,
    payload
  );
  return response.data;
};

/**
 * ColorKitchen Trend — time-based type (daily, weekly, monthly, yearly)
 */
export const reportsColorKitchenTrend = async (filters = {}) => {
  const payload = normalizeFilters(filters);
  const response = await api.post(`reports/color-kitchen/trend`, payload);
  return response.data;
};
