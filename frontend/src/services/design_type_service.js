import api from "./api";

export const searchDesignType = async (filter) => {
  const response = await api.get("/design-type/search", {
    params: filter,
  });
  return response.data;
};

export const getDesignTypeById = async (id) => {
  const response = await api.get(`/design-type/${id}`);
  return response.data;
};

export const createDesignType = async (data) => {
  const response = await api.post("/design-type", data);
  return response.data;
};

export const updateDesignType = async (id, data) => {
  const response = await api.put(`/design-type/${id}`, data);
  return response.data;
};

export const deleteDesignType = async (id) => {
  const response = await api.delete(`/design-type/${id}`);
  return response.data;
};
