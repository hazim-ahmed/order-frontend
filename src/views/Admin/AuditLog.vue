<!-- ==============================================================================
تاريخ التعديل: 2026-07-22
الوظيفة: واجهة سجلات النظام وسجل تدقيق العمليات (System Logs & Audit Trail Monitor)
السياق: دمج واجهة مراقبة صحة النظام وحركات الطلبات ضمن تبويبات موحدة في لوحة تحكم الأدمن
مرجع الأمان وتجربة المستخدم: Live System Operations, Health & Audit Monitoring Dashboard
============================================================================== -->
<template>
  <div class="admin-audit-log animate-slide-up">
    <!-- Header -->
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <Activity class="text-brand" :size="26" />
          سجلات النظام وتدقيق العمليات
        </h2>
        <p class="text-secondary text-sm mt-1">مراقبة صحة السيرفر بالخلفية وسجل حركات وطلبات النظام</p>
      </div>

      <!-- Health Status Badge -->
      <div v-if="activeTab === 'systemLogs'" class="flex items-center gap-2">
        <span 
          :class="[
            'px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 border',
            stats.healthStatus === 'HEALTHY' ? 'bg-green-500/10 text-success border-green-500/30' :
            stats.healthStatus === 'DEGRADED' ? 'bg-yellow-500/10 text-warning border-yellow-500/30' :
            'bg-red-500/10 text-danger border-red-500/30'
          ]"
        >
          <span class="w-2 h-2 rounded-full animate-ping" :class="stats.healthStatus === 'HEALTHY' ? 'bg-success' : 'bg-danger'"></span>
          {{ stats.healthStatus === 'HEALTHY' ? 'السيرفر مستقر (Healthy)' : stats.healthStatus === 'DEGRADED' ? 'أداء متوسط (Degraded)' : 'تنبيه حرِج (Critical)' }}
        </span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-[var(--border-color)] gap-3 mb-6">
      <button 
        @click="activeTab = 'systemLogs'" 
        class="py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'systemLogs' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-secondary hover:text-primary'"
      >
        <Terminal :size="18" />
        🖥️ سجلات النظام والمراقبة الحية (System & Error Logs)
      </button>

      <button 
        @click="activeTab = 'orderAudit'" 
        class="py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'orderAudit' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-secondary hover:text-primary'"
      >
        <FileText :size="18" />
        📜 سجل تدقيق حركة الطلبات (Orders Audit Trail)
      </button>
    </div>

    <!-- ==============================================================================
         TAB 1: سجلات النظام والمراقبة الحية (System & Error Logs)
         ============================================================================== -->
    <div v-if="activeTab === 'systemLogs'">
      <!-- Toolbar controls for system logs -->
      <div class="flex justify-between items-center flex-wrap gap-4 mb-4">
        <div class="flex items-center gap-2 flex-1 max-w-lg">
          <input 
            type="text" 
            v-model="filters.search" 
            @input="fetchSystemLogs"
            class="form-input w-full text-sm" 
            placeholder="بحث في الرسائل، أسماء المستخدمين، المسارات..."
          >
          <select v-model="filters.level" @change="fetchSystemLogs" class="form-input text-sm w-40">
            <option value="ALL">كل المستويات</option>
            <option value="ERROR">🔴 أخطاء (ERROR)</option>
            <option value="WARN">🟡 تحذيرات (WARN)</option>
            <option value="INFO">🔵 معلومات (INFO)</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="toggleAutoRefresh" 
            :class="['btn text-xs py-2 flex items-center gap-1.5 border', autoRefresh ? 'btn-primary' : 'btn-ghost border-[var(--border-color)]']"
          >
            <RefreshCw :size="14" :class="{ 'animate-spin': loadingSystemLogs || autoRefresh }" />
            <span>{{ autoRefresh ? 'التحديث اللحظي (مفعل)' : 'تفعيل التحديث اللحظي' }}</span>
          </button>
          <button @click="clearLogsConfirm" class="btn btn-outline border-red-500/30 text-danger hover:bg-red-500/10 text-xs py-2 flex items-center gap-1">
            <Trash2 :size="14" />
            تفريغ
          </button>
        </div>
      </div>

      <!-- Health Metrics Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="glass-card p-4 border-r-4 border-blue-500">
          <span class="text-xs text-secondary font-bold block mb-1">استهلاك الذاكرة (Memory)</span>
          <div class="text-lg font-black text-blue-400" dir="ltr">
            {{ stats.memoryUsageMB?.heapUsed || 0 }} MB / {{ stats.memoryUsageMB?.heapTotal || 0 }} MB
          </div>
        </div>

        <div class="glass-card p-4 border-r-4 border-emerald-500">
          <span class="text-xs text-secondary font-bold block mb-1">مدة تشغيل الخادم (Uptime)</span>
          <div class="text-lg font-black text-emerald-400">
            {{ formatUptime(stats.uptimeSeconds) }}
          </div>
        </div>

        <div class="glass-card p-4 border-r-4 border-red-500">
          <span class="text-xs text-secondary font-bold block mb-1">الأخطاء الحالية (Errors)</span>
          <div class="text-lg font-black text-red-400">
            {{ stats.logCounts?.errors || 0 }}
          </div>
        </div>

        <div class="glass-card p-4 border-r-4 border-amber-500">
          <span class="text-xs text-secondary font-bold block mb-1">إجمالي السجلات المسجلة</span>
          <div class="text-lg font-black text-amber-400">
            {{ stats.logCounts?.total || 0 }}
          </div>
        </div>
      </div>

      <!-- System Logs Terminal Table -->
      <div class="glass-card p-0 overflow-hidden border border-[var(--border-color)]">
        <div class="table-wrapper max-h-[500px] overflow-y-auto font-mono text-xs">
          <table class="w-full text-start">
            <thead class="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] z-10">
              <tr class="text-secondary text-[11px]">
                <th class="p-3 text-start">الوقت</th>
                <th class="p-3 text-start">المستوى</th>
                <th class="p-3 text-start">التصنيف</th>
                <th class="p-3 text-start">رسالة الحدث</th>
                <th class="p-3 text-start">المستخدم</th>
                <th class="p-3 text-center">الاستجابة</th>
                <th class="p-3 text-center font-sans">عرض</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="log in systemLogs" 
                :key="log.id"
                :class="[
                  'border-b border-[var(--border-color)]/40 hover:bg-blue-500/5 transition-colors',
                  log.level === 'ERROR' ? 'bg-red-500/5' : log.level === 'WARN' ? 'bg-yellow-500/5' : ''
                ]"
              >
                <td data-label="الوقت" class="p-3 whitespace-nowrap text-secondary text-[11px]" dir="ltr">
                  {{ formatTimestamp(log.timestamp) }}
                </td>
                <td data-label="المستوى" class="p-3 whitespace-nowrap">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      log.level === 'ERROR' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      log.level === 'WARN' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    ]"
                  >
                    {{ log.level }}
                  </span>
                </td>
                <td data-label="التصنيف" class="p-3 whitespace-nowrap text-brand font-bold">{{ log.category }}</td>
                <td data-label="الرسالة" class="p-3 font-mono text-primary max-w-md truncate" :title="log.message">{{ log.message }}</td>
                <td data-label="المستخدم" class="p-3 whitespace-nowrap text-secondary">
                  <span v-if="log.user" class="text-xs">{{ log.user.username }}</span>
                  <span v-else class="text-muted text-[10px]">-</span>
                </td>
                <td data-label="الاستجابة" class="p-3 whitespace-nowrap text-center">
                  <span v-if="log.statusCode" :class="getStatusBadgeClass(log.statusCode)" class="px-2 py-0.5 rounded text-[10px] font-bold">
                    {{ log.statusCode }}
                  </span>
                  <span v-if="log.durationMs" class="text-[10px] text-muted mr-1">{{ log.durationMs }}ms</span>
                </td>
                <td data-label="عرض" class="p-3 whitespace-nowrap text-center font-sans">
                  <button @click="selectedLog = log" class="btn-ghost text-info p-1 rounded" title="عرض التفاصيل">
                    <Eye :size="16" />
                  </button>
                </td>
              </tr>
              <tr v-if="systemLogs.length === 0">
                <td colspan="7" class="p-8 text-center text-secondary font-sans">لا توجد سجلات نظام مطابقة.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==============================================================================
         TAB 2: سجل تدقيق حركة الطلبات (Orders Audit Trail)
         ============================================================================== -->
    <div v-if="activeTab === 'orderAudit'">
      <div v-if="loadingOrderLogs" class="flex justify-center mt-12">
        <div class="loader"></div>
      </div>

      <div v-else class="glass-card overflow-x-auto">
        <table class="w-full text-start">
          <thead>
            <tr class="text-secondary border-b border-[var(--border-color)]">
              <th class="p-3 text-start">التاريخ والوقت</th>
              <th class="p-3 text-start">رقم الطلب</th>
              <th class="p-3 text-start">المستخدم المعني</th>
              <th class="p-3 text-start">من حالة</th>
              <th class="p-3 text-start">إلى حالة</th>
              <th class="p-3 text-start">ملاحظات النظام</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in orderLogs" :key="log.id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
              <td data-label="التاريخ" class="p-3" dir="ltr">{{ new Date(log.created_at || log.createdAt).toLocaleString('ar-SA') }}</td>
              <td data-label="رقم الطلب" class="p-3 font-bold text-brand">
                <router-link :to="{ name: 'SharedOrderDetail', params: { id: log.order_id || log.order?.id } }">
                  {{ log.order?.order_number || `طلب #${log.order_id}` }}
                </router-link>
              </td>
              <td data-label="المستخدم" class="p-3">{{ log.user?.username || log.user?.name || `مستخدم #${log.changed_by || log.user_id || '-'}` }}</td>
              <td data-label="من حالة" class="p-3 text-secondary text-sm">{{ $t(`order.status.${log.from_status}`) || log.from_status }}</td>
              <td data-label="إلى حالة" class="p-3 font-bold text-sm">{{ $t(`order.status.${log.to_status}`) || log.to_status }}</td>
              <td data-label="ملاحظات" class="p-3 text-sm text-secondary">{{ formatPayload(log.payload) }}</td>
            </tr>
            <tr v-if="orderLogs.length === 0">
              <td colspan="6" class="p-8 text-center text-secondary">لا توجد سجلات تدقيق طلبات مسجلة حتى الآن.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Details Modal for System Logs -->
    <div v-if="selectedLog" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
      <div class="glass-card w-full max-w-2xl bg-[var(--bg-primary)] p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--border-color)]">
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border-color)]">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <Terminal :size="20" class="text-brand" />
            تفاصيل السجل الرقمي (#{{ selectedLog.id }})
          </h3>
          <button @click="selectedLog = null" class="btn-ghost text-secondary hover:text-primary">✕</button>
        </div>

        <div class="space-y-4 font-mono text-xs">
          <div class="grid grid-cols-2 gap-4 bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] font-sans">
            <div>
              <span class="text-secondary text-xs block">التوقيت:</span>
              <strong class="text-primary" dir="ltr">{{ new Date(selectedLog.timestamp).toLocaleString('ar-SA') }}</strong>
            </div>
            <div>
              <span class="text-secondary text-xs block">المستوى / التصنيف:</span>
              <strong class="text-brand">{{ selectedLog.level }} / {{ selectedLog.category }}</strong>
            </div>
          </div>

          <div>
            <label class="font-sans text-xs font-bold text-secondary mb-1 block">الرسالة الكاملة:</label>
            <div class="p-3 bg-black/50 rounded-lg text-emerald-400 border border-emerald-500/20 whitespace-pre-wrap">
              {{ selectedLog.message }}
            </div>
          </div>

          <div v-if="selectedLog.details">
            <label class="font-sans text-xs font-bold text-secondary mb-1 block">تفاصيل وتتبع الحدث (Details / Metadata):</label>
            <pre class="p-3 bg-black/80 rounded-lg text-blue-300 border border-blue-500/20 overflow-x-auto text-[11px] leading-relaxed">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
          </div>

          <div v-if="selectedLog.user" class="font-sans bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
            <span class="text-xs font-bold text-brand block mb-1">المستخدم المنسوب إليه الطلب:</span>
            <span class="text-xs text-primary font-bold">{{ selectedLog.user.username }}</span> 
            <span class="text-xs text-secondary">({{ selectedLog.user.role }}) - ID: {{ selectedLog.user.id }}</span>
          </div>
        </div>

        <div class="flex justify-end mt-6 pt-3 border-t border-[var(--border-color)]">
          <button @click="selectedLog = null" class="btn btn-ghost px-6">إغلاق</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: المنطق التفاعلي لشاشة سجلات النظام وحركات التدقيق المدمجة
// السياق: دمج واجهتي المراقبة والتدقيق لضمان الوصول السريع وسهولة الاستخدام
// ==============================================================================
import { ref, onMounted, onUnmounted } from 'vue'
import { Activity, Terminal, FileText, RefreshCw, Trash2, Eye } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { useToastStore } from '../../store/toast'

const toast = useToastStore()
const activeTab = ref('systemLogs')

// System Logs State
const loadingSystemLogs = ref(false)
const autoRefresh = ref(true)
let refreshTimer = null
const systemLogs = ref([])
const stats = ref({})
const selectedLog = ref(null)

const filters = ref({
  search: '',
  level: 'ALL'
})

// Order Audit Logs State
const loadingOrderLogs = ref(false)
const orderLogs = ref([])

// 1. جلب سجلات النظام المباشرة
const fetchSystemLogs = async () => {
  loadingSystemLogs.value = true
  try {
    const params = {}
    if (filters.value.level !== 'ALL') params.level = filters.value.level
    if (filters.value.search.trim()) params.search = filters.value.search.trim()

    const res = await omsApi.get('/api/reports/system-logs', { params })
    systemLogs.value = res.data.logs || []
    stats.value = res.data.stats || {}
  } catch (error) {
    console.error('Error fetching system logs:', error)
  } finally {
    loadingSystemLogs.value = false
  }
}

// 2. جلب سجلات تدقيق الطلبات
const fetchOrderAuditLogs = async () => {
  loadingOrderLogs.value = true
  try {
    const response = await omsApi.get('/api/orders')
    const orders = Array.isArray(response.data) ? response.data : (response.data.orders || [])
    
    let extractedLogs = []
    orders.forEach(o => {
      const logsList = o.statusLogs || o.logs || []
      if (Array.isArray(logsList)) {
        logsList.forEach(l => {
          extractedLogs.push({
            id: l.id || `audit_${Math.random()}`,
            created_at: l.created_at || l.createdAt,
            order_id: o.id,
            order: o,
            user: l.changedBy || l.user,
            changed_by: l.changed_by,
            from_status: l.from_status,
            to_status: l.to_status,
            payload: l.payload
          })
        })
      }
    })
    
    extractedLogs.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
    orderLogs.value = extractedLogs
  } catch (error) {
    console.error('Error fetching order audit logs:', error)
  } finally {
    loadingOrderLogs.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
    toast.info('تم تفعيل التحديث اللحظي التلقائي')
  } else {
    stopAutoRefresh()
    toast.info('تم إيقاف التحديث اللحظي')
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    if (activeTab.value === 'systemLogs') {
      fetchSystemLogs()
    }
  }, 4000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const clearLogsConfirm = async () => {
  try {
    await omsApi.delete('/api/reports/system-logs')
    toast.success('تم تفريغ سجلات الذاكرة بنجاح')
    await fetchSystemLogs()
  } catch (error) {
    toast.danger('فشل في تفريغ سجلات النظام')
  }
}

const formatTimestamp = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

const formatUptime = (seconds) => {
  if (!seconds) return '0 دقيقة'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) return `${hrs} ساعة و ${mins} دقيقة`
  return `${mins} دقيقة`
}

const getStatusBadgeClass = (status) => {
  if (status >= 500) return 'bg-red-500/20 text-red-400 border border-red-500/30'
  if (status >= 400) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  return 'bg-green-500/20 text-green-400 border border-green-500/30'
}

const formatPayload = (payload) => {
  if (!payload) return '-'
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
    if (Object.keys(parsed).length === 0) return '-'
    const strings = []
    if (parsed.rejection_reason) strings.push(`سبب الرفض: ${parsed.rejection_reason}`)
    if (parsed.cancellation_reason) strings.push(`سبب الإلغاء: ${parsed.cancellation_reason}`)
    if (parsed.note) strings.push(`ملاحظة: ${parsed.note}`)
    if (strings.length > 0) return strings.join(' | ')
    return JSON.stringify(parsed)
  } catch (e) {
    return String(payload)
  }
}

onMounted(() => {
  fetchSystemLogs()
  fetchOrderAuditLogs()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
