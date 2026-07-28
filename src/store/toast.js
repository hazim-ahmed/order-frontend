// ============================================================
// Toast Store — مستودع الإشعارات المنبثقة
// الوظيفة: إدارة قائمة الإشعارات التي تظهر للمستخدم مؤقتاً
// Actions: add, remove, success, danger, warning, info
// ============================================================
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  // قائمة الإشعارات النشطة
  // Active toasts list
  const toasts = ref([]);

  // ============================================================
  // إضافة إشعار جديد
  // Adds a new toast and auto-removes it after duration ms
  // المدخلات: { type, title, message, duration }
  // ============================================================
  const add = ({ type = 'info', title = '', message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    toasts.value.push({ id, type, title, message });

    // إزالة الإشعار تلقائياً بعد المدة المحددة
    setTimeout(() => remove(id), duration);
  };

  // ============================================================
  // حذف إشعار بالـ ID
  // Removes a toast by its ID
  // ============================================================
  const remove = (id) => {
    const idx = toasts.value.findIndex(t => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  };

  // Shorthand helpers للأنواع الأربعة
  const success = (message, title = '') => add({ type: 'success', title, message });
  const danger  = (message, title = '') => add({ type: 'danger',  title, message });
  const warning = (message, title = '') => add({ type: 'warning', title, message });
  const info    = (message, title = '') => add({ type: 'info',    title, message });

  return { toasts, add, remove, success, danger, warning, info };
});
