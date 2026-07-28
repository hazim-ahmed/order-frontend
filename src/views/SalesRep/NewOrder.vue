<!-- ==============================================================================
تاريخ التعديل: 2026-07-22
الوظيفة: واجهة إضافة طلب جديد بدعم متعدد الأصناف ومكونات الإشعارات المخصصة
السياق: يحل مشكلة تقييد الطلب بصنف واحد ويحسن تجربة المستخدم التشغيلية
مرجع الأمان وتجربة المستخدم: Frontend Audit Section 10 & Phase 4.1 UX Refactoring
============================================================================== -->
<template>
  <div class="sales-rep-new-order animate-slide-up max-w-3xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button @click="$router.back()" class="btn-ghost p-2 rounded-full hover:bg-[var(--bg-hover)]" type="button">
        <ArrowRight :size="20" />
      </button>
      <h2 class="text-2xl font-bold">{{ $t('nav.newOrder') }}</h2>
    </div>

    <div class="glass-card p-6 md:p-8">
      <div v-if="loadingCore" class="flex justify-center p-8">
        <div class="loader"></div>
      </div>
      
      <form v-else @submit.prevent="submitOrder" class="flex flex-col gap-6">
        <!-- Client Selection -->
        <div class="form-group">
          <label class="form-label font-bold text-lg mb-2">معلومات العميل</label>
          <div class="relative">
            <input 
              type="text" 
              v-model="newOrder.client_name" 
              class="form-input w-full p-3 text-lg" 
              placeholder="اكتب اسم العميل أو ابحث..." 
              list="clients-list"
              required
            >
            <datalist id="clients-list">
              <option v-for="client in clientsList" :key="client.id" :value="client.name"></option>
            </datalist>
          </div>
          <p class="text-sm text-secondary mt-1">إذا لم يكن العميل موجوداً، سيتم إنشاؤه تلقائياً بالنظام.</p>
        </div>

        <!-- Delivery Method -->
        <div class="form-group">
          <label class="form-label font-bold text-lg mb-2">طريقة التسليم</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label 
              class="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
              :class="newOrder.delivery_type === 'delivery' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 font-bold' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'"
            >
              <input type="radio" v-model="newOrder.delivery_type" value="delivery" class="hidden">
              <div class="w-4 h-4 rounded-full border border-[var(--brand-primary)] flex items-center justify-center">
                <div v-if="newOrder.delivery_type === 'delivery'" class="w-2 h-2 rounded-full bg-[var(--brand-primary)]"></div>
              </div>
              <span>🚚 توصيل عبر أسطول الشركة</span>
            </label>

            <label 
              class="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
              :class="newOrder.delivery_type === 'customer_pickup' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 font-bold' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'"
            >
              <input type="radio" v-model="newOrder.delivery_type" value="customer_pickup" class="hidden">
              <div class="w-4 h-4 rounded-full border border-[var(--brand-primary)] flex items-center justify-center">
                <div v-if="newOrder.delivery_type === 'customer_pickup'" class="w-2 h-2 rounded-full bg-[var(--brand-primary)]"></div>
              </div>
              <span>🏢 استلام مباشر من المستودع</span>
            </label>
          </div>
        </div>

        <!-- Extra details if customer_pickup -->
        <div v-if="newOrder.delivery_type === 'customer_pickup'" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 animate-fade-in">
          <div class="form-group mb-0">
            <label class="form-label text-sm">اسم سائق/ناقل العميل (اختياري)</label>
            <input type="text" v-model="newOrder.pickup_driver_name" class="form-input w-full" placeholder="اسم السائق المستلم...">
          </div>
          <div class="form-group mb-0">
            <label class="form-label text-sm">رقم لوحة شاحنة العميل (اختياري)</label>
            <input type="text" v-model="newOrder.pickup_vehicle_plate" class="form-input w-full" placeholder="رقم اللوحة...">
          </div>
        </div>

        <hr class="border-[var(--border-color)] my-2">

        <!-- Multiple Products List Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <label class="form-label font-bold text-lg mb-0">تفاصيل الأصناف وأسعار الوحدة للمندوب</label>
            <button 
              type="button" 
              @click="addItem" 
              class="btn btn-outline-primary text-sm flex items-center gap-1"
            >
              <Plus :size="16" />
              <span>إضافة صنف آخر</span>
            </button>
          </div>

          <div class="space-y-4">
            <div 
              v-for="(item, index) in orderItems" 
              :key="index" 
              class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] relative space-y-3"
            >
              <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div class="form-group mb-0 md:col-span-4">
                  <label class="form-label text-sm">اسم المنتج (#{{ index + 1 }})</label>
                  <input 
                    type="text" 
                    v-model="item.product_name" 
                    class="form-input w-full" 
                    placeholder="اكتب اسم المنتج أو اختر..." 
                    list="products-list"
                    required
                  >
                  <datalist id="products-list">
                    <option v-for="product in productsList" :key="product.id" :value="product.name">
                    </option>
                  </datalist>
                </div>
                
                <div class="form-group mb-0 md:col-span-3">
                  <label class="form-label text-sm">الكمية</label>
                  <input 
                    type="number" 
                    v-model="item.quantity" 
                    class="form-input w-full" 
                    :placeholder="item.unit === 'kg' ? 'مثال: 500' : 'مثال: 2.5'" 
                    min="0.001" 
                    step="any"
                    required
                  >
                </div>

                <div class="form-group mb-0 md:col-span-2">
                  <label class="form-label text-sm">الوحدة</label>
                  <select v-model="item.unit" class="form-input w-full font-bold text-brand">
                    <option value="kg">📦 كجم</option>
                    <option value="ton">⚖️ طن</option>
                  </select>
                </div>

                <div class="form-group mb-0 md:col-span-3">
                  <label class="form-label text-sm">سعر الوحدة للعميل (ريال)</label>
                  <input 
                    type="number" 
                    v-model="item.price_per_unit" 
                    class="form-input w-full font-bold text-emerald-600" 
                    :placeholder="item.unit === 'kg' ? 'السعر لكل كجم...' : 'السعر لكل طن...'" 
                    min="0.001" 
                    step="any"
                    required
                  >
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs">
                <span class="font-bold text-emerald-600" v-if="Number(item.quantity) > 0 && Number(item.price_per_unit) > 0">
                  إجمالي قيمة هذا الصنف: {{ (Number(item.quantity) * Number(item.price_per_unit)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} ريال
                </span>
                <span v-else class="text-secondary">يرجى تحديد الكمية وسعر الوحدة المعتمد</span>

                <button 
                  type="button" 
                  @click="removeItem(index)" 
                  v-if="orderItems.length > 1"
                  class="btn btn-ghost text-danger p-1 hover:bg-red-500/10 rounded flex items-center gap-1"
                  title="حذف هذا الصنف"
                >
                  <Trash2 :size="16" />
                  <span>حذف الصنف</span>
                </button>
              </div>
            </div>

            <!-- Total Weight & Order Summary Card -->
            <div class="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex flex-wrap justify-between items-center gap-4 text-sm font-bold mt-4">
              <span class="text-secondary">عدد الأصناف: <b class="text-primary">{{ orderItems.length }}</b></span>
              <span>إجمالي الوزن: <span class="text-brand text-base">{{ calculatedTotalKg.toLocaleString() }} كجم</span></span>
              <span>الإجمالي الكلي للطلب: <span class="text-emerald-600 text-lg font-extrabold">{{ calculatedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} ريال</span></span>
            </div>
          </div>
        </div>

        <!-- Error Message Banner -->
        <div v-if="errorMsg" class="p-3 text-danger bg-red-500/10 border border-[var(--danger)]/20 rounded-lg">
          {{ errorMsg }}
        </div>

        <!-- Submit Controls -->
        <div class="flex justify-end gap-4 mt-4">
          <button type="button" @click="$router.back()" class="btn btn-ghost">إلغاء</button>
          <button type="submit" class="btn btn-primary px-8" :disabled="submitting">
            <span v-if="submitting" class="loader small mr-2 inline-block"></span>
            {{ submitting ? 'جاري الإنشاء...' : 'تأكيد وحفظ الطلب' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: إدارية إضافة وتعديل الطلبات متعددة الأصناف ودعم وحدات الأوزان (كجم / طن)
// السياق: يتيح لمنسق المبيعات تحديد كميات الأوزان بالكيلوجرام والطن مع التحويل التلقائي
// ==============================================================================
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Plus, Trash2 } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { useToastStore } from '../../store/toast'

const router = useRouter()
const toast = useToastStore()
const loadingCore = ref(true)
const submitting = ref(false)
const errorMsg = ref('')

const clientsList = ref([])
const productsList = ref([])

const newOrder = ref({ 
  client_name: '',
  delivery_type: 'delivery',
  pickup_driver_name: '',
  pickup_vehicle_plate: ''
})

// قائمة الأصناف الديناميكية للطلب
const orderItems = ref([
  { product_name: '', quantity: '', unit: 'kg', price_per_unit: '' }
])

const calculatedTotalKg = computed(() => {
  return orderItems.value.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    if (item.unit === 'ton') {
      return sum + (qty * 1000)
    }
    return sum + qty
  }, 0)
})

const calculatedTotalAmount = computed(() => {
  return orderItems.value.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.price_per_unit) || 0
    return sum + (qty * price)
  }, 0)
})

// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: إضافة صنف جديد لقائمة الأصناف
// السياق: تزويد النموذج بدعم الأصناف المتعددة واسعار الوحدة لكل صنف
// ==============================================================================
const addItem = () => {
  orderItems.value.push({ product_name: '', quantity: '', unit: 'kg', price_per_unit: '' })
}

// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: حذف صنف محدد مع حظر إزالة الصنف الأخير
// السياق: يضمن بقاء صنف واحد على الأقل داخل الطلب
// ==============================================================================
const removeItem = (index) => {
  if (orderItems.value.length > 1) {
    orderItems.value.splice(index, 1)
  }
}

// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: جلب البيانات الأساسية للعملاء والمنتجات
// ==============================================================================
const fetchCoreData = async () => {
  loadingCore.value = true
  try {
    const [clientsRes, productsRes] = await Promise.all([
      omsApi.get('/api/core/clients'),
      omsApi.get('/api/core/products')
    ])
    clientsList.value = clientsRes.data
    productsList.value = productsRes.data
  } catch (error) {
    console.error('Error fetching core data:', error)
    toast.danger('فشل في تحميل قائمة العملاء والمنتجات')
  } finally {
    loadingCore.value = false
  }
}

// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: فحص وإرسال بيانات الطلب متعدد الأصناف إلى الباك اند
// ==============================================================================
const submitOrder = async () => {
  errorMsg.value = ''

  if (!newOrder.value.client_name || !newOrder.value.client_name.trim()) {
    errorMsg.value = 'يرجى إدخال اسم العميل'
    return
  }

  // التحقق من كافة الأصناف المضافة
  const formattedItems = []
  for (let i = 0; i < orderItems.value.length; i++) {
    const item = orderItems.value[i]
    const qty = Number(item.quantity)
    const unitPrice = Number(item.price_per_unit)

    if (!item.product_name || !item.product_name.trim()) {
      errorMsg.value = `يرجى تحديد اسم المنتج للصنف رقم #${i + 1}`
      return
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      errorMsg.value = `الكمية للصنف رقم #${i + 1} يجب أن تكون رقماً موجباً أكبر من صفر`
      return
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      errorMsg.value = `سعر الوحدة للصنف رقم #${i + 1} يجب أن يكون رقماً موجباً أكبر من صفر`
      return
    }

    formattedItems.push({
      product_name: item.product_name.trim(),
      quantity: qty,
      unit: item.unit,
      price_per_unit: unitPrice
    })
  }

  submitting.value = true
  try {
    const res = await omsApi.post('/api/orders', {
      client_name: newOrder.value.client_name.trim(),
      delivery_type: newOrder.value.delivery_type,
      pickup_driver_name: newOrder.value.pickup_driver_name,
      pickup_vehicle_plate: newOrder.value.pickup_vehicle_plate,
      items: formattedItems
    })

    toast.success('تم إنشاء طلب التوريد بنجاح!')
    const createdOrder = res.data.order || res.data
    router.push({ name: 'SharedOrderDetail', params: { id: createdOrder.id } })
  } catch (error) {
    const errText = error.response?.data?.error || 'حدث خطأ أثناء الإنشاء، يرجى المحاولة مرة أخرى.'
    errorMsg.value = errText
    toast.danger(errText)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCoreData()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
.loader.small { width: 16px; height: 16px; border-width: 2px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
html[dir="ltr"] .mr-2 { margin-right: 0.5rem; margin-left: 0; }
html[dir="rtl"] .mr-2 { margin-left: 0.5rem; margin-right: 0; }
</style>
