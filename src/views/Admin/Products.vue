<!-- ==============================================================================
تاريخ التعديل: 2026-07-22
الوظيفة: واجهة إدارة المنتجات والمزامنة مع الـ ERP والـ Toast Store
السياق: استبدال alert و confirm بـ Toast Store الموحد لرفع جودة واستقرار الواجهة
مرجع الأمان وتجربة المستخدم: Frontend Audit Section 14 & Phase 4.1 UX Refactoring
============================================================================== -->
<template>
  <div class="admin-products animate-slide-up">
    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-primary mb-1">المنتجات</h1>
        <p class="text-secondary text-sm">إدارة كتالوج المنتجات وتحديث الكميات والأسعار</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button class="btn btn-outline border-red-500/30 text-danger hover:bg-red-500/10 flex items-center gap-2" @click="openDeleteAllModal" :disabled="products.length === 0">
          <Trash2 :size="18" />
          حذف كافة المنتجات
        </button>
        <button class="btn btn-outline border-[var(--border-color)] flex items-center gap-2" @click="openErpModal">
          <RefreshCw :size="18" />
          مزامنة مع ERP
        </button>
        <button class="btn btn-primary shadow-lg flex items-center gap-2" @click="openAddModal">
          <Plus :size="18" />
          إضافة منتج جديد
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="form-group mb-0">
          <label class="text-xs text-secondary font-bold uppercase tracking-wider mb-2 block">بحث باسم المنتج</label>
          <input type="text" v-model="searchQuery" class="form-input" placeholder="اسم المنتج...">
        </div>

        <div class="form-group mb-0">
          <label class="text-xs text-secondary font-bold uppercase tracking-wider mb-2 block">عرض وحالة الكميات</label>
          <select v-model="stockFilter" class="form-input w-full font-bold text-brand">
            <option value="stock_desc">الأعلى كمية أولاً (الافتراضي)</option>
            <option value="available_only">المنتجات المتوفرة فقط (الكمية > 0)</option>
            <option value="out_of_stock">المنتجات النفاذة (الكمية = 0)</option>
            <option value="stock_asc">الأقل كمية أولاً</option>
          </select>
        </div>

        <div class="form-group mb-0 flex items-end">
          <button @click="resetFilters" class="btn btn-outline w-full h-[46px]">
            إعادة ضبط الفلاتر
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center mt-12">
      <div class="loader"></div>
    </div>

    <div v-else class="glass-card p-0 overflow-hidden">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المنتج</th>
              <th>القسم</th>
              <th>وحدة القياس</th>
              <th>السعر (SAR / كجم)</th>
              <th>المخزون المتوفر (كجم)</th>
              <th>الحالة</th>
              <th class="text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td data-label="#" class="font-bold text-muted">{{ product.id }}</td>
              <td data-label="اسم المنتج" class="font-bold text-brand">{{ product.name }}</td>
              <td data-label="القسم" class="text-secondary">{{ product.category_id ? categories.find(c => c.id === product.category_id)?.name : 'غير محدد' }}</td>
              <td data-label="وحدة القياس">
                <span class="badge badge-info text-xs">
                  {{ product.unit === 'kg' ? 'كجم (كيلوجرام)' : 'كجم (أساسي)' }}
                </span>
              </td>
              <td data-label="السعر" class="font-bold text-success" dir="ltr">
                {{ product.unit === 'kg' ? Number(product.current_price_per_ton).toFixed(2) : (Number(product.current_price_per_ton) / 1000).toFixed(2) }} SAR / كجم
              </td>
              <td data-label="المخزون" class="font-bold text-primary" dir="ltr" :class="Number(product.stock_quantity) < 10 ? 'text-danger' : ''">
                {{ (Number(product.stock_quantity || 0) * (product.unit === 'kg' ? 1 : 1000)).toLocaleString() }} كجم
                
              </td>
              <td data-label="الحالة">
                <span :class="['badge', product.is_active ? 'badge-success' : 'badge-danger']">
                  {{ product.is_active ? 'نشط' : 'غير نشط' }}
                </span>
              </td>
              <td data-label="إجراءات" class="text-center">
                <button @click="openEditModal(product)" class="btn-ghost text-info hover:bg-blue-500/10 p-2 rounded-md transition-colors" title="تعديل">
                  <Edit :size="18" />
                </button>
                <button @click="deleteProduct(product.id)" class="btn-ghost text-danger hover:bg-red-500/10 p-2 rounded-md transition-colors mr-2" title="حذف">
                  <Trash2 :size="18" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="8">
                <div class="empty-state py-12">
                  <div class="empty-state-icon">
                    <Package :size="32" class="text-brand" />
                  </div>
                  <h4 class="text-lg font-bold">لا توجد منتجات</h4>
                  <p class="text-secondary text-sm">جرب تغيير البحث، إدخال المزامنة، أو إضافة منتج جديد.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Product Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-lg bg-[var(--bg-primary)] p-6">
        <h3 class="text-xl font-bold mb-6 text-brand">
          {{ isEditing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد' }}
        </h3>
        
        <form @submit.prevent="saveProduct">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group md:col-span-2">
              <label class="text-sm font-bold mb-2 block">اسم المنتج <span class="text-danger">*</span></label>
              <input v-model="formData.name" type="text" class="form-input w-full" required placeholder="أدخل اسم المنتج">
            </div>
            
            <div class="form-group md:col-span-2">
              <label class="text-sm font-bold mb-2 block">القسم <span class="text-danger">*</span></label>
              <select v-model="formData.category_id" class="form-input w-full" required>
                <option value="">اختر القسم...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">وحدة القياس المعتمدة <span class="text-xs text-brand font-normal">(الأساسية كجم)</span></label>
              <select v-model="formData.unit" class="form-input w-full font-bold text-brand">
                <option value="kg">📦 كيلوجرام (كجم) - الوحدة الأساسية</option>
                <option value="ton">⚖️ طن (Ton)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">السعر (SAR) <span class="text-danger">*</span></label>
              <input v-model="formData.current_price_per_ton" type="number" step="0.01" min="0" class="form-input w-full" required placeholder="0.00">
            </div>
            
            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">الكمية الافتتاحية في المخزون (كجم)</label>
              <input v-model="formData.stock_quantity" type="number" step="0.001" min="0" class="form-input w-full" placeholder="0.000">
            </div>
            
            <div class="form-group md:col-span-2 mb-6">
              <label class="text-sm font-bold mb-2 block">الوصف</label>
              <textarea v-model="formData.description" class="form-input w-full" rows="2" placeholder="وصف المنتج (اختياري)"></textarea>
            </div>

            <div class="form-group md:col-span-2 mb-6 flex items-center gap-2">
              <input type="checkbox" id="isActive" v-model="formData.is_active" class="form-input w-5 h-5 rounded">
              <label for="isActive" class="text-sm font-bold cursor-pointer">المنتج نشط ومتاح للطلب</label>
            </div>
          </div>
          
          <div v-if="formError" class="mb-4 p-3 text-danger bg-red-500/10 rounded-lg text-sm">
            {{ formError }}
          </div>
          
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary flex-1 py-3" :disabled="saving">
              <span v-if="saving" class="loader small inline-block mr-2"></span>
              حفظ المنتج
            </button>
            <button type="button" @click="closeModal" class="btn btn-ghost flex-1 border border-[var(--border-color)]">إلغاء</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ERP Sync Modal -->
    <div v-if="showErpModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-lg bg-[var(--bg-primary)] p-6">
        <h3 class="text-xl font-bold mb-2 text-brand flex items-center gap-2">
          <RefreshCw :size="24" />
          مزامنة المنتجات مع ERP
        </h3>
        <p class="text-sm text-secondary mb-6">يرجى إدخال بيانات الدخول الخاصة بنظام الـ ERP لجلب المنتجات وتحديثها.</p>
        
        <form @submit.prevent="syncErp">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="form-group md:col-span-2">
              <label class="text-sm font-bold mb-2 block">رابط الـ API الأساسي (Base URL) <span class="text-xs text-muted font-normal">(اختياري - مدمج افتراضياً للنظام)</span></label>
              <input v-model="erpForm.baseUrl" type="url" class="form-input w-full" dir="ltr" placeholder="https://smarterp.top/api/v3">
            </div>
            
            <div class="form-group md:col-span-2">
              <label class="text-sm font-bold mb-2 block">اسم الشركة (Company Name) <span class="text-danger">*</span></label>
              <input v-model="erpForm.login_company" type="text" class="form-input w-full" dir="ltr" required placeholder="مثال: شركة الأمل">
            </div>

            <div class="form-group md:col-span-2">
              <label class="text-sm font-bold mb-2 block">القسم المرتبط في النظام الرئيسي <span class="text-danger">*</span></label>
              <select v-model="erpForm.category_id" class="form-input w-full" required>
                <option :value="3">القسم رقم 3 (افتراضي الـ ERP)</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }} (ID: {{ cat.id }})
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">اسم المستخدم <span class="text-danger">*</span></label>
              <input v-model="erpForm.username" type="text" class="form-input w-full" dir="ltr" required>
            </div>
            
            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">كلمة المرور <span class="text-danger">*</span></label>
              <input v-model="erpForm.password" type="password" class="form-input w-full" dir="ltr" required>
            </div>
          </div>
          
          <div v-if="erpError" class="mb-4 p-3 text-danger bg-red-500/10 rounded-lg text-sm">
            {{ erpError }}
          </div>
          
          <div v-if="erpSuccess" class="mb-4 p-3 text-success bg-green-500/10 rounded-lg text-sm font-bold">
            {{ erpSuccess }}
          </div>
          
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary flex-1 py-3" :disabled="syncing">
              <span v-if="syncing" class="loader small inline-block mr-2"></span>
              {{ syncing ? 'جاري المزامنة...' : 'بدء المزامنة' }}
            </button>
            <button type="button" @click="closeErpModal" class="btn btn-ghost flex-1 border border-[var(--border-color)]">إغلاق</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete All Confirmation Modal -->
    <div v-if="showDeleteAllModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="glass-card w-full max-w-md bg-[var(--bg-primary)] p-6 text-center shadow-2xl border border-red-500/30">
        <div class="w-16 h-16 bg-red-500/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertTriangle :size="36" />
        </div>
        <h3 class="text-xl font-bold mb-2 text-danger">تأكيد حذف جميع المنتجات</h3>
        <p class="text-sm text-secondary mb-6 leading-relaxed">
          هل أنت تأكد من رغبتك في حذف <strong>كافة المنتجات ({{ products.length }} منتج)</strong> بشكل نهائي من القاعدة؟
          <br>
          <span class="text-xs text-muted mt-2 block">تنبيه: هذا الإجراء غير قابل للتراجع عنه ويزيل كامل الأصناف.</span>
        </p>

        <div v-if="deleteAllError" class="mb-4 p-3 text-danger bg-red-500/10 rounded-lg text-sm">
          {{ deleteAllError }}
        </div>

        <div class="flex gap-3">
          <button @click="confirmDeleteAll" class="btn bg-red-600 hover:bg-red-700 text-white flex-1 py-3 font-bold" :disabled="deletingAll">
            <span v-if="deletingAll" class="loader small inline-block mr-2"></span>
            {{ deletingAll ? 'جاري الحذف...' : 'نعم، قم بحذف الكل' }}
          </button>
          <button @click="closeDeleteAllModal" class="btn btn-ghost flex-1 border border-[var(--border-color)]" :disabled="deletingAll">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: المنطق التفاعلي لكتالوج المنتجات والمزامنة مع ERP باستخدام Toast
// السياق: تم استخدام Toast Store الموحد لاستبدال النوافذ البدائية وتوفير استجابة بصرية مريحة
// ==============================================================================
import { ref, onMounted, computed } from 'vue'
import { Plus, Package, Edit, Trash2, RefreshCw, AlertTriangle } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { useToastStore } from '../../store/toast'

const toast = useToastStore()
const loading = ref(true)
const products = ref([])
const categories = ref([])
const searchQuery = ref('')
const stockFilter = ref('stock_desc')

const resetFilters = () => {
  searchQuery.value = ''
  stockFilter.value = 'stock_desc'
}

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)
const saving = ref(false)
const formError = ref('')
const formData = ref({
  name: '',
  description: '',
  unit: 'kg',
  current_price_per_ton: '',
  stock_quantity: 0,
  category_id: '',
  is_active: true
})

// ERP Modal State
const showErpModal = ref(false)
const syncing = ref(false)
const erpError = ref('')
const erpSuccess = ref('')
const erpForm = ref({
  baseUrl: 'https://smarterp.top/api/v3',
  login_company: '',
  username: '',
  password: '',
  category_id: 3,
  app_type: 'desktop',
  app_version: '1.0.0'
})

// Delete All Modal State
const showDeleteAllModal = ref(false)
const deletingAll = ref(false)
const deleteAllError = ref('')

const fetchProducts = async () => {
  loading.value = true
  try {
    const [prodRes, catRes] = await Promise.all([
      omsApi.get('/api/products'),
      omsApi.get('/api/categories')
    ])
    products.value = prodRes.data.products || []
    categories.value = catRes.data || []
  } catch (err) {
    console.error('Error fetching data:', err)
    toast.danger('فشل في جلب قائمة المنتجات')
  } finally {
    loading.value = false
  }
}

const filteredProducts = computed(() => {
  let list = [...products.value]

  // 1. تصفية حسب حالة المخزون
  if (stockFilter.value === 'available_only') {
    list = list.filter(p => Number(p.stock_quantity) > 0)
  } else if (stockFilter.value === 'out_of_stock') {
    list = list.filter(p => Number(p.stock_quantity) <= 0)
  }

  // 2. تصفية حسب البحث النصي
  if (searchQuery.value.trim()) {
    const term = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => p.name.toLowerCase().includes(term))
  }

  // 3. الترتيب
  return list.sort((a, b) => {
    const stockA = Number(a.stock_quantity) || 0
    const stockB = Number(b.stock_quantity) || 0

    if (stockFilter.value === 'stock_asc') {
      return stockA - stockB
    }
    return stockB - stockA
  })
})

const openAddModal = () => {
  isEditing.value = false
  currentId.value = null
  formError.value = ''
  formData.value = {
    name: '',
    description: '',
    unit: 'kg',
    current_price_per_ton: '',
    stock_quantity: 0,
    category_id: '',
    is_active: true
  }
  showModal.value = true
}

const openEditModal = (product) => {
  isEditing.value = true
  currentId.value = product.id
  formError.value = ''
  formData.value = {
    name: product.name,
    description: product.description || '',
    unit: product.unit || 'kg',
    current_price_per_ton: product.current_price_per_ton,
    stock_quantity: product.stock_quantity,
    category_id: product.category_id || '',
    is_active: product.is_active !== undefined ? product.is_active : true
  }
  showModal.value = true
}


const closeModal = () => {
  showModal.value = false
}

const saveProduct = async () => {
  saving.value = true
  formError.value = ''
  try {
    if (isEditing.value) {
      await omsApi.put(`/api/products/${currentId.value}`, formData.value)
      toast.success('تم تعديل بيانات المنتج بنجاح!')
    } else {
      await omsApi.post('/api/products', formData.value)
      toast.success('تم إضافة المنتج الجديد بنجاح!')
    }
    closeModal()
    fetchProducts()
  } catch (err) {
    const msg = err.response?.data?.error || 'حدث خطأ أثناء الحفظ.'
    formError.value = msg
    toast.danger(msg)
  } finally {
    saving.value = false
  }
}

const deleteProduct = async (id) => {
  try {
    await omsApi.delete(`/api/products/${id}`)
    toast.success('تم حذف المنتج بنجاح')
    fetchProducts()
  } catch (err) {
    toast.danger(err.response?.data?.error || 'حدث خطأ أثناء الحذف. تأكد من أن المنتج غير مرتبط بطلبات.')
  }
}

const openErpModal = () => {
  syncing.value = false
  erpError.value = ''
  erpSuccess.value = ''
  if (!erpForm.value.category_id) {
    erpForm.value.category_id = 3
  }
  showErpModal.value = true
}

const closeErpModal = () => {
  syncing.value = false
  showErpModal.value = false
}

const syncErp = async () => {
  if (syncing.value) return
  syncing.value = true
  erpError.value = ''
  erpSuccess.value = ''
  try {
    const res = await omsApi.post('/api/products/sync-erp', erpForm.value)
    const successMsg = res.data.message || 'تمت المزامنة مع ERP بنجاح'
    erpSuccess.value = successMsg
    toast.success(successMsg)
    await fetchProducts()
  } catch (err) {
    const errMsg = err.response?.data?.error || err.response?.data?.details || 'حدث خطأ أثناء الاتصال بالـ ERP'
    erpError.value = errMsg
    toast.danger(errMsg)
  } finally {
    syncing.value = false
  }
}

// Delete All Handlers
const openDeleteAllModal = () => {
  deleteAllError.value = ''
  deletingAll.value = false
  showDeleteAllModal.value = true
}

const closeDeleteAllModal = () => {
  if (deletingAll.value) return
  showDeleteAllModal.value = false
}

const confirmDeleteAll = async () => {
  deletingAll.value = true
  deleteAllError.value = ''
  try {
    const res = await omsApi.delete('/api/products/clear-all')
    toast.success(res.data.message || 'تم حذف المنتجات بنجاح')
    closeDeleteAllModal()
    fetchProducts()
  } catch (err) {
    const errMsg = err.response?.data?.error || 'حدث خطأ أثناء تنفيذ عملية حذف الكل.'
    deleteAllError.value = errMsg
    toast.danger(errMsg)
  } finally {
    deletingAll.value = false
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.loader.small { border-left-color: currentColor; width: 16px; height: 16px; border-width: 2px; margin: 0; vertical-align: middle; }
</style>
