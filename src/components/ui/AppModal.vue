<!--
  AppModal Component — مكون الـ Modal / الحوار
  الوظيفة: عرض نافذة حوار مع دعم RTL ومنع scroll الخلفية
  Props:
    - show (Boolean): إظهار أو إخفاء الـ Modal
    - title (String): عنوان النافذة
    - size (String): sm | md | lg — حجم النافذة
  Events:
    - @close: عند الضغط على زر الإغلاق أو الخلفية
  Slots:
    - default: محتوى النافذة
    - footer: أزرار الأكشن
-->
<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="show" class="modal-backdrop" @click.self="emitClose">
        <div 
          class="modal-dialog" 
          :class="`modal-dialog--${size}`" 
          role="dialog" 
          :aria-modal="true"
          aria-labelledby="modal-title-heading"
        >
          <!-- Header -->
          <div class="modal-header">
            <h2 id="modal-title-heading" class="modal-title text-xl font-bold">{{ title }}</h2>
            <button class="btn-ghost icon-btn" @click="emitClose" aria-label="إغلاق النافذة">
              <X :size="20" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div class="modal-footer" v-if="$slots.footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  show:  { type: Boolean, default: false },
  title: { type: String,  default: ''    },
  size:  { type: String,  default: 'md'  }
});

const emit = defineEmits(['close']);

const emitClose = () => {
  emit('close');
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.show) {
    emitClose();
  }
};

watch(() => props.show, (val) => {
  document.body.style.overflow = val ? 'hidden' : '';
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
/* ============================================================
   Backdrop — خلفية النافذة المعتمة
   ============================================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  padding: 16px;
}

/* ============================================================
   نافذة الحوار — Dialog
   ============================================================ */
.modal-dialog {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-dialog--sm { max-width: 400px;  }
.modal-dialog--md { max-width: 580px;  }
.modal-dialog--lg { max-width: 800px;  }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  padding: 6px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}
.icon-btn:hover { color: var(--text-primary); background: var(--bg-hover); }

/* Transitions */
.modal-enter-active { animation: modalIn 200ms ease; }
.modal-leave-active { animation: modalOut 180ms ease forwards; }

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);   }
}
@keyframes modalOut {
  from { opacity: 1; transform: scale(1)    translateY(0);   }
  to   { opacity: 0; transform: scale(0.96) translateY(8px); }
}
</style>
