<!-- ==============================================================================
تاريخ التعديل: 2026-07-22
الوظيفة: واجهة إدارة الأقسام والتصنيفات واستبدال alert بـ Toast
السياق: تحسين استجابة الواجهة وإخطار المستخدم عبر التنبيهات المنبثقة المخصصة
مرجع الأمان وتجربة المستخدم: Frontend Audit Section 14 & Phase 4.1 UX Refactoring
============================================================================== -->
<template>
  <div class="admin-categories animate-slide-up">
    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-primary mb-1">الأقسام</h1>
        <p class="text-secondary text-sm">إدارة تصنيفات وأقسام المنتجات</p>
      </div>
      <button class="btn btn-primary shadow-lg flex items-center gap-2" @click="openAddModal">
        <Plus :size="18" />
        إضافة قسم جديد
      </button>
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
              <th>اسم القسم</th>
              <th>الوصف</th>
              <th class="text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id">
              <td class="font-bold text-muted">{{ category.id }}</td>
              <td class="font-bold text-brand">{{ category.name }}</td>
              <td class="text-secondary">{{ category.description || 'لا يوجد وصف' }}</td>
              <td class="text-center">
                <button @click="openEditModal(category)" class="btn-ghost text-info hover:bg-blue-500/10 p-2 rounded-md transition-colors" title="تعديل">
                  <Edit :size="18" />
                </button>
                <button @click="deleteCategory(category.id)" class="btn-ghost text-danger hover:bg-red-500/10 p-2 rounded-md transition-colors mr-2" title="حذف">
                  <Trash2 :size="18" />
                </button>
              </td>
            </tr>
            <tr v-if="categories.length === 0">
              <td colspan="4">
                <div class="empty-state py-12">
                  <div class="empty-state-icon">
                    <Folders :size="32" class="text-brand" />
                  </div>
                  <h4 class="text-lg font-bold">لا توجد أقسام</h4>
                  <p class="text-secondary text-sm">لم يتم إضافة أي قسم حتى الآن.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-md bg-[var(--bg-primary)] p-6">
        <h3 class="text-xl font-bold mb-6 text-brand">
          {{ isEditing ? 'تعديل بيانات القسم' : 'إضافة قسم جديد' }}
        </h3>
        
        <form @submit.prevent="saveCategory">
          <div class="form-group">
            <label class="text-sm font-bold mb-2 block">اسم القسم <span class="text-danger">*</span></label>
            <input v-model="formData.name" type="text" class="form-input w-full" required placeholder="أدخل اسم القسم">
          </div>
          
          <div class="form-group mb-6">
            <label class="text-sm font-bold mb-2 block">الوصف</label>
            <textarea v-model="formData.description" class="form-input w-full" rows="3" placeholder="أدخل وصف القسم (اختياري)"></textarea>
          </div>
          
          <div v-if="formError" class="mb-4 p-3 text-danger bg-red-500/10 rounded-lg text-sm">
            {{ formError }}
          </div>
          
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary flex-1 py-3" :disabled="saving">
              <span v-if="saving" class="loader small inline-block mr-2"></span>
              حفظ القسم
            </button>
            <button type="button" @click="closeModal" class="btn btn-ghost flex-1 border border-[var(--border-color)]">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: المنطق التفاعلي لإدارة الأقسام واستبدال alert بـ Toast Store
// السياق: تم استخدام Toast Store الموحد لرفع جودة تجربة المستخدم
// ==============================================================================
import { ref, onMounted } from 'vue'
import { Plus, Folders, Edit, Trash2 } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { useToastStore } from '../../store/toast'

const toast = useToastStore()
const loading = ref(true)
const categories = ref([])

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)
const saving = ref(false)
const formError = ref('')
const formData = ref({
  name: '',
  description: ''
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await omsApi.get('/api/categories')
    categories.value = res.data
  } catch (err) {
    console.error('Error fetching categories:', err)
    toast.danger('فشل في جلب الأقسام')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  currentId.value = null
  formError.value = ''
  formData.value = { name: '', description: '' }
  showModal.value = true
}

const openEditModal = (category) => {
  isEditing.value = true
  currentId.value = category.id
  formError.value = ''
  formData.value = { name: category.name, description: category.description || '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveCategory = async () => {
  saving.value = true
  formError.value = ''
  try {
    if (isEditing.value) {
      await omsApi.put(`/api/categories/${currentId.value}`, formData.value)
      toast.success('تم تعديل بيانات القسم بنجاح!')
    } else {
      await omsApi.post('/api/categories', formData.value)
      toast.success('تم إضافة القسم الجديد بنجاح!')
    }
    closeModal()
    fetchCategories()
  } catch (err) {
    const msg = err.response?.data?.error || 'حدث خطأ أثناء الحفظ.'
    formError.value = msg
    toast.danger(msg)
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (id) => {
  try {
    await omsApi.delete(`/api/categories/${id}`)
    toast.success('تم حذف القسم بنجاح!')
    fetchCategories()
  } catch (err) {
    toast.danger(err.response?.data?.error || 'حدث خطأ أثناء الحذف.')
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.loader.small { border-left-color: currentColor; width: 16px; height: 16px; border-width: 2px; margin: 0; vertical-align: middle; }
</style>
