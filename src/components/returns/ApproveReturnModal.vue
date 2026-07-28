<template>
  <div v-if="isOpen && salesReturn" class="modal-backdrop flex items-center justify-center p-4">
    <div class="modal-container w-full max-w-lg animate-slide-up p-6">
      <div class="flex justify-between items-center pb-4 border-b border-[var(--border-color)] mb-4">
        <h3 class="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 class="text-brand" :size="24" />
          اعتماد المرتجع - {{ salesReturn.return_number }}
        </h3>
        <button @click="$emit('close')" class="text-secondary hover:text-primary">
          <X :size="20" />
        </button>
      </div>

      <div class="flex flex-col gap-4">
        <div class="bg-[var(--bg-secondary)] p-4 rounded-lg text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-secondary">الطلب الأصلي:</span>
            <span class="font-bold">{{ salesReturn.order?.order_number || `#${salesReturn.order_id}` }}</span>
          </div>
          <div class="flex justify-between gap-3 mt-2">
            <span class="text-secondary">العميل:</span>
            <span class="font-bold">{{ salesReturn.client?.name || '-' }}</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold mb-2">طريقة حساب التعويض</label>
          <div class="flex flex-col gap-2">
            <label v-for="option in refundOptions" :key="option.value" class="refund-option">
              <input v-model="refundMode" type="radio" :value="option.value" class="accent-[var(--brand-primary)]">
              <span>
                <strong>{{ option.label }}</strong>
                <small>{{ option.description }}</small>
              </span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold mb-1">سبب الرفض</label>
          <textarea
            v-model.trim="rejectionReason"
            rows="3"
            class="input-field w-full"
            placeholder="اكتب سبب الرفض عند اختيار رفض المرتجع..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">إلغاء</button>
          <button type="button" @click="submitReject" class="btn btn-danger">رفض</button>
          <button type="button" @click="submitApprove" class="btn btn-primary">موافقة</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { CheckCircle2, X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  salesReturn: Object
});

const emit = defineEmits(['close', 'submitted']);

const refundMode = ref('good_and_damaged');
const rejectionReason = ref('');

const refundOptions = [
  { value: 'good_only', label: 'السليم فقط', description: 'يعوض العميل عن الكمية السليمة المقبولة فقط.' },
  { value: 'good_and_damaged', label: 'السليم + التالف', description: 'الخيار الافتراضي لمعظم حالات المرتجع.' },
  { value: 'all', label: 'كل الكميات', description: 'يشمل السليم والتالف والمفقود عند مسؤولية الشركة.' }
];

const submitApprove = () => {
  emit('submitted', {
    action: 'approve',
    refund_mode: refundMode.value,
    rejection_reason: null
  });
};

const submitReject = () => {
  if (!rejectionReason.value) {
    alert('يرجى كتابة سبب رفض المرتجع.');
    return;
  }
  emit('submitted', {
    action: 'reject',
    refund_mode: refundMode.value,
    rejection_reason: rejectionReason.value
  });
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    refundMode.value = props.salesReturn?.refund_mode || 'good_and_damaged';
    rejectionReason.value = '';
  }
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  z-index: 999;
}

.refund-option {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  cursor: pointer;
}

.refund-option small {
  display: block;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}
</style>