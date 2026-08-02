<template>
  <div class="admin-backups animate-slide-up space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-primary mb-1">النسخ الاحتياطي</h1>
        <p class="text-secondary text-sm">حماية قاعدة البيانات والمرفقات من الفقدان أثناء التشغيل والاختبار.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <button class="btn btn-outline bg-surface w-full sm:w-auto" :disabled="downloading || !backups.length" @click="downloadLatestBackup">
          <Download :size="18" />
          {{ downloading ? 'جاري التنزيل...' : 'تنزيل آخر نسخة' }}
        </button>
        <button class="btn btn-primary w-full sm:w-auto shadow-lg shadow-brand-500/30" :disabled="creating" @click="createBackup">
          <RefreshCw :size="18" :class="{ 'animate-spin': creating }" />
          {{ creating ? 'جاري إنشاء النسخة...' : 'إنشاء نسخة احتياطية' }}
        </button>
      </div>
    </div>

    <div v-if="statusMessage" class="backup-alert" :class="statusTone">
      <CheckCircle v-if="statusTone === 'success'" :size="18" />
      <AlertTriangle v-else :size="18" />
      <span>{{ statusMessage }}</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="metric-panel">
        <Archive :size="22" class="text-brand" />
        <div>
          <p class="metric-label">عدد النسخ</p>
          <p class="metric-value">{{ backups.length }}</p>
        </div>
      </div>
      <div class="metric-panel">
        <HardDrive :size="22" class="text-info" />
        <div>
          <p class="metric-label">آخر حجم</p>
          <p class="metric-value" dir="ltr">{{ latestBackup ? formatBytes(latestBackup.sizeBytes) : '-' }}</p>
        </div>
      </div>
      <div class="metric-panel">
        <Clock :size="22" class="text-warning" />
        <div>
          <p class="metric-label">آخر نسخة</p>
          <p class="metric-value small">{{ latestBackup ? formatDate(latestBackup.createdAt) : 'لا توجد نسخة' }}</p>
        </div>
      </div>
    </div>

    <div class="glass-card p-5 border border-[var(--border-color)]">
      <div class="flex items-start gap-3">
        <ShieldCheck :size="20" class="text-success shrink-0 mt-1" />
        <div>
          <h3 class="text-base font-bold text-primary mb-1">خطة النسخ الحالية</h3>
          <p class="text-sm text-secondary leading-relaxed">
            يتم ضغط قاعدة البيانات والمرفقات في ملف واحد. إذا فشل dump قاعدة البيانات، يتم إنشاء نسخة JSON بديلة منظمة حسب الجداول والسجلات داخل الأرشيف.
          </p>
        </div>
      </div>
    </div>

    <div class="glass-card p-0 overflow-hidden">
      <div class="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
        <div>
          <h3 class="text-lg font-bold text-primary flex items-center gap-2">
            <Database :size="20" class="text-brand" /> سجل النسخ
          </h3>
          <p class="text-xs text-secondary mt-1">النسخ المحفوظة حاليا على الخادم.</p>
        </div>
        <button class="btn btn-outline bg-surface" :disabled="loading" @click="fetchBackups">
          <RefreshCw :size="16" :class="{ 'animate-spin': loading }" /> تحديث
        </button>
      </div>

      <div v-if="loading" class="p-8 text-center text-secondary text-sm">
        جاري تحميل النسخ...
      </div>

      <div v-else-if="backups.length === 0" class="empty-state">
        <Archive :size="36" class="text-muted mb-3" />
        <p class="font-bold text-primary">لا توجد نسخ احتياطية بعد</p>
        <p class="text-sm text-secondary mt-1">أنشئ أول نسخة من زر إنشاء نسخة احتياطية.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-start">
          <thead>
            <tr class="text-secondary text-xs border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <th class="p-3 text-start">اسم الملف</th>
              <th class="p-3 text-start">الحجم</th>
              <th class="p-3 text-start">تاريخ الإنشاء</th>
              <th class="p-3 text-start">النوع</th>
              <th class="p-3 text-start">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="backup in backups" :key="backup.fileName" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
              <td class="p-3 font-semibold text-primary" dir="ltr">{{ backup.fileName }}</td>
              <td class="p-3 text-secondary" dir="ltr">{{ formatBytes(backup.sizeBytes) }}</td>
              <td class="p-3 text-secondary">{{ formatDate(backup.createdAt) }}</td>
              <td class="p-3">
                <span class="badge" :class="backup.fileName.endsWith('.enc') ? 'badge-warning' : 'badge-success'">
                  {{ backup.fileName.endsWith('.enc') ? 'مشفر' : 'مضغوط' }}
                </span>
              </td>
              <td class="p-3">
                <button class="btn btn-outline text-xs" :disabled="downloadTarget === backup.fileName" @click="downloadBackup(backup.fileName)">
                  <Download :size="15" />
                  {{ downloadTarget === backup.fileName ? 'جاري التنزيل...' : 'تنزيل' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  ShieldCheck
} from 'lucide-vue-next'
import omsApi from '../../services/omsApi'

const backups = ref([])
const loading = ref(false)
const creating = ref(false)
const downloading = ref(false)
const downloadTarget = ref('')
const statusMessage = ref('')
const statusTone = ref('success')

const latestBackup = computed(() => backups.value[0] || null)

const formatBytes = (bytes) => {
  const value = Number(bytes || 0)
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let size = value / 1024
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const readErrorMessage = async (error) => {
  const data = error.response?.data
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      const parsed = JSON.parse(text)
      return parsed.error || parsed.message || 'تعذر تنفيذ العملية.'
    } catch (parseError) {
      return 'تعذر تنفيذ العملية.'
    }
  }
  return data?.error || data?.message || error.message || 'تعذر تنفيذ العملية.'
}

const getFileNameFromHeaders = (headers, fallback) => {
  const disposition = headers?.['content-disposition'] || ''
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match) return decodeURIComponent(utf8Match[1])

  const simpleMatch = disposition.match(/filename="?([^";]+)"?/i)
  return simpleMatch ? simpleMatch[1] : fallback
}

const saveBlob = (response, fallbackName) => {
  const fileName = getFileNameFromHeaders(response.headers, fallbackName)
  const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/gzip' })
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}

const fetchBackups = async () => {
  loading.value = true
  try {
    const response = await omsApi.get('/api/backups')
    backups.value = Array.isArray(response.data?.backups) ? response.data.backups : []
  } catch (error) {
    statusTone.value = 'danger'
    statusMessage.value = await readErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const createBackup = async () => {
  const confirmed = window.confirm('سيتم إنشاء نسخة احتياطية كاملة الآن. قد تستغرق العملية بعض الوقت حسب حجم البيانات والمرفقات. هل تريد المتابعة؟')
  if (!confirmed) return

  creating.value = true
  statusMessage.value = ''
  try {
    const response = await omsApi.post('/api/backups/run')
    const backup = response.data?.backup
    statusTone.value = 'success'
    statusMessage.value = backup?.manifest?.database_format === 'sequelize-json-fallback'
      ? 'تم إنشاء النسخة، وتم استخدام JSON fallback لقاعدة البيانات.'
      : 'تم إنشاء النسخة الاحتياطية بنجاح.'
    await fetchBackups()
  } catch (error) {
    statusTone.value = 'danger'
    statusMessage.value = await readErrorMessage(error)
  } finally {
    creating.value = false
  }
}

const downloadBackup = async (fileName) => {
  downloadTarget.value = fileName
  statusMessage.value = ''
  try {
    const response = await omsApi.get(`/api/backups/download/${encodeURIComponent(fileName)}`, { responseType: 'blob' })
    saveBlob(response, fileName)
  } catch (error) {
    statusTone.value = 'danger'
    statusMessage.value = await readErrorMessage(error)
  } finally {
    downloadTarget.value = ''
  }
}

const downloadLatestBackup = async () => {
  downloading.value = true
  statusMessage.value = ''
  try {
    const response = await omsApi.get('/api/backups/download/latest', { responseType: 'blob' })
    saveBlob(response, latestBackup.value?.fileName || `KMT_Backup_${new Date().toISOString().slice(0, 10)}.tar.gz`)
  } catch (error) {
    statusTone.value = 'danger'
    statusMessage.value = await readErrorMessage(error)
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  fetchBackups()
})
</script>

<style scoped>
.bg-surface {
  background-color: var(--bg-surface);
}

.metric-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-height: 92px;
}

.metric-label {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  margin-bottom: 4px;
}

.metric-value {
  color: var(--text-primary);
  font-size: var(--text-xl);
  font-weight: 800;
  line-height: 1.25;
}

.metric-value.small {
  font-size: var(--text-base);
}

.backup-alert {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: 700;
}

.backup-alert.success {
  border-color: rgba(16, 185, 129, 0.35);
  background: rgba(16, 185, 129, 0.10);
  color: var(--success);
}

.backup-alert.danger {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.10);
  color: var(--danger);
}

.empty-state {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 220px;
}
</style>