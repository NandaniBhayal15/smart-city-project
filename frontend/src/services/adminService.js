import api from './api';

export const adminService = {
  async listUsers(page = 1, pageSize = 20) {
    const { data } = await api.get('/users/', { params: { page, page_size: pageSize } });
    return data;
  },

  async updateUser(userId, payload) {
    const { data } = await api.put(`/users/${userId}`, payload);
    return data;
  },

  async deleteUser(userId) {
    await api.delete(`/users/${userId}`);
  },

  async getDataSources() {
    const { data } = await api.get('/admin/data-sources');
    return data;
  },

  async getCollectionLogs(page = 1) {
    const { data } = await api.get('/admin/collection-logs', { params: { page } });
    return data;
  },
};
