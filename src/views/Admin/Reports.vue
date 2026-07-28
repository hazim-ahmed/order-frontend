<template>
  <div class="admin-reports animate-slide-up space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
      <div>
        <h1 class="text-3xl font-extrabold text-primary mb-1">التقارير الشاملة والمطابقة</h1>
        <p class="text-secondary text-sm">مراجعة مطابقة كميات الشحن كلياً، وأداء المناديب وحركة المنتجات بالنظام المحلي</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="fetchReport" class="btn btn-outline border-[var(--border-color)] flex items-center gap-2">
          <RefreshCw :size="18" :class="{ 'animate-spin': loading }" />
          تحديث البيانات
        </button>
        <button @click="exportExcel" class="btn btn-success shadow-lg flex items-center gap-2" :disabled="exportingExcel">
          <FileSpreadsheet :size="18" />
          <span v-if="exportingExcel" class="loader small inline-block ml-1"></span>
          {{ exportingExcel ? 'جاري التصدير...' : 'تصدير إكسل شامل' }}
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="glass-card p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="text-xs text-secondary font-bold uppercase mb-1 block">من تاريخ</label>
          <input type="date" v-model="filters.date_from" @change="fetchReport" class="form-input w-full text-sm">
        </div>
        <div>
          <label class="text-xs text-secondary font-bold uppercase mb-1 block">إلى تاريخ</label>
          <input type="date" v-model="filters.date_to" @change="fetchReport" class="form-input w-full text-sm">
        </div>
        <div>
          <label class="text-xs text-secondary font-bold uppercase mb-1 block">تصفية بحسب المندوب</label>
          <select v-model="filters.sales_rep_id" @change="fetchReport" class="form-input w-full text-sm">
            <option value="">جميع المناديب</option>
            <option v-for="rep in salesRepsList" :key="rep.id" :value="rep.id">{{ rep.name }}</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="resetFilters" class="btn btn-outline w-full h-[40px] text-sm">
            إعادة ضبط الفلاتر
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center my-12">
      <div class="loader"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- KPI Stats Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="glass-card p-4 border-r-4 border-blue-500 flex items-center justify-between">
          <div>
            <p class="text-xs text-secondary font-bold">إجمالي الطلبات</p>
            <h3 class="text-2xl font-black text-primary mt-1">{{ summary.totalOrdersCount || 0 }}</h3>
          </div>
          <div class="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Package :size="24" />
          </div>
        </div>

        <div class="glass-card p-4 border-r-4 border-indigo-500 flex items-center justify-between">
          <div>
            <p class="text-xs text-secondary font-bold">الكمية المطلوبة (المبيعات)</p>
            <h3 class="text-xl font-black text-brand mt-1" dir="ltr">{{ ((summary.totalRequestedTons || 0) * 1000).toLocaleString() }} كجم</h3>
            <span class="text-[10px] text-secondary">({{ formatKgWithUnit(summary.totalRequestedTons || 0) }})</span>
          </div>
          <div class="p-3 bg-indigo-500/10 text-brand rounded-xl">
            <Scale :size="24" />
          </div>
        </div>

        <div class="glass-card p-4 border-r-4 border-emerald-500 flex items-center justify-between">
          <div>
            <p class="text-xs text-secondary font-bold">الكمية المشحونة (الفرد)</p>
            <h3 class="text-xl font-black text-emerald-500 mt-1" dir="ltr">{{ ((summary.totalShippedTons || 0) * 1000).toLocaleString() }} كجم</h3>
            <span class="text-[10px] text-secondary">({{ formatKgWithUnit(summary.totalShippedTons || 0) }})</span>
          </div>
          <div class="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Truck :size="24" />
          </div>
        </div>

        <div class="glass-card p-4 border-r-4 flex items-center justify-between"
             :class="summary.varianceTons > 0 ? 'border-amber-500' : (summary.varianceTons < 0 ? 'border-purple-500' : 'border-gray-500')">
          <div>
            <p class="text-xs text-secondary font-bold">تفاوت الشحن (الفارق)</p>
            <h3 class="text-xl font-black mt-1" :class="summary.varianceTons > 0 ? 'text-amber-500' : 'text-purple-400'" dir="ltr">
              {{ summary.varianceTons > 0 ? '+' : '' }}{{ ((summary.varianceTons || 0) * 1000).toLocaleString() }} كجم
            </h3>
            <span v-if="summary.discrepancyCount > 0" class="text-[10px] text-amber-500 font-bold">
              {{ summary.discrepancyCount }} طلبات فارق
            </span>
          </div>
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <AlertTriangle :size="24" />
          </div>
        </div>

        <div class="glass-card p-4 border-r-4 border-green-500 flex items-center justify-between">
          <div>
            <p class="text-xs text-secondary font-bold">إجمالي المبيعات</p>
            <h3 class="text-xl font-black text-success mt-1" dir="ltr">{{ (summary.totalRevenue || 0).toLocaleString() }} SAR</h3>
          </div>
          <div class="p-3 bg-green-500/10 text-success rounded-xl">
            <DollarSign :size="24" />
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-[var(--border-color)] gap-2">
        <button 
          @click="activeTab = 'reconciliation'" 
          class="py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
          :class="activeTab === 'reconciliation' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-secondary hover:text-primary'"
        >
          <Scale :size="18" />
          مطابقة كميات الشحن والتفاوت
          <span v-if="summary.discrepancyCount > 0" class="badge badge-danger text-[10px]">
            {{ summary.discrepancyCount }}
          </span>
        </button>

        <button 
          @click="activeTab = 'salesReps'" 
          class="py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
          :class="activeTab === 'salesReps' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-secondary hover:text-primary'"
        >
          <Users :size="18" />
          أداء المناديب وتفاصيل الأصناف
        </button>

        <button 
          @click="activeTab = 'products'" 
          class="py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
          :class="activeTab === 'products' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-secondary hover:text-primary'"
        >
          <Layers :size="18" />
          حركة وإحصائيات المنتجات
        </button>
      </div>

      <!-- TAB 1: SHIPPING RECONCILIATION & VARIANCE AUDIT -->
      <div v-if="activeTab === 'reconciliation'" class="glass-card p-0 overflow-hidden">
        <div class="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg text-primary">سجل مطابقة الشحن والقبانات</h3>
            <p class="text-xs text-secondary">قارن بين الكميات المطلوبة في الطلب والكميات المشحونة بالفعل لمعالجة أي تفاوت</p>
          </div>
          <span class="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full font-bold">
            يمكنك تعديل كمية الشحن الفعلية لأي طلب مباشرة
          </span>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>المندوب</th>
                <th>السائق</th>
                <th>المطلوب (كجم)</th>
                <th>المشحون الفعلي (كجم)</th>
                <th>الفارق</th>
                <th>حالة المطابقة</th>
                <th>المبلغ</th>
                <th class="text-center">إجراءات المطابقة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in shippingReconciliation" :key="item.id" 
                  :class="item.variance_status !== 'matched' ? 'bg-amber-500/5' : ''">
                <td class="font-bold text-brand">{{ item.order_number }}</td>
                <td class="font-bold text-primary">{{ item.client_name }}</td>
                <td class="text-secondary text-xs">{{ item.sales_rep_name }}</td>
                <td class="text-secondary text-xs">{{ item.driver_name }}</td>
                <td class="font-bold text-indigo-400" dir="ltr">{{ formatKgWithUnit(item.requested_tons) }}</td>
                <td class="font-bold text-emerald-400" dir="ltr">
                  <span v-if="editingOrderId !== item.id">{{ formatKgWithUnit(item.shipped_tons) }}</span>
                  <input v-else v-model="editingShippedValue" type="number" step="0.001" class="form-input w-24 p-1 text-xs text-center" dir="ltr">
                </td>
                <td class="font-bold" dir="ltr" :class="item.variance_tons > 0 ? 'text-amber-500' : (item.variance_tons < 0 ? 'text-purple-400' : 'text-muted')">
                  {{ item.variance_tons > 0 ? '+' : '' }}{{ formatKgWithUnit(item.variance_tons) }}
                </td>
                <td>
                  <span :class="{
                    'badge badge-success': item.variance_status === 'matched',
                    'badge badge-warning text-amber-500 bg-amber-500/10 border-amber-500/20': item.variance_status === 'over_shipped',
                    'badge text-purple-400 bg-purple-500/10 border-purple-500/20': item.variance_status === 'under_shipped'
                  }">
                    {{ item.variance_status === 'matched' ? 'مطابق' : (item.variance_status === 'over_shipped' ? 'زيادة شحن (+)' : 'نقص شحن (-)') }}
                  </span>
                </td>
                <td class="font-bold text-success" dir="ltr">{{ item.total_amount.toLocaleString() }} SAR</td>
                <td class="text-center">
                  <button v-if="editingOrderId !== item.id" @click="startEditing(item)" class="btn btn-outline text-xs py-1 px-3">
                    تعديل وزن القبّان
                  </button>
                  <div v-else class="flex items-center justify-center gap-1">
                    <button @click="saveShippedTons(item.id)" class="btn btn-primary text-xs py-1 px-2" :disabled="savingTons">
                      حفظ
                    </button>
                    <button @click="cancelEditing" class="btn btn-ghost text-xs py-1 px-2">
                      إلغاء
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="shippingReconciliation.length === 0">
                <td colspan="10" class="text-center py-8 text-secondary">
                  لا توجد طلبات مسجلة ضمن الفلاتر المحددة.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: SALES REPS PERFORMANCE & PRODUCT BREAKDOWN -->
      <div v-if="activeTab === 'salesReps'" class="space-y-6">
        <div v-for="rep in salesRepsReport" :key="rep.id" class="glass-card p-6 border-t-4 border-brand">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[var(--border-color)] pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-lg">
                {{ rep.name ? rep.name.charAt(0) : 'M' }}
              </div>
              <div>
                <h3 class="text-xl font-bold text-primary">{{ rep.name }}</h3>
                <p class="text-xs text-secondary">{{ rep.email || 'مندوب مبيعات' }} | {{ rep.phone || 'بدون هاتف' }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <div class="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg text-center">
                <span class="text-[10px] text-secondary font-bold block">إجمالي الطلبات</span>
                <span class="text-lg font-black text-brand">{{ rep.totalOrders }}</span>
              </div>
              <div class="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg text-center">
                <span class="text-[10px] text-secondary font-bold block">الكمية المطلوبة</span>
                <span class="text-lg font-black text-indigo-400" dir="ltr">{{ formatKgWithUnit(rep.totalRequestedTons) }}</span>
              </div>
              <div class="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg text-center">
                <span class="text-[10px] text-secondary font-bold block">الكمية المشحونة</span>
                <span class="text-lg font-black text-emerald-400" dir="ltr">{{ formatKgWithUnit(rep.totalShippedTons) }}</span>
              </div>
              <div class="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg text-center">
                <span class="text-[10px] text-secondary font-bold block">إجمالي المبيعات</span>
                <span class="text-lg font-black text-success" dir="ltr">{{ rep.totalAmount.toLocaleString() }} SAR</span>
              </div>
            </div>
          </div>

          <!-- Product Details Breakdown for this Sales Rep -->
          <div>
            <h4 class="text-xs font-bold uppercase text-secondary mb-3 tracking-wider flex items-center gap-2">
              <Package :size="16" /> تفاصيل الأصناف والمنتجات المطلوبة بواسطة {{ rep.name }}
            </h4>
            <div class="table-wrapper">
              <table class="table text-sm">
                <thead>
                  <tr class="bg-[var(--bg-secondary)] text-xs">
                    <th>اسم المنتج</th>
                    <th>الكمية الإجمالية المطلوبة</th>
                    <th>عدد مرات الطلب</th>
                    <th>إجمالي المبلغ للمنتج</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prod in rep.productsList" :key="prod.product_name">
                    <td class="font-bold text-brand">{{ prod.product_name }}</td>
                    <td class="font-bold text-indigo-400" dir="ltr">{{ formatKgWithUnit(prod.quantity_tons) }}</td>
                    <td class="font-bold text-secondary">{{ prod.orders_count }} طلبات</td>
                    <td class="font-bold text-success" dir="ltr">{{ prod.total_amount.toLocaleString() }} SAR</td>
                  </tr>
                  <tr v-if="rep.productsList.length === 0">
                    <td colspan="4" class="text-center text-xs text-secondary py-4">
                      لم يقم هذا المندوب بإنشاء أي طلبات حتى الآن.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="salesRepsReport.length === 0" class="glass-card text-center py-12 text-secondary">
          لا يوجد مناديب مسجلين بالنظام أو لا توجد بيانات ضمن التصفية.
        </div>
      </div>

      <!-- TAB 3: PRODUCTS SUMMARY & MOVEMENT -->
      <div v-if="activeTab === 'products'" class="glass-card p-0 overflow-hidden">
        <div class="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
          <h3 class="font-bold text-lg text-primary">تقرير حركة الأصناف والمنتجات بالكامل</h3>
          <p class="text-xs text-secondary">حساب الكميات المباعة، المسلمة، والمخزون الحالي لكل صنف</p>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم المنتج</th>
                <th>سعر الكجم (SAR)</th>
                <th>المخزون الحالي (كجم)</th>
                <th>إجمالي المطلوب (كجم)</th>
                <th>إجمالي المشحون (كجم)</th>
                <th>عدد الطلبات</th>
                <th>إجمالي الإيرادات (SAR)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in productsSummaryReport" :key="p.id">
                <td class="font-bold text-muted">{{ p.id }}</td>
                <td class="font-bold text-brand">{{ p.name }}</td>
                <td class="font-bold text-secondary" dir="ltr">{{ p.current_price_per_ton }}</td>
                <td class="font-bold" :class="p.stock_quantity <= 0 ? 'text-danger' : 'text-primary'" dir="ltr">
                  {{ formatKgWithUnit(p.stock_quantity) }}
                </td>
                <td class="font-bold text-indigo-400" dir="ltr">{{ formatKgWithUnit(p.totalOrderedTons) }}</td>
                <td class="font-bold text-emerald-400" dir="ltr">{{ formatKgWithUnit(p.totalDeliveredTons) }}</td>
                <td class="font-bold text-secondary">{{ p.ordersCount }}</td>
                <td class="font-bold text-success" dir="ltr">{{ p.totalRevenue.toLocaleString() }} SAR</td>
              </tr>
              <tr v-if="productsSummaryReport.length === 0">
                <td colspan="8" class="text-center py-8 text-secondary">
                  لا توجد منتجات مسجلة في الكتالوج.
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
import { 
  FileSpreadsheet, Package, Scale, Truck, DollarSign, 
  AlertTriangle, Users, Layers, RefreshCw 
} from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { formatKgWithUnit, formatPricePerKg } from '../../utils/weightFormatter'

const loading = ref(true)
const exportingExcel = ref(false)
const activeTab = ref('reconciliation')

const summary = ref({})
const shippingReconciliation = ref([])
const salesRepsReport = ref([])
const productsSummaryReport = ref([])
const salesRepsList = ref([])

// Filters
const filters = ref({
  date_from: '',
  date_to: '',
  sales_rep_id: ''
})

// Inline Shipped Tons Editing State
const editingOrderId = ref(null)
const editingShippedValue = ref(0)
const savingTons = ref(false)

const fetchReport = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.value.date_from) params.append('date_from', filters.value.date_from)
    if (filters.value.date_to) params.append('date_to', filters.value.date_to)
    if (filters.value.sales_rep_id) params.append('sales_rep_id', filters.value.sales_rep_id)

    const res = await omsApi.get(`/api/reports/comprehensive?${params.toString()}`)
    summary.value = res.data.summary || {}
    shippingReconciliation.value = res.data.shippingReconciliation || []
    salesRepsReport.value = res.data.salesRepsReport || []
    productsSummaryReport.value = res.data.productsSummaryReport || []
    
    // Extract unique sales rep list for filter dropdown if empty
    if (salesRepsList.value.length === 0 && salesRepsReport.value.length > 0) {
      salesRepsList.value = salesRepsReport.value.map(r => ({ id: r.id, name: r.name }))
    }
  } catch (error) {
    console.error('Error fetching comprehensive report:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    date_from: '',
    date_to: '',
    sales_rep_id: ''
  }
  fetchReport()
}

const startEditing = (item) => {
  editingOrderId.value = item.id
  editingShippedValue.value = item.shipped_tons
}

const cancelEditing = () => {
  editingOrderId.value = null
  editingShippedValue.value = 0
}

const saveShippedTons = async (orderId) => {
  savingTons.value = true
  try {
    await omsApi.put(`/api/reports/shipped-tons/${orderId}`, {
      shipped_tons: editingShippedValue.value
    })
    cancelEditing()
    fetchReport()
  } catch (error) {
    alert(error.response?.data?.error || 'حدث خطأ أثناء التحديث.')
  } finally {
    savingTons.value = false
  }
}

import { useToastStore } from '../../store/toast'

const toast = useToastStore()

const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const response = await omsApi.get('/api/reports/excel', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `KMT_Comprehensive_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('تم تصدير ملف الإكسل بنجاح!')
  } catch (error) {
    console.error('Export error:', error)
    toast.danger('حدث خطأ أثناء تصدير ملف الإكسل.')
  } finally {
    exportingExcel.value = false
  }
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
.loader.small { width: 16px; height: 16px; border-width: 2px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
