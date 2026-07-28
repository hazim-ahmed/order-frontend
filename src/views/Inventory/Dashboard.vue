<template>
  <div class="inventory-dashboard animate-slide-up space-y-6">
    <div class="header-section mb-6">
      <h2 class="text-2xl font-bold">{{ $t('nav.dashboard') }}</h2>
      <p class="text-secondary mt-1">إدارة التجهيز، السائقين، والطلبات المكتملة ودراسة المنتجات</p>
    </div>

    <!-- Skeleton Loading Screen -->
    <div v-if="loading" class="flex flex-col gap-6 md:gap-8">
      <SkeletonLoader type="kpi" :count="5" />
      <SkeletonLoader type="table" :rows="4" :cols="4" />
    </div>

    <div v-else class="space-y-6 stagger-container">
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <router-link :to="{ name: 'InventoryIncomingOrders' }" class="glass-card flex flex-col gap-2 border-t-4 border-[var(--warning)] hover:-translate-y-1 transition-transform">
          <div class="flex justify-between items-center">
            <div class="text-secondary text-sm">طلبات واردة</div>
            <Inbox class="text-[var(--warning)]" :size="24" />
          </div>
          <div class="text-3xl font-bold">{{ stats.incoming }}</div>
        </router-link>
        
        <router-link :to="{ name: 'InventoryProcessing' }" class="glass-card flex flex-col gap-2 border-t-4 border-[var(--info)] hover:-translate-y-1 transition-transform">
          <div class="flex justify-between items-center">
            <div class="text-secondary text-sm">قيد التجهيز</div>
            <Settings class="text-[var(--info)]" :size="24" />
          </div>
          <div class="text-3xl font-bold">{{ stats.processing }}</div>
        </router-link>

        <router-link :to="{ name: 'InventoryReadyOrders' }" class="glass-card flex flex-col gap-2 border-t-4 border-[var(--primary)] hover:-translate-y-1 transition-transform">
          <div class="flex justify-between items-center">
            <div class="text-secondary text-sm">جاهزة (تم الإسناد)</div>
            <CheckSquare class="text-[var(--primary)]" :size="24" />
          </div>
          <div class="text-3xl font-bold">{{ stats.ready }}</div>
        </router-link>

        <div class="glass-card flex flex-col gap-2 border-t-4 border-emerald-500">
          <div class="flex justify-between items-center">
            <div class="text-secondary text-sm">طلبات مكتملة ومسلمة</div>
            <Truck class="text-emerald-500" :size="24" />
          </div>
          <div class="text-3xl font-bold text-emerald-500">{{ stats.completed }}</div>
        </div>
        
        <router-link :to="{ name: 'InventoryReturns' }" class="glass-card flex flex-col gap-2 border-t-4 border-[var(--danger)] hover:-translate-y-1 transition-transform">
          <div class="flex justify-between items-center">
            <div class="text-secondary text-sm">طلبات الإرجاع</div>
            <RotateCcw class="text-[var(--danger)]" :size="24" />
          </div>
          <div class="text-3xl font-bold">{{ stats.returns }}</div>
        </router-link>
      </div>

      <!-- Product Study Section for Inventory Manager -->
      <div class="glass-card p-6 border-t-4 border-emerald-500">
        <div class="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 class="text-lg font-bold text-primary flex items-center gap-2">
              <Package class="text-emerald-500" :size="20" /> دراسة كميات المنتجات والطلبات المكتملة
            </h3>
            <p class="text-xs text-secondary">حساب إجمالي الكميات المسلمة فعلياً بالكجم لكل منتج في المستودع</p>
          </div>
          <span class="badge badge-success text-xs">إجمالي المسلم: {{ formatKgWithUnit(stats.completedTons) }}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-start">
            <thead>
              <tr class="text-secondary text-xs border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <th class="p-3 text-start">المنتج / المادة الخام</th>
                <th class="p-3 text-start">الكمية المسلمة المكتملة (كجم)</th>
                <th class="p-3 text-start">عدد الطلبات المكتملة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in productStudy" :key="item.name" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3 font-bold text-brand">{{ item.name }}</td>
                <td class="p-3 font-bold text-emerald-500" dir="ltr">{{ formatKgWithUnit(item.deliveredTons) }}</td>
                <td class="p-3 font-bold text-secondary">{{ item.ordersCount }} طلبات</td>
              </tr>
              <tr v-if="productStudy.length === 0">
                <td colspan="3" class="p-6 text-center text-secondary text-sm">
                  لا توجد طلبات مكتملة حالياً لإجراء الدراسة.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Inbox, Settings, CheckSquare, RotateCcw, Truck, Package } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import { formatKgWithUnit } from '../../utils/weightFormatter'

const loading = ref(true)
const stats = ref({
  incoming: 0,
  processing: 0,
  ready: 0,
  completed: 0,
  returns: 0,
  completedTons: 0
})
const productStudy = ref([])

const fetchStats = async () => {
  loading.value = true
  try {
    const res = await omsApi.get('/api/orders')
    const allOrders = Array.isArray(res.data) ? res.data : (res.data.orders || [])
    
    stats.value.incoming = allOrders.filter(o => o.status === 'pending_inventory_approval').length
    stats.value.processing = allOrders.filter(o => o.status === 'processing_in_warehouse').length
    stats.value.ready = allOrders.filter(o => o.status === 'assigned_to_driver' || o.status === 'ready_for_pickup').length
    stats.value.returns = allOrders.filter(o => o.status === 'return_requested').length
    
    const completedOrders = allOrders.filter(o => o.status === 'delivered')
    stats.value.completed = completedOrders.length
    
    // Product study calculation
    const productsMap = {}
    let totalTons = 0

    completedOrders.forEach(o => {
      const orderTons = Number(o.total_tons || 0)
      totalTons += orderTons

      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const pName = item.product?.name || item.product_name || `منتج #${item.product_id}`
          const qty = Number(item.quantity_tons || 0)
          
          if (!productsMap[pName]) {
            productsMap[pName] = { name: pName, deliveredTons: 0, ordersCount: 0 }
          }
          productsMap[pName].deliveredTons += qty
          productsMap[pName].ordersCount += 1
        })
      }
    })

    stats.value.completedTons = Number(totalTons.toFixed(3))
    productStudy.value = Object.values(productsMap).map(p => ({
      ...p,
      deliveredTons: Number(p.deliveredTons.toFixed(3))
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
