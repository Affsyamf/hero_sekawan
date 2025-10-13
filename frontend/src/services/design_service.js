import api from "./api";

export const searchDesign = async (filter) => {
  const response = await api.get("/design/search", {
    params: filter,
  });
  return response;
};

export const getDesignById = async (id) => {
  const response = await api.get(`/design/${id}`);
  return response;
};

export const createDesign = async (data) => {
  const response = await api.post("/design", data);
  return response;
};

export const updateDesign = async (id, data) => {
  const response = await api.put(`/design/${id}`, data);
  return response;
};

export const deleteDesign = async (id) => {
  const response = await api.delete(`/design/${id}`);
  return response;
};
