<template>
  <div class="sales-manager-pending animate-slide-up">
    <!-- Header Section -->
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold">{{ $t('nav.pendingApproval') }}</h2>
        <p class="text-secondary mt-1">مراجعة طلبات التوريد وطلبات مرتجعات المبيعات والموافقة عليها</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge badge-warning text-lg px-4 py-2">
          إجمالي المطلوبة: {{ pendingOrders.length + pendingReturns.length }} إجراء
        </span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-[var(--border-color)] mb-6">
      <button 
        @click="activeTab = 'orders'" 
        class="py-3 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2"
        :class="activeTab === 'orders' ? 'border-brand text-brand' : 'border-transparent text-secondary hover:text-primary'"
      >
        <Clock :size="18" />
        <span>طلبات التوريد المعلقة</span>
        <span class="px-2 py-0.5 text-xs rounded-full bg-amber-500/15 text-amber-600 font-extrabold">{{ pendingOrders.length }}</span>
      </button>

      <button 
        @click="activeTab = 'returns'" 
        class="py-3 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2"
        :class="activeTab === 'returns' ? 'border-brand text-brand' : 'border-transparent text-secondary hover:text-primary'"
      >
        <RotateCcw :size="18" />
        <span>طلبات مرتجعات المبيعات</span>
        <span class="px-2 py-0.5 text-xs rounded-full bg-rose-500/15 text-rose-600 font-extrabold">{{ pendingReturns.length }}</span>
      </button>
    </div>

    <div v-if="loading" class="flex justify-center mt-8">
      <div class="loader"></div>
    </div>

    <!-- Tab 1: Orders Awaiting Approval -->
    <div v-else-if="activeTab === 'orders'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="order in pendingOrders" :key="order.id" class="glass-card flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-sm">
        <div>
          <div class="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
            <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="text-lg font-extrabold text-brand hover:underline flex items-center gap-1.5">
              <span>{{ order.order_number }}</span>
            </router-link>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              بانتظار الاعتماد
            </span>
          </div>
          
          <div class="mb-4 flex flex-col gap-2">
            <div class="flex justify-between text-sm">
              <span class="text-secondary">المندوب:</span>
              <span class="font-bold text-primary">{{ order.salesRep?.name || '-' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-secondary">العميل:</span>
              <span class="font-bold text-primary">{{ order.client?.name || '-' }}</span>
            </div>
            <div class="mt-4 bg-[var(--bg-secondary)] p-3 rounded-lg text-sm space-y-2">
              <p class="font-bold border-b border-[var(--border-color)] pb-1 flex justify-between items-center text-xs">
                <span>تفاصيل الأصناف ({{ order.items?.length || 0 }})</span>
                <span class="text-secondary font-normal">السعر × الكمية</span>
              </p>
              <ul class="flex flex-col gap-2">
                <li v-for="item in order.items" :key="item.id" class="flex flex-col text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] p-2.5 rounded-lg shadow-xs">
                  <div class="flex justify-between font-bold text-primary mb-1">
                    <span>{{ item.product?.name || 'منتج' }}</span>
                    <span class="text-emerald-500 font-extrabold">{{ Number(item.quantity_tons * Number(item.price_per_ton_snapshot || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} ريال</span>
                  </div>
                  <div class="flex justify-between text-secondary">
                    <span>
                      الكمية: 
                      <b class="text-primary">{{ formatKgWithUnit(item.quantity_tons) }}</b>
                    </span>
                    <span>
                      سعر الوحدة: 
                      <b class="text-emerald-600">{{ formatPricePerKg(item.price_per_ton_snapshot || 0) }} ريال/كجم</b>
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div class="flex justify-between items-center mt-3 pt-2 border-t border-[var(--border-color)]">
              <span class="text-secondary text-sm font-bold">الإجمالي المالي للطلب:</span>
              <span class="font-extrabold text-emerald-600 text-lg">{{ Number(order.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} ريال</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
          <button @click="updateStatus(order.id, 'pending_inventory_approval')" class="btn btn-success flex-1 py-2.5 text-sm font-bold shadow-md shadow-emerald-500/10">
            موافقة المبيعات
          </button>
          <button @click="openRejectModal(order.id)" class="btn btn-danger flex-1 py-2.5 text-sm font-bold border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all">
            رفض
          </button>
        </div>
      </div>
      
      <div v-if="pendingOrders.length === 0" class="col-span-full text-center mt-12 text-secondary glass-card p-12 space-y-3">
        <CheckCircle :size="52" class="mx-auto text-emerald-500 opacity-60" />
        <p class="text-xl font-bold text-primary">لا توجد طلبات توريد معلقة للموافقة حالياً.</p>
        <p class="text-sm text-secondary">تمت مراجعة جميع الطلبات الواردة بنجاح!</p>
      </div>
    </div>

    <!-- Tab 2: Sales Returns Awaiting Approval -->
    <div v-else-if="activeTab === 'returns'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="ret in pendingReturns" :key="ret.id" class="glass-card flex flex-col justify-between border-t-4 border-amber-500 shadow-sm">
        <div>
          <div class="flex justify-between items-center mb-3 border-b border-[var(--border-color)] pb-3">
            <div>
              <span class="text-lg font-bold text-brand block">{{ ret.return_number }}</span>
              <span class="text-xs text-secondary">الطلب الأصلي: {{ ret.order?.order_number || `#${ret.order_id}` }}</span>
            </div>
            <span class="badge badge-warning">مرتجع بانتظار الاعتماد</span>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-secondary">العميل:</span>
              <span class="font-bold text-primary">{{ ret.client?.name || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary">الكمية المطلوبة:</span>
              <span class="font-bold text-amber-500">{{ formatKgWithUnit(ret.total_requested_tons) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary">الاسترداد التقديري:</span>
              <span class="font-bold text-emerald-500">{{ Number(ret.total_refund_amount).toFixed(2) }} ريال</span>
            </div>
          </div>

          <div class="bg-[var(--bg-secondary)] p-3 rounded-lg text-sm mb-4">
            <span class="text-xs text-secondary block mb-1">سبب طلب الإرجاع:</span>
            <p class="font-semibold text-primary">{{ ret.reason }}</p>
          </div>
        </div>

        <div class="flex gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
          <button @click="approveReturn(ret.id, 'approve')" class="btn btn-success flex-1 py-2.5 text-sm font-bold">
            موافقة المبيعات
          </button>
          <button @click="approveReturn(ret.id, 'reject')" class="btn btn-danger flex-1 py-2.5 text-sm font-bold">
            رفض
          </button>
        </div>
      </div>

      <div v-if="pendingReturns.length === 0" class="col-span-full text-center mt-12 text-secondary glass-card p-12 space-y-3">
        <CheckCircle :size="52" class="mx-auto text-emerald-500 opacity-60" />
        <p class="text-xl font-bold text-primary">لا توجد طلبات مرتجعات مبيعات معلقة حالياً.</p>
      </div>
    </div>

    <!-- Reject Modal for Orders -->
    <div v-if="showRejectModal" class="modal-backdrop flex items-center justify-center z-50" @click.self="showRejectModal = false">
      <div class="modal-container w-full max-w-md mx-4 p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
          <h3 class="text-xl font-bold text-danger flex items-center gap-2">
            <XCircle :size="22" /> سبب رفض الطلب
          </h3>
        </div>
        <div class="form-group mb-0">
          <textarea 
            v-model="rejectionReason" 
            class="input-field w-full p-3 text-sm" 
            rows="4" 
            placeholder="اكتب سبب الرفض بوضوح..."
          ></textarea>
        </div>
        <div v-if="actionError" class="p-3 text-danger bg-red-500/10 rounded-lg text-xs font-bold">
          {{ actionError }}
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="confirmReject" class="btn btn-danger flex-1 font-bold" :disabled="actionLoading">
            تأكيد الرفض
          </button>
          <button @click="showRejectModal = false; actionError = ''" class="btn btn-secondary flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-vue-next';
import omsApi from '../../services/omsApi';
import { formatKgWithUnit, formatPricePerKg } from '../../utils/weightFormatter';

const activeTab = ref('orders');
const orders = ref([]);
const pendingReturns = ref([]);
const loading = ref(true);
const actionLoading = ref(false);
const showRejectModal = ref(false);
const rejectionReason = ref('');
const rejectingOrderId = ref(null);
const actionError = ref('');

const pendingOrders = computed(() => {
  return orders.value;
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [ordersRes, returnsRes] = await Promise.allSettled([
      omsApi.get('/api/orders?limit=200'),
      omsApi.get('/api/sales-returns?limit=200')
    ]);

    if (ordersRes.status === 'fulfilled') {
      const rawOrders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : (ordersRes.value.data.orders || []);
      orders.value = rawOrders.filter(o => o.status === 'pending_sales_approval');
    } else {
      console.error('Error fetching orders:', ordersRes.reason);
    }

    if (returnsRes.status === 'fulfilled') {
      const rawReturns = returnsRes.value.data.returns || [];
      pendingReturns.value = rawReturns.filter(r => r.status === 'return_requested');
    } else {
      console.error('Error fetching returns:', returnsRes.reason);
    }
  } catch (error) {
    console.error('Error fetching pending data:', error);
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (orderId, targetStatus, payload = {}) => {
  try {
    if (targetStatus === 'rejected_by_sales') actionLoading.value = true;
    else loading.value = true;
    
    await omsApi.post(`/api/orders/${orderId}/transition`, {
      targetStatus,
      payload
    });
    await fetchData();
  } catch (error) {
    actionError.value = error.response?.data?.error || 'حدث خطأ غير متوقع.';
  } finally {
    loading.value = false;
    actionLoading.value = false;
  }
};

const approveReturn = async (returnId, action) => {
  try {
    loading.value = true;
    await omsApi.patch(`/api/sales-returns/${returnId}/approve`, {
      approval_stage: 'sales',
      action: action,
      rejection_reason: action === 'reject' ? 'تم الرفض بواسطة مدير المبيعات' : null
    });
    await fetchData();
  } catch (error) {
    alert(error.response?.data?.error || 'حدث خطأ أثناء اعتماد المرتجع.');
  } finally {
    loading.value = false;
  }
};

const openRejectModal = (orderId) => {
  rejectingOrderId.value = orderId;
  rejectionReason.value = '';
  actionError.value = '';
  showRejectModal.value = true;
};

const confirmReject = async () => {
  if (actionLoading.value) return;
  if (!rejectionReason.value.trim()) {
    actionError.value = 'الرجاء كتابة سبب الرفض';
    return;
  }
  await updateStatus(rejectingOrderId.value, 'rejected_by_sales', { rejection_reason: rejectionReason.value });
  if (!actionError.value) {
    showRejectModal.value = false;
    rejectionReason.value = '';
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
