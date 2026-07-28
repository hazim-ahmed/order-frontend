<template>
  <main class="setup-shell" dir="rtl">
    <section class="setup-panel">
      <header class="setup-header">
        <div>
          <span class="setup-kicker">تهيئة النظام</span>
          <h1>إعداد الشركة وحساب المسؤول</h1>
          <p>تظهر هذه الشاشة عند تشغيل النظام لأول مرة فقط، وبعد إنشاء المسؤول يتم إغلاقها تلقائياً.</p>
        </div>
        <div class="status-pill" :class="{ ready: !statusLoading && !initialized }">
          <ShieldCheck :size="18" />
          <span>{{ statusText }}</span>
        </div>
      </header>

      <div v-if="statusLoading" class="state-box">
        <LoaderCircle :size="22" class="spin" />
        <span>جاري فحص حالة النظام...</span>
      </div>

      <form v-else class="setup-grid" @submit.prevent="submitSetup">
        <section class="form-section">
          <div class="section-title">
            <Building2 :size="20" />
            <div>
              <h2>بيانات الشركة</h2>
              <p>تستخدم هذه البيانات كأساس لتعريف النسخة عند العميل.</p>
            </div>
          </div>

          <label>
            اسم الشركة
            <input v-model.trim="form.company_name" required autocomplete="organization" placeholder="مثال: شركة الكميت للتجارة" />
          </label>

          <div class="field-row">
            <label>
              رقم الهاتف
              <input v-model.trim="form.company_phone" autocomplete="tel" placeholder="05xxxxxxxx" />
            </label>
            <label>
              البريد الإلكتروني
              <input v-model.trim="form.company_email" type="email" autocomplete="email" placeholder="info@example.com" />
            </label>
          </div>

          <label>
            العنوان
            <textarea v-model.trim="form.company_address" rows="3" placeholder="المدينة، الحي، الشارع"></textarea>
          </label>

          <div class="field-row">
            <label>
              الرقم الضريبي
              <input v-model.trim="form.tax_number" inputmode="numeric" />
            </label>
            <label>
              السجل التجاري
              <input v-model.trim="form.commercial_registration" inputmode="numeric" />
            </label>
          </div>

          <div class="field-row compact">
            <label>
              المنطقة الزمنية
              <select v-model="form.timezone">
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Kuwait">Asia/Kuwait</option>
                <option value="Asia/Baghdad">Asia/Baghdad</option>
              </select>
            </label>
            <label>
              العملة
              <select v-model="form.currency">
                <option value="SAR">SAR</option>
                <option value="AED">AED</option>
                <option value="KWD">KWD</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">
            <UserCog :size="20" />
            <div>
              <h2>حساب المسؤول</h2>
              <p>هذا الحساب يملك صلاحية إنشاء المستخدمين وإدارة النظام بعد التهيئة.</p>
            </div>
          </div>

          <label>
            اسم المسؤول
            <input v-model.trim="form.admin_name" required autocomplete="name" placeholder="الاسم الكامل" />
          </label>

          <div class="field-row">
            <label>
              اسم المستخدم
              <input v-model.trim="form.admin_username" required autocomplete="username" placeholder="admin" />
            </label>
            <label>
              هاتف المسؤول
              <input v-model.trim="form.admin_phone" autocomplete="tel" />
            </label>
          </div>

          <label>
            بريد المسؤول
            <input v-model.trim="form.admin_email" type="email" autocomplete="email" />
          </label>

          <div class="field-row">
            <label>
              كلمة المرور
              <input v-model="form.admin_password" required type="password" autocomplete="new-password" minlength="8" />
            </label>
            <label>
              تأكيد كلمة المرور
              <input v-model="confirmPassword" required type="password" autocomplete="new-password" minlength="8" />
            </label>
          </div>

          <div class="password-note" :class="{ invalid: passwordIssue }">
            <KeyRound :size="17" />
            <span>{{ passwordIssue || 'كلمة المرور مطابقة وتحقق الحد الأدنى المطلوب.' }}</span>
          </div>

          <div v-if="errorMessage" class="alert error">
            <AlertTriangle :size="18" />
            <span>{{ errorMessage }}</span>
          </div>

          <div class="actions">
            <button type="submit" :disabled="submitting || !!passwordIssue">
              <LoaderCircle v-if="submitting" :size="18" class="spin" />
              <CheckCircle2 v-else :size="18" />
              <span>{{ submitting ? 'جاري التهيئة...' : 'تهيئة النظام والدخول' }}</span>
            </button>
          </div>
        </section>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  UserCog
} from 'lucide-vue-next'
import omsApi from '../services/omsApi'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const statusLoading = ref(true)
const submitting = ref(false)
const initialized = ref(false)
const errorMessage = ref('')
const confirmPassword = ref('')

const form = reactive({
  company_name: '',
  company_phone: '',
  company_email: '',
  company_address: '',
  tax_number: '',
  commercial_registration: '',
  timezone: 'Asia/Riyadh',
  currency: 'SAR',
  admin_name: '',
  admin_username: 'admin',
  admin_email: '',
  admin_phone: '',
  admin_password: ''
})

const passwordIssue = computed(() => {
  if (!form.admin_password && !confirmPassword.value) return ''
  if (form.admin_password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'
  if (form.admin_password !== confirmPassword.value) return 'تأكيد كلمة المرور غير مطابق.'
  return ''
})

const statusText = computed(() => {
  if (statusLoading.value) return 'فحص الحالة'
  if (initialized.value) return 'النظام مهيأ'
  return 'جاهز للتهيئة'
})

onMounted(async () => {
  try {
    const response = await omsApi.get('/api/setup/status')
    initialized.value = !!response.data.initialized
    if (initialized.value) {
      router.replace({ name: authStore.isAuthenticated ? 'RoleRedirect' : 'Login' })
    }
  } catch (error) {
    errorMessage.value = 'تعذر فحص حالة النظام. تأكد من تشغيل الخادم وقاعدة البيانات.'
  } finally {
    statusLoading.value = false
  }
})

const submitSetup = async () => {
  errorMessage.value = ''

  if (passwordIssue.value) {
    errorMessage.value = passwordIssue.value
    return
  }

  submitting.value = true

  try {
    const response = await omsApi.post('/api/setup/initialize', form)
    authStore.setSession(response.data.token)
    router.replace({ name: 'RoleRedirect' })
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'تعذر إكمال التهيئة. راجع البيانات وحاول مرة أخرى.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.setup-shell {
  min-height: 100vh;
  background: #f6f7f9;
  color: #172033;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 32px 20px;
}

.setup-panel {
  width: min(1120px, 100%);
  align-self: center;
}

.setup-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.setup-kicker {
  display: inline-flex;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 8px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 30px;
  line-height: 1.25;
  font-weight: 850;
  color: #111827;
}

.setup-header p,
.section-title p {
  margin-top: 8px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.8;
}

.status-pill {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 8px;
  padding: 0 12px;
  font-weight: 800;
  font-size: 13px;
}

.status-pill.ready {
  border-color: #bfdbfe;
  color: #1d4ed8;
  background: #eff6ff;
}

.setup-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.form-section,
.state-box {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.form-section {
  padding: 22px;
}

.state-box {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #475569;
  font-weight: 800;
}

.section-title {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.section-title > svg {
  color: #2563eb;
  margin-top: 2px;
}

h2 {
  color: #111827;
  font-size: 18px;
  font-weight: 850;
}

label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 15px;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  min-height: 42px;
  padding: 10px 12px;
  color: #111827;
  background: #fff;
  font: inherit;
  font-weight: 650;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

textarea {
  resize: vertical;
  min-height: 86px;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.field-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.field-row label {
  min-width: 0;
}

.compact {
  align-items: end;
}

.password-note,
.alert {
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.6;
}

.password-note {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.password-note.invalid,
.alert.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.alert {
  margin-top: 12px;
}

.actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 18px;
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 18px;
  font-weight: 850;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .setup-shell {
    padding: 22px 14px;
  }

  .setup-header,
  .setup-grid,
  .field-row {
    grid-template-columns: 1fr;
  }

  .setup-header {
    display: grid;
  }
}
</style>
