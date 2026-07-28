<template>
  <div class="sales-manager-all-orders animate-slide-up">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">{{ $t('nav.allOrders') }}</h2>
    </div>

    <div class="glass-card mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="form-group mb-0">
        <label class="text-sm text-secondary mb-1 block">بحث</label>
        <input type="text" v-model="filters.search" class="form-input w-full" placeholder="رقم الطلب، العميل، المندوب...">
      </div>
      <div class="form-group mb-0">
        <label class="text-sm text-secondary mb-1 block">حالة الطلب</label>
        <select v-model="filters.status" class="form-input w-full">
          <option value="">كل الحالات</option>
          <option value="pending_sales_approval">{{ $t('order.status.pending_sales_approval') }}</option>
          <option value="pending_inventory_approval">{{ $t('order.status.pending_inventory_approval') }}</option>
          <option value="processing_in_warehouse">{{ $t('order.status.processing_in_warehouse') }}</option>
          <option value="assigned_to_driver">{{ $t('order.status.assigned_to_driver') }}</option>
          <option value="ready_for_pickup">{{ $t('order.status.ready_for_pickup') }}</option>
          <option value="picked_up_by_driver">{{ $t('order.status.picked_up_by_driver') }}</option>
          <option value="delivered">{{ $t('order.status.delivered') }}</option>
          <option value="failed_delivery">{{ $t('order.status.failed_delivery') }}</option>
          <option value="rejected_by_sales">{{ $t('order.status.rejected_by_sales') }}</option>
          <option value="cancelled">{{ $t('order.status.cancelled') }}</option>
        </select>
      </div>
      <div class="form-group mb-0 flex items-end">
        <button @click="resetFilters" class="btn btn-ghost w-full border border-[var(--border-color)]">إعادة ضبط</button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center mt-8">
      <div class="loader"></div>
    </div>

    <div v-else class="glass-card overflow-x-auto">
      <table class="w-full text-start">
        <thead>
          <tr class="text-secondary border-b border-[var(--border-color)]">
            <th class="p-3 text-start">رقم الطلب</th>
            <th class="p-3 text-start">المندوب</th>
            <th class="p-3 text-start">العميل</th>
            <th class="p-3 text-start">التاريخ</th>
            <th class="p-3 text-start">الحالة</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
            <td class="p-3">
                <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="font-bold text-brand hover:underline">
                  {{ order.order_number }}
                </router-link>
            </td>
            <td class="p-3">{{ order.salesRep?.name || '-' }}</td>
            <td class="p-3">{{ order.client?.name || '-' }}</td>
            <td class="p-3 text-xs font-mono text-secondary" dir="ltr">{{ formatDateTime(order.created_at || order.createdAt) }}</td>
            <td class="p-3">
              <OrderStatusBadge :status="order.status" />
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="6" class="p-8 text-center text-secondary">لا توجد طلبات مطابقة.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import omsApi from '../../services/omsApi'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge.vue'
import { formatDateTime } from '../../utils/dateFormatter'

const loading = ref(true)
const orders = ref([])
const filters = ref({
  search: '',
  status: ''
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await omsApi.get('/api/orders?limit=200')
    orders.value = Array.isArray(response.data) ? response.data : (response.data.orders || [])
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value.search = ''
  filters.value.status = ''
}

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchesStatus = !filters.value.status || o.status === filters.value.status
    const search = filters.value.search.toLowerCase()
    const matchesSearch = !search || 
      (o.order_number && o.order_number.toLowerCase().includes(search)) ||
      (o.client?.name && o.client.name.toLowerCase().includes(search)) ||
      (o.salesRep?.name && o.salesRep.name.toLowerCase().includes(search))
    return matchesStatus && matchesSearch
  })
})

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
