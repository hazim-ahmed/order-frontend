<template>
  <div class="stat-card" :style="{ '--card-color': colorValue }">
    <div class="stat-top">
      <p class="stat-title">{{ title }}</p>
      <div class="stat-icon-wrap">
        <component :is="icon" :size="20" />
      </div>
    </div>
    <div class="stat-value" :dir="dir || 'auto'">{{ value }}</div>
    <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
    <div v-if="trend !== undefined && trend !== 0" class="stat-trend" :class="trend > 0 ? 'up' : 'down'" dir="ltr">
      <span>{{ trend > 0 ? '▲' : '▼' }} {{ Math.abs(trend) }}%</span>
      <span class="trend-label">مقارنة بالأمس</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title:    { type: String, required: true },
  value:    { type: [String, Number], required: true },
  icon:     { type: Object, required: true },
  color:    { type: String, default: 'primary' },
  trend:    { type: Number, default: undefined },
  subtitle: { type: String, default: '' },
  dir:      { type: String, default: '' }
})

const colorMap = {
  primary: 'var(--brand-primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  info:    'var(--info)'
}

const colorValue = computed(() => colorMap[props.color] || colorMap.primary)
</script>

<style scoped>
.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-card);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  height: 3px;
  background: var(--card-color);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: -40px;
  inset-inline-end: -20px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--card-color);
  opacity: 0.05;
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.stat-title {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1.4;
}

.stat-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--card-color) 12%, transparent);
  color: var(--card-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.stat-subtitle {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: var(--text-xs);
  font-weight: 600;
}
.stat-trend.up   { color: var(--success); }
.stat-trend.down { color: var(--danger); }
.trend-label { color: var(--text-disabled); font-weight: 400; }
</style>
