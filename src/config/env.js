/**
 * src/config/env.js
 * الإعدادات المركزية لمتغيرات البيئة ورابط الباك إند
 */
export const DEFAULT_BACKEND_URL = 'https://order-backend-cm88.onrender.com';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  // في بيئة التطوير المحلية يعتمد على Vite Proxy أو localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  // في الإنتاج عند عدم تحديد المتغير في Vercel يتصل بسيرفر Render المعتمد تلقائياً
  return DEFAULT_BACKEND_URL;
};
