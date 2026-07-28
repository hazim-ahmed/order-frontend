<template>
  <div v-if="isOpen" class="modal-backdrop flex items-center justify-center p-4">
    <div class="modal-container w-full max-w-2xl animate-slide-up p-6">
      <div class="flex justify-between items-center pb-4 border-b border-[var(--border-color)] mb-4">
        <h3 class="text-xl font-bold flex items-center gap-2">
          <RotateCcw class="text-brand" :size="24" />
          إنشاء طلب مرتجع مبيعات جديد
        </h3>
        <button @click="$emit('close')" class="text-secondary hover:text-primary">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="submitReturn" class="flex flex-col gap-4">
        <!-- اختيار الطلب الأصلي (المسلّم أو فشل التسليم) -->
        <div>
          <label class="block text-sm font-semibold mb-1">الطلب الأصلي (المسلّم / فشل التسليم) *</label>
          <select 
            v-model="form.order_id" 
            @change="onOrderSelect"
            class="input-field w-full" 
            required
            :disabled="loadingOrders"
          >
            <option value="" disabled>اختر الطلب...</option>
            <option v-for="order in eligibleOrders" :key="order.id" :value="order.id">
              {{ order.order_number }} - العميل: {{ order.client?.name || 'غير معروف' }} ({{ formatKg(order.total_tons) }} كجم)
            </option>
          </select>
          <span v-if="loadingOrders" class="text-xs text-secondary mt-1 block">جاري تحميل الطلبات المؤهلة للمرتجع...</span>
        </div>

        <!-- سبب الإرجاع -->
        <div>
          <label class="block text-sm font-semibold mb-1">سبب الإرجاع المعين *</label>
          <textarea 
            v-model="form.reason" 
            rows="3" 
            class="input-field w-full"
            placeholder="اكتب أسباب الإرجاع الفنية أو الشكوى بالتفصيل..."
            required
          ></textarea>
        </div>

        <!-- أصناف الطلب المحددة للإرجاع -->
        <div v-if="selectedOrder" class="bg-[var(--bg-secondary)] p-4 rounded-lg">
          <h4 class="font-bold mb-2 border-b border-[var(--border-color)] pb-2 text-sm">تحديد الكميات المرتجعة بالكجم لكل صنف</h4>
          
          <div v-for="item in returnItems" :key="item.product_id" class="flex items-center justify-between gap-4 py-2 border-b border-dashed border-[var(--border-color)] last:border-0">
            <div>
              <p class="font-bold text-sm">{{ item.product_name }}</p>
              <p class="text-xs text-secondary">المشحون بالطلب: {{ item.max_kg }} كجم - السعر: {{ formatPricePerKg(item.unit_price) }} ريال/كجم</p>
            </div>
            
            <div class="flex items-center gap-2">
              <input 
                type="number" 
                v-model.number="item.requested_kg" 
                step="0.001" 
                min="0" 
                :max="item.max_kg"
                class="input-field w-28 text-center"
                placeholder="الكمية"
              />
              <span class="text-xs text-secondary">كجم</span>
            </div>
          </div>
        </div>

        <!-- رسالة الخطأ إن وجدت -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 text-danger text-sm flex items-center gap-2">
          <AlertCircle :size="16" /> {{ errorMessage }}
        </div>

        <!-- أزرار الإجراءات -->
        <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">إلغاء</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="loader small mr-2 inline-block"></span>
            تقديم طلب المرتجع
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { RotateCcw, X, AlertCircle } from 'lucide-vue-next';
import omsApi from '../../services/omsApi';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'created']);

const eligibleOrders = ref([]);
const loadingOrders = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const selectedOrder = ref(null);
const returnItems = ref([]);

const form = ref({
  order_id: '',
  reason: ''
});

const fetchEligibleOrders = async () => {
  loadingOrders.value = true;
  try {
    const responses = await Promise.all([
      omsApi.get('/api/orders?status=delivered&limit=100'),
      omsApi.get('/api/orders?status=failed_delivery&limit=100')
    ]);
    const byId = new Map();
    for (const response of responses) {
      const list = Array.isArray(response.data) ? response.data : (response.data.orders || []);
      list.forEach(order => byId.set(order.id, order));
    }
    eligibleOrders.value = Array.from(byId.values());
  } catch (err) {
    errorMessage.value = 'فشل جلب الطلبات المؤهلة للمرتجع.';
  } finally {
    loadingOrders.value = false;
  }
};

const onOrderSelect = () => {
  const order = eligibleOrders.value.find(o => o.id === Number(form.value.order_id));
  if (order) {
    selectedOrder.value = order;
    returnItems.value = (order.items || []).map(i => ({
      product_id: i.product_id,
      product_name: i.product?.name || `منتج ${i.product_id}`,
      max_tons: i.quantity_tons,
      unit_price: i.price_per_ton_snapshot || 0,
      requested_tons: i.quantity_tons
    }));
  }
};

const submitReturn = async () => {
  errorMessage.value = '';
  const filteredItems = returnItems.value.filter(i => Number(i.requested_kg) > 0);
  
  if (filteredItems.length === 0) {
    errorMessage.value = 'يرجى إدخال كمية أكبر من الصفر لصنف واحد على الأقل.';
    return;
  }

  submitting.value = true;
  try {
    await omsApi.post('/api/sales-returns', {
      order_id: form.value.order_id,
      reason: form.value.reason,
      items: filteredItems.map(i => ({
        product_id: i.product_id,
        requested_tons: toNumber(i.requested_kg) / 1000
      }))
    });

    emit('created');
    emit('close');
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'حدث خطأ أثناء تقديم المرتجع.';
  } finally {
    submitting.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value.order_id = '';
    form.value.reason = '';
    selectedOrder.value = null;
    returnItems.value = [];
    errorMessage.value = '';
    fetchEligibleOrders();
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
