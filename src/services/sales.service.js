import apiClient from './apiClient';

export default {
  // 5. المبيعات (SALES)
  getSalesList() {
    return apiClient.get('/sales/sales_list');
  },
  getSalesReferences() {
    return apiClient.get('/sales/sales_refererences'); // Written exactly as requested with the extra 'e'
  },
  getSaleById(id) {
    return apiClient.get(`/sales/get_sale/${id}`);
  },
  getPaymentStatuses() {
    return apiClient.get('/sales/payment_statuses');
  },
  getSaleStatuses() {
    return apiClient.get('/sales/sale_statuses');
  },
  addSale(data) {
    return apiClient.post('/sales/add', data);
  },
  addPayments(id, data) {
    return apiClient.post(`/sales/add_payments/${id}`, data);
  },
  returnSale(id, data) {
    return apiClient.post(`/sales/return_sale/${id}`, data);
  }
};
