import api from "./api";

export const overviewDashboard = async (filter) => {
  const response = await api.get("/dashboard/", {
    params: filter,
  });
  return response.data;
};



