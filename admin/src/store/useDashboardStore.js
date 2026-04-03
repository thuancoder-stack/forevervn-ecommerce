import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  period: '12m',
  activeMetric: 'orders',
  selectedOrderId: null,
  selectedCategory: null,
  setPeriod: (period) => set({ period }),
  setActiveMetric: (activeMetric) => set({ activeMetric }),
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}))
