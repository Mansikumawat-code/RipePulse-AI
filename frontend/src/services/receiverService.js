import { apiClient } from './api';

export const receiverService = {
  getShipments: async (facility = null) => {
    const res = await apiClient.get('/receiver/shipments', {
      params: facility ? { facility } : {}
    });
    return res.data;
  },

  getShipmentById: async (shipmentId) => {
    const res = await apiClient.get(`/receiver/shipments/${shipmentId}`);
    return res.data;
  },

  verifyReceipt: async (shipmentId, payload) => {
    const res = await apiClient.post(`/receiver/shipments/${shipmentId}/verify`, payload);
    return res.data;
  },

  getInventory: async (facility = null) => {
    const res = await apiClient.get('/receiver/inventory', {
      params: facility ? { facility } : {}
    });
    return res.data?.inventory || [];
  }
};
