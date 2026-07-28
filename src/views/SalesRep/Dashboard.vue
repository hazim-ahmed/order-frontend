<template>
  <div class="sales-rep-dashboard animate-slide-up">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div class="header-section">
        <h2 class="text-3xl font-extrabold text-primary mb-1">لوحة تحكم المبيعات</h2>
        <p class="text-secondary text-sm">متابعة أداء الطلبات والحالات التشغيلية والوزن الإجمالي للعملاء</p>
      </div>
      <router-link :to="{ name: 'SalesRepNewOrder' }" class="btn btn-primary shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2 py-3 px-5">
        <PlusCircle :size="20" />
        <span>إضافة طلب جديد</span>
      </router-link>
    </div>

    <!-- Skeleton Loading Screen -->
    <div v-if="loading" class="flex flex-col gap-6 md:gap-8">
      <SkeletonLoader type="kpi" :count="4" />
      <SkeletonLoader type="table" :rows="4" :cols="5" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-container">
      <!-- Total Orders Card -->
      <div class="glass-card p-5 border-t-4 border-indigo-500 relative overflow-hidden group hover:border-indigo-400 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-secondary text-sm font-medium">إجمالي الطلبات</span>
          <div class="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <ShoppingBag :size="20" />
          </div>
        </div>
        <div class="text-3xl font-extrabold text-primary mb-1">{{ stats.total }}</div>
        <div class="text-xs text-muted">إجمالي وزن الطلبات: <b class="text-brand">{{ formatKgWithUnit(stats.totalTons) }}</b></div>
      </div>

      <!-- Pending Orders & Returns Card -->
      <div class="glass-card p-5 border-t-4 border-amber-500 relative overflow-hidden group hover:border-amber-400 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-secondary text-sm font-medium">قيد الموافقة والانتظار</span>
          <div class="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock :size="20" />
          </div>
        </div>
        <div class="text-3xl font-extrabold text-amber-400 mb-1">{{ stats.pending }}</div>
        <div class="text-xs text-muted">طلبات التوريد والإرجاع المعلقة</div>
      </div>

      <!-- Completed Orders Card -->
      <div class="glass-card p-5 border-t-4 border-emerald-500 relative overflow-hidden group hover:border-emerald-400 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-secondary text-sm font-medium">مكتمل ومسلّم للعميل</span>
          <div class="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 :size="20" />
          </div>
        </div>
        <div class="text-3xl font-extrabold text-emerald-400 mb-1">{{ stats.delivered }}</div>
        <div class="text-xs text-muted">تم استلام الفاتورة وتسليم الشحنة</div>
      </div>

      <!-- Rejected / Cancelled Card -->
      <div class="glass-card p-5 border-t-4 border-rose-500 relative overflow-hidden group hover:border-rose-400 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-secondary text-sm font-medium">مرفوضة / ملغاة</span>
          <div class="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <XCircle :size="20" />
          </div>
        </div>
        <div class="text-3xl font-extrabold text-rose-400 mb-1">{{ stats.rejected }}</div>
        <div class="text-xs text-muted">طلبات تم التراجع عنها أو رفضها</div>
      </div>
    </div>
    
    <!-- Recent Orders Preview Table -->
    <div class="mt-8 glass-card p-0 overflow-hidden">
      <div class="p-5 flex flex-wrap justify-between items-center gap-4 border-b border-[var(--border-color)]">
        <div>
          <h3 class="text-xl font-extrabold text-primary mb-0.5">أحدث الطلبات المسجلة</h3>
          <p class="text-xs text-secondary">عرض ملخص لآخر الطلبات وتحديثات حالاتها</p>
        </div>
        <router-link :to="{ name: 'SalesRepOrdersList' }" class="btn btn-outline text-xs py-2 px-4 flex items-center gap-1.5">
          <span>عرض كافة الطلبات</span>
          <ArrowLeft :size="15" />
        </router-link>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>اسم العميل</th>
              <th>طريقة التسليم</th>
              <th>الإجمالي (SAR)</th>
              <th>التاريخ</th>
              <th class="text-center">الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-white/5 transition-colors">
              <td>
                <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="text-brand hover:underline font-bold font-mono">
                  {{ order.order_number }}
                </router-link>
              </td>
              <td class="font-bold text-primary">{{ order.client?.name || '-' }}</td>
              <td>
                <span v-if="order.delivery_type === 'customer_pickup'" class="text-xs font-bold text-amber-400">🏢 استلام مباشر</span>
                <span v-else class="text-xs font-bold text-brand">🚚 توصيل شركة</span>
              </td>
              <td class="font-bold text-success" dir="ltr">{{ Number(order.total_amount || 0).toLocaleString() }} SAR</td>
              <td class="text-secondary text-xs">{{ new Date(order.created_at || order.createdAt).toLocaleDateString() }}</td>
              <td class="text-center">
                <OrderStatusBadge :status="order.status" />
              </td>
            </tr>
            <tr v-if="recentOrders.length === 0">
              <td colspan="6" class="p-8 text-center text-secondary">
                لا توجد طلبات مسجلة حالياً.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PlusCircle, ShoppingBag, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge.vue'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import { formatKgWithUnit } from '../../utils/weightFormatter'

const loading = ref(true)
const recentOrders = ref([])
const stats = ref({
  total: 0,
  pending: 0,
  delivered: 0,
  rejected: 0,
  totalTons: 0
})

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const res = await omsApi.get('/api/orders?limit=5')
    const allRes = await omsApi.get('/api/orders')
    
    const allData = Array.isArray(allRes.data) ? allRes.data : (allRes.data.orders || [])
    
    stats.value.total = allData.length
    stats.value.pending = allData.filter(o => ['pending_sales_approval', 'return_requested'].includes(o.status)).length
    stats.value.delivered = allData.filter(o => o.status === 'delivered').length
    stats.value.rejected = allData.filter(o => ['rejected_by_sales', 'cancelled'].includes(o.status)).length
    stats.value.totalTons = allData.reduce((sum, o) => sum + (Number(o.total_tons) || 0), 0)

    const listData = Array.isArray(res.data) ? res.data : (res.data.orders || [])
    recentOrders.value = listData.slice(0, 5)

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

