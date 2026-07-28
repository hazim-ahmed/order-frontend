<template>
  <div class="inventory-processing animate-slide-up">
    <div class="header-section mb-6 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold">{{ $t('nav.processing') }}</h2>
        <p class="text-secondary mt-1">تعيين السائقين أو تسليم الطلبات المباشرة للعملاء</p>
      </div>
      <span class="badge badge-info text-lg px-4 py-2">{{ orders.length }} قيد التجهيز</span>
    </div>

    <div v-if="loading" class="flex justify-center mt-8">
      <div class="loader"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="order in orders" :key="order.id" class="glass-card flex flex-col justify-between border-t-4 border-[var(--info)]">
        <div>
          <div class="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
            <router-link :to="{ name: 'SharedOrderDetail', params: { id: order.id } }" class="text-lg font-bold text-brand hover:underline">
              {{ order.order_number }}
            </router-link>
            <span class="text-xs text-secondary">{{ order.client?.name || '-' }}</span>
          </div>
          
          <div class="bg-[var(--bg-secondary)] p-3 rounded-lg text-sm mb-4">
            <p class="font-bold mb-2 border-b border-[var(--border-color)] pb-1">المنتجات</p>
            <ul class="flex flex-col gap-1">
              <li v-for="item in order.items" :key="item.id" class="flex justify-between">
                <span>{{ item.product?.name }}</span>
                <span class="font-bold">{{ formatKgWithUnit(item.quantity_tons) }}</span>
              </li>
            </ul>
          </div>

          <!-- delivery_type badge -->
          <div v-if="order.delivery_type === 'customer_pickup'" class="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p class="font-bold text-amber-500 flex items-center gap-2 text-sm">
              <span>🏢</span> استلام مباشر من المستودع (من قِبل العميل)
            </p>
            <div v-if="order.pickup_driver_name || order.pickup_vehicle_plate" class="text-xs text-secondary mt-1">
              <span v-if="order.pickup_driver_name">سائق العميل: {{ order.pickup_driver_name }} | </span>
              <span v-if="order.pickup_vehicle_plate">اللوحة: {{ order.pickup_vehicle_plate }}</span>
            </div>
          </div>

          <div v-else class="form-group mb-4">
            <label class="text-sm text-secondary mb-1 block">اختر السائق لنقل العهدة</label>
            <select v-model="selectedDrivers[order.id]" class="form-input w-full p-2">
              <option value="" disabled>-- اختر السائق --</option>
              <option v-for="driver in driversList" :key="driver.id" :value="driver.id">
                {{ driver.username || driver.name || 'سائق' }}
              </option>
            </select>
          </div>
          
          <div v-if="orderErrors[order.id]" class="mb-4 p-2 text-danger bg-red-500/10 rounded-lg text-sm">
            {{ orderErrors[order.id] }}
          </div>
        </div>

        <div v-if="order.delivery_type === 'customer_pickup'" class="flex flex-col gap-2">
          <button @click="openDirectDeliverModal(order)" class="btn btn-primary w-full py-3">
            📝 تسجيل بيانات سائق العميل وتسليم الشحنة
          </button>
        </div>

        <div v-else class="flex flex-col gap-2">
          <button @click="assignDriver(order.id)" class="btn btn-info w-full py-2.5" :disabled="actionLoading[order.id]">
            <span v-if="actionLoading[order.id]" class="loader small mr-2 inline-block"></span>
            إسناد للسائق
          </button>
          <button @click="openDirectDeliverModal(order)" class="btn btn-ghost w-full py-2 text-xs text-amber-500 border border-amber-500/30 hover:bg-amber-500/10">
            🏢 تحويل لاستلام مباشر وتسليم الشحنة للعميل
          </button>
        </div>
      </div>

      <div v-if="orders.length === 0" class="col-span-full text-center mt-12 text-secondary glass-card p-12">
        <Settings :size="48" class="mx-auto mb-4 text-info opacity-50" />
        <p class="text-xl">لا يوجد طلبات قيد التجهيز حالياً.</p>
      </div>
    </div>

    <!-- Modal for Customer Pickup Details Registration -->
    <div v-if="showPickupModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="glass-card max-w-lg w-full p-6 md:p-8 rounded-xl shadow-2xl relative border border-[var(--brand-primary)]/30">
        <h3 class="text-xl font-bold mb-4 text-brand flex items-center gap-2">
          🏢 تحويل وتسليم مباشر لسائق العميل
        </h3>
        <p class="text-sm text-secondary mb-6">الطلب رقم: <b>{{ activeOrder?.order_number }}</b> — العميل: <b>{{ activeOrder?.client?.name }}</b></p>

        <form @submit.prevent="submitDirectDelivery" class="flex flex-col gap-4">
          <div class="form-group mb-0">
            <label class="form-label text-sm font-bold">اسم سائق العميل / الناقل *</label>
            <input type="text" v-model="modalData.pickup_driver_name" class="form-input w-full" placeholder="أدخل اسم السائق المستلم..." required>
          </div>

          <div class="form-group mb-0">
            <label class="form-label text-sm font-bold">رقم لوحة الشاحنة / المركبة *</label>
            <input type="text" v-model="modalData.pickup_vehicle_plate" class="form-input w-full" placeholder="أدخل رقم اللوحة..." required>
          </div>

          <div class="form-group mb-0">
            <label class="form-label text-sm">رقم هوية / إثبات المستلم (اختياري)</label>
            <input type="text" v-model="modalData.pickup_receiver_id" class="form-input w-full" placeholder="رقم الهوية الوطنية أو الإقامة...">
          </div>

          <div class="form-group mb-0">
            <label class="form-label text-sm font-bold">الرقم المرجعي لسند الاستلام *</label>
            <input type="text" v-model="modalData.delivery_reference_number" class="form-input w-full" placeholder="أدخل الرقم المرجعي للسند المطبوع..." required>
          </div>

          <div class="form-group mb-0">
            <label class="form-label text-sm font-bold">صورة / مستند سند التسليم الموقّع *</label>
            <div class="flex flex-col gap-2">
              <input 
                type="file" 
                ref="fileInputRef"
                @change="handleFileUpload" 
                accept="image/*,.pdf" 
                capture="environment"
                class="hidden"
              >
              <button 
                type="button" 
                @click="$refs.fileInputRef?.click()" 
                class="btn btn-outline flex items-center gap-2 w-full justify-center py-3 border-dashed"
                :disabled="uploadingFile"
              >
                <Upload :size="18" />
                <span v-if="uploadingFile" class="flex items-center gap-2">
                  <span class="loader small inline-block"></span> جاري رفع صورة السند...
                </span>
                <span v-else-if="uploadSuccessMsg" class="text-emerald-500 font-bold">📷 تغيير صورة السند المرفوعة</span>
                <span v-else>📷 التقاط صورة أو اختيار ملف السند</span>
              </button>

              <div v-if="uploadSuccessMsg" class="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle :size="14" /> {{ uploadSuccessMsg }}
              </div>

              <input type="text" v-model="modalData.delivery_image_url" class="form-input w-full text-xs text-secondary opacity-75 dir-ltr" placeholder="رابط الملف المرفوع..." required readonly>
            </div>
          </div>

          <div v-if="modalError" class="p-3 text-danger bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
            {{ modalError }}
          </div>

          <div class="flex justify-end gap-3 mt-4">
            <button type="button" @click="showPickupModal = false" class="btn btn-ghost">إلغاء</button>
            <button type="submit" class="btn btn-success px-6" :disabled="modalSubmitting">
              <span v-if="modalSubmitting" class="loader small mr-2 inline-block"></span>
              تأكيد وتسليم البضاعة
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Settings, Upload, CheckCircle } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { formatKgWithUnit } from '../../utils/weightFormatter'

const orders = ref([])
const driversList = ref([])
const loading = ref(true)
const actionLoading = ref({})
const orderErrors = ref({})
const selectedDrivers = ref({})

// File Upload state
const fileInputRef = ref(null)
const uploadingFile = ref(false)
const uploadSuccessMsg = ref('')

// Modal state
const showPickupModal = ref(false)
const activeOrder = ref(null)
const modalSubmitting = ref(false)
const modalError = ref('')
const modalData = ref({
  pickup_driver_name: '',
  pickup_vehicle_plate: '',
  pickup_receiver_id: '',
  delivery_reference_number: '',
  delivery_image_url: '',
  delivery_document_id: null
})

const handleFileUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    modalError.value = 'نوع الملف غير مسموح به. المسموح فقط صور (JPG, PNG) أو مستندات (PDF).'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    modalError.value = 'حجم الملف يتجاوز الحد المسموح به (5 ميجابايت).'
    return
  }

  uploadingFile.value = true
  uploadSuccessMsg.value = ''
  modalError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)
    if (activeOrder.value?.id) {
      formData.append('order_id', activeOrder.value.id)
    }

    const res = await omsApi.post('/api/upload/delivery', formData)
    modalData.value.delivery_document_id = res.data.document_id
    modalData.value.delivery_image_url = res.data.url
    uploadSuccessMsg.value = 'تم رفع صورة السند بنجاح!'
  } catch (err) {
    modalError.value = err.response?.data?.error || 'فشل في رفع الملف، يرجى المحاولة مرة أخرى.'
  } finally {
    uploadingFile.value = false
  }
}

const fetchOrders = async () => {
  try {
    const response = await omsApi.get('/api/orders?status=processing_in_warehouse')
    orders.value = Array.isArray(response.data) ? response.data : (response.data.orders || [])
    orders.value.forEach(o => {
      if (!selectedDrivers.value[o.id]) selectedDrivers.value[o.id] = ''
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const fetchDrivers = async () => {
  try {
    const response = await omsApi.get('/api/users')
    const allUsers = response.data.users || response.data
    driversList.value = allUsers.filter(u => u.role === 'driver' && u.is_active)
  } catch (error) {
    console.error('Error fetching drivers:', error)
  }
}

const assignDriver = async (orderId) => {
  if (!selectedDrivers.value[orderId]) {
    orderErrors.value[orderId] = 'الرجاء اختيار السائق'
    return
  }
  
  actionLoading.value[orderId] = true
  orderErrors.value[orderId] = ''
  try {
    await omsApi.post(`/api/orders/${orderId}/transition`, {
      targetStatus: 'assigned_to_driver',
      payload: { driver_id: selectedDrivers.value[orderId] }
    })
    await fetchOrders()
  } catch (error) {
    orderErrors.value[orderId] = error.response?.data?.error || 'حدث خطأ.'
  } finally {
    actionLoading.value[orderId] = false
  }
}

const openDirectDeliverModal = (order) => {
  activeOrder.value = order
  modalError.value = ''
  uploadSuccessMsg.value = ''
  modalData.value = {
    pickup_driver_name: order.pickup_driver_name || '',
    pickup_vehicle_plate: order.pickup_vehicle_plate || '',
    pickup_receiver_id: order.pickup_receiver_id || '',
    delivery_reference_number: order.delivery_reference_number || `PICKUP-${Date.now()}`,
    delivery_image_url: order.delivery_image_url || '',
    delivery_document_id: null
  }
  showPickupModal.value = true
}

const submitDirectDelivery = async () => {
  if (!activeOrder.value) return
  
  modalSubmitting.value = true
  modalError.value = ''
  
  try {
    // Single transition directly to delivered for inventory_manager
    await omsApi.post(`/api/orders/${activeOrder.value.id}/transition`, {
      targetStatus: 'delivered',
      payload: {
        delivery_type: 'customer_pickup',
        delivery_document_id: modalData.value.delivery_document_id,
        delivery_image_url: modalData.value.delivery_image_url,
        delivery_reference_number: modalData.value.delivery_reference_number,
        pickup_driver_name: modalData.value.pickup_driver_name,
        pickup_vehicle_plate: modalData.value.pickup_vehicle_plate,
        pickup_receiver_id: modalData.value.pickup_receiver_id
      }
    })

    showPickupModal.value = false
    await fetchOrders()
  } catch (error) {
    modalError.value = error.response?.data?.error || 'حدث خطأ أثناء التسليم المباشر.'
  } finally {
    modalSubmitting.value = false
  }
}

onMounted(() => {
  fetchOrders()
  fetchDrivers()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
.loader.small { width: 16px; height: 16px; border-width: 2px; margin: 0; vertical-align: middle; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
html[dir="rtl"] .mr-2 { margin-left: 0.5rem; margin-right: 0; }
</style>
