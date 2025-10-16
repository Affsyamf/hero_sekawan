import api from "./api";

export const importApi = {
  importLapPembelian: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/import/lap-pembelian", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  previewLapPembelian: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/import/lap-pembelian/preview", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
