import apiClient from './apiClient';

export default {
  // 4. المنتجات (PRODUCTS)
  getProductsList() {
    return apiClient.get('/products/get_products_list');
  },
  getProductById(id) {
    return apiClient.get(`/products/product/${id}`);
  },
  addProduct(data) {
    return apiClient.post('/products/add', data);
  },
  updateProduct(id, data) {
    return apiClient.post(`/products/update/${id}`, data);
  },
  deleteProduct(id) {
    return apiClient.post(`/products/delete/${id}`);
  },
  getProductsBalance() {
    return apiClient.get('/products/products_balance');
  },
  getProductsMovements() {
    return apiClient.get('/products/get_products_movements');
  },
  getInventoryMovements() {
    return apiClient.get('/products/get_inventory_movements');
  }
};
