<template>
  <div v-if="isOpen && salesReturn" class="modal-backdrop flex items-center justify-center p-4">
    <div class="modal-container w-full max-w-6xl animate-slide-up p-6">
      <div class="flex justify-between items-center pb-4 border-b border-[var(--border-color)] mb-4">
        <h3 class="text-xl font-bold flex items-center gap-2">
          <Scale class="text-brand" :size="24" />
          فحص وتأكيد أوزان المرتجع بالمخزن - {{ salesReturn.return_number }}
        </h3>
        <button @click="$emit('close')" class="text-secondary hover:text-primary">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="submitInspection" class="flex flex-col gap-4">
        <div class="bg-[var(--bg-secondary)] p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-secondary block">العميل:</span>
            <span class="font-bold">{{ salesReturn.client?.name || 'غير محدد' }}</span>
          </div>
          <div>
            <span class="text-secondary block">الطلب الأصلي:</span>
            <span class="font-bold text-brand">{{ salesReturn.order?.order_number }}</span>
          </div>
          <div>
            <span class="text-secondary block">الكمية المطلوبة للإرجاع:</span>
            <span class="font-bold text-danger">{{ formatKg(salesReturn.total_requested_tons) }} كجم</span>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--border-color)] bg-blue-500/10 p-3 text-sm text-info">
          الوحدة الأساسية للإدخال هي الكجم. ويمكن اختيار الطن عند الحاجة، وسيحفظ النظام القيم بالتوافق مع قاعدة البيانات الحالية.
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-right border-collapse">
            <thead>
              <tr class="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <th class="p-3">المنتج</th>
                <th class="p-3 text-center">الوحدة</th>
                <th class="p-3 text-center">المطلوب</th>
                <th class="p-3 text-center">السليم</th>
                <th class="p-3 text-center">التالف</th>
                <th class="p-3 text-center">المفقود</th>
                <th class="p-3 text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in inspectItems" :key="item.product_id" class="border-b border-[var(--border-color)]">
                <td class="p-3 font-semibold min-w-[160px]">{{ item.product_name }}</td>
                <td class="p-3 text-center">
                  <select v-model="item.input_unit" class="input-field w-24 text-center">
                    <option value="ton">طن</option>
                    <option value="kg">كجم</option>
                  </select>
                </td>
                <td class="p-3 text-center font-bold min-w-[120px]">
                  <div>{{ formatQuantity(item.requested_tons, item.input_unit) }} {{ unitLabel(item.input_unit) }}</div>
                  
                </td>
                <td class="p-3 text-center">
                  <input
                    type="number"
                    :value="formatInput(item.verified_good_tons, item.input_unit)"
                    @input="setQuantity(item, 'verified_good_tons', $event.target.value); balanceItem(item, 'good')"
                    :step="unitStep(item.input_unit)"
                    min="0"
                    class="input-field w-28 text-center bg-emerald-500/10 font-bold text-emerald-400"
                  />
                </td>
                <td class="p-3 text-center">
                  <input
                    type="number"
                    :value="formatInput(item.verified_damaged_tons, item.input_unit)"
                    @input="setQuantity(item, 'verified_damaged_tons', $event.target.value); balanceItem(item, 'damaged')"
                    :step="unitStep(item.input_unit)"
                    min="0"
                    class="input-field w-28 text-center bg-red-500/10 font-bold text-rose-400"
                  />
                </td>
                <td class="p-3 text-center">
                  <input
                    type="number"
                    :value="formatInput(item.verified_missing_tons, item.input_unit)"
                    @input="setQuantity(item, 'verified_missing_tons', $event.target.value); balanceItem(item, 'missing')"
                    :step="unitStep(item.input_unit)"
                    min="0"
                    class="input-field w-28 text-center bg-amber-500/10 font-bold text-amber-400"
                  />
                </td>
                <td class="p-3 text-center min-w-[130px]">
                  <span :class="['font-bold', isBalanced(item) ? 'text-emerald-400' : 'text-danger']">
                    {{ formatQuantity(itemTotal(item), item.input_unit) }} / {{ formatQuantity(item.requested_tons, item.input_unit) }} {{ unitLabel(item.input_unit) }}
                  </span>
                  
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div class="rounded-lg bg-emerald-500/10 p-3 text-emerald-400 font-bold">إجمالي السليم: {{ formatKg(summary.good) }} كجم</div>
          <div class="rounded-lg bg-red-500/10 p-3 text-rose-400 font-bold">إجمالي التالف: {{ formatKg(summary.damaged) }} كجم</div>
          <div class="rounded-lg bg-amber-500/10 p-3 text-amber-400 font-bold">إجمالي المفقود: {{ formatKg(summary.missing) }} كجم</div>
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">ملاحظات أمين المخزن / الفحص الفني</label>
          <textarea
            v-model="inspectionNotes"
            rows="2"
            class="input-field w-full"
            placeholder="اكتب أي ملاحظات حول حالة الشحنة المرتجعة أو سبب التلف أو الفقد..."
          ></textarea>
        </div>

        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 text-danger text-sm flex items-center gap-2">
          <AlertCircle :size="16" /> {{ errorMessage }}
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">إلغاء</button>
          <button type="submit" class="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white" :disabled="submitting || !allBalanced">
            <span v-if="submitting" class="loader small mr-2 inline-block"></span>
            اعتماد الفحص وإدخال المخزون
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Scale, X, AlertCircle } from 'lucide-vue-next';
import omsApi from '../../services/omsApi';

const props = defineProps({
  isOpen: Boolean,
  salesReturn: Object
});

const emit = defineEmits(['close', 'inspected']);

const submitting = ref(false);
const errorMessage = ref('');
const inspectItems = ref([]);
const inspectionNotes = ref('');

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const roundTons = (value) => Math.max(0, Number(toNumber(value).toFixed(3)));
const itemTotal = (item) => roundTons(toNumber(item.verified_good_tons) + toNumber(item.verified_damaged_tons) + toNumber(item.verified_missing_tons));
const formatTons = (value) => toNumber(value).toFixed(3).replace(/\.000$/, '');
const formatKg = (value) => (toNumber(value) * 1000).toFixed(0);
const unitLabel = (unit) => unit === 'kg' ? 'كجم' : 'طن';
const unitStep = (unit) => unit === 'kg' ? '1' : '0.001';
const fromDisplayUnit = (value, unit) => unit === 'kg' ? toNumber(value) / 1000 : toNumber(value);
const toDisplayUnit = (tons, unit) => unit === 'kg' ? toNumber(tons) * 1000 : toNumber(tons);
const formatQuantity = (tons, unit) => unit === 'kg' ? formatKg(tons) : formatTons(tons);
const formatInput = (tons, unit) => {
  const value = toDisplayUnit(tons, unit);
  return unit === 'kg' ? String(Math.round(value)) : formatTons(value);
};

const setQuantity = (item, field, value) => {
  item[field] = roundTons(fromDisplayUnit(value, item.input_unit));
};

const isBalanced = (item) => Math.abs(itemTotal(item) - toNumber(item.requested_tons)) <= 0.001;

const balanceItem = (item, source) => {
  const requested = roundTons(item.requested_tons);
  item.verified_good_tons = roundTons(Math.min(toNumber(item.verified_good_tons), requested));
  item.verified_damaged_tons = roundTons(Math.min(toNumber(item.verified_damaged_tons), requested));
  item.verified_missing_tons = roundTons(Math.min(toNumber(item.verified_missing_tons), requested));

  if (source === 'good') {
    if (item.verified_missing_tons > requested - item.verified_good_tons) {
      item.verified_missing_tons = roundTons(requested - item.verified_good_tons);
    }
    item.verified_damaged_tons = roundTons(requested - item.verified_good_tons - item.verified_missing_tons);
  } else if (source === 'damaged') {
    if (item.verified_missing_tons > requested - item.verified_damaged_tons) {
      item.verified_missing_tons = roundTons(requested - item.verified_damaged_tons);
    }
    item.verified_good_tons = roundTons(requested - item.verified_damaged_tons - item.verified_missing_tons);
  } else if (source === 'missing') {
    if (item.verified_damaged_tons > requested - item.verified_missing_tons) {
      item.verified_damaged_tons = roundTons(requested - item.verified_missing_tons);
    }
    item.verified_good_tons = roundTons(requested - item.verified_damaged_tons - item.verified_missing_tons);
  }
};

const summary = computed(() => inspectItems.value.reduce((totals, item) => ({
  good: totals.good + toNumber(item.verified_good_tons),
  damaged: totals.damaged + toNumber(item.verified_damaged_tons),
  missing: totals.missing + toNumber(item.verified_missing_tons)
}), { good: 0, damaged: 0, missing: 0 }));

const allBalanced = computed(() => inspectItems.value.length > 0 && inspectItems.value.every(isBalanced));

const initForm = () => {
  if (!props.salesReturn) return;
  inspectionNotes.value = props.salesReturn.inspection_notes || '';
  inspectItems.value = (props.salesReturn.items || []).map(i => {
    const requested = roundTons(i.requested_tons);
    const good = i.verified_good_tons !== undefined && Number(i.verified_good_tons) > 0 ? roundTons(i.verified_good_tons) : requested;
    const damaged = roundTons(i.verified_damaged_tons || 0);
    const missing = roundTons(i.verified_missing_tons || Math.max(0, requested - good - damaged));
    const item = {
      product_id: i.product_id,
      product_name: i.product?.name || `منتج ${i.product_id}`,
      requested_tons: requested,
      verified_good_tons: good,
      verified_damaged_tons: damaged,
      verified_missing_tons: missing,
      input_unit: 'kg'
    };
    balanceItem(item, 'good');
    return item;
  });
};

const submitInspection = async () => {
  errorMessage.value = '';
  if (!allBalanced.value) {
    errorMessage.value = 'يجب أن يساوي مجموع السليم والتالف والمفقود الكمية المطلوبة لكل صنف.';
    return;
  }

  submitting.value = true;

  try {
    await omsApi.post(`/api/sales-returns/${props.salesReturn.id}/inspect`, {
      items: inspectItems.value.map(i => ({
        product_id: i.product_id,
        verified_good_tons: i.verified_good_tons,
        verified_damaged_tons: i.verified_damaged_tons,
        verified_missing_tons: i.verified_missing_tons
      })),
      inspection_notes: inspectionNotes.value
    });

    emit('inspected');
    emit('close');
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'حدث خطأ أثناء حفظ الفحص المخزني.';
  } finally {
    submitting.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    errorMessage.value = '';
    initForm();
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