import api from "./api";

export const searchDesignType = async (filter) => {
  const response = await api.get("/design-type/search", {
    params: filter,
  });
  return response;
};

export const getDesignTypeById = async (id) => {
  const response = await api.get(`/design-type/${id}`);
  return response;
};

export const createDesignType = async (data) => {
  const response = await api.post("/design-type", data);
  return response;
};

export const updateDesignType = async (id, data) => {
  const response = await api.put(`/design-type/${id}`, data);
  return response;
};

export const deleteDesignType = async (id) => {
  const response = await api.delete(`/design-type/${id}`);
  return response;
};
