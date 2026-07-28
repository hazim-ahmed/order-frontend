<template>
  <span :class="['status-badge', badgeClass]">
    <span class="status-dot" :style="{ background: dotColor }"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  status: { type: String, required: true }
})

const { t } = useI18n()

const CONFIG = {
  pending_sales_approval:    { class: 'warning',  dot: '#F59E0B' },
  pending_inventory_approval:{ class: 'orange',   dot: '#F97316' },
  processing_in_warehouse:   { class: 'blue',     dot: '#3B82F6' },
  assigned_to_driver:        { class: 'blue',     dot: '#3B82F6' },
  ready_for_pickup:          { class: 'purple',   dot: '#8B5CF6' },
  picked_up_by_driver:       { class: 'brand',    dot: 'var(--brand-primary)' },
  delivered:                 { class: 'success',  dot: '#10B981' },
  failed_delivery:           { class: 'danger',   dot: '#EF4444' },
  return_requested:          { class: 'orange',   dot: '#F97316' },
  returned_to_warehouse:     { class: 'success',  dot: '#10B981' },
  rejected_by_sales:         { class: 'danger',   dot: '#EF4444' },
  cancelled:                 { class: 'neutral',  dot: '#6B7280' }
}

const config    = computed(() => CONFIG[props.status] || { class: 'neutral', dot: '#6B7280' })
const badgeClass = computed(() => `badge-${config.value.class}`)
const dotColor   = computed(() => config.value.dot)
const label      = computed(() => {
  try { return t(`order.status.${props.status}`) } catch { return props.status }
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
  line-height: 1.5;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Color variants */
.badge-success { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16,185,129,0.25); }
.badge-warning { background: rgba(245, 158, 11, 0.1); color: #D97706; border-color: rgba(245,158,11,0.25); }
.badge-danger  { background: rgba(239, 68,  68, 0.1); color: #DC2626; border-color: rgba(239,68,68,0.25); }
.badge-blue    { background: rgba(59, 130, 246, 0.1); color: #2563EB; border-color: rgba(59,130,246,0.25); }
.badge-purple  { background: rgba(139, 92, 246, 0.1); color: #7C3AED; border-color: rgba(139,92,246,0.25); }
.badge-orange  { background: rgba(249, 115, 22, 0.1); color: #EA580C; border-color: rgba(249,115,22,0.25); }
.badge-brand   { background: rgba(79, 70, 229, 0.1);  color: var(--brand-primary); border-color: rgba(79,70,229,0.25); }
.badge-neutral { background: var(--bg-secondary);     color: var(--text-secondary); border-color: var(--border-color); }

/* Dark mode adjustments */
.dark .badge-success { background: rgba(52,211,153,0.1); color: var(--success); }
.dark .badge-warning { background: rgba(251,191,36,0.1); color: var(--warning); }
.dark .badge-danger  { background: rgba(248,113,113,0.1); color: var(--danger); }
.dark .badge-blue    { background: rgba(96,165,250,0.1); color: #60A5FA; }
.dark .badge-purple  { background: rgba(167,139,250,0.1); color: #A78BFA; }
.dark .badge-orange  { background: rgba(251,146,60,0.1); color: #FB923C; }
.dark .badge-brand   { background: rgba(129,140,248,0.12); }
</style>
