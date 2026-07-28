<!-- ==============================================================================
تاريخ التعديل والإنشاء: 2026-07-22
الوظيفة: واجهة مراقبة صحة النظام والسجلات الحية والعمليات (System Health & Live Logs Monitor)
السياق: تمكين الأدمن من رؤية أداء السيرفر بالخلفية، استهلاك الذاكرة، الأخطاء اللحظية، والطلبات
مرجع الأمان والتشغيل: Live System Operations & Diagnostics Dashboard
============================================================================== -->
<template>
  <div class="system-logs-monitor animate-slide-up">
    <!-- Header -->
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-black flex items-center gap-2">
            <Activity :size="26" class="text-brand animate-pulse" />
            مراقبة صحة النظام والسجلات الحية
          </h2>
          <!-- Health Badge -->
          <span 
            :class="[
              'px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 border',
              stats.healthStatus === 'HEALTHY' ? 'bg-green-500/10 text-success border-green-500/30' :
              stats.healthStatus === 'DEGRADED' ? 'bg-yellow-500/10 text-warning border-yellow-500/30' :
              'bg-red-500/10 text-danger border-red-500/30'
            ]"
          >
            <span class="w-2 h-2 rounded-full animate-ping" :class="stats.healthStatus === 'HEALTHY' ? 'bg-success' : 'bg-danger'"></span>
            {{ stats.healthStatus === 'HEALTHY' ? 'السيرفر يعمل بكفاءة (Healthy)' : stats.healthStatus === 'DEGRADED' ? 'أداء متوسط (Degraded)' : 'تنبيه حرِج (Critical)' }}
          </span>
        </div>
        <p class="text-secondary text-sm mt-1">تتبع أداء الخادم بالخلفية والطلبات ومراقبة الأخطاء لحظياً</p>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <!-- Auto Refresh Toggle -->
        <button 
          @click="toggleAutoRefresh" 
          :class="['btn text-xs px-3 py-2 flex items-center gap-2 border', autoRefresh ? 'btn-primary' : 'btn-ghost border-[var(--border-color)]']"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': loading || autoRefresh }" />
          <span>{{ autoRefresh ? 'التحديث اللحظي (مفعل)' : 'التحديث اللحظي (معطل)' }}</span>
        </button>

        <!-- Manual Fetch -->
        <button @click="fetchLogs" class="btn btn-outline border-[var(--border-color)] text-xs py-2">
          تحديث الآن
        </button>

        <!-- Clear Logs -->
        <button @click="clearLogsConfirm" class="btn btn-outline border-red-500/30 text-danger hover:bg-red-500/10 text-xs py-2 flex items-center gap-1.5">
          <Trash2 :size="14" />
          تفريغ السجلات
        </button>
      </div>
    </div>

    <!-- Health Metrics Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- Memory Card -->
      <div class="glass-card p-4 border-r-4 border-blue-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-secondary font-bold">استهلاك الذاكرة (Memory)</span>
          <Cpu :size="20" class="text-blue-400" />
        </div>
        <div class="text-xl font-black text-blue-400" dir="ltr">
          {{ stats.memoryUsageMB?.heapUsed || 0 }} MB <span class="text-xs text-secondary">/ {{ stats.memoryUsageMB?.heapTotal || 0 }} MB</span>
        </div>
        <div class="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            class="bg-blue-500 h-full transition-all duration-500" 
            :style="{ width: `${Math.min(100, ((stats.memoryUsageMB?.heapUsed || 0) / (stats.memoryUsageMB?.heapTotal || 1)) * 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- Uptime Card -->
      <div class="glass-card p-4 border-r-4 border-emerald-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-secondary font-bold">مدة تشغيل الخادم (Uptime)</span>
          <Clock :size="20" class="text-emerald-400" />
        </div>
        <div class="text-xl font-black text-emerald-400">
          {{ formatUptime(stats.uptimeSeconds) }}
        </div>
        <p class="text-[11px] text-secondary mt-2" dir="ltr">Node {{ stats.nodeVersion }} ({{ stats.platform }})</p>
      </div>

      <!-- Error Count Card -->
      <div class="glass-card p-4 border-r-4 border-red-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-secondary font-bold">الأخطاء المسجلة (Errors)</span>
          <AlertCircle :size="20" class="text-red-400" />
        </div>
        <div class="text-xl font-black text-red-400">
          {{ stats.logCounts?.errors || 0 }}
        </div>
        <p class="text-[11px] text-secondary mt-2">من إجمالي {{ stats.logCounts?.total || 0 }} سجل بالذاكرة</p>
      </div>

      <!-- Warning/Info Stats -->
      <div class="glass-card p-4 border-r-4 border-amber-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-secondary font-bold">التنبيهات والمعلومات</span>
          <Terminal :size="20" class="text-amber-400" />
        </div>
        <div class="flex items-center gap-4 mt-1">
          <div>
            <span class="text-xs text-secondary">تحذيرات: </span>
            <span class="font-bold text-amber-400">{{ stats.logCounts?.warnings || 0 }}</span>
          </div>
          <div>
            <span class="text-xs text-secondary">معلومات: </span>
            <span class="font-bold text-blue-400">{{ stats.logCounts?.info || 0 }}</span>
          </div>
        </div>
        <p class="text-[11px] text-secondary mt-2">مراقبة الاتصالات والطلبات</p>
      </div>
    </div>

    <!-- Filters Toolbar -->
    <div class="glass-card mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="form-group mb-0 md:col-span-2">
        <label class="text-xs text-secondary font-bold mb-1 block">بحث في السجلات</label>
        <input 
          type="text" 
          v-model="filters.search" 
          @input="fetchLogs"
          class="form-input w-full text-sm" 
          placeholder="ابحث بالنص، الرابط، اسم المستخدم..."
        >
      </div>

      <div class="form-group mb-0">
        <label class="text-xs text-secondary font-bold mb-1 block">مستوى التنبيه (Severity)</label>
        <select v-model="filters.level" @change="fetchLogs" class="form-input w-full text-sm">
          <option value="ALL">كل المستويات</option>
          <option value="ERROR">🔴 خطأ حرج (ERROR)</option>
          <option value="WARN">🟡 تحذير (WARN)</option>
          <option value="INFO">🔵 معلومات (INFO)</option>
        </select>
      </div>

      <div class="form-group mb-0">
        <label class="text-xs text-secondary font-bold mb-1 block">تصنيف الحدث (Category)</label>
        <select v-model="filters.category" @change="fetchLogs" class="form-input w-full text-sm">
          <option value="ALL">كل التصنيفات</option>
          <option value="HTTP">HTTP Requests</option>
          <option value="AUTH">Authentication</option>
          <option value="SYSTEM">System Engine</option>
        </select>
      </div>
    </div>

    <!-- Terminal Log Console Table -->
    <div class="glass-card p-0 overflow-hidden shadow-2xl border border-[var(--border-color)]">
      <div class="bg-[var(--bg-secondary)] p-3 border-b border-[var(--border-color)] flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span class="text-xs font-mono text-secondary mr-2">live-system-terminal.log</span>
        </div>
        <span class="text-xs text-secondary font-bold">عرض {{ logs.length }} سجل</span>
      </div>

      <div class="table-wrapper max-h-[550px] overflow-y-auto font-mono text-xs">
        <table class="w-full text-start border-collapse">
          <thead class="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] z-10">
            <tr class="text-secondary text-[11px]">
              <th class="p-3 text-start">الوقت</th>
              <th class="p-3 text-start">المستوى</th>
              <th class="p-3 text-start">التصنيف</th>
              <th class="p-3 text-start">تفاصيل الحدث / الرسالة</th>
              <th class="p-3 text-start">المستخدم</th>
              <th class="p-3 text-center">الاستجابة</th>
              <th class="p-3 text-center font-sans">تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="log in logs" 
              :key="log.id"
              :class="[
                'border-b border-[var(--border-color)]/40 hover:bg-blue-500/5 transition-colors',
                log.level === 'ERROR' ? 'bg-red-500/5' : log.level === 'WARN' ? 'bg-yellow-500/5' : ''
              ]"
            >
              <!-- Timestamp -->
              <td class="p-3 whitespace-nowrap text-secondary text-[11px]" dir="ltr">
                {{ formatTimestamp(log.timestamp) }}
              </td>

              <!-- Level -->
              <td class="p-3 whitespace-nowrap">
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

              <!-- Category -->
              <td class="p-3 whitespace-nowrap text-brand font-bold">
                {{ log.category }}
              </td>

              <!-- Message -->
              <td class="p-3 font-mono text-primary max-w-md truncate" :title="log.message">
                {{ log.message }}
              </td>

              <!-- User -->
              <td class="p-3 whitespace-nowrap text-secondary">
                <span v-if="log.user" class="text-xs">
                  {{ log.user.username }} <span class="text-[10px] text-muted">({{ log.user.role }})</span>
                </span>
                <span v-else class="text-muted text-[10px]">-</span>
              </td>

              <!-- Status & Response Time -->
              <td class="p-3 whitespace-nowrap text-center">
                <span v-if="log.statusCode" :class="getStatusBadgeClass(log.statusCode)" class="px-2 py-0.5 rounded text-[10px] font-bold">
                  {{ log.statusCode }}
                </span>
                <span v-if="log.durationMs" class="text-[10px] text-muted mr-1">
                  {{ log.durationMs }}ms
                </span>
              </td>

              <!-- Details button -->
              <td class="p-3 whitespace-nowrap text-center font-sans">
                <button 
                  @click="openDetailsModal(log)" 
                  class="btn-ghost text-info hover:bg-blue-500/10 p-1.5 rounded"
                  title="عرض التفاصيل الكترونية"
                >
                  <Eye :size="15" />
                </button>
              </td>
            </tr>

            <tr v-if="logs.length === 0">
              <td colspan="7" class="p-12 text-center text-secondary font-sans">
                لا توجد سجلات طابقة للبحث الحالي.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Log Details Modal -->
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
            <label class="font-sans text-xs font-bold text-secondary mb-1 block">تفاصيل وتتبع الخطأ (Details / Metadata):</label>
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
// الوظيفة: شاشة إدارة ومراقبة سجلات النظام ومؤشرات صحة الخادم اللحظية
// السياق: تم استكمال متطلبات المراقبة الشاملة للنظام وتوفير التحديث التلقائي والفلترة
// ==============================================================================
import { ref, onMounted, onUnmounted } from 'vue'
import { Activity, Cpu, Clock, AlertCircle, Terminal, RefreshCw, Trash2, Eye } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { useToastStore } from '../../store/toast'

const toast = useToastStore()
const loading = ref(false)
const autoRefresh = ref(true)
let refreshTimer = null

const logs = ref([])
const stats = ref({})
const selectedLog = ref(null)

const filters = ref({
  search: '',
  level: 'ALL',
  category: 'ALL'
})

// جلب السجلات والإحصائيات من الخادم
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.level !== 'ALL') params.level = filters.value.level
    if (filters.value.category !== 'ALL') params.category = filters.value.category
    if (filters.value.search.trim()) params.search = filters.value.search.trim()

    const res = await omsApi.get('/api/reports/system-logs', { params })
    logs.value = res.data.logs || []
    stats.value = res.data.stats || {}
  } catch (error) {
    console.error('Error fetching system logs:', error)
  } finally {
    loading.value = false
  }
}

// التبديل بين التحديث اللحظي والتوقف
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
    fetchLogs()
  }, 4000) // كل 4 ثواني
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// تفريغ سجلات الذاكرة
const clearLogsConfirm = async () => {
  try {
    await omsApi.delete('/api/reports/system-logs')
    toast.success('تم تفريغ سجلات الذاكرة بنجاح')
    await fetchLogs()
  } catch (error) {
    toast.danger('فشل في تفريغ سجلات النظام')
  }
}

const openDetailsModal = (log) => {
  selectedLog.value = log
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

onMounted(() => {
  fetchLogs()
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
