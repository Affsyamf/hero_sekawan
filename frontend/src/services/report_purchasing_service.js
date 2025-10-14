import api from "./api";

export const reportsPurchasingSummary = async (filters = {}) => {
  const response = await api.get("reports/purchasing/summary", {
    params: {
      start_date: filters.start_date,
      end_date: filters.end_date,
      account_type: filters.account_type,
    },
  });
  return response.data;
};
