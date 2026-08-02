<template>
  <div class="admin-all-orders animate-slide-up">
    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-primary mb-1">{{ $t('nav.allOrders') }}</h1>
        <p class="text-secondary text-sm">عرض وإدارة جميع الطلبات في النظام الموحد</p>
      </div>
      <button class="btn btn-primary shadow-lg flex items-center gap-2" @click="exportReports" :disabled="exporting">
        <Download :size="18" />
        <span v-if="exporting" class="loader small inline-block"></span>
        {{ exporting ? 'جاري التصدير...' : 'تصدير التقارير' }}
      </button>
    </div>

    <!-- Filters -->
    <div class="glass-card mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="form-group mb-0">
          <label class="text-xs text-secondary font-bold uppercase tracking-wider mb-2 block">بحث حر</label>
          <input type="text" v-model="filters.search" class="form-input" placeholder="رقم الطلب، اسم العميل...">
        </div>
        <div class="form-group mb-0">
          <label class="text-xs text-secondary font-bold uppercase tracking-wider mb-2 block">تصفية حسب الحالة</label>
          <select v-model="filters.status" class="form-input">
            <option value="">كل الحالات</option>
            <option v-for="status in allStatuses" :key="status" :value="status">
              {{ $t(`order.status.${status}`) || status }}
            </option>
          </select>
        </div>
        <div class="form-group mb-0 flex items-end">
          <button @click="filters.search = ''; filters.status = ''" class="btn btn-outline w-full h-[46px]">
            إعادة ضبط الفلاتر
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center mt-12">
      <div class="loader"></div>
    </div>

    <div v-else class="glass-card p-0 overflow-hidden">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>المندوب</th>
              <th>العميل</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th class="text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td data-label="رقم الطلب">
                <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="font-bold text-brand hover:underline">
                  {{ order.order_number }}
                </router-link>
              </td>
              <td data-label="المندوب" class="text-secondary">{{ order.salesRep?.name || '-' }}</td>
              <td data-label="العميل" class="font-medium">{{ order.client?.name || '-' }}</td>
              <td data-label="التاريخ" class="text-secondary text-xs font-mono" dir="ltr">{{ formatDateTime(order.created_at || order.createdAt) }}</td>
              <td data-label="الحالة">
                <OrderStatusBadge :status="order.status" />
              </td>
              <td data-label="إجراءات" class="text-center">
                <button 
                  v-if="canCancel(order.status)" 
                  @click="openCancelModal(order.id)" 
                  class="btn-ghost text-danger hover:bg-red-500/10 p-2 rounded-md transition-colors"
                  title="إلغاء الطلب نهائياً"
                >
                  <XCircle :size="18" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="7">
                <div class="empty-state py-12">
                  <div class="empty-state-icon">
                    <Search :size="32" class="text-brand" />
                  </div>
                  <h4 class="text-lg font-bold">لا توجد طلبات</h4>
                  <p class="text-secondary text-sm">جرب تغيير فلاتر البحث أو إضافة طلب جديد.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cancel Modal -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-md bg-[var(--bg-primary)] p-6">
        <h3 class="text-xl font-bold text-danger mb-2">تأكيد إلغاء الطلب</h3>
        <p class="text-secondary text-sm mb-6">سيتم إلغاء الطلب نهائياً وإعادة الكميات للمخزون إذا تم خصمها مسبقاً.</p>
        
        <div class="form-group mb-4">
          <label class="text-sm font-bold mb-2 block">سبب الإلغاء <span class="text-danger">*</span></label>
          <textarea v-model="cancelReason" class="form-input w-full p-3" rows="3" placeholder="اكتب سبب الإلغاء للتسجيل في النظام..."></textarea>
        </div>
        
        <div v-if="cancelError" class="mb-4 p-3 text-danger bg-red-500/10 rounded-lg text-sm">
          {{ cancelError }}
        </div>
        
        <div class="flex gap-3">
          <button @click="confirmCancel" class="btn btn-danger flex-1 py-3" :disabled="actionLoading">
            <span v-if="actionLoading" class="loader small inline-block mr-2"></span>
            تأكيد الإلغاء
          </button>
          <button @click="showCancelModal = false; cancelError = ''" class="btn btn-ghost flex-1 border border-[var(--border-color)]">تراجع</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Download, XCircle, Search } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge.vue'
import { formatDateTime } from '../../utils/dateFormatter'

const loading = ref(true)
const exporting = ref(false)
const actionLoading = ref(false)
const orders = ref([])

const filters = ref({
  search: '',
  status: ''
})

const allStatuses = [
  'pending_sales_approval', 'rejected_by_sales', 'pending_inventory_approval', 
  'processing_in_warehouse', 'assigned_to_driver', 'ready_for_pickup', 
  'picked_up_by_driver', 'delivered', 'failed_delivery', 'return_requested', 
  'returned_to_warehouse', 'cancelled'
]

// Cancel Modal State
const showCancelModal = ref(false)
const cancellingOrderId = ref(null)
const cancelReason = ref('')
const cancelError = ref('')

const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await omsApi.get('/api/orders')
    orders.value = Array.isArray(response.data) ? response.data : (response.data.orders || [])
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const sMatches = !filters.value.status || o.status === filters.value.status
    const term = filters.value.search.toLowerCase()
    const tMatches = !term || 
      (o.order_number && o.order_number.toLowerCase().includes(term)) ||
      (o.client?.name && o.client.name.toLowerCase().includes(term)) ||
      (o.salesRep?.name && o.salesRep.name.toLowerCase().includes(term))
    return sMatches && tMatches
  })
})

const canCancel = (status) => {
  const cancellable = [
    'pending_sales_approval', 'pending_inventory_approval', 
    'processing_in_warehouse', 'assigned_to_driver', 'ready_for_pickup'
  ]
  return cancellable.includes(status)
}

const openCancelModal = (orderId) => {
  cancellingOrderId.value = orderId
  cancelReason.value = ''
  cancelError.value = ''
  showCancelModal.value = true
}

const confirmCancel = async () => {
  if (!cancelReason.value.trim()) {
    cancelError.value = 'الرجاء كتابة سبب الإلغاء.'
    return
  }
  
  actionLoading.value = true
  cancelError.value = ''
  
  try {
    await omsApi.post(`/api/orders/${cancellingOrderId.value}/transition`, {
      targetStatus: 'cancelled',
      payload: { cancellation_reason: cancelReason.value }
    })
    showCancelModal.value = false
    await fetchOrders()
  } catch (error) {
    cancelError.value = error.response?.data?.error || 'حدث خطأ في الإلغاء.'
  } finally {
    actionLoading.value = false
  }
}

import { useToastStore } from '../../store/toast'

const toast = useToastStore()

const exportReports = async () => {
  exporting.value = true
  try {
    const response = await omsApi.get('/api/reports/excel', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `KMT_OMS_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('تم تصدير التقرير بنجاح!')
  } catch (error) {
    console.error('Export error:', error)
    toast.danger('حدث خطأ أثناء تصدير التقرير.')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
.loader.small { border-left-color: currentColor; width: 16px; height: 16px; border-width: 2px; margin: 0; vertical-align: middle; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
html[dir="rtl"] .mr-2 { margin-left: 0.5rem; margin-right: 0; }
</style>
