import { create } from "zustand";

const useDateFilterStore = create((set) => ({
  dateRange: null,

  setDateRange: (range) => set({ dateRange: range }),

  clearDateRange: () => set({ dateRange: null }),

  // Helper untuk mendapatkan query params untuk API
  getDateParams: () => {
    const state = useDateFilterStore.getState();
    if (!state.dateRange) return {};

    return {
      dateFrom: state.dateRange.dateFrom,
      dateTo: state.dateRange.dateTo,
    };
  },
}));

export default useDateFilterStore;
