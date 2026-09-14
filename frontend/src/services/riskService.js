import { apiClient, unwrapList } from './api';

export const riskService = {
  async getRiskSummary() {
    const response = await apiClient.get('/risk-summary');
    return response.data;
  },

  async getAlerts() {
    const response = await apiClient.get('/alerts');
    return unwrapList(response.data);
  },

  async acknowledgeAlert(alertId) {
    const response = await apiClient.patch(`/alerts/${alertId}/acknowledge`);
    return response.data;
  },
};
