<template>
  <div class="active-orders animate-slide-up">
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold">العمليات التي تتم معالجتها</h2>
        <p class="text-secondary mt-1">تتبع جميع الطلبات النشطة وقيد المعالجة في مختلف الأقسام</p>
      </div>
      <span class="badge badge-info text-lg px-4 py-2">{{ activeOrders.length }} طلب نشط</span>
    </div>

    <!-- Filters -->
    <div class="glass-card mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="form-group mb-0">
        <label class="text-sm text-secondary mb-1 block">رقم الطلب</label>
        <input type="text" v-model="filters.orderNumber" class="form-input w-full" placeholder="ابحث برقم الطلب...">
      </div>
      <div class="form-group mb-0">
        <label class="text-sm text-secondary mb-1 block">المرحلة الحالية</label>
        <select v-model="filters.stage" class="form-input w-full">
          <option value="">الكل</option>
          <option value="sales">المبيعات (مراجعة)</option>
          <option value="inventory">المخازن (تجهيز)</option>
          <option value="driver">التوصيل (السائق)</option>
        </select>
      </div>
      <div class="form-group mb-0 lg:col-span-2 flex items-end">
        <button @click="resetFilters" class="btn btn-outline w-full md:w-auto px-6 h-[46px]">مسح الفلاتر</button>
      </div>
    </div>

    <!-- Skeleton Loading Screen -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader type="card" />
      <SkeletonLoader type="card" />
      <SkeletonLoader type="card" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-container">
      <div v-for="order in filteredOrders" :key="order.id" class="glass-card flex flex-col justify-between hover:-translate-y-1 transition-transform border-t-4" :style="`border-top-color: ${getStageColor(order.status)}`">
        <div>
          <div class="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
            <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="text-lg font-bold text-brand hover:underline">
              {{ order.order_number }}
            </router-link>
            <OrderStatusBadge :status="order.status" class="scale-90 origin-left" />
          </div>
          
          <div class="mb-4 text-sm">
            <div>
              <p class="text-secondary text-xs mb-1">العميل</p>
              <p class="font-bold">{{ order.client?.name || 'عميل نقدي' }}</p>
            </div>
          </div>
          
          <div class="bg-[var(--bg-secondary)] p-3 rounded-lg text-sm mb-4">
            <p class="font-bold mb-2 flex items-center gap-2">
              المرحلة الحالية: 
              <span :style="`color: ${getStageColor(order.status)}`">{{ getStageName(order.status) }}</span>
            </p>
            <p class="text-xs text-secondary mt-1">تاريخ الإنشاء: {{ new Date(order.created_at || order.createdAt).toLocaleDateString() }}</p>
          </div>
        </div>

        <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="btn btn-ghost w-full py-2 bg-[var(--bg-secondary)] hover:bg-brand/10 hover:text-brand transition-colors text-center font-bold">
          عرض مسار الطلب بالكامل
        </router-link>
      </div>

      <div v-if="filteredOrders.length === 0" class="col-span-full text-center mt-12 text-secondary glass-card p-12">
        <p class="text-xl">لا توجد عمليات تتم معالجتها حالياً.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import omsApi from '../../services/omsApi'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge.vue'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'

const loading = ref(true)
const allOrders = ref([])

const filters = ref({
  orderNumber: '',
  stage: ''
})

const fetchOrders = async () => {
  loading.value = true
  try {
    // Fetch all orders, limit is 50 by default but we can pass limit=500 to make sure we get active ones.
    const res = await omsApi.get('/api/orders?limit=200')
    const rawOrders = Array.isArray(res.data) ? res.data : (res.data.orders || [])
    
    // Filter out inactive orders (delivered, cancelled, rejected)
    const inactiveStatuses = ['delivered', 'cancelled', 'rejected_by_sales']
    allOrders.value = rawOrders.filter(o => !inactiveStatuses.includes(o.status))
    
  } catch (err) {
    console.error('Error fetching active orders:', err)
  } finally {
    loading.value = false
  }
}

const activeOrders = computed(() => allOrders.value)

const filteredOrders = computed(() => {
  return activeOrders.value.filter(o => {
    // Search Order Number
    if (filters.value.orderNumber && !o.order_number.toLowerCase().includes(filters.value.orderNumber.toLowerCase())) {
      return false
    }
    
    // Stage Filter
    if (filters.value.stage) {
      const stage = getStageKey(o.status)
      if (stage !== filters.value.stage) return false
    }
    
    return true
  })
})

const resetFilters = () => {
  filters.value = { orderNumber: '', stage: '' }
}

const getStageKey = (status) => {
  if (['pending_sales_approval', 'sales_approved'].includes(status)) return 'sales'
  if (['pending_inventory_approval', 'processing_in_warehouse', 'ready_for_pickup'].includes(status)) return 'inventory'
  if (['assigned_to_driver', 'picked_up_by_driver', 'failed_delivery', 'return_requested', 'returned_to_warehouse', 'in_transit', 'credit_note_issued'].includes(status)) return 'driver'
  return 'other'
}

const getStageName = (status) => {
  const key = getStageKey(status)
  if (key === 'sales') return 'مراجعة المبيعات'
  if (key === 'inventory') return 'تجهيز المخازن'
  if (key === 'driver') return 'التوصيل والشحن'
  return 'غير معروف'
}

const getStageColor = (status) => {
  const key = getStageKey(status)
  if (key === 'sales') return 'var(--warning)' // Orange
  if (key === 'inventory') return 'var(--info)' // Blue
  if (key === 'driver') return 'var(--brand-primary)' // Purple
  return 'var(--text-secondary)'
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
