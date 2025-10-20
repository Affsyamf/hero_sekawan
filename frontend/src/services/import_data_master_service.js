import api from "./api";

export const importDataMasterLapChemical = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/import/master-data/lap-chemical", formData);
  return response;
};

export const importDataMasterLapChemicalPreview = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/import/master-data/lap-chemical/preview",
    formData
  );
  return response;
};

export const importDataMasterLapPembelian = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/import/master-data/lap-pembelian",
    formData
  );
  return response;
};

export const importDataMasterLapPembelianPreview = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/import/master-data/lap-pembelian/preview",
    formData
  );
  return response;
};

export const importDataMasterLapCk = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/import/master-data/lap-ck", formData);
  return response;
};

export const importDataMasterLapCkPreview = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/import/master-data/lap-ck/preview",
    formData
  );
  return response;
};
