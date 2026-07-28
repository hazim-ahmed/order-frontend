<template>
  <div class="container text-center mt-4 flex items-center justify-center" style="min-height: 50vh;">
    <div class="glass-card animate-fade-in">
      <h2>جاري توجيهك إلى لوحة التحكم الخاصة بك...</h2>
      <div class="loader mt-4"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: التوجيه التلقائي للمستخدم حسب دوره بعد الدخول (Role-Based Redirect)
// السياق: يحل مشكلة تعليق الشاشة عند تسجيل الدخول بصلاحية الأدمن (Admin Role)
// ==============================================================================
onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.initAuth()
  }

  const role = authStore.userRole
  
  if (role === 'sales_rep') {
    router.replace({ name: 'SalesRepDashboard' })
  } else if (role === 'sales_manager') {
    router.replace({ name: 'SalesManagerDashboard' })
  } else if (role === 'inventory_manager') {
    router.replace({ name: 'InventoryDashboard' })
  } else if (role === 'driver') {
    router.replace({ name: 'DriverDashboard' })
  } else if (role === 'admin') {
    router.replace({ name: 'AdminDashboard' })
  } else {
    // في حال عدم التعرف على الدور، الخروج التلقائي لصفحة الدخول
    authStore.logout()
    router.replace({ name: 'Login' })
  }
})
</script>

<style scoped>
.loader {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
