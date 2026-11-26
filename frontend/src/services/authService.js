import api from './api';

export const authService = {
  async login(identifier, password) {
    const { data } = await api.post('/auth/login', {
      login: identifier,
      email: identifier,
      username: identifier,
      password,
    });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  async signup(payload) {
    const { data } = await api.post('/auth/signup', payload);
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/users/me');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await api.put('/users/me', payload);
    return data;
  },

  async changePassword(current_password, new_password) {
    const { data } = await api.post('/users/me/change-password', { current_password, new_password });
    return data;
  },

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(token, new_password) {
    const { data } = await api.post('/auth/reset-password', { token, new_password });
    return data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};
