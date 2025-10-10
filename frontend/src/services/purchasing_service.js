import api from "./api";

export const searchPurchasing = async (filter) => {
  const response = await api.get("/purchasing/search", {
    params: filter,
  });
  return response.data;
};

export const getPurchasingById = async (id) => {
  const response = await api.get(`/purchasing/${id}`);
  return response.data;
};

export const createPurchasing = async (data) => {
  const response = await api.post("/purchasing", data);
  return response.data;
};

export const updatePurchasing = async (id, data) => {
  const response = await api.put(`/purchasing/${id}`, data);
  return response.data;
};

export const deletePurchasing = async (id) => {
  const response = await api.delete(`/purchasing/${id}`);
  return response.data;
};
