import api from "./api";

export const importHargaObat = async (id) => {
  const response = await api.get(`/import/harga-obat/${id}`);
  return response.data;
};

export const importLapChemical = async (id) => {
  const response = await api.get(`/import/lap-chemical/${id}`);
  return response.data;
};

export const importLapPembelian = async (id) => {
  const response = await api.get(`/import/lap-pembelian/${id}`);
  return response.data;
};

export const importLapCk = async (id) => {
  const response = await api.get(`/import/lap-ck/${id}`);
  return response.data;
};

export const importOpeningBalance = async (id) => {
  const response = await api.get(`/import/opening-balance/${id}`);
  return response.data;
};

export const importStockOpname = async (id) => {
  const response = await api.get(`/import/stock-opname/${id}`);
  return response.data;
};

// import master data
export const importMasterDataLapPembelian = async (id) => {
  const response = await api.get(`/import/master-data/lap-pembelian/${id}`);
  return response.data;
};

export const importMasterDataProductCode = async (id) => {
  const response = await api.get(`/import/master-data/lap-chemical/${id}`);
  return response.data;
};

export const importMasterDataDesign = async (id) => {
  const response = await api.get(`/import/master-data/lap-ck/${id}`);
  return response.data;
};

