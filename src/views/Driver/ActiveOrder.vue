<template>
  <div class="driver-active-order animate-slide-up max-w-lg mx-auto pb-6">
    <div class="flex items-center gap-4 mb-6 px-2 md:px-0">
      <button @click="$router.back()" class="btn-ghost p-2 rounded-full hover:bg-[var(--bg-hover)]">
        <ArrowRight :size="20" />
      </button>
      <h2 class="text-xl font-bold">تفاصيل وإدارة الطلب</h2>
    </div>

    <div v-if="loading" class="flex justify-center mt-12">
      <div class="loader"></div>
    </div>

    <div v-else-if="!order" class="text-center mt-12 glass-card p-8">
      <p>تعذر العثور على الطلب.</p>
    </div>

    <div v-else class="flex flex-col gap-4 px-2 md:px-0">
      <div class="glass-card p-5 border-t-4" :style="{ borderTopColor: getStatusColor(order.status) }">
        <div class="flex justify-between items-start mb-4">
          <span class="text-2xl font-bold text-brand">{{ order.order_number }}</span>
          <span class="text-sm px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
            {{ $t(`order.status.${order.status}`) || order.status }}
          </span>
        </div>

        <div class="flex flex-col gap-3 mb-6 bg-[var(--bg-secondary)] p-4 rounded-lg">
          <p class="flex items-center gap-3"><User :size="18" class="text-secondary"/> <span class="font-bold">{{ order.client?.name || '-' }}</span></p>
          <p class="flex items-center gap-3"><MapPin :size="18" class="text-secondary"/> <span>{{ order.client?.address || 'الموقع غير محدد' }}</span></p>
          <p class="flex items-center gap-3"><Phone :size="18" class="text-secondary"/> <a :href="`tel:${order.client?.phone || ''}`" class="text-brand font-bold" dir="ltr">{{ order.client?.phone || 'غير متوفر' }}</a></p>
        </div>

        <h4 class="font-bold mb-3 border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
          <Package :size="18" /> المنتجات ({{ formatKgWithUnit(getTotalTons(order)) }})
        </h4>
        <ul class="flex flex-col gap-2 mb-6">
          <li v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
            <span>{{ item.product?.name }}</span>
            <span class="font-bold">{{ formatKgWithUnit(item.quantity_tons) }}</span>
          </li>
        </ul>

        <!-- Action Buttons Flow -->
        <div class="flex flex-col gap-3 mt-6">
          <button 
            v-if="order.status === 'ready_for_pickup'" 
            @click="updateStatus('picked_up_by_driver')" 
            class="btn btn-primary w-full py-4 text-lg font-bold shadow-lg"
            :disabled="actionLoading"
          >
            <span v-if="actionLoading" class="loader small inline-block mr-2"></span>
            تأكيد استلام البضاعة
          </button>
          
          <template v-if="order.status === 'picked_up_by_driver'">
            <button @click="openDeliveryModal" class="btn btn-success w-full py-4 text-lg font-bold shadow-lg">
              تأكيد التسليم (يتطلب صورة)
            </button>

            <button @click="showFailModal = true" class="btn btn-danger bg-red-500/10 text-danger border border-red-500/30 w-full py-3 mt-2">
              الإبلاغ عن فشل التسليم
            </button>
          </template>

          <button 
            v-if="order.status === 'failed_delivery'" 
            @click="updateStatus('return_requested')" 
            class="btn btn-warning w-full py-4 text-lg font-bold shadow-lg"
            :disabled="actionLoading"
          >
            <span v-if="actionLoading" class="loader small inline-block mr-2"></span>
            طلب إرجاع البضاعة
          </button>
          
          <div v-if="order.status === 'return_requested'" class="p-4 bg-[var(--bg-secondary)] border border-[var(--warning)] rounded-lg text-center text-sm font-bold text-warning">
            بانتظار استلام المخزن للمرتجع
          </div>
          <div v-if="order.status === 'returned_to_warehouse'" class="p-4 bg-[var(--bg-secondary)] border border-[var(--success)] rounded-lg text-center text-sm font-bold text-success">
            تم استلام المرتجع في المخزن
          </div>
          <div v-if="order.status === 'delivered'" class="p-4 bg-[var(--bg-secondary)] border border-[var(--success)] rounded-lg text-center text-sm font-bold text-success">
            تم تسليم الطلب بنجاح
          </div>
        </div>

        <div v-if="actionError" class="mt-4 p-3 text-danger bg-red-500/10 rounded-lg text-sm text-center">
          {{ actionError }}
        </div>
      </div>
    </div>

    <!-- Delivery Modal - رفع صورة أو PDF -->
    <div v-if="showDeliveryModal" class="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 pb-0">
      <div class="glass-card w-full max-w-md bg-[var(--bg-primary)] md:rounded-2xl rounded-t-3xl rounded-b-none p-6 animate-slide-up pb-10">
        <h3 class="text-xl font-bold mb-2">تأكيد التسليم</h3>
        <p class="text-secondary text-sm mb-6">يرجى رفع صورة أو ملف PDF لمستند التسليم الموقّع من العميل.</p>
        
        <!-- 1. الرقم المرجعي للسند -->
        <div class="form-group mb-4">
          <label class="form-label text-xs font-bold text-secondary uppercase mb-1 block">رقم سند الاستلام الورقي *</label>

          <!-- كارت نطاق السندات النشطة المصروفة للسائق -->
          <div v-if="driverActiveBooksSummary && driverActiveBooksSummary.active_books.length > 0" class="mb-2 p-3 bg-brand/10 border border-brand/30 rounded-xl text-xs space-y-1">
            <div class="font-bold text-brand flex items-center justify-between">
              <span>دفاترك النشطة المصروفة:</span>
              <span class="badge badge-success text-[10px]">متبقي {{ driverActiveBooksSummary.total_remaining_slips }} سند</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span 
                v-for="b in driverActiveBooksSummary.active_books" 
                :key="b.id"
                class="bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-color)] text-emerald-400 font-mono text-[11px]"
              >
                نطاق [{{ b.start_number }} - {{ b.end_number }}]
              </span>
            </div>
          </div>

          <input 
            type="text" 
            v-model="deliveryRefNumber" 
            class="form-input w-full text-base p-3 font-bold text-brand" 
            placeholder="أدخل رقم السند الورقي من نطاق دفترك..."
            required
          >
        </div>

        <!-- 2. رفع الملف -->
        <div class="form-group mb-4">
          <label class="form-label text-xs font-bold text-secondary uppercase mb-1 block">صورة / ملف السند *</label>
          <label class="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-color)] rounded-xl p-6 cursor-pointer hover:border-brand transition-colors min-h-[160px] relative overflow-hidden bg-[var(--bg-secondary)]">
            <input type="file" accept="image/*,.pdf,application/pdf" capture="environment" @change="handleFileSelect" class="hidden">
            <div v-if="!selectedFile" class="text-center">
              <div class="flex justify-center gap-2 mb-2 text-secondary opacity-50">
                <Camera :size="36" />
                <FileText :size="36" />
              </div>
              <p class="font-bold text-brand text-sm">التقط صورة أو اختر ملف PDF السند</p>
              <p class="text-[11px] text-secondary mt-1">يدعم الصور وملفات المستندات PDF</p>
            </div>
            <div v-else class="text-center p-2">
              <div v-if="selectedFile.type.includes('pdf')" class="flex flex-col items-center text-danger">
                <FileText :size="40" class="mb-1" />
                <p class="font-bold text-xs text-primary">{{ selectedFile.name }}</p>
                <span class="badge badge-danger text-[10px] mt-1">ملف مستند PDF</span>
              </div>
              <img v-else :src="filePreview" class="max-h-32 mx-auto rounded-lg object-contain" />
            </div>
          </label>
        </div>

        <!-- شريط تقدم الرفع -->
        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="mb-4">
          <div class="w-full bg-[var(--bg-secondary)] rounded-full h-2.5 overflow-hidden">
            <div class="bg-green-500 h-2.5 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <p class="text-xs text-secondary text-center mt-1">جاري الرفع... {{ uploadProgress }}%</p>
        </div>

        <!-- رسالة الخطأ داخل النافذة -->
        <div v-if="modalError" class="mb-4 p-3 text-danger bg-red-500/10 rounded-lg text-sm text-center border border-red-500/20">
          {{ modalError }}
        </div>
        
        <div class="flex gap-3">
          <button @click="confirmDelivery" class="btn btn-success flex-1 py-3" :disabled="!selectedFile || !deliveryRefNumber.trim() || actionLoading">
            <span v-if="actionLoading" class="loader small inline-block mr-2"></span>
            تأكيد وتسليم الطلب
          </button>
          <button @click="closeDeliveryModal" class="btn btn-ghost flex-1 border border-[var(--border-color)]">إلغاء</button>
        </div>
      </div>
    </div>

    <!-- Fail Delivery Modal -->
    <div v-if="showFailModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-md bg-[var(--bg-primary)] p-6">
        <h3 class="text-xl font-bold text-danger mb-4">سبب فشل التسليم</h3>
        <textarea v-model="failReason" class="form-input w-full p-3 mb-4" rows="4" placeholder="اكتب سبب فشل التسليم هنا..."></textarea>
        <div class="flex gap-3">
          <button @click="confirmFail" class="btn btn-danger flex-1 py-3" :disabled="actionLoading">
            <span v-if="actionLoading" class="loader small inline-block mr-2"></span>
            تأكيد
          </button>
          <button @click="showFailModal = false; failReason = ''" class="btn btn-ghost flex-1 border border-[var(--border-color)]">إلغاء</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, User, MapPin, Phone, Package, Camera, FileText } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

// Delivery Modal
const showDeliveryModal = ref(false)
const selectedFile = ref(null)
const filePreview = ref('')
const deliveryRefNumber = ref('')
const uploadProgress = ref(0)
const modalError = ref('')
const driverActiveBooksSummary = ref(null)

const fetchDriverActiveBooks = async () => {
  try {
    const res = await omsApi.get('/api/delivery-document-books-manager/books/driver-slips')
    driverActiveBooksSummary.value = res.data
  } catch (err) {
    console.error('Failed to fetch driver active books summary:', err)
  }
}

const openDeliveryModal = () => {
  showDeliveryModal.value = true
  fetchDriverActiveBooks()
}


// Fail Modal
const showFailModal = ref(false)
const failReason = ref('')

const fetchOrder = async () => {
  try {
    const res = await omsApi.get(`/api/orders/${route.params.id}`)
    order.value = res.data.order || res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (targetStatus, payload = {}) => {
  actionLoading.value = true
  actionError.value = ''
  try {
    await omsApi.post(`/api/orders/${route.params.id}/transition`, {
      targetStatus,
      payload
    })
    await fetchOrder()
  } catch (error) {
    actionError.value = error.response?.data?.error || 'حدث خطأ غير متوقع'
    throw error
  } finally {
    actionLoading.value = false
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  const maxSizeBytes = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    modalError.value = 'نوع الملف غير مسموح به. المسموح فقط صور (JPG, PNG) أو مستندات (PDF).'
    event.target.value = ''
    selectedFile.value = null
    filePreview.value = ''
    return
  }

  if (file.size > maxSizeBytes) {
    modalError.value = 'حجم الملف يتجاوز الحد المسموح به (5 ميجابايت).'
    event.target.value = ''
    selectedFile.value = null
    filePreview.value = ''
    return
  }

  modalError.value = ''
  selectedFile.value = file
  if (file.type.startsWith('image/')) {
    if (filePreview.value && filePreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview.value)
    }
    filePreview.value = URL.createObjectURL(file)
  } else {
    filePreview.value = '' // PDF thumbnail representation
  }
}

const closeDeliveryModal = () => {
  if (filePreview.value && filePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(filePreview.value)
  }
  showDeliveryModal.value = false
  selectedFile.value = null
  filePreview.value = ''
  deliveryRefNumber.value = ''
  modalError.value = ''
  uploadProgress.value = 0
}

const confirmDelivery = async () => {
  if (!selectedFile.value || !deliveryRefNumber.value.trim()) return
  actionLoading.value = true
  uploadProgress.value = 0
  modalError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (order.value?.id) {
      formData.append('order_id', order.value.id)
    }

    const uploadRes = await omsApi.post('/api/upload/delivery', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    const documentId = uploadRes.data.document_id
    const imageUrl = uploadRes.data.url

    await updateStatus('delivered', {
      delivery_document_id: documentId,
      delivery_image_url: imageUrl,
      delivery_reference_number: deliveryRefNumber.value.trim()
    })

    closeDeliveryModal()
    router.replace({ name: 'DriverDashboard' })
  } catch (e) {
    if (e.response && e.response.status === 413) {
      modalError.value = 'حجم الملف يتجاوز الحد المسموح به في الخادم (5 ميجابايت).'
    } else {
      modalError.value = e.response?.data?.error || actionError.value || 'حدث خطأ أثناء رفع صورة إثبات التسليم'
    }
  } finally {
    actionLoading.value = false
    uploadProgress.value = 0
  }
}

const confirmFail = async () => {
  if (!failReason.value.trim()) return
  await updateStatus('failed_delivery', { note: failReason.value })
  showFailModal.value = false
}

const getTotalTons = (ord) => {
  if (!ord?.items) return 0
  return ord.items.reduce((sum, item) => sum + Number(item.quantity_tons), 0)
}

const getStatusColor = (status) => {
  if (status === 'delivered') return 'var(--success)'
  if (status === 'ready_for_pickup') return 'var(--primary)'
  if (status === 'picked_up_by_driver') return 'var(--info)'
  if (status === 'failed_delivery' || status === 'return_requested') return 'var(--danger)'
  return 'var(--warning)'
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
.loader.small { width: 16px; height: 16px; border-width: 2px; margin: 0; vertical-align: middle; border-left-color: currentColor; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
html[dir="rtl"] .mr-2 { margin-left: 0.5rem; margin-right: 0; }
</style>
