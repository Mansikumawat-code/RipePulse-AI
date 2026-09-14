import { apiClient, unwrapList } from './api';

export const destinationService = {
  async getAlternativeDestinations(batchId = null) {
    const response = await apiClient.get('/destinations', { params: { batchId } });
    return unwrapList(response.data);
  },

  async getDestinationById(id) {
    const response = await apiClient.get(`/destinations/${id}`);
    return response.data;
  },
};
