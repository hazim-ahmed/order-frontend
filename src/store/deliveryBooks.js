import { defineStore } from 'pinia';
import omsApi from '../services/omsApi';

const BASE_PATH = '/api/delivery-document-books-manager';

export const useDeliveryBooksStore = defineStore('deliveryBooks', {
  state: () => ({
    batches: [],
    books: [],
    driverSlipsSummary: null,
    nextStartNumber: null,
    loading: false,
    error: null,
    successMessage: null
  }),

  actions: {
    async fetchBatches(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await omsApi.get(`${BASE_PATH}/batches`, { params });
        this.batches = res.data.batches || [];
        this.nextStartNumber = res.data.next_start_number || null;
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'فشل استرجاع أوامر الصرف.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createBatch(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await omsApi.post(`${BASE_PATH}/batches`, payload);
        this.successMessage = res.data.message || 'تم إنشاء أمر الصرف بنجاح.';
        await this.fetchBatches();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'فشل إنشاء أمر الصرف.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchBooks(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await omsApi.get(`${BASE_PATH}/books`, { params });
        this.books = res.data.books || [];
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'فشل استرجاع الدفاتر.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async assignBookToDriver(bookId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await omsApi.post(`${BASE_PATH}/books/${bookId}/assign-driver`, payload);
        this.successMessage = res.data.message || 'تم صرف الدفتر للسائق بنجاح.';
        await this.fetchBooks();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'فشل صرف الدفتر للسائق.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchDriverSlipsSummary(driverId = null) {
      this.loading = true;
      this.error = null;
      try {
        const params = driverId ? { driver_id: driverId } : {};
        const res = await omsApi.get(`${BASE_PATH}/books/driver-slips`, { params });
        this.driverSlipsSummary = res.data;
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'فشل استرجاع ملخص سندات السائق.';
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});