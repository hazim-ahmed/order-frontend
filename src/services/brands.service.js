import apiClient from './apiClient';

export default {
  // 2. العلامات التجارية (BRANDS)
  getBrands() {
    return apiClient.get('/brands/get_brands');
  },
  getBrandById(id) {
    return apiClient.get(`/brands/get_brand/${id}`);
  },
  addBrand(data) {
    return apiClient.post('/brands/add', data);
  },
  updateBrand(id, data) {
    return apiClient.post(`/brands/update/${id}`, data);
  }
};
