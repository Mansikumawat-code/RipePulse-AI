import { apiClient } from './api';

export const recommendationService = {
  async getBatchRecommendation(batch) {
    const response = await apiClient.get(`/batches/${batch.id}/recommendation`);
    return response.data;
  },

  async executeReroute(batchId, targetDestinationId, options = {}) {
    const response = await apiClient.post('/reroute/execute', {
      batchId,
      targetDestinationId,
      options,
    });
    return response.data;
  },
};
