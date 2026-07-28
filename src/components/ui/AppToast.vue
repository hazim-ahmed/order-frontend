<!--
  AppToast Component — مكون الإشعارات المنبثقة
  الوظيفة: عرض رسائل النجاح والخطأ والتحذير والمعلومات بشكل مؤقت
  Props:
    - toasts (Array): قائمة الإشعارات النشطة من useToast store
-->
<template>
  <teleport to="body">
    <div class="toast-container" role="status" aria-live="polite">
      <transition-group name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <component :is="toastIcon(toast.type)" :size="18" class="toast__icon" />
          <div class="toast__body">
            <p class="toast__title" v-if="toast.title">{{ toast.title }}</p>
            <p class="toast__message">{{ toast.message }}</p>
          </div>
          <button class="toast__close" @click="toastStore.remove(toast.id)">
            <X :size="16" />
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
// ============================================================
// استيراد store الإشعارات وعرض القائمة
// Imports toast store and renders the list
// ============================================================
import { storeToRefs } from 'pinia';
import { useToastStore } from '../../store/toast';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next';

const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);

// ============================================================
// اختيار الأيقونة بناءً على نوع الإشعار
// Returns the appropriate icon based on toast type
// ============================================================
const toastIcon = (type) => {
  const icons = {
    success: CheckCircle,
    danger: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };
  return icons[type] || Info;
};
</script>

<style scoped>
/* ============================================================
   حاوية الإشعارات — Toast Container
   تظهر في الزاوية السفلية بجانب مناسب حسب اتجاه اللغة
   ============================================================ */
.toast-container {
  position: fixed;
  bottom: 24px;
  inset-inline-end: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  width: 100%;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  pointer-events: all;
}

.toast--success { border-inline-start: 3px solid var(--success); }
.toast--danger  { border-inline-start: 3px solid var(--danger);  }
.toast--warning { border-inline-start: 3px solid var(--warning); }
.toast--info    { border-inline-start: 3px solid var(--info);    }

.toast__icon {
  flex-shrink: 0;
  margin-top: 1px;
}
.toast--success .toast__icon { color: var(--success); }
.toast--danger  .toast__icon { color: var(--danger);  }
.toast--warning .toast__icon { color: var(--warning); }
.toast--info    .toast__icon { color: var(--info);    }

.toast__body { flex: 1; min-width: 0; }

.toast__title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.toast__message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.toast__close {
  flex-shrink: 0;
  color: var(--text-disabled);
  padding: 2px;
  border-radius: var(--radius-sm);
  transition: color 150ms ease;
}
.toast__close:hover { color: var(--text-primary); }

/* Transition Animations */
.toast-enter-active { animation: slideInEnd 250ms ease; }
.toast-leave-active { animation: slideOutEnd 200ms ease forwards; }

@keyframes slideInEnd {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes slideOutEnd {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}

html[dir="rtl"] .toast-enter-active { animation: slideInStart 250ms ease; }
html[dir="rtl"] .toast-leave-active { animation: slideOutStart 200ms ease forwards; }

@keyframes slideInStart {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes slideOutStart {
  from { transform: translateX(0);     opacity: 1; }
  to   { transform: translateX(-100%); opacity: 0; }
}
</style>
