import api from './api';

export const cityService = {
  async listCities({ page = 1, pageSize = 20, search = '' } = {}) {
    const { data } = await api.get('/cities/', { params: { page, page_size: pageSize, search } });
    return data;
  },

  async getCity(id) {
    const { data } = await api.get(`/cities/${id}`);
    return data;
  },

  async createCity(payload) {
    const { data } = await api.post('/cities/', payload);
    return data;
  },

  async quickAddCity(name, country = 'India', state = '') {
    const { data } = await api.post('/cities/quick-add', { name, country, state });
    return data;
  },

  async updateCity(id, payload) {
    const { data } = await api.put(`/cities/${id}`, payload);
    return data;
  },

  async deleteCity(id) {
    await api.delete(`/cities/${id}`);
  },

  async uploadDataset(cityId, category, file) {
    const form = new FormData();
    form.append('city_id', cityId);
    form.append('category', category);
    form.append('file', file);
    const { data } = await api.post('/uploads/dataset', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async triggerDataCollection(cityId) {
    const { data } = await api.post(`/cities/${cityId}/collect`);
    return data;
  },
};
