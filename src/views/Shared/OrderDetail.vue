<template>
  <div class="order-detail-page animate-slide-up max-w-5xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button @click="$router.back()" class="btn-ghost p-2 rounded-full hover:bg-[var(--bg-hover)]">
        <ArrowRight :size="20" />
      </button>
      <h2 class="text-2xl font-bold">تفاصيل الطلب</h2>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="loader"></div>
    </div>

    <div v-else-if="error" class="glass-card p-8 text-center text-danger">
      {{ error }}
    </div>

    <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Main Content: Order details -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <div class="glass-card p-6 md:p-8">
          <div class="flex flex-wrap justify-between items-start gap-4 mb-6 border-b border-[var(--border-color)] pb-6">
            <div>
              <h3 class="text-3xl font-bold text-brand mb-2">{{ order.order_number }}</h3>
              <p class="text-secondary flex items-center gap-2">
                <Calendar :size="16" />
                {{ new Date(order.created_at).toLocaleString() }}
              </p>
            </div>
            <OrderStatusBadge :status="order.status" />
          </div>

          <!-- Order Stepper -->
          <div class="mb-8 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
            <OrderStepper :status="order.status" />
          </div>

          <div v-if="order.status === 'rejected_by_sales'" class="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle class="text-danger shrink-0 mt-0.5" :size="20" />
            <div>
              <h4 class="text-danger font-bold mb-1">تم رفض الطلب</h4>
              <p class="text-sm">{{ order.rejection_reason || 'لا يوجد سبب مرفق' }}</p>
            </div>
          </div>

          <div class="mb-8 flex flex-wrap gap-4">
            <div class="p-4 bg-[var(--bg-secondary)] rounded-lg min-w-[200px]">
              <p class="text-sm text-secondary mb-1 flex items-center gap-2">
                <User :size="16" /> العميل
              </p>
              <p class="font-bold text-lg">{{ order.client?.name || '-' }}</p>
            </div>

            <div class="p-4 bg-[var(--bg-secondary)] rounded-lg min-w-[200px]">
              <p class="text-sm text-secondary mb-1">طريقة التسليم</p>
              <p v-if="order.delivery_type === 'customer_pickup'" class="font-bold text-amber-500 flex items-center gap-1">
                <span>🏢</span> استلام مباشر من المستودع
              </p>
              <p v-else class="font-bold text-brand flex items-center gap-1">
                <span>🚚</span> توصيل أسطول الشركة
              </p>
            </div>

            <div v-if="order.delivery_type === 'customer_pickup' && (order.pickup_driver_name || order.pickup_vehicle_plate)" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg min-w-[200px]">
              <p class="text-sm text-amber-500 mb-1 font-bold">بيانات الناقل / العميل</p>
              <p v-if="order.pickup_driver_name" class="text-sm">السائق: <b>{{ order.pickup_driver_name }}</b></p>
              <p v-if="order.pickup_vehicle_plate" class="text-sm">اللوحة: <b>{{ order.pickup_vehicle_plate }}</b></p>
            </div>
          </div>

          <h4 class="font-bold text-xl mb-4 flex items-center gap-2">
            <Package :size="20" /> المنتجات ({{ order.items?.length || 0 }})
          </h4>
          
          <div class="overflow-x-auto">
            <table class="w-full text-start">
              <thead>
                <tr class="text-secondary border-b border-[var(--border-color)]">
                  <th class="p-3 text-start">المنتج</th>
                  <th class="p-3 text-start">الكمية</th>
                  <th class="p-3 text-start">سعر الوحدة المحدد</th>
                  <th class="p-3 text-end">الإجمالي الفرعي</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id" class="border-b border-[var(--border-color)]">
                  <td class="p-3 font-bold">{{ item.product?.name || 'منتج غير معروف' }}</td>
                  <td class="p-3 font-bold text-brand">{{ formatKgWithUnit(item.quantity_tons) }}</td>
                  <td class="p-3 text-emerald-600 font-bold text-sm"><b>{{ formatPricePerKg(item.price_per_ton_snapshot || 0) }}</b> ريال / كجم</td>
                  <td class="p-3 text-end font-bold text-primary">
                    {{ Number(item.quantity_tons * Number(item.price_per_ton_snapshot || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} ريال
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Financial Breakdown Summary -->
          <div class="mt-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] space-y-2 text-sm">
            <div class="flex justify-between font-extrabold text-base pt-1 text-brand">
              <span>الإجمالي المالي النهائي للطلب:</span>
              <span class="text-emerald-600">{{ Number(order.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} ريال</span>
            </div>
          </div>
        </div>

        <!-- Download Invoice if delivered -->
        <div v-if="order.status === 'delivered'" class="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-4 border-emerald-500">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-green-500/10 rounded-full text-success">
              <FileCheck :size="24" />
            </div>
            <div>
              <h4 class="font-bold mb-1">الفاتورة الضريبية والمالية</h4>
              <p class="text-sm text-secondary">الطلب مكتمل وتَم التسليم، تم إصدار الفاتورة الضريبية معتمدة تلقائياً.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <a v-if="order.invoice?.pdf_url" :href="`${apiBaseUrl}${order.invoice.pdf_url}`" target="_blank" class="btn btn-primary flex items-center gap-2 shrink-0">
              <Printer :size="18" />
              طباعة / معاينة الفاتورة (PDF)
            </a>
            <button v-else @click="fetchOrderDetails" class="btn btn-outline flex items-center gap-2">
              <RefreshCw :size="18" />
              تحديث الفاتورة
            </button>
          </div>
        </div>

        <!-- Uploaded Delivery Proof Document by Driver -->
        <div v-if="order.delivery_image_url || order.delivery_reference_number" class="glass-card p-6 border-t-4 border-info">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-blue-500/10 rounded-full text-info">
                <FileCheck :size="24" />
              </div>
              <div>
                <h4 class="font-bold text-lg text-primary">وثيقة ورقم سند التسليم المرفوع من السائق</h4>
                <p v-if="order.delivery_reference_number" class="text-sm font-bold text-brand mt-0.5">
                  الرقم المرجعي للسند: <span class="bg-brand/10 text-brand px-2 py-0.5 rounded font-mono">{{ order.delivery_reference_number }}</span>
                </p>
                <p class="text-xs text-secondary mt-0.5">يمكنك معاينة المستند المرفوع مباشرة أو تنزيله على جهازك</p>
              </div>
            </div>
            <div v-if="order.delivery_image_url" class="flex items-center gap-2">
              <button @click="downloadDocument(order.delivery_image_url)" class="btn btn-outline border-info text-info hover:bg-blue-500/10 flex items-center gap-2 text-xs py-2">
                <Download :size="16" />
                تنزيل المستند
              </button>
              <button @click="previewDocument(order.delivery_image_url)" class="btn btn-primary flex items-center gap-2 text-xs py-2">
                <Eye :size="16" />
                فتح ومعاينة المستند
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: Timeline -->
      <div class="lg:col-span-1">
        <div class="glass-card p-6 sticky top-24">
          <OrderTimeline :logs="order.logs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Download, Activity, Calendar, AlertCircle, User, CreditCard, Package, FileCheck, Printer, RefreshCw, Eye } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge.vue'
import OrderTimeline from '../../components/ui/OrderTimeline.vue'
import OrderStepper from '../../components/ui/OrderStepper.vue'
import { formatKgWithUnit, formatPricePerKg } from '../../utils/weightFormatter'

const route = useRoute()
const { locale } = useI18n()
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== null ? import.meta.env.VITE_API_BASE_URL : ''

const loading = ref(true)
const order = ref(null)
const error = ref('')

const fetchOrderDetails = async () => {
  loading.value = true
  try {
    const res = await omsApi.get(`/api/orders/${route.params.id}`)
    order.value = res.data.order || res.data
    
    // Also fetch logs if not included in the main order response
    try {
      const logsRes = await omsApi.get(`/api/orders/${route.params.id}/logs`)
      order.value.logs = logsRes.data.logs || logsRes.data
    } catch (e) {
      console.error('Could not fetch logs', e)
    }
  } catch (err) {
    error.value = 'تعذر تحميل تفاصيل الطلب. قد لا تملك صلاحية للوصول إليه.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const previewDocument = async (url) => {
  if (!url) return
  try {
    const response = await omsApi.get(url, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/webp' })
    const blobUrl = window.URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
  } catch (error) {
    console.error('Preview error:', error)
    window.open(`${apiBaseUrl}${url}`, '_blank')
  }
}

const downloadDocument = async (url) => {
  if (!url) return
  try {
    const response = await omsApi.get(url, { responseType: 'blob' })
    const contentType = (response.headers['content-type'] || 'application/octet-stream').split(';')[0]
    const blob = new Blob([response.data], { type: contentType })
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    const extensionByMime = {
      'image/webp': 'webp',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/pdf': 'pdf'
    }
    const extension = extensionByMime[contentType] || 'bin'
    const safeClientName = String(order.value?.client?.name || 'Unknown_Client')
      .normalize('NFKC')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .replace(/\s+/g, '_')
      .slice(0, 80)
    const rawOrderDate = order.value?.createdAt || order.value?.created_at
    const parsedOrderDate = rawOrderDate ? new Date(rawOrderDate) : null
    const orderDate = parsedOrderDate && !Number.isNaN(parsedOrderDate.getTime())
      ? parsedOrderDate.toISOString().slice(0, 10)
      : 'unknown-date'
    const orderNumber = String(order.value?.order_number || 'Order').replace(/[<>:"/\\|?*]/g, '-')
    link.download = `Delivery_Proof_${safeClientName}_${orderDate}_${orderNumber}.${extension}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Download error:', error)
    window.open(`${apiBaseUrl}${url}`, '_blank')
  }
}

onMounted(() => {
  fetchOrderDetails()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
