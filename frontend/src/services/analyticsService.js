import api from './api';

export const analyticsService = {
  async getDashboardStats() {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },

  async getAqiTrends(cityIds, days = 30) {
    const { data } = await api.get('/analytics/trends/aqi', {
      params: { city_ids: cityIds.join(','), days },
    });
    return data;
  },

  async getWeatherTrends(cityIds, metric = 'temperature_c', days = 30) {
    const { data } = await api.get('/analytics/trends/weather', {
      params: { city_ids: cityIds.join(','), metric, days },
    });
    return data;
  },

  async compareCities(cityAId, cityBId) {
    const { data } = await api.get('/comparison/', {
      params: { city_a_id: cityAId, city_b_id: cityBId },
    });
    return data;
  },

  async getPredictions(cityId, category) {
    const params = {};
    if (cityId) params.city_id = cityId;
    if (category) params.category = category;
    const { data } = await api.get('/predictions/', { params });
    return data;
  },

  async runAqiPrediction(cityId) {
    const { data } = await api.post(`/predictions/run/aqi/${cityId}`);
    return data;
  },

  async runEnergyPrediction(cityId) {
    const { data } = await api.post(`/predictions/run/energy/${cityId}`);
    return data;
  },

  async getRecommendations(cityId, category, priority) {
    const params = {};
    if (cityId) params.city_id = cityId;
    if (category) params.category = category;
    if (priority) params.priority = priority;
    const { data } = await api.get('/recommendations/', { params });
    return data;
  },

  async generateRecommendations(cityId) {
    const { data } = await api.post(`/recommendations/generate/${cityId}`);
    return data;
  },

  async downloadCsvReport(cityId, category) {
    const resp = await api.get(`/reports/city/${cityId}/csv`, {
      params: { category },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cityId}_${category}_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
