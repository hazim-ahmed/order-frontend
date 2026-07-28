import apiClient from './apiClient';

export default {
  // 1. المحاسبة (ACCOUNTING)
  getAccounts() {
    return apiClient.get('/accounting/accounts');
  },
  getEntryById(id) {
    return apiClient.get(`/accounting/get_entry/${id}`);
  },
  addEntry(data) {
    return apiClient.post('/accounting/add_entry', data);
  },
  updateEntry(id, data) {
    return apiClient.post(`/accounting/update_entry/${id}`, data);
  },
  addBond(data) {
    return apiClient.post('/accounting/add_bond', data);
  },
  updateBond(id, data) {
    return apiClient.post(`/accounting/edit_bond/${id}`, data);
  },
  getCostCenters() {
    return apiClient.get('/accounting/costcenters');
  },
  getAccountBalances() {
    return apiClient.get('/accounting/account_balances');
  }
};
