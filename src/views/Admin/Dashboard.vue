<template>
  <div class="admin-dashboard animate-slide-up">
    <!-- Header Area -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-primary mb-1">لوحة القيادة</h1>
          <p class="text-secondary text-sm">الملخص المالي والتشغيلي لنظام KMT OMS</p>
        </div>
        <div class="flex gap-3">
          <router-link :to="{ name: 'AdminAuditLog' }" class="btn btn-outline bg-surface">
            <Activity :size="18" /> سجل التدقيق
          </router-link>
          <router-link :to="{ name: 'AdminAllOrders' }" class="btn btn-primary shadow-lg shadow-brand-500/30">
            <Layers :size="18" /> إدارة جميع الطلبات
          </router-link>
        </div>
      </div>
    </div>

    <!-- Quick Management Panel -->
    <div class="glass-card mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold flex items-center gap-2">
          <Database :size="20" class="text-brand" /> إدارة البيانات الأساسية
        </h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <router-link :to="{ name: 'AdminUsers' }" class="action-card">
          <Users :size="24" class="text-muted mb-2" />
          <span class="text-sm font-semibold">المستخدمين</span>
        </router-link>
        <button class="action-card disabled">
          <Briefcase :size="24" class="text-muted mb-2" />
          <span class="text-sm font-semibold">العملاء (قريباً)</span>
        </button>
        <router-link :to="{ name: 'AdminProducts' }" class="action-card">
          <Package :size="24" class="text-muted mb-2" />
          <span class="text-sm font-semibold">المنتجات</span>
        </router-link>
        <router-link :to="{ name: 'AdminCategories' }" class="action-card">
          <Folders :size="24" class="text-muted mb-2" />
          <span class="text-sm font-semibold">الأقسام</span>
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col gap-6 md:gap-8">
      <SkeletonLoader type="kpi" :count="4" />
      <SkeletonLoader type="table" :rows="4" :cols="4" />
    </div>

    <div v-else class="space-y-8 stagger-container">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="إجمالي المبيعات المكتملة" 
          :value="formatCurrency(stats.totalRevenue)" 
          :icon="DollarSign" 
          color="success" 
          dir="ltr"
        />
        <StatCard 
          title="طلبات مكتملة" 
          :value="stats.completedOrders" 
          :icon="CheckCircle" 
          color="primary" 
        />
        <StatCard 
          title="طلبات قيد التنفيذ" 
          :value="stats.activeOrders" 
          :icon="Activity" 
          color="warning" 
        />
        <StatCard 
          title="طلبات ملغاة/مرفوضة" 
          :value="stats.cancelledOrders" 
          :icon="XCircle" 
          color="danger" 
        />
      </div>

      <!-- Product Study Section for General Manager / Admin -->
      <div class="glass-card p-6 border-t-4 border-emerald-500">
        <div class="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 class="text-lg font-bold text-primary flex items-center gap-2">
              <Package class="text-emerald-500" :size="20" /> دراسة كميات وإيرادات المنتجات المكتملة (General Admin Study)
            </h3>
            <p class="text-xs text-secondary">تحليل الأصناف الأكثر طلبًا وتأثيراً في المبيعات المكتملة بالنظام</p>
          </div>
          <div class="flex gap-2">
            <span class="badge badge-success text-xs">إجمالي الكميات المسلمة: {{ formatKgWithUnit(stats.completedTons) }}</span>
            <router-link :to="{ name: 'AdminReports' }" class="badge badge-primary text-xs hover:underline cursor-pointer">
              التقرير الشامل 📊
            </router-link>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-start">
            <thead>
              <tr class="text-secondary text-xs border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <th class="p-3 text-start">المنتج / المادة الخام</th>
                <th class="p-3 text-start">الكمية المباعة المكتملة (كجم)</th>
                <th class="p-3 text-start">عدد الطلبات المكتملة</th>
                <th class="p-3 text-start">إجمالي الإيرادات (SAR)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in productStudy" :key="item.name" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3 font-bold text-brand">{{ item.name }}</td>
                <td class="p-3 font-bold text-emerald-500" dir="ltr">{{ formatKgWithUnit(item.deliveredTons) }}</td>
                <td class="p-3 font-bold text-secondary">{{ item.ordersCount }} طلبات</td>
                <td class="p-3 font-bold text-success" dir="ltr">{{ item.revenue.toLocaleString() }} SAR</td>
              </tr>
              <tr v-if="productStudy.length === 0">
                <td colspan="4" class="p-6 text-center text-secondary text-sm">
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
import { DollarSign, CheckCircle, Activity, XCircle, Database, Layers, Users, Briefcase, Package, Folders } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter'
import StatCard from '../../components/ui/StatCard.vue'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'

const loading = ref(true)
const stats = ref({
  totalRevenue: 0,
  completedOrders: 0,
  activeOrders: 0,
  cancelledOrders: 0,
  completedTons: 0
})
const productStudy = ref([])

const fetchStats = async () => {
  loading.value = true
  try {
    const res = await omsApi.get('/api/orders')
    const allOrders = Array.isArray(res.data) ? res.data : (res.data.orders || [])
    
    const completedOrders = allOrders.filter(o => o.status === 'delivered')
    stats.value.completedOrders = completedOrders.length
    stats.value.cancelledOrders = allOrders.filter(o => o.status === 'cancelled' || o.status === 'rejected_by_sales').length
    stats.value.activeOrders = allOrders.filter(o => !['delivered', 'cancelled', 'rejected_by_sales', 'failed_delivery', 'returned_to_warehouse'].includes(o.status)).length
    
    stats.value.totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

    // Calculate product study
    const productsMap = {}
    let totalTons = 0

    completedOrders.forEach(o => {
      totalTons += Number(o.total_tons || 0)

      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const pName = item.product?.name || item.product_name || `منتج #${item.product_id}`
          const qty = Number(item.quantity_tons || 0)
          const price = Number(item.price_per_ton_snapshot) || Number(item.product?.current_price_per_ton) || 0;
          
          if (!productsMap[pName]) {
            productsMap[pName] = { name: pName, deliveredTons: 0, ordersCount: 0, revenue: 0 }
          }
          productsMap[pName].deliveredTons += qty
          productsMap[pName].ordersCount += 1
          productsMap[pName].revenue += qty * price
        })
      }
    })

    stats.value.completedTons = Number(totalTons.toFixed(3))
    productStudy.value = Object.values(productsMap).map(p => ({
      ...p,
      deliveredTons: Number(p.deliveredTons.toFixed(3)),
      revenue: Number(p.revenue.toFixed(2))
    }))
      
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(value)
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.action-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--transition-base);
}

.action-card:not(.disabled):hover {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.action-card:not(.disabled):hover svg {
  color: var(--brand-primary);
}

.action-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-hover);
}

.bg-surface {
  background-color: var(--bg-surface);
}
</style>
