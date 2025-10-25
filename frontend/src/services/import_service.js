import api from "./api";

export const importApi = {
  importLapPembelian: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/import/lap-pembelian", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  previewLapPembelian: (file) => {
    console.log("DELETE ME");
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/import/lap-pembelian/preview", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  previewLapCk: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/import/lap-ck/preview", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  importLapCk: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/import/lap-ck", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async previewStockOpname(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("import/stock-opname-chemical/preview", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  async importStockOpname(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("import/stock-opname-chemical", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  previewLapChemical(file) {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("import/lap-chemical/preview", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  importLapChemical(file) {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("import/lap-chemical", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async previewOpeningBalance(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("import/opening-balance/preview", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  async importOpeningBalance(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("import/opening-balance", fd, {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
