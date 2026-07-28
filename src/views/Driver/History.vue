<template>
  <div class="driver-history animate-slide-up pb-20">
    <div class="header-section mb-6 text-center">
      <h2 class="text-2xl font-bold">{{ $t('nav.history') }}</h2>
      <p class="text-secondary mt-1">سجل الطلبات المنجزة بالكامل</p>
    </div>

    <div v-if="loading" class="flex justify-center mt-12">
      <div class="loader"></div>
    </div>

    <div v-else-if="orders.length === 0" class="text-center mt-12 glass-card p-12 mx-4 border-dashed border-2 border-[var(--border-color)]">
      <HistoryIcon :size="48" class="mx-auto mb-4 text-secondary opacity-50" />
      <p class="text-xl">لم تقم بتوصيل أي طلبات بعد.</p>
    </div>

    <div v-else class="flex flex-col gap-4 px-2 md:px-0">
      <div 
        v-for="order in orders" 
        :key="order.id" 
        class="glass-card flex flex-col p-4 border-t-4 border-[var(--success)]"
      >
        <div class="flex justify-between items-start mb-2">
          <span class="text-xl font-bold text-brand">{{ order.order_number }}</span>
          <span class="text-xs px-2 py-1 rounded-full bg-green-500/10 text-[var(--success)] font-bold">
            مكتمل
          </span>
        </div>
        
        <div class="mb-3 text-sm flex flex-col gap-1">
          <p class="flex items-center gap-2"><User :size="14" class="text-secondary"/> <span class="font-bold">{{ order.client?.name || '-' }}</span></p>
          <p class="flex items-center gap-2"><CheckCircle :size="14" class="text-[var(--success)]"/> تم التسليم في: <strong dir="ltr">{{ new Date(order.updated_at).toLocaleString() }}</strong></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { History as HistoryIcon, User, CheckCircle } from 'lucide-vue-next'
import omsApi from '../../services/omsApi'
import { useAuthStore } from '../../store/auth'

const loading = ref(true)
const orders = ref([])
const authStore = useAuthStore()

const fetchOrders = async () => {
  try {
    const response = await omsApi.get('/api/orders?status=delivered')
    const allOrders = Array.isArray(response.data) ? response.data : (response.data.orders || [])
    const currentDriverId = Number(authStore.user?.id)
    orders.value = allOrders.filter(o => Number(o.driver_id) === currentDriverId)
  } catch (error) {
    console.error('Error fetching history:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.loader { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: var(--brand-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
