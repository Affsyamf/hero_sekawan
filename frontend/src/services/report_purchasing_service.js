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

export const reportsPurchasingTrend = async (filters = {}) => {
  const response = await api.get("reports/purchasing/trend", {
    params: {
      start_date: filters.start_date,
      end_date: filters.end_date,
      account_type: filters.account_type,
      granularity: filters.granularity,
    },
  });
  return response.data;
};

export const reportsPurchasingProducts = async (filters = {}) => {
  const response = await api.get("reports/purchasing/products", {
    params: {
      start_date: filters.start_date,
      end_date: filters.end_date,
      account_type: filters.account_type,
      granularity: filters.granularity,
    },
  });
  return response.data;
};

export const reportsPurchasingSuppliers = async (filters = {}) => {
  const response = await api.get("reports/purchasing/suppliers", {
    params: {
      start_date: filters.start_date,
      end_date: filters.end_date,
      account_type: filters.account_type,
      granularity: filters.granularity,
    },
  });
  return response.data;
};

export const reportsPurchasingBreakdownSummary = async (filters = {}) => {
  const response = await api.get("reports/purchasing/breakdown/summary", {
    params: {
      start_date: filters.start_date,
      end_date: filters.end_date,
      account_type: filters.account_type,
      granularity: filters.granularity,
    },
  });
  return response.data;
};
