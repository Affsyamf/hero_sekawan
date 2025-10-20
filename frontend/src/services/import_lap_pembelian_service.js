import api from "./api";

// Upload file Excel
export const uploadMasterLapPembelian = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/import-lap-pembelian/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

// Commit data berdasarkan session_id
export const commitMasterLapPembelian = async (session_id) => {
  const response = await api.post(`/import-lap-pembelian/commit/${session_id}`);
  return response;
};

// Get summary preview (all table targets)
export const getPreviewSummaryLapPembelian = async (session_id) => {
  const response = await api.get(`/import-lap-pembelian/preview/${session_id}/summary`);
  return response;
};

// Get preview data by table_target with pagination
export const getPreviewLapPembelian = async (session_id, table_target, page = 1, per_page = 50) => {
  const response = await api.get(
    `/import-lap-pembelian/preview/${session_id}/${table_target}`,
    {
      params: { page, per_page }
    }
  );
  return response;
};

// Preview data berdasarkan session_id
export const previewMasterLapPembelian = async (session_id) => {
  const response = await api.get(`/import-lap-pembelian/preview/${session_id}`);
  return response;
};
