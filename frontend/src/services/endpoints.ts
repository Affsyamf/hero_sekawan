import { http, uploadFile, downloadFile, buildQuery } from "./api";

// ==================== TYPES ====================
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  status?: string;
  total?: number;
}

export interface SearchFilters {
  search?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

// ==================== GENERAL ====================
export const generalApi = {
  async healthCheck(showLoading: boolean = false) {
    return await http(showLoading, `/`, { method: "GET" });
  },
};

// ==================== MASTER DATA ====================

// Supplier API
export const supplierApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/supplier/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/supplier/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    code: string;
    name: string;
    contact_info?: string;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/supplier`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    code?: string;
    name?: string;
    contact_info?: string;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/supplier/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/supplier/${id}`,
      { method: "DELETE" }
    );
  },
};

// Product API
export const productApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/product/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/product/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    code?: string;
    name: string;
    unit?: string;
    account_id?: number;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/product`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    code?: string;
    name?: string;
    unit?: string;
    account_id?: number;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/product/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/product/${id}`,
      { method: "DELETE" }
    );
  },
};

// Design API
export const designApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    code: string;
    type_id: number;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    code?: string;
    type_id?: number;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design/${id}`,
      { method: "DELETE" }
    );
  },
};

// ==================== TYPES ====================

// Account API
export const accountApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/account/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/account/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    name: string;
    account_no: number;
    account_type: string; // 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
    alias?: string;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/account`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    name?: string;
    account_no?: number;
    account_type?: string;
    alias?: string;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/account/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/account/${id}`,
      { method: "DELETE" }
    );
  },
};

// Design Type API
export const designTypeApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design-type/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design-type/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    name: string;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design-type`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    name?: string;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design-type/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/design-type/${id}`,
      { method: "DELETE" }
    );
  },
};

// ==================== LEDGER ====================

export const ledgerApi = {
  async search(filters: {
    product_id?: number;
    ref?: string; // 'PURCHASING' | 'STOCK_MOVEMENT' | 'COLOR_KITCHEN'
    location?: string; // 'WAREHOUSE' | 'PRODUCTION'
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/ledger/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/ledger/${id}`,
      { method: "GET" }
    );
  },

  async getByProduct(productId: number, filters: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/ledger/product/${productId}`,
      { method: "POST" },
      filters
    );
  },

  async getStock(filters: {
    product_id?: number;
    location?: string;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/ledger/stock`,
      { method: "POST" },
      filters
    );
  },
};

// ==================== PURCHASING ====================

export const purchasingApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/purchasing/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/purchasing/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    date?: string;
    code?: string;
    purchase_order?: string;
    supplier_id: number;
    details: Array<{
      product_id: number;
      quantity: number;
      price: number;
      discount?: number;
      ppn?: number;
      pph?: number;
      dpp?: number;
      tax_no?: string;
      exchange_rate?: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/purchasing`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    date?: string;
    code?: string;
    purchase_order?: string;
    supplier_id?: number;
    details?: Array<{
      id?: number;
      product_id: number;
      quantity: number;
      price: number;
      discount?: number;
      ppn?: number;
      pph?: number;
      dpp?: number;
      tax_no?: string;
      exchange_rate?: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/purchasing/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/purchasing/${id}`,
      { method: "DELETE" }
    );
  },

  async getBySupplier(supplierId: number, filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/purchasing/supplier/${supplierId}`,
      { method: "POST" },
      filters
    );
  },
};

// ==================== STOCK MOVEMENT ====================

export const stockMovementApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-movement/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-movement/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    date?: string;
    code: string;
    details: Array<{
      product_id: number;
      quantity: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-movement`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    date?: string;
    code?: string;
    details?: Array<{
      id?: number;
      product_id: number;
      quantity: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-movement/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-movement/${id}`,
      { method: "DELETE" }
    );
  },
};

// ==================== STOCK OPNAME ====================

export const stockOpnameApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    date?: string;
    code: string;
    details: Array<{
      product_id: number;
      system_quantity: number;
      physical_quantity: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    date?: string;
    code?: string;
    details?: Array<{
      id?: number;
      product_id: number;
      system_quantity: number;
      physical_quantity: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname/${id}`,
      { method: "DELETE" }
    );
  },

  // Get current system stock untuk prepare stock opname
  async getCurrentStock(filters: {
    product_id?: number;
    location?: string;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname/current-stock`,
      { method: "POST" },
      filters
    );
  },

  // Get stock opname differences/variances
  async getDifferences(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname/${id}/differences`,
      { method: "GET" }
    );
  },

  // Approve stock opname (untuk update ledger berdasarkan selisih)
  async approve(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/stock-opname/${id}/approve`,
      { method: "POST" }
    );
  },
};

// ==================== COLOR KITCHEN ====================

// Color Kitchen Batch API
export const colorKitchenBatchApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-batch/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-batch/${id}`,
      { method: "GET" }
    );
  },

  async create(payload: {
    date?: string;
    code: string;
    entries: Array<{
      code: string; // OPJ
      design_id: number;
      rolls?: number;
      paste_quantity: number;
      details: Array<{
        product_id: number;
        quantity: number;
      }>;
    }>;
    details: Array<{
      product_id: number;
      quantity: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-batch`,
      { method: "POST" },
      payload
    );
  },

  async update(id: number, payload: {
    date?: string;
    code?: string;
    entries?: Array<{
      id?: number;
      code: string;
      design_id: number;
      rolls?: number;
      paste_quantity: number;
      details: Array<{
        id?: number;
        product_id: number;
        quantity: number;
      }>;
    }>;
    details?: Array<{
      id?: number;
      product_id: number;
      quantity: number;
    }>;
  }, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-batch/${id}`,
      { method: "PUT" },
      payload
    );
  },

  async delete(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-batch/${id}`,
      { method: "DELETE" }
    );
  },
};

// Color Kitchen Entry API (Individual OPJ)
export const colorKitchenEntryApi = {
  async search(filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-entry/search`,
      { method: "POST" },
      filters
    );
  },

  async getById(id: number, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-entry/${id}`,
      { method: "GET" }
    );
  },

  async getByBatch(batchId: number, filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-entry/batch/${batchId}`,
      { method: "POST" },
      filters
    );
  },

  async getByDesign(designId: number, filters: SearchFilters = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/color-kitchen-entry/design/${designId}`,
      { method: "POST" },
      filters
    );
  },
};

// ==================== DASHBOARD ====================

export const dashboardApi = {
  async getOverview(filters: {
    start_date?: string;
    end_date?: string;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/dashboard/overview`,
      { method: "POST" },
      filters
    );
  },

  async getStockSummary(filters: {
    location?: string; // 'WAREHOUSE' | 'PRODUCTION'
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/dashboard/stock-summary`,
      { method: "POST" },
      filters
    );
  },

  async getPurchasingSummary(filters: {
    start_date?: string;
    end_date?: string;
    supplier_id?: number;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/dashboard/purchasing-summary`,
      { method: "POST" },
      filters
    );
  },

  async getProductionSummary(filters: {
    start_date?: string;
    end_date?: string;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/dashboard/production-summary`,
      { method: "POST" },
      filters
    );
  },
};

// ==================== REPORTS ====================

export const reportApi = {
  // Ledger Reports
  async getLedgerReport(filters: {
    product_id?: number;
    start_date?: string;
    end_date?: string;
    location?: string;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/report/ledger`,
      { method: "POST" },
      filters
    );
  },

  async exportLedger(filters: {
    product_id?: number;
    start_date?: string;
    end_date?: string;
    location?: string;
  } = {}, showLoading: boolean = true) {
    return await downloadFile(
      showLoading,
      `/report/ledger/export`,
      `ledger_report_${new Date().getTime()}.xlsx`,
      "POST",
      filters
    );
  },

  // Stock Reports
  async getStockReport(filters: {
    location?: string;
    product_id?: number;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/report/stock`,
      { method: "POST" },
      filters
    );
  },

  async exportStock(filters: {
    location?: string;
    product_id?: number;
  } = {}, showLoading: boolean = true) {
    return await downloadFile(
      showLoading,
      `/report/stock/export`,
      `stock_report_${new Date().getTime()}.xlsx`,
      "POST",
      filters
    );
  },

  // Purchasing Reports
  async getPurchasingReport(filters: {
    start_date?: string;
    end_date?: string;
    supplier_id?: number;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/report/purchasing`,
      { method: "POST" },
      filters
    );
  },

  async exportPurchasing(filters: {
    start_date?: string;
    end_date?: string;
    supplier_id?: number;
  } = {}, showLoading: boolean = true) {
    return await downloadFile(
      showLoading,
      `/report/purchasing/export`,
      `purchasing_report_${new Date().getTime()}.xlsx`,
      "POST",
      filters
    );
  },

  // Stock Opname Reports
  async getStockOpnameReport(filters: {
    start_date?: string;
    end_date?: string;
    product_id?: number;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/report/stock-opname`,
      { method: "POST" },
      filters
    );
  },

  async exportStockOpname(filters: {
    start_date?: string;
    end_date?: string;
    product_id?: number;
  } = {}, showLoading: boolean = true) {
    return await downloadFile(
      showLoading,
      `/report/stock-opname/export`,
      `stock_opname_report_${new Date().getTime()}.xlsx`,
      "POST",
      filters
    );
  },

  // Production Reports
  async getProductionReport(filters: {
    start_date?: string;
    end_date?: string;
    design_id?: number;
  } = {}, showLoading: boolean = true) {
    return await http<ApiResponse>(
      showLoading,
      `/report/production`,
      { method: "POST" },
      filters
    );
  },

  async exportProduction(filters: {
    start_date?: string;
    end_date?: string;
    design_id?: number;
  } = {}, showLoading: boolean = true) {
    return await downloadFile(
      showLoading,
      `/report/production/export`,
      `production_report_${new Date().getTime()}.xlsx`,
      "POST",
      filters
    );
  },
};

// ==================== IMPORT ====================

export const importApi = {
  // Import Harga Obat
  async importHargaObat(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/harga-obat`,
      file
    );
  },

  // Import Lap Chemical
  async importLapChemical(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/lap-chemical`,
      file
    );
  },

  // Import Lap Pembelian
  async importLapPembelian(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/lap-pembelian`,
      file
    );
  },

  // Import Lap CK (Color Kitchen)
  async importLapCk(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/lap-ck`,
      file
    );
  },

  // Import Opening Balance
  async importOpeningBalance(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/opening_balance`,
      file
    );
  },

  // Import Stock Opname
  async importStockOpname(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/stock_opname`,
      file
    );
  },

  // Master Data Imports
  async importMasterDataLapPembelian(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/master-data/lap-pembelian`,
      file
    );
  },

  async importMasterDataProductCode(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/master-data/product_code`,
      file
    );
  },

  async importMasterDataDesign(file: File, showLoading: boolean = true) {
    return await uploadFile<ApiResponse>(
      showLoading,
      `/import/master-data/design`,
      file
    );
  },
};

// ==================== EXPORT DEFAULT ====================
export default {
  general: generalApi,
  supplier: supplierApi,
  product: productApi,
  design: designApi,
  account: accountApi,
  designType: designTypeApi,
  ledger: ledgerApi,
  purchasing: purchasingApi,
  stockMovement: stockMovementApi,
  stockOpname: stockOpnameApi,
  colorKitchenBatch: colorKitchenBatchApi,
  colorKitchenEntry: colorKitchenEntryApi,
  dashboard: dashboardApi,
  report: reportApi,
  import: importApi,
};