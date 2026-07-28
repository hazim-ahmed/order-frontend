<template>
  <div v-if="isOpen && salesReturn" class="modal-backdrop flex items-center justify-center p-4">
    <div class="modal-container w-full max-w-md animate-slide-up p-6">
      <div class="flex justify-between items-center pb-4 border-b border-[var(--border-color)] mb-4">
        <h3 class="text-xl font-bold flex items-center gap-2">
          <Truck class="text-brand" :size="24" />
          إسناد سائق للمرتجع
        </h3>
        <button @click="$emit('close')" class="text-secondary hover:text-primary">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="assignDriver" class="flex flex-col gap-4">
        <div class="bg-[var(--bg-secondary)] p-3 rounded-lg text-sm">
          <span class="text-secondary">رقم المرتجع:</span>
          <strong class="text-brand ms-2">{{ salesReturn.return_number }}</strong>
        </div>

        <div>
          <label class="block text-sm font-bold mb-1">السائق</label>
          <select v-model="driverId" class="input-field w-full" required :disabled="loadingDrivers">
            <option value="" disabled>اختر السائق...</option>
            <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
              {{ driver.name || driver.username || `سائق #${driver.id}` }}
            </option>
          </select>
          <p v-if="loadingDrivers" class="text-xs text-secondary mt-1">جاري تحميل السائقين...</p>
        </div>

        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 text-danger text-sm">
          {{ errorMessage }}
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">إلغاء</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting || loadingDrivers">
            <span v-if="submitting" class="loader small mr-2 inline-block"></span>
            إسناد السائق
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Truck, X } from 'lucide-vue-next';
import omsApi from '../../services/omsApi';

const props = defineProps({
  isOpen: Boolean,
  salesReturn: Object
});

const emit = defineEmits(['close', 'assigned']);

const drivers = ref([]);
const driverId = ref('');
const loadingDrivers = ref(false);
const submitting = ref(false);
const errorMessage = ref('');

const fetchDrivers = async () => {
  loadingDrivers.value = true;
  errorMessage.value = '';
  try {
    const response = await omsApi.get('/api/users');
    const allUsers = response.data.users || response.data || [];
    drivers.value = allUsers.filter(user => user.role === 'driver' && user.is_active !== false);
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'تعذر تحميل قائمة السائقين.';
  } finally {
    loadingDrivers.value = false;
  }
};

const assignDriver = async () => {
  if (!driverId.value) return;
  submitting.value = true;
  errorMessage.value = '';
  try {
    await omsApi.post(`/api/sales-returns/${props.salesReturn.id}/assign-driver`, {
      driver_id: driverId.value
    });
    emit('assigned');
    emit('close');
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'تعذر إسناد السائق للمرتجع.';
  } finally {
    submitting.value = false;
  }
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    driverId.value = props.salesReturn?.driver_id || '';
    errorMessage.value = '';
    fetchDrivers();
  }
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  z-index: 999;
}

.loader.small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-left-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>