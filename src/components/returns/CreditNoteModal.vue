<template>
  <div v-if="isOpen && salesReturn" class="modal-backdrop flex items-center justify-center p-4">
    <div class="modal-container w-full max-w-xl animate-slide-up p-6">
      <div class="flex justify-between items-center pb-4 border-b border-[var(--border-color)] mb-4">
        <h3 class="text-xl font-bold flex items-center gap-2">
          <FileText class="text-brand" :size="24" />
          إصدار إشعار دائن (Credit Note) - {{ salesReturn.return_number }}
        </h3>
        <button @click="$emit('close')" class="text-secondary hover:text-primary">
          <X :size="20" />
        </button>
      </div>

      <div class="flex flex-col gap-4">
        <!-- تفاصيل العميل والطلب -->
        <div class="bg-[var(--bg-secondary)] p-4 rounded-lg flex flex-col gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-secondary">اسم العميل:</span>
            <span class="font-bold">{{ salesReturn.client?.name || 'غير محدد' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-secondary">الطلب الأصلي:</span>
            <span class="font-bold text-brand">{{ salesReturn.order?.order_number }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-secondary">الكمية المفحوصة والمستلمة:</span>
            <span class="font-bold text-emerald-400">
              {{ formatKgWithUnit(Number(salesReturn.verified_good_tons || 0) + Number(salesReturn.verified_damaged_tons || 0)) }}
            </span>
          </div>
        </div>

        <!-- ملخص المبالغ والضريبة -->
        <div class="glass-card p-4 flex flex-col gap-3 border-t-2 border-brand">
          <div class="flex justify-between items-center text-sm">
            <span class="text-secondary">المبلغ الصافي (قبل الضريبة):</span>
            <span class="font-bold">{{ subtotal.toFixed(2) }} ريال</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-secondary">ضريبة القيمة المضافة (15%):</span>
            <span class="font-bold text-amber-400">{{ taxAmount.toFixed(2) }} ريال</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-[var(--border-color)] text-lg font-bold text-brand">
            <span>إجمالي الإشعار الدائن:</span>
            <span>{{ totalAmount.toFixed(2) }} ريال</span>
          </div>
        </div>

        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 text-danger text-sm flex items-center gap-2">
          <AlertCircle :size="16" /> {{ errorMessage }}
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">إلغاء</button>
          <button @click="issueCreditNote" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="loader small mr-2 inline-block"></span>
            تأكيد وإصدار الإشعار الدائن
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { FileText, X, AlertCircle } from 'lucide-vue-next';
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter';

const props = defineProps({
  isOpen: Boolean,
  salesReturn: Object
});

const emit = defineEmits(['close', 'issued']);

const submitting = ref(false);
const errorMessage = ref('');

const subtotal = computed(() => Number(props.salesReturn?.total_refund_amount || 0));
const taxAmount = computed(() => subtotal.value * 0.15);
const totalAmount = computed(() => subtotal.value + taxAmount.value);

const issueCreditNote = async () => {
  errorMessage.value = '';
  submitting.value = true;
  try {
    await omsApi.post(`/api/sales-returns/${props.salesReturn.id}/issue-credit-note`);
    emit('issued');
    emit('close');
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'حدث خطأ أثناء إصدار الإشعار الدائن.';
  } finally {
    submitting.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    errorMessage.value = '';
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
.loader { border: 3px solid rgba(255,255,255,0.3); border-left-color: #fff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
