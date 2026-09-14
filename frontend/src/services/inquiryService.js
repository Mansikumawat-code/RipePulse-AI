import { apiClient } from './api';

export const inquiryService = {
  /**
   * Fetches all assessment inquiries from SQLite backend.
   */
  async getInquiries(status = null) {
    const params = status && status !== 'ALL' ? { status } : {};
    const res = await apiClient.get('/inquiries', { params });
    return res.data?.inquiries || [];
  },

  /**
   * Submits a new warehouse assessment request from landing page.
   */
  async submitInquiry({ warehouseName, email, volumeDetails }) {
    const payload = {
      warehouse_name: warehouseName,
      email,
      volume_details: volumeDetails
    };
    const res = await apiClient.post('/inquiries', payload);
    return res.data?.inquiry;
  },

  /**
   * Updates inquiry review status (Admin only).
   */
  async updateStatus(inquiryId, status) {
    const res = await apiClient.patch(`/inquiries/${inquiryId}`, { status });
    return res.data?.inquiry;
  },

  /**
   * Deletes an inquiry (Admin only).
   */
  async deleteInquiry(inquiryId) {
    const res = await apiClient.delete(`/inquiries/${inquiryId}`);
    return res.data;
  }
};
