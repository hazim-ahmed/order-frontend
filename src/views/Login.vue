<template>
  <div class="login-container">
    <!-- Ambient Orbs -->
    <div class="bg-orb bg-orb-1" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-2" aria-hidden="true"></div>

    <div class="login-card animate-slide-up">
      <!-- Logo & Brand -->
      <div class="text-center mb-8">
        <div class="logo-icon mb-3">
          <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="url(#grad)"/>
            <path d="M10 20 L17 27 L30 13" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stop-color="#6366F1"/>
                <stop offset="100%" stop-color="#4F46E5"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="brand-name">KMT <span class="brand-highlight">OMS</span></h1>
        <p class="brand-subtitle">نظام إدارة الطلبات واللوجستيات الموحد</p>
      </div>

      <form @submit.prevent="handleLogin" novalidate class="flex flex-col gap-4">
        <div class="form-group mb-0">
          <label for="username-input" class="form-label">اسم المستخدم</label>
          <div class="input-wrapper">
            <User class="input-icon" :size="18" />
            <input 
              id="username-input"
              v-model="username" 
              type="text" 
              class="form-input with-icon"
              placeholder="أدخل اسم المستخدم"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="form-group mb-0">
          <label for="password-input" class="form-label">كلمة المرور</label>
          <div class="input-wrapper">
            <Lock class="input-icon" :size="18" />
            <input 
              id="password-input"
              v-model="password" 
              :type="showPassword ? 'text' : 'password'"
              class="form-input with-icon with-icon-end"
              placeholder="أدخل كلمة المرور"
              autocomplete="current-password"
              required
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
              :title="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
            >
              <Eye v-if="!showPassword" :size="16" />
              <EyeOff v-else :size="16" />
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="error-alert animate-fade-in" role="alert">
          <AlertCircle :size="18" class="shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <button 
          type="submit" 
          class="btn btn-primary w-full mt-3 py-3 text-base shadow-lg hover:shadow-indigo-500/25 transition-all" 
          :disabled="loading"
        >
          <span v-if="loading" class="loader loader-sm me-2"></span>
          <LogIn v-else :size="19" class="me-2" />
          {{ loading ? 'جاري التحقق والدخول...' : 'تسجيل الدخول' }}
        </button>
      </form>

      <!-- Quick Fill Role Selector (Test & Demo Helper) -->
      <div v-if="isDev" class="mt-6 pt-5 border-t border-[var(--border-subtle,rgba(255,255,255,0.08))]">
        <p class="text-xs text-secondary text-center mb-3 font-semibold">تعبئة سريعة للتجربة والتعينة:</p>
        <div class="flex flex-wrap gap-1.5 justify-center">
          <button 
            v-for="role in quickRoles" 
            :key="role.username"
            type="button"
            @click="fillAccount(role.username)"
            class="role-pill"
            :title="`تسجيل دخول كـ ${role.label}`"
          >
            <component :is="role.icon" :size="13" class="me-1 opacity-80" />
            {{ role.label }}
          </button>
        </div>
      </div>

      <p class="footer-note">نظام داخلي محمي — الوصول مصرح به فقط للمخوّلين</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { User, Lock, Eye, EyeOff, AlertCircle, LogIn, Shield, Briefcase, Truck, Warehouse, UserCheck } from 'lucide-vue-next'

const isDev        = import.meta.env.DEV
const username     = ref('')
const password     = ref('')
const errorMsg     = ref('')
const loading      = ref(false)
const showPassword = ref(false)

const router    = useRouter()
const authStore = useAuthStore()

const quickRoles = [
  { label: 'مدير النظام', username: 'admin1', icon: Shield },
  { label: 'مدير المبيعات', username: 'manager1', icon: Briefcase },
  { label: 'مندوب المبيعات', username: 'rep1', icon: UserCheck },
  { label: 'أمين المخزن', username: 'inventory1', icon: Warehouse },
  { label: 'السائق', username: 'driver1', icon: Truck }
]

const fillAccount = (user) => {
  if (!isDev) return
  username.value = user
  password.value = '123456'
  errorMsg.value = ''
}

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = 'يرجى إدخال اسم المستخدم وكلمة المرور'
    return
  }

  loading.value  = true
  errorMsg.value = ''
  
  try {
    await authStore.login(username.value, password.value)
    router.push({ name: 'RoleRedirect' })
  } catch (error) {
    errorMsg.value = error.response?.data?.error || 'حدث خطأ في الاتصال بالخادم.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #060A14;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
}

/* Ambient Orbs */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  opacity: 0.28;
}
.bg-orb-1 {
  width: 450px; height: 450px;
  background: radial-gradient(circle, #6366F1, transparent 70%);
  top: -120px; right: -120px;
  animation: float 10s ease-in-out infinite;
}
.bg-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #4F46E5, transparent 70%);
  bottom: -120px; left: -100px;
  animation: float 12s ease-in-out infinite reverse;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(25px, -25px); }
}

/* Clean Solid Card */
.login-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 430px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}

/* Logo & Brand */
.logo-icon {
  width: 56px; height: 56px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 2.1rem;
  font-weight: 800;
  color: #F3F4F6;
  letter-spacing: 1.5px;
  margin-bottom: 0.2rem;
}
.brand-highlight { color: #818CF8; }

.brand-subtitle {
  color: #9CA3AF;
  font-size: 0.875rem;
  font-weight: 400;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #E5E7EB;
  margin-bottom: 0.35rem;
  display: block;
}

/* Input wrappers */
.input-wrapper { position: relative; }

.input-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-start: 14px;
  color: #6B7280;
  pointer-events: none;
}

.form-input.with-icon { padding-inline-start: 2.75rem; }
.form-input.with-icon-end { padding-inline-end: 2.75rem; }

.toggle-password {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-end: 12px;
  color: #6B7280;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: color 0.15s;
  display: flex;
  align-items: center;
}
.toggle-password:hover { color: #9CA3AF; }

.form-input {
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #F3F4F6;
  border-radius: 12px;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  background-color: rgba(255, 255, 255, 0.06);
}
.form-input::placeholder { color: #4B5563; }

/* Error alert */
.error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: #FCA5A5;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Quick Fill Pills */
.role-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #D1D5DB;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.role-pill:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #A5B4FC;
}

/* Footer */
.footer-note {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: #4B5563;
}

/* Loader */
.loader.loader-sm {
  border-color: rgba(255,255,255,0.2);
  border-top-color: white;
}

/* Responsive */
@media (max-width: 440px) {
  .login-card { padding: 1.75rem; border-radius: 16px; }
  .brand-name { font-size: 1.8rem; }
}
</style>

