import { apiClient, unwrapList } from './api';

export const telemetryService = {
  async getBatchTelemetry(batchId) {
    const response = await apiClient.get(`/batches/${batchId}/telemetry`);
    return unwrapList(response.data);
  },

  async getWarehouseTelemetry(warehouseId = 'WH-CA-01') {
    const response = await apiClient.get(`/warehouses/${warehouseId}/telemetry`);
    return response.data;
  },

  async simulateStress(batchId) {
    const response = await apiClient.post('/simulate/stress', { batchId });
    return response.data;
  },

  async simulateRecovery(batchId) {
    const response = await apiClient.post('/simulate/recovery', { batchId });
    return response.data;
  },

  async simulateStep(batchId, scenario = 'NORMAL') {
    const response = await apiClient.post('/simulate/step', { batchId, scenario });
    return response.data;
  },

  async sendTelemetry(payload) {
    const response = await apiClient.post('/telemetry', payload);
    return response.data;
  },

  async toggleTicker(batchId) {
    const response = await apiClient.post('/simulate/toggle-ticker', { batchId });
    return response.data;
  },

  async getSimulatorStatus() {
    const response = await apiClient.get('/simulate/status');
    return response.data;
  },
};
