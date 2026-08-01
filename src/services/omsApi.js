/**
 * src/services/omsApi.js
 * API Client الموحد لنظام إدارة الطلبات (OMS)
 * 
 * يستخدم VITE_API_BASE_URL من ملف .env بدلاً من localhost الثابت
 * يتعامل مع التوكن تلقائياً ويعالج انتهاء الجلسة (401)
 */
import axios from 'axios'
import router from '../router'
import { getApiBaseUrl } from '../config/env'

const omsApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Accept': 'application/json'
  }
})

// إضافة التوكن تلقائياً لكل الطلبات
omsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// معالجة الأخطاء العامة (خصوصاً 401 - انتهاء الجلسة)
import { useAuthStore } from '../store/auth'

omsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // الجلسة انتهت أو التوكن غير صالح - تصفير المتجر وتسجيل الخروج
      try {
        const authStore = useAuthStore()
        authStore.logout()
      } catch (e) {
        localStorage.removeItem('token')
      }
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default omsApi
