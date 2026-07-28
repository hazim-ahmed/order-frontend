<!-- ==============================================================================
تاريخ التعديل: 2026-07-22
الوظيفة: واجهة إدارة المستخدمين وإعداد الصلاحيات للآدمن
السياق: استبدال alert بـ Toast Store الموحد وإتاحة تعديل وتفعيل/تعطيل الحسابات
مرجع الأمان وتجربة المستخدم: Frontend Audit Section 14 & Phase 4.1 UX Refactoring
============================================================================== -->
<template>
  <div class="admin-users animate-slide-up">
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold">{{ $t('nav.users') || 'إدارة المستخدمين' }}</h2>
        <p class="text-secondary mt-1">إنشاء، تعديل، وإدارة صلاحيات النظام</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary flex items-center gap-2">
        <Plus :size="18" />
        إضافة مستخدم جديد
      </button>
    </div>

    <!-- Filters -->
    <div class="glass-card mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="form-group mb-0">
        <label class="text-sm text-secondary mb-1 block">بحث حر</label>
        <input type="text" v-model="filters.search" class="form-input w-full" placeholder="الاسم، اسم المستخدم...">
      </div>
      <div class="form-group mb-0">
        <label class="text-sm text-secondary mb-1 block">تصفية حسب الدور</label>
        <select v-model="filters.role" class="form-input w-full">
          <option value="">كل الأدوار</option>
          <option value="admin">مدير نظام (Admin)</option>
          <option value="sales_manager">مدير مبيعات</option>
          <option value="sales_rep">مندوب مبيعات</option>
          <option value="inventory_manager">أمين مخزن</option>
          <option value="driver">سائق</option>
        </select>
      </div>
      <div class="form-group mb-0">
        <label class="text-sm text-secondary mb-1 block">الحالة</label>
        <select v-model="filters.status" class="form-input w-full">
          <option value="">الكل</option>
          <option value="active">نشط</option>
          <option value="inactive">معطل</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center mt-8">
      <div class="loader"></div>
    </div>

    <div v-else class="glass-card overflow-x-auto">
      <table class="w-full text-start">
        <thead>
          <tr class="text-secondary border-b border-[var(--border-color)]">
            <th class="p-3 text-start">الاسم الكامل</th>
            <th class="p-3 text-start">اسم المستخدم</th>
            <th class="p-3 text-start">معلومات التواصل</th>
            <th class="p-3 text-start">الدور (الصلاحية)</th>
            <th class="p-3 text-start">الحالة</th>
            <th class="p-3 text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
            <td class="p-3 font-bold">{{ user.name || '-' }}</td>
            <td class="p-3" dir="ltr">{{ user.username }}</td>
            <td class="p-3">
              <div class="text-xs text-secondary flex flex-col gap-1 mt-1">
                <span v-if="user.phone" dir="ltr">{{ user.phone }}</span>
                <span v-if="user.email" dir="ltr">{{ user.email }}</span>
              </div>
            </td>
            <td class="p-3">
              <span class="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                {{ formatRole(user.role) }}
              </span>
            </td>
            <td class="p-3">
              <span :class="['text-xs px-2 py-1 rounded-full', user.is_active ? 'bg-green-500/10 text-success' : 'bg-red-500/10 text-danger']">
                {{ user.is_active ? 'نشط' : 'معطل' }}
              </span>
            </td>
            <td class="p-3 text-center">
              <button @click="openEditModal(user)" class="btn btn-ghost text-info hover:bg-blue-500/10 p-2 rounded-lg ml-2" title="تعديل">
                <Edit :size="18" />
              </button>
              <button @click="toggleUserStatus(user)" :class="['btn btn-ghost p-2 rounded-lg', user.is_active ? 'text-danger hover:bg-red-500/10' : 'text-success hover:bg-green-500/10']" :title="user.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'">
                <Power :size="18" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="p-8 text-center text-secondary">لا يوجد مستخدمين مطابقين للبحث.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- User Modal (Create/Edit) -->
    <div v-if="showModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-md bg-[var(--bg-primary)] p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <UserIcon :size="24" class="text-brand" />
          {{ isEditing ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد' }}
        </h3>
        
        <form @submit.prevent="saveUser">
          <div class="form-group mb-4">
            <label class="text-sm font-bold mb-2 block">الاسم الكامل <span class="text-danger">*</span></label>
            <input type="text" v-model="form.name" class="form-input w-full p-3" required>
          </div>
          
          <div class="form-group mb-4">
            <label class="text-sm font-bold mb-2 block">رقم الهاتف (اختياري)</label>
            <input type="text" v-model="form.phone" class="form-input w-full p-3" dir="ltr" placeholder="+9665...">
          </div>
          
          <div class="form-group mb-4">
            <label class="text-sm font-bold mb-2 block">البريد الإلكتروني (اختياري)</label>
            <input type="email" v-model="form.email" class="form-input w-full p-3 text-left" dir="ltr" placeholder="user@example.com">
          </div>
          
          <div class="form-group mb-4">
            <label class="text-sm font-bold mb-2 block">اسم المستخدم (للدخول) <span class="text-danger">*</span></label>
            <input type="text" v-model="form.username" class="form-input w-full p-3 text-left" dir="ltr" required :disabled="isEditing">
            <p v-if="isEditing" class="text-xs text-secondary mt-1">لا يمكن تغيير اسم المستخدم بعد الإنشاء.</p>
          </div>
          
          <div class="form-group mb-4">
            <label class="text-sm font-bold mb-2 block">كلمة المرور <span v-if="!isEditing" class="text-danger">*</span></label>
            <input type="password" v-model="form.password" class="form-input w-full p-3 text-left" dir="ltr" :required="!isEditing">
            <p v-if="isEditing" class="text-xs text-warning mt-1">اتركه فارغاً إذا لم ترغب بتغيير كلمة المرور.</p>
          </div>
          
          <div class="form-group mb-6">
            <label class="text-sm font-bold mb-2 block">الصلاحية (الدور) <span class="text-danger">*</span></label>
            <select v-model="form.role" class="form-input w-full p-3" required>
              <option value="admin">مدير نظام (Admin)</option>
              <option value="sales_manager">مدير مبيعات</option>
              <option value="sales_rep">مندوب مبيعات</option>
              <option value="inventory_manager">أمين مخزن</option>
              <option value="driver">سائق</option>
            </select>
          </div>
          
          <div v-if="actionError" class="mb-6 p-3 text-danger bg-red-500/10 rounded-lg text-sm">
            {{ actionError }}
          </div>
          
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary flex-1 py-3" :disabled="actionLoading">
              <span v-if="actionLoading" class="loader small inline-block mr-2"></span>
              {{ isEditing ? 'حفظ التعديلات' : 'إضافة المستخدم' }}
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
// الوظيفة: منطق تفاعلي لإدارة حسابات المستخدمين واستبدال alerts بـ Toast
// السياق: تم استخدام Toast Store الموحد لتحسين الاستجابة البصرية وتفادي النوافذ التنبيهية القاسية
// ==============================================================================
import { ref, onMounted, computed } from 'vue'
import { Plus, Edit, Power, User as UserIcon } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { useToastStore } from '../../store/toast'

const toast = useToastStore()
const loading = ref(true)
const actionLoading = ref(false)
const users = ref([])

const filters = ref({
  search: '',
  role: '',
  status: ''
})

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const currentUserId = ref(null)
const actionError = ref('')

const form = ref({
  name: '',
  username: '',
  password: '',
  phone: '',
  email: '',
  role: 'sales_rep'
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await omsApi.get('/api/users')
    users.value = Array.isArray(response.data) ? response.data : (response.data.users || [])
  } catch (error) {
    console.error('Error fetching users:', error)
    toast.danger('فشل في جلب قائمة المستخدمين من الخادم')
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const roleMatch = !filters.value.role || u.role === filters.value.role
    const statusMatch = !filters.value.status || 
      (filters.value.status === 'active' ? u.is_active : !u.is_active)
    
    const term = filters.value.search.toLowerCase()
    const searchMatch = !term || 
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term))
      
    return roleMatch && statusMatch && searchMatch
  })
})

const openCreateModal = () => {
  isEditing.value = false
  currentUserId.value = null
  form.value = { name: '', username: '', password: '', phone: '', email: '', role: 'sales_rep' }
  actionError.value = ''
  showModal.value = true
}

const openEditModal = (user) => {
  isEditing.value = true
  currentUserId.value = user.id
  form.value = { 
    name: user.name || '', 
    username: user.username, 
    password: '', 
    phone: user.phone || '',
    email: user.email || '',
    role: user.role 
  }
  actionError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveUser = async () => {
  actionLoading.value = true
  actionError.value = ''
  
  try {
    const payload = { ...form.value }
    if (isEditing.value && !payload.password) {
      delete payload.password
    }
    
    if (isEditing.value) {
      await omsApi.put(`/api/users/${currentUserId.value}`, payload)
      toast.success('تم حفظ تعديلات المستخدم بنجاح!')
    } else {
      await omsApi.post('/api/users', payload)
      toast.success('تم إضافة المستخدم الجديد بنجاح!')
    }
    
    closeModal()
    await fetchUsers()
  } catch (error) {
    const msg = error.response?.data?.error || 'حدث خطأ غير متوقع أثناء الحفظ.'
    actionError.value = msg
    toast.danger(msg)
  } finally {
    actionLoading.value = false
  }
}

const toggleUserStatus = async (user) => {
  try {
    await omsApi.put(`/api/users/${user.id}`, { is_active: !user.is_active })
    toast.success(`تم ${!user.is_active ? 'تفعيل' : 'تعطيل'} حساب المستخدم ${user.username} بنجاح`)
    await fetchUsers()
  } catch (error) {
    toast.danger(error.response?.data?.error || 'حدث خطأ أثناء تغيير حالة الحساب')
  }
}

const formatRole = (role) => {
  const map = {
    'admin': 'مدير نظام',
    'sales_manager': 'مدير مبيعات',
    'sales_rep': 'مندوب مبيعات',
    'inventory_manager': 'أمين مخزن',
    'driver': 'سائق'
  }
  return map[role] || role
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
.loader.small { border-left-color: currentColor; width: 16px; height: 16px; border-width: 2px; margin: 0; vertical-align: middle; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
html[dir="rtl"] .mr-2 { margin-left: 0.5rem; margin-right: 0; }
html[dir="rtl"] .ml-2 { margin-left: 0; margin-right: 0.5rem; }
</style>
