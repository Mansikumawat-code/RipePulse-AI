import { apiClient, unwrapList } from './api';

export const alertService = {
  async getAllAlerts() {
    const response = await apiClient.get('/alerts');
    return unwrapList(response.data);
  },

  async acknowledgeAlert(alertId) {
    const response = await apiClient.patch(`/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  async resolveAlert(alertId) {
    const response = await apiClient.patch(`/alerts/${alertId}/resolve`);
    return response.data;
  },

  async getRiskSummary() {
    const response = await apiClient.get('/risk-summary');
    return response.data;
  },
};
