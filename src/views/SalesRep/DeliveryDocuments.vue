<template>
  <div class="sales-rep-documents animate-slide-up">
    <div class="flex justify-between items-center mb-6 gap-3 flex-wrap">
      <div>
        <h2 class="text-2xl font-bold">سندات طلباتي</h2>
        <p class="text-secondary text-sm mt-1">متابعة سندات التسليم المرتبطة بطلباتك المستلمة.</p>
      </div>
      <button type="button" class="btn btn-ghost flex items-center gap-2" :disabled="loading" @click="fetchDocuments">
        <RefreshCw :size="18" :class="{ 'animate-spin': loading }" />
        تحديث
      </button>
    </div>

    <div v-if="unpostedCount > 0" class="notice-card mb-6">
      <AlertTriangle :size="20" class="text-warning flex-shrink-0" />
      <div>
        <p class="font-bold text-primary">تنبيه ترحيل السندات</p>
        <p class="text-sm text-secondary">
          لديك {{ unpostedCount }} سند لم تقم بترحيله إلى النظام الرئيسي.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="glass-card stat-tile">
        <span class="text-secondary text-sm">كل السندات</span>
        <strong>{{ documents.length }}</strong>
      </div>
      <div class="glass-card stat-tile">
        <span class="text-secondary text-sm">تم إدخالها للنظام الرئيسي</span>
        <strong class="text-success">{{ postedCount }}</strong>
      </div>
      <div class="glass-card stat-tile">
        <span class="text-secondary text-sm">لم يتم إدخالها</span>
        <strong class="text-warning">{{ unpostedCount }}</strong>
      </div>
    </div>

    <div class="glass-card mb-6 flex flex-wrap gap-4 items-center">
      <div class="inline-flex rounded-lg border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)]">
        <button
          v-for="option in postingFilters"
          :key="option.value"
          type="button"
          :class="['filter-tab', filters.postingStatus === option.value ? 'is-active' : '']"
          @click="filters.postingStatus = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="form-group mb-0 flex-1 min-w-[220px]">
        <input
          v-model.trim="filters.search"
          type="text"
          class="form-input"
          placeholder="بحث برقم السند أو الطلب أو العميل أو فاتورة النظام..."
        >
      </div>
    </div>

    <div v-if="loading" class="flex justify-center mt-8">
      <div class="loader"></div>
    </div>

    <div v-else-if="error" class="glass-card p-6 text-danger">
      {{ error }}
    </div>

    <div v-else class="glass-card overflow-x-auto">
      <table class="w-full text-start min-w-[1080px]">
        <thead>
          <tr class="text-secondary border-b border-[var(--border-color)]">
            <th class="p-3 text-start">رقم السند</th>
            <th class="p-3 text-start">رقم الطلب</th>
            <th class="p-3 text-start">العميل</th>
            <th class="p-3 text-start">تاريخ التسليم</th>
            <th class="p-3 text-start">حالة الترحيل</th>
            <th class="p-3 text-start">رقم فاتورة النظام الرئيسي</th>
            <th class="p-3 text-start">المرفق</th>
            <th class="p-3 text-start">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="document in filteredDocuments"
            :key="document.id"
            class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] align-middle"
          >
            <td class="p-3">
              <div class="font-bold font-mono" dir="ltr">{{ document.document_number }}</div>
              <div v-if="document.book_number" class="text-xs text-secondary mt-1">دفتر: {{ document.book_number }}</div>
            </td>
            <td class="p-3 font-bold">{{ document.order_number }}</td>
            <td class="p-3">{{ document.client_name }}</td>
            <td class="p-3 text-xs font-mono text-secondary" dir="ltr">{{ formatDateTime(document.delivered_at) }}</td>
            <td class="p-3">
              <span :class="['status-pill', document.document_posted_to_erp ? 'is-posted' : 'is-unposted']">
                {{ document.document_posted_to_erp ? 'مدخل للنظام الرئيسي' : 'لم يتم إدخاله' }}
              </span>
            </td>
            <td class="p-3">
              <input
                v-model.trim="document.erp_invoice_number"
                type="text"
                class="form-input min-w-[200px]"
                placeholder="مثال: INV-2026-001"
                :disabled="savingRows[document.id] || document.document_posted_to_erp"
              >
              <p v-if="rowErrors[document.id]" class="text-danger text-xs mt-1">{{ rowErrors[document.id] }}</p>
            </td>
            <td class="p-3">
              <button
                v-if="document.delivery_image_url"
                type="button"
                class="btn btn-outline text-sm px-3 py-1 flex items-center gap-2"
                :disabled="downloadingRows[document.id]"
                @click="downloadDocument(document)"
              >
                <Download :size="15" />
                {{ downloadingRows[document.id] ? 'جاري التنزيل...' : 'تنزيل المرفق' }}
              </button>
              <span v-else class="text-xs text-secondary">لا يوجد مرفق</span>
              <p v-if="downloadErrors[document.id]" class="text-danger text-xs mt-1">{{ downloadErrors[document.id] }}</p>
            </td>
            <td class="p-3">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-primary text-sm px-3 py-1 flex items-center gap-2"
                  :disabled="savingRows[document.id] || document.document_posted_to_erp"
                  @click="markAsPosted(document)"
                >
                  <CheckCircle2 :size="15" />
                  ترحيل
                </button>
                <button
                  type="button"
                  class="btn btn-ghost text-sm px-3 py-1"
                  :disabled="savingRows[document.id] || !document.document_posted_to_erp"
                  @click="markAsUnposted(document)"
                >
                  إلغاء الترحيل
                </button>
                <router-link :to="{ name: 'SharedOrderDetail', params: { id: document.order_id } }" class="btn btn-ghost text-brand text-sm px-3 py-1">
                  التفاصيل
                </router-link>
              </div>
            </td>
          </tr>
          <tr v-if="filteredDocuments.length === 0">
            <td colspan="8" class="p-8 text-center text-secondary">لا توجد سندات مطابقة للفلاتر الحالية.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, CheckCircle2, Download, RefreshCw } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { formatDateTime } from '../../utils/dateFormatter'

const loading = ref(true)
const error = ref('')
const orders = ref([])
const rowErrors = ref({})
const savingRows = ref({})
const downloadingRows = ref({})
const downloadErrors = ref({})
const filters = ref({
  postingStatus: 'all',
  search: ''
})

const postingFilters = [
  { value: 'all', label: 'كل السندات' },
  { value: 'posted', label: 'مدخلة للنظام الرئيسي' },
  { value: 'unposted', label: 'غير مدخلة' }
]

const fetchDocuments = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await omsApi.get('/api/orders', {
      params: {
        status: 'delivered',
        limit: 100
      }
    })
    orders.value = Array.isArray(response.data) ? response.data : (response.data.orders || [])
  } catch (err) {
    error.value = err.response?.data?.error || 'تعذر استرجاع سندات طلباتك.'
  } finally {
    loading.value = false
  }
}

const documents = computed(() => {
  return orders.value
    .filter(order => order.delivery_reference_number || order.documentUsage?.document_number)
    .map(order => ({
      id: order.id,
      order_id: order.id,
      order_number: order.order_number || '-',
      client_name: order.client?.name || '-',
      delivered_at: order.delivered_at || order.updatedAt,
      document_number: order.documentUsage?.document_number || order.delivery_reference_number || '-',
      book_number: order.documentUsage?.book?.book_number || '',
      delivery_image_url: order.delivery_image_url || '',
      created_at: order.created_at || order.createdAt,
      document_posted_to_erp: Boolean(order.document_posted_to_erp),
      erp_invoice_number: order.erp_invoice_number || ''
    }))
})

const postedCount = computed(() => documents.value.filter(document => document.document_posted_to_erp).length)
const unpostedCount = computed(() => documents.value.filter(document => !document.document_posted_to_erp).length)

const filteredDocuments = computed(() => {
  const search = filters.value.search.toLowerCase()

  return documents.value.filter(document => {
    const matchesPosting =
      filters.value.postingStatus === 'all' ||
      (filters.value.postingStatus === 'posted' && document.document_posted_to_erp) ||
      (filters.value.postingStatus === 'unposted' && !document.document_posted_to_erp)

    const matchesSearch =
      !search ||
      String(document.document_number).toLowerCase().includes(search) ||
      String(document.order_number).toLowerCase().includes(search) ||
      String(document.client_name).toLowerCase().includes(search) ||
      String(document.erp_invoice_number || '').toLowerCase().includes(search)

    return matchesPosting && matchesSearch
  })
})


const normalizeInvoiceNumber = (value) => String(value || '').trim().toLowerCase()

const getDeliveryDownloadUrl = (url) => String(url || '').replace(/\/view(\?.*)?$/, '/download')

const readDownloadErrorMessage = async (downloadError) => {
  const fallbackMessage = 'تعذر تنزيل المرفق. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
  const data = downloadError.response?.data

  if (data instanceof Blob) {
    const text = await data.text()
    try {
      return JSON.parse(text).error || fallbackMessage
    } catch (parseError) {
      return text || fallbackMessage
    }
  }

  return data?.error || fallbackMessage
}

const sanitizeFileSegment = (value, fallback) => String(value || fallback)
  .normalize('NFKC')
  .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
  .replace(/\s+/g, '_')
  .slice(0, 80)

const extensionByMime = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf'
}

const buildDeliveryProofName = (deliveryDocument, contentType) => {
  const extension = extensionByMime[contentType] || 'bin'
  const clientName = sanitizeFileSegment(deliveryDocument.client_name, 'Unknown_Client')
  const orderNumber = sanitizeFileSegment(deliveryDocument.order_number, 'Order')
  const rawDate = deliveryDocument.delivered_at || deliveryDocument.created_at
  const parsedDate = rawDate ? new Date(rawDate) : null
  const orderDate = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toISOString().slice(0, 10)
    : 'unknown-date'
  return `Delivery_Proof_${clientName}_${orderDate}_${orderNumber}.${extension}`
}

const downloadDocument = async (deliveryDocument) => {
  if (!deliveryDocument.delivery_image_url) return
  downloadErrors.value = { ...downloadErrors.value, [deliveryDocument.id]: '' }
  downloadingRows.value = { ...downloadingRows.value, [deliveryDocument.id]: true }
  try {
    const response = await omsApi.get(getDeliveryDownloadUrl(deliveryDocument.delivery_image_url), { responseType: 'blob' })
    const contentType = (response.headers['content-type'] || 'application/octet-stream').split(';')[0]
    const blob = new Blob([response.data], { type: contentType })
    const blobUrl = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = blobUrl
    link.download = buildDeliveryProofName(deliveryDocument, contentType)
    window.document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (downloadError) {
    console.error('Download delivery document error:', downloadError)
    downloadErrors.value = {
      ...downloadErrors.value,
      [deliveryDocument.id]: await readDownloadErrorMessage(downloadError)
    }
  } finally {
    downloadingRows.value = { ...downloadingRows.value, [deliveryDocument.id]: false }
  }
}
const updatePosting = async (document, posted) => {
  rowErrors.value = { ...rowErrors.value, [document.id]: '' }
  const invoiceNumber = String(document.erp_invoice_number || '').trim()
  if (posted && !invoiceNumber) {
    rowErrors.value = {
      ...rowErrors.value,
      [document.id]: 'رقم فاتورة النظام الرئيسي مطلوب عند تأكيد الترحيل.'
    }
    return
  }

  if (posted) {
    const duplicateDocument = documents.value.find(item =>
      item.id !== document.id && normalizeInvoiceNumber(item.erp_invoice_number) === normalizeInvoiceNumber(invoiceNumber)
    )
    if (duplicateDocument) {
      rowErrors.value = {
        ...rowErrors.value,
        [document.id]: 'رقم الفاتورة مستخدم بالفعل في سند آخر ظاهر في القائمة.'
      }
      return
    }
  }
  savingRows.value = { ...savingRows.value, [document.id]: true }
  try {
    const response = await omsApi.patch(`/api/orders/${document.order_id}/document-posting`, {
      document_posted_to_erp: posted,
      erp_invoice_number: posted ? invoiceNumber : ''
    })
    const updatedOrder = response.data.order
    orders.value = orders.value.map(order => order.id === document.order_id ? { ...order, ...updatedOrder } : order)
  } catch (err) {
    rowErrors.value = {
      ...rowErrors.value,
      [document.id]: err.response?.data?.error || 'تعذر تحديث حالة ترحيل السند.'
    }
  } finally {
    savingRows.value = { ...savingRows.value, [document.id]: false }
  }
}

const markAsPosted = (document) => updatePosting(document, true)
const markAsUnposted = (document) => updatePosting(document, false)

onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
.notice-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-compact);
  padding: var(--space-card);
  border: 1px solid color-mix(in srgb, var(--warning) 40%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--warning) 12%, var(--bg-card));
}

.stat-tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-height: 96px;
  justify-content: center;
}

.stat-tile strong {
  font-size: var(--text-2xl);
  line-height: 1;
}

.filter-tab {
  padding: 0.5rem 1rem;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-secondary);
  transition: color var(--transition-fast), background-color var(--transition-fast);
  white-space: nowrap;
}

.filter-tab:hover {
  color: var(--text-primary);
}

.filter-tab.is-active {
  color: white;
  background-color: var(--brand-primary);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 800;
  white-space: nowrap;
}

.status-pill.is-posted {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 14%, transparent);
}

.status-pill.is-unposted {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 14%, transparent);
}

.loader {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--brand-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
