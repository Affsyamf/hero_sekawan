import api from "./api";

export const searchStockOpname = async (filter) => {
  const response = await api.get("/stock-opname/search", {
    params: filter,
  });
  return response.data;
};

export const getStockOpnameById = async (id) => {
  const response = await api.get(`/stock-opname/${id}`);
  return response.data;
};

export const createStockOpname = async (data) => {
  const response = await api.post("/stock-opname", data);
  return response.data;
};

export const updateStockOpname = async (id, data) => {
  const response = await api.put(`/stock-opname/${id}`, data);
  return response.data;
};

export const deleteStockOpname = async (id) => {
  const response = await api.delete(`/stock-opname/${id}`);
  return response.data;
};
