<template>
  <div class="driver-dashboard animate-slide-up pb-6">
    <div class="header-section mb-6 text-center">
      <h2 class="text-2xl font-bold">{{ $t('nav.activeOrders') }}</h2>
      <p class="text-secondary mt-1">الطلبات والمرتجعات المسندة إليك حالياً.</p>
    </div>

    <div v-if="loading" class="flex flex-col gap-4 px-2 md:px-0">
      <SkeletonLoader type="card" />
      <SkeletonLoader type="card" />
    </div>

    <template v-else>
      <section class="mb-8">
        <div class="flex items-center justify-between mb-3 px-2 md:px-0">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <PackageCheck :size="20" class="text-brand" />
            طلبات التوصيل
          </h3>
          <span class="badge badge-info">{{ orders.length }}</span>
        </div>

        <div v-if="orders.length === 0" class="text-center glass-card p-8 mx-2 md:mx-0 border-dashed border-2 border-[var(--border-color)]">
          <PackageCheck :size="40" class="mx-auto mb-3 text-[var(--success)] opacity-50" />
          <p class="text-lg">لا توجد طلبات نشطة مسندة إليك.</p>
        </div>

        <div v-else class="flex flex-col gap-4 px-2 md:px-0">
          <router-link
            v-for="order in orders"
            :key="order.id"
            :to="{ name: 'DriverActiveOrder', params: { id: order.id } }"
            class="glass-card flex flex-col p-4 relative overflow-hidden border-l-4 hover:-translate-y-1 transition-transform"
            :style="{ borderLeftColor: getStatusColor(order.status) }"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-xl font-bold text-brand">{{ order.order_number }}</span>
              <span class="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                {{ $t(`order.status.${order.status}`) || order.status }}
              </span>
            </div>

            <div class="mb-3 text-sm flex flex-col gap-1">
              <p class="flex items-center gap-2"><User :size="14" class="text-secondary"/> <span class="font-bold">{{ order.client?.name || '-' }}</span></p>
              <p class="flex items-center gap-2"><MapPin :size="14" class="text-secondary"/> {{ order.client?.address || 'الموقع غير محدد' }}</p>
              <p class="flex items-center gap-2"><Weight :size="14" class="text-secondary"/> {{ formatKgWithUnit(getTotalTons(order)) }}</p>
            </div>

            <div class="mt-2 pt-3 border-t border-[var(--border-color)] text-center text-brand font-bold text-sm flex justify-center items-center gap-2">
              إدارة الطلب <ArrowLeft :size="16" />
            </div>
          </router-link>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3 px-2 md:px-0">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <RotateCcw :size="20" class="text-brand" />
            مرتجعات مسندة إليك
          </h3>
          <span class="badge badge-warning">{{ returnOrders.length }}</span>
        </div>

        <div v-if="returnOrders.length === 0" class="text-center glass-card p-8 mx-2 md:mx-0 border-dashed border-2 border-[var(--border-color)]">
          <RotateCcw :size="40" class="mx-auto mb-3 text-[var(--warning)] opacity-50" />
          <p class="text-lg">لا توجد مرتجعات قيد النقل مسندة إليك.</p>
        </div>

        <div v-else class="flex flex-col gap-4 px-2 md:px-0">
          <div
            v-for="ret in returnOrders"
            :key="ret.id"
            class="glass-card flex flex-col p-4 border-l-4 border-[var(--warning)]"
          >
            <div class="flex justify-between items-start mb-3">
              <div>
                <span class="text-xl font-bold text-brand block">{{ ret.return_number }}</span>
                <span class="text-xs text-secondary">الطلب الأصلي: {{ ret.order?.order_number || `#${ret.order_id}` }}</span>
              </div>
              <span class="badge badge-primary">في الطريق إلى المخزن</span>
            </div>

            <div class="mb-3 text-sm flex flex-col gap-1">
              <p class="flex items-center gap-2"><User :size="14" class="text-secondary"/> <span class="font-bold">{{ ret.client?.name || '-' }}</span></p>
              <p class="flex items-center gap-2"><MapPin :size="14" class="text-secondary"/> {{ ret.client?.address || 'الموقع غير محدد' }}</p>
              <p class="flex items-center gap-2"><Weight :size="14" class="text-secondary"/> {{ formatKgWithUnit(ret.total_requested_tons) }}</p>
            </div>

            <div class="bg-[var(--bg-secondary)] rounded-lg p-3 mb-3 text-xs">
              <p class="font-bold mb-2">الأصناف</p>
              <div v-for="item in ret.items" :key="item.id" class="flex justify-between gap-3 py-1">
                <span>{{ item.product?.name || `منتج #${item.product_id}` }}</span>
                <strong>{{ formatKgWithUnit(item.requested_tons) }}</strong>
              </div>
            </div>

            <div v-if="returnErrors[ret.id]" class="mb-3 p-2 text-danger bg-red-500/10 rounded-lg text-sm">
              {{ returnErrors[ret.id] }}
            </div>

            <button
              class="btn btn-primary w-full flex items-center justify-center gap-2"
              :disabled="returnActionLoading[ret.id]"
              @click="confirmReturnDelivery(ret.id)"
            >
              <CheckCircle :size="16" />
              تأكيد تسليم البضاعة للمستودع
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { PackageCheck, User, MapPin, Weight, ArrowLeft, RotateCcw, CheckCircle } from 'lucide-vue-next';
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter';
import { useAuthStore } from '../../store/auth';
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue';

const loading = ref(true);
const orders = ref([]);
const returnOrders = ref([]);
const returnActionLoading = ref({});
const returnErrors = ref({});
const authStore = useAuthStore();

const fetchOrders = async () => {
  const response = await omsApi.get('/api/orders');
  const allOrders = Array.isArray(response.data) ? response.data : (response.data.orders || []);
  const activeStatuses = ['assigned_to_driver', 'ready_for_pickup', 'picked_up_by_driver', 'failed_delivery', 'return_requested'];
  const currentDriverId = Number(authStore.user?.id);
  orders.value = allOrders.filter(order => activeStatuses.includes(order.status) && Number(order.driver_id) === currentDriverId);
};

const fetchReturnOrders = async () => {
  const response = await omsApi.get('/api/sales-returns?status=in_transit&limit=100');
  returnOrders.value = response.data.returns || [];
};

const fetchDashboard = async () => {
  loading.value = true;
  try {
    await Promise.all([fetchOrders(), fetchReturnOrders()]);
  } catch (error) {
    console.error('Error fetching driver dashboard:', error);
  } finally {
    loading.value = false;
  }
};

const confirmReturnDelivery = async (returnId) => {
  returnActionLoading.value = { ...returnActionLoading.value, [returnId]: true };
  returnErrors.value = { ...returnErrors.value, [returnId]: '' };
  try {
    await omsApi.post(`/api/sales-returns/${returnId}/confirm-delivery`);
    await fetchReturnOrders();
  } catch (error) {
    returnErrors.value = {
      ...returnErrors.value,
      [returnId]: error.response?.data?.error || 'تعذر تأكيد تسليم المرتجع.'
    };
  } finally {
    returnActionLoading.value = { ...returnActionLoading.value, [returnId]: false };
  }
};

const getTotalTons = (order) => {
  if (!order.items) return 0;
  return order.items.reduce((sum, item) => sum + Number(item.quantity_tons), 0);
};

const getStatusColor = (status) => {
  if (status === 'ready_for_pickup') return 'var(--primary)';
  if (status === 'picked_up_by_driver') return 'var(--info)';
  if (status === 'failed_delivery' || status === 'return_requested') return 'var(--danger)';
  return 'var(--warning)';
};

onMounted(() => {
  fetchDashboard();
});
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
html[dir="rtl"] .border-l-4 { border-left-width: 0; border-right-width: 4px; }
</style>