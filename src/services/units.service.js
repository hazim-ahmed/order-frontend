import apiClient from './apiClient';

export default {
  // 6. الوحدات (UNITS)
  getUnits() {
    return apiClient.get('/units/get_units');
  },
  getUnitById(id) {
    return apiClient.get(`/units/get_unit/${id}`);
  },
  addUnit(data) {
    return apiClient.post('/units/add', data);
  },
  updateUnit(id, data) {
    return apiClient.post(`/units/update/${id}`, data);
  }
};
