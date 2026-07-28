import apiClient from './apiClient';

export default {
  // 3. إنشاء التوكن (GENERATE TOKEN)
  login(credentials) {
    return apiClient.post('/user/login', credentials);
  }
};
