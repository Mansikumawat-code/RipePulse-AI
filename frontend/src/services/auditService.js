import { apiClient } from './api';

export const auditService = {
  /**
   * Retrieves persistent system audit logs from backend.
   * Restricted to ADMIN role.
   *
   * @param {Object} params - { role, action, entity_type, search, limit }
   * @returns {Promise<{ success: boolean, count: number, logs: Array }>}
   */
  async getAuditLogs(params = {}) {
    const cleanParams = {};
    if (params.role && params.role !== 'ALL') cleanParams.role = params.role;
    if (params.action && params.action !== 'ALL') cleanParams.action = params.action;
    if (params.entity_type && params.entity_type !== 'ALL') cleanParams.entity_type = params.entity_type;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params.limit) cleanParams.limit = params.limit;

    const res = await apiClient.get('/audit-logs', { params: cleanParams });
    return res.data;
  }
};
