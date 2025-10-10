import api from "./api";

export const searchStockMovement = async (filter) => {
  const response = await api.get("/stock-movement/search", {
    params: filter,
  });
  return response.data;
};

export const getStockMovementById = async (id) => {
  const response = await api.get(`/stock-movement/${id}`);
  return response.data;
};

export const createStockMovement = async (data) => {
  const response = await api.post("/stock-movement", data);
  return response.data;
};

export const updateStockMovement = async (id, data) => {
  const response = await api.put(`/stock-movement/${id}`, data);
  return response.data;
};

export const deleteStockMovement = async (id) => {
  const response = await api.delete(`/stock-movement/${id}`);
  return response.data;
};
