import { apiClient, unwrapList } from './api';

export const routingService = {
  async evaluateRouteFeasibility(batch, route) {
    const response = await apiClient.post('/routing/evaluate', { batchId: batch.id, route });
    return response.data;
  },

  async executeReroute(batchId, targetDestinationId, options = null) {
    const response = await apiClient.post('/reroute/execute', {
      batchId,
      targetDestinationId,
      options,
    });
    return response.data;
  },

  async getDispatches() {
    const response = await apiClient.get('/dispatches');
    return unwrapList(response.data);
  },

  async getAtRiskBatches() {
    const response = await apiClient.get('/batches/at-risk');
    return unwrapList(response.data);
  },

  async checkRoute(batchId, destinationId) {
    const response = await apiClient.post('/routes/check', { batchId, destinationId });
    return response.data;
  },

  async createDispatch(payload) {
    const response = await apiClient.post('/dispatches', payload);
    return response.data;
  },

  async updateDispatchStatus(dispatchId, status, progressPct = null, notes = null) {
    const response = await apiClient.patch(`/dispatches/${dispatchId}/status`, { status, progressPct, notes });
    return response.data;
  },

  async simulateRouteIssue(dispatchId) {
    const response = await apiClient.post(`/dispatches/${dispatchId}/simulate-route-issue`, {
      reason: 'Simulated route blockage/delay',
    });
    return response.data;
  },

  async rerouteDispatch(dispatchId, destinationId, reason) {
    const response = await apiClient.post(`/dispatches/${dispatchId}/reroute`, { destinationId, reason });
    return response.data;
  },
};
