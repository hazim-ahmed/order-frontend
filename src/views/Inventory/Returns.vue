<template>
  <div class="inventory-returns animate-slide-up">
    <div class="header-section mb-6 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold">{{ $t('nav.returns') }}</h2>
        <p class="text-secondary mt-1">تأكيد استلام المرتجعات من السائقين</p>
      </div>
      <span class="badge badge-danger text-lg px-4 py-2">{{ orders.length }} مرتجع</span>
    </div>

    <div v-if="loading" class="flex justify-center mt-8">
      <div class="loader"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="order in orders" :key="order.id" class="glass-card flex flex-col justify-between border-t-4 border-[var(--danger)]">
        <div>
          <div class="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
            <span class="text-lg font-bold text-brand">{{ order.order_number }}</span>
            <span class="text-xs text-secondary font-mono" dir="ltr">{{ formatDateTime(order.created_at || order.createdAt) }}</span>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-secondary mb-1">السائق المسند</p>
            <p class="font-bold flex items-center gap-2">
              <Truck :size="16" /> {{ order.driver?.username || 'سائق' }}
            </p>
          </div>
          
          <div class="bg-[var(--bg-secondary)] p-3 rounded-lg text-sm mb-4">
            <p class="font-bold mb-2 border-b border-[var(--border-color)] pb-1 text-danger flex items-center gap-2">
              <AlertCircle :size="16" /> المنتجات المرتجعة
            </p>
            <ul class="flex flex-col gap-1">
              <li v-for="item in order.items" :key="item.id" class="flex justify-between">
                <span>{{ item.product?.name }}</span>
                <span class="font-bold">{{ formatKgWithUnit(item.quantity_tons) }}</span>
              </li>
            </ul>
          </div>
          
          <div v-if="orderErrors[order.id]" class="mb-4 p-2 text-danger bg-red-500/10 rounded-lg text-sm">
            {{ orderErrors[order.id] }}
          </div>
        </div>

        <button @click="confirmReturn(order.id)" class="btn w-full py-3 bg-[var(--danger)] text-white hover:opacity-90" :disabled="actionLoading[order.id]">
          <span v-if="actionLoading[order.id]" class="loader small mr-2 inline-block"></span>
          تأكيد استلام المرتجع
        </button>
      </div>

      <div v-if="orders.length === 0" class="col-span-full text-center mt-12 text-secondary glass-card p-12">
        <RotateCcw :size="48" class="mx-auto mb-4 text-danger opacity-50" />
        <p class="text-xl">لا توجد طلبات إرجاع قيد الانتظار.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RotateCcw, Truck, AlertCircle } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter'
import { formatDateTime } from '../../utils/dateFormatter'

const orders = ref([])
const loading = ref(true)
const actionLoading = ref({})
const orderErrors = ref({})

const fetchOrders = async () => {
  try {
    const response = await omsApi.get('/api/orders?status=return_requested')
    orders.value = Array.isArray(response.data) ? response.data : (response.data.orders || [])
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const confirmReturn = async (orderId) => {
  actionLoading.value[orderId] = true
  orderErrors.value[orderId] = ''
  try {
    await omsApi.post(`/api/orders/${orderId}/transition`, {
      targetStatus: 'returned_to_warehouse'
    })
    await fetchOrders()
  } catch (error) {
    orderErrors.value[orderId] = error.response?.data?.error || 'حدث خطأ.'
  } finally {
    actionLoading.value[orderId] = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
.loader.small { width: 16px; height: 16px; border-width: 2px; margin: 0; vertical-align: middle; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
html[dir="rtl"] .mr-2 { margin-left: 0.5rem; margin-right: 0; }
</style>
