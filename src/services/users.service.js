import apiClient from './apiClient';

export default {
  // 7. المستخدمون (USERS)
  getUsersList() {
    return apiClient.get('/user/users_list');
  },
  getCashiersList() {
    return apiClient.get('/user/cashiers_list');
  }
};
