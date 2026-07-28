<template>
  <div class="crud-manager animate-slide-up">
    <div class="header-section mb-4 flex justify-between items-center">
      <div>
        <h2>إدارة بيانات ({{ resourceName }})</h2>
        <p class="text-secondary">إضافة، تعديل وحذف البيانات يدوياً</p>
      </div>
      <div>
        <button class="btn btn-primary" @click="openFormModal()">+ إضافة جديد</button>
        <button class="btn btn-secondary ml-2" @click="$router.push('/admin')">عودة للرئيسية</button>
      </div>
    </div>

    <div v-if="loading" class="text-center mt-4">
      <div class="loader"></div>
    </div>

    <div v-else class="glass-card table-responsive">
      <table class="table w-100" v-if="data.length > 0">
        <thead>
          <tr>
            <th v-for="key in visibleKeys" :key="key">{{ formatHeader(key) }}</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data" :key="item.id">
            <td v-for="key in visibleKeys" :key="key">{{ item[key] }}</td>
            <td class="flex gap-2">
              <button class="btn btn-sm btn-info" @click="openFormModal(item)">تعديل</button>
              <button class="btn btn-sm btn-danger" @click="deleteItem(item.id)">حذف</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="text-center text-secondary py-4">
        لا توجد بيانات متاحة حالياً.
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showModal" class="modal-backdrop flex items-center justify-center">
      <div class="glass-card" style="width: 100%; max-width: 500px; background: var(--bg-secondary);">
        <h3 class="mb-4">{{ editMode ? 'تعديل البيانات' : 'إضافة بيانات جديدة' }}</h3>
        
        <form @submit.prevent="saveData">
          <div v-for="key in formKeys" :key="key" class="form-group mb-3">
            <label class="mb-2 block">{{ formatHeader(key) }}</label>
            <input v-if="typeof formData[key] === 'number'" type="number" step="any" v-model.number="formData[key]" class="form-input" required>
            <textarea v-else-if="key === 'address' || key.includes('description')" v-model="formData[key]" class="form-input" rows="3"></textarea>
            <input v-else type="text" v-model="formData[key]" class="form-input" required>
          </div>
          
          <div v-if="actionError" class="mb-3 text-danger">
            {{ actionError }}
          </div>

          <div class="flex gap-4 mt-4">
            <button type="submit" class="btn btn-primary" style="flex: 1;" :disabled="saving">
              {{ saving ? 'جاري الحفظ...' : 'حفظ' }}
            </button>
            <button type="button" @click="showModal = false" class="btn btn-secondary" style="flex: 1;">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import omsApi from '../../services/omsApi'

const route = useRoute()
const resource = ref(route.params.resource) // e.g. 'users', 'clients', 'products', 'categories'

const data = ref([])
const loading = ref(true)
const showModal = ref(false)
const editMode = ref(false)
const saving = ref(false)
const actionError = ref('')
const formData = ref({})

// Configurations for specific fields to skip
const hiddenKeys = ['id', 'createdAt', 'updatedAt', 'password', 'role'] // don't show or edit these generically

const resourceName = computed(() => {
  const map = {
    'users': 'المستخدمين',
    'clients': 'العملاء',
    'products': 'المنتجات',
    'categories': 'الأقسام'
  }
  return map[resource.value] || resource.value
})

const visibleKeys = computed(() => {
  if (data.value.length === 0) return []
  return Object.keys(data.value[0]).filter(k => !hiddenKeys.includes(k) && typeof data.value[0][k] !== 'object')
})

const formKeys = computed(() => {
  if (data.value.length > 0) {
     return visibleKeys.value;
  }
  // Default fallbacks if empty
  if(resource.value === 'products') return ['name', 'unit', 'current_price_per_ton', 'stock_quantity']
  if(resource.value === 'clients') return ['name', 'phone', 'address']
  if(resource.value === 'users') return ['name', 'email', 'phone']
  if(resource.value === 'categories') return ['name']
  return ['name']
})

const formatHeader = (key) => {
  const map = {
    'name': 'الاسم',
    'phone': 'رقم الهاتف',
    'address': 'العنوان',
    'unit': 'الوحدة',
    'current_price_per_ton': 'السعر',
    'stock_quantity': 'الكمية',
    'email': 'البريد الإلكتروني'
  }
  return map[key] || key
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await omsApi.get(`/api/${resource.value}`)
    data.value = res.data
  } catch (error) {
    console.error('Error fetching data', error)
  } finally {
    loading.value = false
  }
}

const openFormModal = (item = null) => {
  actionError.value = ''
  if (item) {
    editMode.value = true
    formData.value = { ...item }
  } else {
    editMode.value = false
    formData.value = {}
    formKeys.value.forEach(k => { formData.value[k] = '' })
  }
  showModal.value = true
}

import { useToastStore } from '../../store/toast'

const toast = useToastStore()

const saveData = async () => {
  saving.value = true
  actionError.value = ''
  try {
    if (editMode.value) {
      await omsApi.put(`/api/${resource.value}/${formData.value.id}`, formData.value)
      toast.success('تم حفظ التعديلات بنجاح!')
    } else {
      await omsApi.post(`/api/${resource.value}`, formData.value)
      toast.success('تم إضافة العنصر بنجاح!')
    }
    showModal.value = false
    fetchData()
  } catch (error) {
    const msg = error.response?.data?.error || error.response?.data?.message || 'حدث خطأ أثناء الحفظ'
    actionError.value = msg
    toast.danger(msg)
  } finally {
    saving.value = false
  }
}

const deleteItem = async (id) => {
  try {
    await omsApi.delete(`/api/${resource.value}/${id}`)
    toast.success('تم حذف العنصر بنجاح!')
    fetchData()
  } catch (error) {
    toast.danger('حدث خطأ أثناء الحذف')
  }
}

watch(() => route.params.resource, (newRes) => {
  if (newRes) {
    resource.value = newRes
    fetchData()
  }
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.table-responsive {
  overflow-x: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  padding: 12px;
  text-align: right;
  border-bottom: 1px solid var(--border-color);
}
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.65);
  z-index: 1000;
  padding: 20px;
}
.btn-sm {
  padding: 4px 10px;
  font-size: 0.85rem;
}
.ml-2 {
  margin-left: 0.5rem;
}
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
