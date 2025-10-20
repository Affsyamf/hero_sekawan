import api from "./api";

export const importLapChemical = async (data) => {
  const response = await api.post("/import/lap-chemical", data);
  return response;
};

export const importLapChemicalPreview = async (data) => {
  const response = await api.post("/import/lap-chemical", data);
  return response;
};

export const importLapPembelian = async (data) => {
  const response = await api.post("/import/lap-pembelian", data);
  return response;
};

export const importLapPembelianPreview = async (data) => {
  const response = await api.post("/import/lap-pembelian", data);
  return response;
};

export const importLapCk = async (data) => {
  const response = await api.post("/import/lap-ck", data);
  return response;
};

export const importLapCkPreview = async (data) => {
  const response = await api.post("/import/lap-ck", data);
  return response;
};
