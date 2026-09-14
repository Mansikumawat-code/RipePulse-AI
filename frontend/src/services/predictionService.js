import { apiClient } from './api';

export const predictionService = {
  /**
   * Sends batch data to the backend /predict endpoint and receives a fresh
   * XGBoost shelf-life prediction. The model runs on the backend only.
   */
  async predictBatchShelfLife(batchData) {
    const response = await apiClient.post('/predict', batchData);
    return response.data;
  },

  /**
   * Fetches the latest stored AI prediction result for a batch from the backend.
   * Returns RSL, SLI, riskLevel, confidenceScore, and decayRateFactor.
   */
  async getBatchPrediction(batchId) {
    const response = await apiClient.get(`/batches/${batchId}/prediction`);
    return response.data;
  },
};
