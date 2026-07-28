<template>
  <div class="order-timeline">
    <h4 class="font-bold mb-6 flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
      <Activity :size="20" class="text-brand" />
      سجل الحالات والتتبع
    </h4>
    
    <div v-if="!logs || logs.length === 0" class="text-secondary text-sm text-center py-8">
      لا توجد سجلات متاحة
    </div>
    
    <div v-else class="timeline relative pl-4 border-l-2 border-[var(--border-color)] ml-3" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <div v-for="(log, idx) in sortedLogs" :key="log.id || idx" class="mb-8 relative timeline-item">
        <span class="absolute w-3 h-3 rounded-full bg-brand -left-[23px] top-1 shadow-[0_0_0_4px_var(--bg-primary)] z-10 indicator"></span>
        <div class="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] ml-2 timeline-content">
          <div class="flex justify-between items-start mb-1">
            <p class="text-sm font-bold text-brand">{{ $t(`order.status.${log.to_status}`) || log.to_status }}</p>
            <p class="text-xs text-secondary font-mono" dir="ltr">{{ formatDateTime(log.created_at || log.createdAt) }}</p>
          </div>
          <p class="text-xs text-secondary mt-1 flex items-center gap-1" v-if="log.user">
            <User :size="12" /> {{ log.user.name || log.user.username }}
          </p>
          <div v-if="hasPayloadDetails(log.payload)" class="mt-2 text-xs p-2 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
            {{ formatPayload(log.payload) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Activity, User } from 'lucide-vue-next'
import { formatDateTime } from '../../utils/dateFormatter'

const { locale } = useI18n()

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
})

const sortedLogs = computed(() => {
  return [...props.logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Desktop standard (newest top) or oldest top depending on preference. Let's do oldest top (a-b)
})

const hasPayloadDetails = (payload) => {
  if (!payload) return false
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
    return Object.keys(parsed).length > 0
  } catch (e) {
    return false
  }
}

const formatPayload = (payload) => {
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
    const strings = []
    if (parsed.rejection_reason) strings.push(`سبب الرفض: ${parsed.rejection_reason}`)
    if (parsed.cancellation_reason) strings.push(`سبب الإلغاء: ${parsed.cancellation_reason}`)
    if (parsed.note) strings.push(`ملاحظة: ${parsed.note}`)
    if (parsed.driver_id) strings.push(`تم التعيين لسائق`)
    if (parsed.delivery_image_url) strings.push(`مرفق صورة تسليم`)
    return strings.length > 0 ? strings.join(' | ') : ''
  } catch (e) {
    return ''
  }
}
</script>

<style scoped>
html[dir="rtl"] .timeline { border-right-width: 2px; border-left-width: 0; padding-right: 1rem; padding-left: 0; margin-right: 0.75rem; margin-left: 0; }
html[dir="rtl"] .timeline .indicator { right: -23px; left: auto; }
html[dir="rtl"] .timeline .timeline-content { margin-right: 0.5rem; margin-left: 0; }

html[dir="ltr"] .timeline .indicator { left: -23px; right: auto; }
html[dir="ltr"] .timeline .timeline-content { margin-left: 0.5rem; margin-right: 0; }

.bg-brand { background-color: var(--brand-primary); }
</style>
