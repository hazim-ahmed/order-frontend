<template>
  <div class="order-stepper py-6 overflow-x-auto">
    <div class="stepper-container min-w-[600px] sm:min-w-0" :dir="isRtl ? 'rtl' : 'ltr'">
      <!-- Node 1: Created by Sales Rep -->
      <div class="step" :class="getStepClass(1)">
        <div class="step-icon">
          <UserPlus v-if="getStepState(1) !== 'done'" :size="20" />
          <Check v-else :size="20" />
        </div>
        <div class="step-content">
          <p class="step-title">الطلب</p>
          <p class="step-desc">من المندوب</p>
        </div>
        <div class="step-line"></div>
      </div>

      <!-- Node 2: Sales Manager Approval -->
      <div class="step" :class="getStepClass(2)">
        <div class="step-icon">
          <ClipboardCheck v-if="getStepState(2) !== 'done' && getStepState(2) !== 'error'" :size="20" />
          <Check v-if="getStepState(2) === 'done'" :size="20" />
          <XCircle v-if="getStepState(2) === 'error'" :size="20" />
        </div>
        <div class="step-content">
          <p class="step-title">المبيعات</p>
          <p class="step-desc" v-if="getStepState(2) !== 'error'">مراجعة الإدارة</p>
          <p class="step-desc text-danger" v-else>مرفوض</p>
        </div>
        <div class="step-line"></div>
      </div>

      <!-- Node 3: Warehouse Processing -->
      <div class="step" :class="getStepClass(3)">
        <div class="step-icon">
          <Package v-if="getStepState(3) !== 'done'" :size="20" />
          <Check v-else :size="20" />
        </div>
        <div class="step-content">
          <p class="step-title">المخازن</p>
          <p class="step-desc">قيد التجهيز</p>
        </div>
        <div class="step-line"></div>
      </div>

      <!-- Node 4: Driver Stage -->
      <div class="step" :class="getStepClass(4)">
        <div class="step-icon">
          <Truck v-if="getStepState(4) !== 'done' && getStepState(4) !== 'error'" :size="20" />
          <Check v-if="getStepState(4) === 'done'" :size="20" />
          <RotateCcw v-if="getStepState(4) === 'error'" :size="20" />
        </div>
        <div class="step-content">
          <p class="step-title">السائق</p>
          <p class="step-desc" v-if="getStepState(4) !== 'error'">قيد التوصيل</p>
          <p class="step-desc text-danger" v-else>مرتجع / فشل</p>
        </div>
        <div class="step-line"></div>
      </div>

      <!-- Node 5: Delivered -->
      <div class="step" :class="getStepClass(5)">
        <div class="step-icon">
          <CheckCircle v-if="getStepState(5) !== 'done'" :size="20" />
          <Check v-else :size="20" />
        </div>
        <div class="step-content">
          <p class="step-title">التسليم</p>
          <p class="step-desc">مكتمل</p>
        </div>
      </div>
    </div>

    <!-- Error/Cancelled State Override -->
    <div v-if="isCancelled" class="mt-6 p-4 rounded-lg flex items-center justify-center gap-3 font-bold bg-red-500/10 text-danger">
      <XCircle :size="24" />
      <span class="text-lg">{{ cancelOrReturnReason }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserPlus, ClipboardCheck, Package, Truck, CheckCircle, Check, XCircle, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const { locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

const isCancelled = computed(() => props.status === 'cancelled')
const isRejected = computed(() => props.status === 'rejected_by_sales')
const isReturned = computed(() => ['failed_delivery', 'return_requested', 'returned_to_warehouse'].includes(props.status))

// Logic to determine exactly which node we are at (1 to 5)
const currentStep = computed(() => {
  const s = props.status
  // Node 1: Sales Rep creation -> essentially step 1 is done if it exists, so we are at least at step 2
  if (['pending_sales_approval'].includes(s)) return 2 // Currently waiting on step 2
  
  if (isRejected.value) return 2 // Stopped at 2

  if (['pending_inventory_approval'].includes(s)) return 3 // Waiting on warehouse
  if (['processing_in_warehouse'].includes(s)) return 3 // Still in warehouse
  
  if (['assigned_to_driver', 'ready_for_pickup'].includes(s)) return 4 // Waiting for driver
  if (['picked_up_by_driver'].includes(s)) return 4 // With driver
  
  if (isReturned.value) return 4 // Failed at driver stage

  if (['delivered'].includes(s)) return 5 // Completely done
  
  return 1 // default
})

const cancelOrReturnReason = computed(() => {
  if (['cancelled'].includes(props.status)) return 'تم إلغاء الطلب بالكامل'
  return ''
})

const getStepState = (stepNumber) => {
  // Overrides for specific failures
  if (stepNumber === 2 && isRejected.value) return 'error'
  if (stepNumber === 4 && isReturned.value) return 'error'
  if (isCancelled.value) return 'inactive' // Canceling halts the visual tree

  // Standard progressive state
  // If current step is greater than this node, this node is done
  if (currentStep.value > stepNumber) return 'done'
  // If we are currently AT this node, it is active
  if (currentStep.value === stepNumber) return 'active'
  
  return 'inactive'
}

const getStepClass = (stepNumber) => {
  const state = getStepState(stepNumber)
  return {
    'step-active': state === 'active',
    'step-done': state === 'done',
    'step-inactive': state === 'inactive',
    'step-error': state === 'error'
  }
}
</script>

<style scoped>
.stepper-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  width: 100%;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  text-align: center;
  z-index: 1;
}

/* The Connecting Line */
.step-line {
  position: absolute;
  top: 24px;
  height: 3px;
  background-color: var(--border-color);
  z-index: -1;
}

html[dir="rtl"] .step-line {
  right: 50%;
  width: 100%;
}

html[dir="ltr"] .step-line {
  left: 50%;
  width: 100%;
}

.step:last-child .step-line {
  display: none;
}

/* Icon Container */
.step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  border: 3px solid var(--border-color);
  color: var(--text-muted);
  transition: all var(--transition-base);
  margin-bottom: 12px;
  box-shadow: 0 0 0 4px var(--bg-primary); /* For hiding the line behind it */
}

/* Content */
.step-title {
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin-bottom: 4px;
}
.step-desc {
  font-size: 11px;
  color: var(--text-secondary);
}

/* States */
.step.step-active .step-icon {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  background-color: var(--bg-primary);
  box-shadow: 0 0 0 4px var(--bg-primary), 0 0 15px rgba(79, 70, 229, 0.3);
}
.step.step-active .step-title {
  color: var(--brand-primary);
}

.step.step-done .step-icon {
  background-color: var(--success);
  border-color: var(--success);
  color: white;
}
.step.step-done .step-line {
  background-color: var(--success);
}
.step.step-done .step-title {
  color: var(--success);
}

.step.step-error .step-icon {
  background-color: var(--bg-primary);
  border-color: var(--danger);
  color: var(--danger);
}
.step.step-error .step-title {
  color: var(--danger);
}
.step.step-error .step-line {
  background-color: var(--danger);
  opacity: 0.3;
}

/* Mobile Responsiveness (Vertical layout) */
@media (max-width: 640px) {
  .stepper-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 32px;
  }
  
  .step {
    flex-direction: row;
    width: 100%;
    text-align: start;
    gap: 16px;
  }
  
  .step-icon {
    margin-bottom: 0;
  }
  
  .step-line {
    width: 3px;
    height: 100%;
    top: 48px;
  }
  
  html[dir="rtl"] .step-line {
    right: 23px; /* Center of the 48px icon */
    left: auto;
  }
  
  html[dir="ltr"] .step-line {
    left: 23px;
    right: auto;
  }
}
</style>
