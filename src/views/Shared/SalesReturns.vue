<template>
  <div class="sales-returns-page animate-slide-up">
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <RotateCcw class="text-brand" :size="28" />
          إدارة مرتجعات المبيعات
        </h2>
        <p class="text-secondary mt-1">متابعة الاعتماد، النقل، الفحص المخزني، والإشعار الدائن للمرتجعات.</p>
      </div>

      <button
        v-if="['sales_rep', 'admin'].includes(userRole)"
        @click="showCreateModal = true"
        class="btn btn-primary flex items-center gap-2"
      >
        <PlusCircle :size="18" />
        طلب مرتجع جديد
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="glass-card p-4 flex items-center gap-4 border-r-4 border-indigo-500">
        <div class="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <RotateCcw :size="24" />
        </div>
        <div>
          <span class="text-xs text-secondary block">إجمالي المرتجعات</span>
          <span class="text-2xl font-bold">{{ returnsList.length }}</span>
        </div>
      </div>

      <div class="glass-card p-4 flex items-center gap-4 border-r-4 border-amber-500">
        <div class="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
          <Clock :size="24" />
        </div>
        <div>
          <span class="text-xs text-secondary block">بانتظار الاعتماد</span>
          <span class="text-2xl font-bold">{{ pendingCount }}</span>
        </div>
      </div>

      <div class="glass-card p-4 flex items-center gap-4 border-r-4 border-cyan-500">
        <div class="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
          <Truck :size="24" />
        </div>
        <div>
          <span class="text-xs text-secondary block">قيد النقل أو الفحص</span>
          <span class="text-2xl font-bold">{{ inTransitCount }}</span>
        </div>
      </div>

      <div class="glass-card p-4 flex items-center gap-4 border-r-4 border-emerald-500">
        <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 :size="24" />
        </div>
        <div>
          <span class="text-xs text-secondary block">مكتمل بإشعار دائن</span>
          <span class="text-2xl font-bold">{{ completedCount }}</span>
        </div>
      </div>
    </div>

    <div class="glass-card p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Filter :size="18" class="text-secondary" />
        <select v-model="selectedStatus" @change="fetchReturns" class="input-field py-2">
          <option value="">جميع الحالات</option>
          <option value="return_requested">بانتظار موافقة المبيعات</option>
          <option value="sales_approved">معتمد من المبيعات</option>
          <option value="in_transit">في الطريق إلى المخزن</option>
          <option value="driver_delivered">السائق أكد التسليم</option>
          <option value="returned_to_warehouse">مستلم بالمخزن</option>
          <option value="credit_note_issued">صادر له إشعار دائن</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      <button @click="fetchReturns" class="btn btn-secondary py-2 text-sm flex items-center gap-2">
        <RefreshCw :size="16" :class="{ spin: loading }" />
        تحديث القائمة
      </button>
    </div>

    <div v-if="loading" class="flex justify-center my-12">
      <div class="loader"></div>
    </div>

    <div v-else-if="returnsList.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="ret in returnsList"
        :key="ret.id"
        class="glass-card p-6 flex flex-col justify-between border-t-4"
        :class="getStatusBorderClass(ret.status)"
      >
        <div>
          <div class="flex justify-between items-start mb-3 border-b border-[var(--border-color)] pb-3 gap-3">
            <div>
              <span class="text-lg font-bold text-brand block">{{ ret.return_number }}</span>
              <span class="text-xs text-secondary">الطلب الأصلي: {{ ret.order?.order_number || `#${ret.order_id}` }}</span>
            </div>
            <span class="badge" :class="getStatusBadgeClass(ret.status)">
              {{ getStatusLabel(ret.status) }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span class="text-xs text-secondary block">العميل:</span>
              <span class="font-bold">{{ ret.client?.name || 'غير معروف' }}</span>
            </div>
            <div>
              <span class="text-xs text-secondary block">تاريخ التقديم:</span>
              <span class="font-bold text-primary">{{ formatDateTime(ret.createdAt || ret.created_at) }}</span>
            </div>
            <div>
              <span class="text-xs text-secondary block">الكمية المطلوبة:</span>
              <span class="font-bold text-amber-400">{{ formatKgWithUnit(ret.total_requested_tons) }}</span>
            </div>
            <div>
              <span class="text-xs text-secondary block">مبلغ الاسترداد:</span>
              <span class="font-bold text-emerald-400">{{ Number(ret.total_refund_amount || 0).toFixed(2) }} ريال</span>
            </div>
            <div v-if="ret.driver">
              <span class="text-xs text-secondary block">السائق:</span>
              <span class="font-bold">{{ ret.driver.name || ret.driver.username }}</span>
            </div>
            <div v-if="ret.refund_mode">
              <span class="text-xs text-secondary block">طريقة التعويض:</span>
              <span class="font-bold text-info">{{ refundModeLabel(ret.refund_mode) }}</span>
            </div>
            <div v-if="ret.sales_approved_at">
              <span class="text-xs text-secondary block">اعتماد المبيعات:</span>
              <span class="font-bold text-blue-400">{{ formatDateTime(ret.sales_approved_at) }}</span>
            </div>
            <div v-if="ret.driver_delivered_at">
              <span class="text-xs text-secondary block">تأكيد السائق:</span>
              <span class="font-bold text-cyan-400">{{ formatDateTime(ret.driver_delivered_at) }}</span>
            </div>
          </div>

          <div class="bg-[var(--bg-secondary)] p-3 rounded-lg text-sm mb-4">
            <span class="text-xs text-secondary block mb-1">سبب الإرجاع:</span>
            <p class="font-medium text-primary">{{ ret.reason }}</p>
          </div>

          <div v-if="['returned_to_warehouse', 'credit_note_issued'].includes(ret.status)" class="bg-emerald-500/10 p-3 rounded-lg text-sm mb-4 border border-emerald-500/20">
            <div class="text-emerald-400 font-bold mb-2">نتائج الفحص بالمخزن:</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-secondary">
              <span>سليم: <strong class="text-emerald-400">{{ formatKgWithUnit(ret.verified_good_tons) }}</strong></span>
              <span>تالف: <strong class="text-rose-400">{{ formatKgWithUnit(ret.verified_damaged_tons) }}</strong></span>
              <span>مفقود: <strong class="text-amber-400">{{ formatKgWithUnit(ret.verified_missing_tons) }}</strong></span>
            </div>
          </div>

          <div v-if="ret.creditNote" class="bg-indigo-500/10 p-3 rounded-lg text-sm mb-4 border border-indigo-500/20 flex justify-between items-center">
            <div>
              <span class="text-xs text-indigo-300 block">الإشعار الدائن الصادر:</span>
              <span class="font-bold text-indigo-400">{{ ret.creditNote.credit_note_number }}</span>
            </div>
            <span class="text-lg font-bold text-indigo-400">{{ Number(ret.creditNote.total_amount || 0).toFixed(2) }} ريال</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-color)]">
          <template v-if="ret.status === 'return_requested' && ['sales_manager', 'admin'].includes(userRole)">
            <button @click="openApproveModal(ret)" class="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1">
              اعتماد / رفض
            </button>
          </template>

          <template v-else-if="ret.status === 'return_requested' && userRole === 'inventory_manager'">
            <div class="w-full text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
              بانتظار موافقة مدير المبيعات قبل الفحص أو الاستلام.
            </div>
          </template>

          <template v-if="ret.status === 'sales_approved' && ['inventory_manager', 'admin'].includes(userRole)">
            <button @click="openAssignDriverModal(ret)" class="btn btn-info text-xs flex-1 flex items-center justify-center gap-1">
              <Truck :size="14" /> إسناد سائق
            </button>
            <button @click="openInspectModal(ret)" class="btn btn-primary bg-amber-600 hover:bg-amber-700 text-white text-xs flex-1 flex items-center justify-center gap-1">
              <Scale :size="14" /> فحص مباشر
            </button>
          </template>

          <template v-if="['in_transit', 'driver_delivered'].includes(ret.status) && ['inventory_manager', 'admin'].includes(userRole)">
            <button @click="openInspectModal(ret)" class="btn btn-primary bg-amber-600 hover:bg-amber-700 text-white text-xs flex-1 flex items-center justify-center gap-1">
              <Scale :size="14" /> فحص أوزان القبان بالمخزن
            </button>
          </template>

          <template v-if="ret.status === 'returned_to_warehouse' && userRole === 'admin'">
            <button @click="openCreditNoteModal(ret)" class="btn btn-primary text-xs flex-1 flex items-center justify-center gap-1">
              <FileText :size="14" /> إصدار الإشعار الدائن
            </button>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="glass-card text-center p-12 text-secondary">
      <RotateCcw :size="48" class="mx-auto mb-4 opacity-40 text-brand" />
      <p class="text-xl">لا توجد طلبات مرتجعات مبيعات مطابقة.</p>
    </div>

    <CreateReturnModal :is-open="showCreateModal" @close="showCreateModal = false" @created="fetchReturns" />
    <InspectReturnModal :is-open="showInspectModal" :sales-return="selectedReturn" @close="showInspectModal = false" @inspected="fetchReturns" />
    <CreditNoteModal :is-open="showCreditModal" :sales-return="selectedReturn" @close="showCreditModal = false" @issued="fetchReturns" />
    <ApproveReturnModal :is-open="showApproveModal" :sales-return="selectedReturn" @close="showApproveModal = false" @submitted="handleApproval" />
    <AssignReturnDriverModal :is-open="showAssignDriverModal" :sales-return="selectedReturn" @close="showAssignDriverModal = false" @assigned="fetchReturns" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../store/auth';
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter';
import { formatDateTime } from '../../utils/dateFormatter';
import {
  RotateCcw, PlusCircle, Clock, Truck, CheckCircle2,
  Filter, RefreshCw, Scale, FileText
} from 'lucide-vue-next';

import CreateReturnModal from '../../components/returns/CreateReturnModal.vue';
import InspectReturnModal from '../../components/returns/InspectReturnModal.vue';
import CreditNoteModal from '../../components/returns/CreditNoteModal.vue';
import ApproveReturnModal from '../../components/returns/ApproveReturnModal.vue';
import AssignReturnDriverModal from '../../components/returns/AssignReturnDriverModal.vue';

const authStore = useAuthStore();
const userRole = computed(() => authStore.userRole);

const returnsList = ref([]);
const loading = ref(true);
const selectedStatus = ref('');
const selectedReturn = ref(null);

const showCreateModal = ref(false);
const showInspectModal = ref(false);
const showCreditModal = ref(false);
const showApproveModal = ref(false);
const showAssignDriverModal = ref(false);

const pendingCount = computed(() => returnsList.value.filter(r => r.status === 'return_requested').length);
const inTransitCount = computed(() => returnsList.value.filter(r => ['sales_approved', 'in_transit', 'driver_delivered'].includes(r.status)).length);
const completedCount = computed(() => returnsList.value.filter(r => r.status === 'credit_note_issued').length);

const fetchReturns = async () => {
  loading.value = true;
  try {
    const url = selectedStatus.value ? `/api/sales-returns?status=${selectedStatus.value}&limit=200` : '/api/sales-returns?limit=200';
    const response = await omsApi.get(url);
    returnsList.value = response.data.returns || [];
  } catch (err) {
    console.error('Error fetching sales returns:', err);
  } finally {
    loading.value = false;
  }
};

const openApproveModal = (ret) => {
  selectedReturn.value = ret;
  showApproveModal.value = true;
};

const openAssignDriverModal = (ret) => {
  selectedReturn.value = ret;
  showAssignDriverModal.value = true;
};

const openInspectModal = (ret) => {
  selectedReturn.value = ret;
  showInspectModal.value = true;
};

const openCreditNoteModal = (ret) => {
  selectedReturn.value = ret;
  showCreditModal.value = true;
};

const handleApproval = async (payload) => {
  if (!selectedReturn.value) return;
  try {
    await omsApi.patch(`/api/sales-returns/${selectedReturn.value.id}/approve`, {
      approval_stage: 'sales',
      ...payload
    });
    showApproveModal.value = false;
    await fetchReturns();
  } catch (err) {
    alert(err.response?.data?.error || 'حدث خطأ أثناء معالجة الاعتماد.');
  }
};

const refundModeLabel = (mode) => {
  const map = {
    good_only: 'السليم فقط',
    good_and_damaged: 'السليم + التالف',
    all: 'كل الكميات'
  };
  return map[mode] || '-';
};

const getStatusLabel = (status) => {
  const map = {
    return_requested: 'بانتظار موافقة المبيعات',
    sales_approved: 'معتمد من المبيعات',
    finance_approved: 'معتمد مالياً',
    in_transit: 'في الطريق إلى المخزن',
    driver_delivered: 'السائق أكد التسليم',
    inspected: 'تم الفحص',
    returned_to_warehouse: 'مستلم بالمخزن',
    credit_note_issued: 'تم إصدار الإشعار الدائن',
    rejected: 'مرفوض'
  };
  return map[status] || status;
};

const getStatusBadgeClass = (status) => {
  const map = {
    return_requested: 'badge-warning',
    sales_approved: 'badge-info',
    finance_approved: 'badge-info',
    in_transit: 'badge-primary',
    driver_delivered: 'badge-primary',
    returned_to_warehouse: 'badge-emerald',
    credit_note_issued: 'badge-success',
    rejected: 'badge-danger'
  };
  return map[status] || 'badge-secondary';
};

const getStatusBorderClass = (status) => {
  const map = {
    return_requested: 'border-amber-500',
    sales_approved: 'border-blue-500',
    finance_approved: 'border-blue-500',
    in_transit: 'border-cyan-500',
    driver_delivered: 'border-cyan-500',
    returned_to_warehouse: 'border-emerald-500',
    credit_note_issued: 'border-indigo-500',
    rejected: 'border-rose-500'
  };
  return map[status] || 'border-gray-500';
};

onMounted(() => {
  fetchReturns();
});
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>