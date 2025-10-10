import api from "./api";

export const searchAccount = async (filter) => {
  const response = await api.get("/account/search", {
    params: filter,
  });
  return response.data;
};

export const getAccountById = async (id) => {
  const response = await api.get(`/account/${id}`);
  return response.data;
};

export const createAccount = async (data) => {
  const response = await api.post("/account", data);
  return response.data;
};

export const updateAccount = async (id, data) => {
  const response = await api.put(`/account/${id}`, data);
  return response.data;
};

export const deleteAccount = async (id) => {
  const response = await api.delete(`/account/${id}`);
  return response.data;
};
