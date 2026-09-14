import { apiClient, unwrapList } from './api';

export const batchService = {
  async getAllBatches() {
    const response = await apiClient.get('/batches');
    return unwrapList(response.data);
  },

  async getBatchById(id) {
    const response = await apiClient.get(`/batches/${id}`);
    return response.data;
  },

  async createBatch(newBatch) {
    const response = await apiClient.post('/batches', newBatch);
    return response.data;
  },

  async updateBatchAction(batchId, status) {
    const response = await apiClient.patch(`/batches/${batchId}/action`, { status });
    return response.data;
  },
};
