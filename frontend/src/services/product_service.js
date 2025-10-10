import api from "./api";

export const searchProduct = async (filter) => {
  const response = await api.get("/product/search", {
    params: filter,
  });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/product/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post("/product", data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/product/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/product/${id}`);
  return response.data;
};
