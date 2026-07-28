<template>
  <div class="sales-rep-orders animate-slide-up">
    <div class="flex justify-between items-center mb-6 gap-3 flex-wrap">
      <h2 class="text-2xl font-bold">{{ $t('nav.myOrders') }}</h2>
      <router-link :to="{ name: 'SalesRepNewOrder' }" class="btn btn-primary flex items-center gap-2">
        <PlusCircle :size="18" />
        {{ $t('nav.newOrder') }}
      </router-link>
    </div>

    <div class="glass-card mb-6 flex flex-wrap gap-4 items-center">
      <div class="inline-flex rounded-lg border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)]">
        <button
          type="button"
          :class="['px-4 py-2 text-sm font-bold transition-colors', activeTab === 'all' ? 'bg-brand text-white' : 'text-secondary hover:text-primary']"
          @click="activeTab = 'all'"
        >
          كل الطلبات
        </button>
        <button
          type="button"
          :class="['px-4 py-2 text-sm font-bold transition-colors', activeTab === 'delivered' ? 'bg-brand text-white' : 'text-secondary hover:text-primary']"
          @click="activeTab = 'delivered'"
        >
          الطلبات المستلمة
        </button>
      </div>

      <div class="form-group mb-0 flex-1 min-w-[200px]">
        <input type="text" v-model="filters.search" class="form-input" placeholder="بحث برقم الطلب أو العميل...">
      </div>
      <div v-if="activeTab === 'all'" class="form-group mb-0 flex-1 min-w-[200px]">
        <select v-model="filters.status" class="form-input">
          <option value="">كل الحالات</option>
          <option value="pending_sales_approval">{{ $t('order.status.pending_sales_approval') }}</option>
          <option value="pending_inventory_approval">{{ $t('order.status.pending_inventory_approval') }}</option>
          <option value="processing_in_warehouse">{{ $t('order.status.processing_in_warehouse') }}</option>
          <option value="assigned_to_driver">{{ $t('order.status.assigned_to_driver') }}</option>
          <option value="delivered">{{ $t('order.status.delivered') }}</option>
          <option value="return_requested">{{ $t('order.status.return_requested') }}</option>
          <option value="returned_to_warehouse">{{ $t('order.status.returned_to_warehouse') }}</option>
          <option value="rejected_by_sales">{{ $t('order.status.rejected_by_sales') }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center mt-8">
      <div class="loader"></div>
    </div>

    <div v-else-if="activeTab === 'all'" class="glass-card overflow-x-auto">
      <table class="w-full text-start">
        <thead>
          <tr class="text-secondary border-b border-[var(--border-color)]">
            <th class="p-3 text-start">رقم الطلب</th>
            <th class="p-3 text-start">العميل</th>
            <th class="p-3 text-start">الكمية (كجم)</th>
            <th class="p-3 text-start">التاريخ</th>
            <th class="p-3 text-start">الحالة</th>
            <th class="p-3 text-start">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
            <td class="p-3 font-bold">{{ order.order_number }}</td>
            <td class="p-3">{{ order.client?.name || '-' }}</td>
            <td class="p-3">{{ getTotalTons(order) }}</td>
            <td class="p-3 text-xs font-mono text-secondary" dir="ltr">{{ formatDateTime(order.created_at || order.createdAt) }}</td>
            <td class="p-3">
              <OrderStatusBadge :status="order.status" />
            </td>
            <td class="p-3">
              <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="btn btn-ghost text-brand text-sm px-3 py-1">
                التفاصيل
              </router-link>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="6" class="p-8 text-center text-secondary">لا توجد طلبات مطابقة للبحث.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="glass-card overflow-x-auto">
      <table class="w-full text-start min-w-[900px]">
        <thead>
          <tr class="text-secondary border-b border-[var(--border-color)]">
            <th class="p-3 text-start">رقم الطلب</th>
            <th class="p-3 text-start">العميل</th>
            <th class="p-3 text-start">تاريخ الاستلام</th>
            <th class="p-3 text-start">سند التسليم</th>
            <th class="p-3 text-start">تم الترحيل</th>
            <th class="p-3 text-start">رقم فاتورة النظام الرئيسي</th>
            <th class="p-3 text-start">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in deliveredOrders" :key="order.id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] align-middle">
            <td class="p-3 font-bold">{{ order.order_number }}</td>
            <td class="p-3">{{ order.client?.name || '-' }}</td>
            <td class="p-3 text-xs font-mono text-secondary" dir="ltr">{{ formatDateTime(order.delivered_at || order.updatedAt) }}</td>
            <td class="p-3">
              <span class="text-xs text-secondary">{{ order.delivery_reference_number || '-' }}</span>
            </td>
            <td class="p-3">
              <label class="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  class="w-4 h-4 accent-[var(--brand-primary)]"
                  v-model="order.document_posted_to_erp"
                />
                <span>{{ order.document_posted_to_erp ? 'نعم' : 'لا' }}</span>
              </label>
            </td>
            <td class="p-3">
              <input
                type="text"
                v-model.trim="order.erp_invoice_number"
                class="form-input min-w-[190px]"
                placeholder="مثال: INV-2026-001"
              />
              <p v-if="rowErrors[order.id]" class="text-danger text-xs mt-1">{{ rowErrors[order.id] }}</p>
            </td>
            <td class="p-3">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-primary text-sm px-3 py-1 flex items-center gap-2"
                  :disabled="savingRows[order.id]"
                  @click="savePosting(order)"
                >
                  <Save :size="15" />
                  حفظ
                </button>
                <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="btn btn-ghost text-brand text-sm px-3 py-1">
                  التفاصيل
                </router-link>
              </div>
            </td>
          </tr>
          <tr v-if="deliveredOrders.length === 0">
            <td colspan="7" class="p-8 text-center text-secondary">لا توجد طلبات مستلمة مطابقة للبحث.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { PlusCircle, Save } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge.vue'
import { formatDateTime } from '../../utils/dateFormatter'

const loading = ref(true)
const orders = ref([])
const activeTab = ref('all')
const savingRows = ref({})
const rowErrors = ref({})
const filters = ref({
  search: '',
  status: ''
})

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

const matchesSearch = (order) => {
  const search = filters.value.search.toLowerCase()
  return !search ||
    (order.order_number && order.order_number.toLowerCase().includes(search)) ||
    (order.client?.name && order.client.name.toLowerCase().includes(search)) ||
    (order.erp_invoice_number && order.erp_invoice_number.toLowerCase().includes(search))
}

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchesStatus = !filters.value.status || o.status === filters.value.status
    return matchesStatus && matchesSearch(o)
  })
})

const deliveredOrders = computed(() => {
  return orders.value.filter(o => o.status === 'delivered' && matchesSearch(o))
})

const getTotalTons = (order) => {
  if (!order.items) return 0
  return order.items.reduce((sum, item) => sum + Number(item.quantity_tons), 0)
}

const savePosting = async (order) => {
  rowErrors.value = { ...rowErrors.value, [order.id]: '' }
  if (order.document_posted_to_erp && !order.erp_invoice_number) {
    rowErrors.value = { ...rowErrors.value, [order.id]: 'رقم الفاتورة مطلوب عند تأكيد الترحيل.' }
    return
  }

  savingRows.value = { ...savingRows.value, [order.id]: true }
  try {
    const response = await omsApi.patch(`/api/orders/${order.id}/document-posting`, {
      document_posted_to_erp: order.document_posted_to_erp,
      erp_invoice_number: order.erp_invoice_number || ''
    })
    const updated = response.data.order
    orders.value = orders.value.map(item => item.id === order.id ? { ...item, ...updated } : item)
  } catch (error) {
    rowErrors.value = { ...rowErrors.value, [order.id]: error.response?.data?.error || 'تعذر حفظ بيانات الترحيل.' }
  } finally {
    savingRows.value = { ...savingRows.value, [order.id]: false }
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
