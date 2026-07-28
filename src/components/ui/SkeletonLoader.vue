<!--
  SkeletonLoader Component — مكون التحميل الهيكلي (Loading Skeleton)
  الوظيفة: عرض حالة تحميل مرئية قبل وصول البيانات الحقيقية
  Props:
    - rows (Number): عدد الصفوف للجداول
    - type (String): 'card' | 'table' | 'kpi' — نوع الـ Skeleton
-->
<template>
  <!-- Skeleton لبطاقات KPI -->
  <div v-if="type === 'kpi'" class="skeleton-kpi-grid">
    <div v-for="i in count" :key="i" class="card skeleton-kpi-card">
      <div class="skeleton-line skeleton-line--sm w-40"></div>
      <div class="skeleton-line skeleton-line--xl w-24 mt-2"></div>
      <div class="skeleton-line skeleton-line--xs w-32 mt-1"></div>
    </div>
  </div>

  <!-- Skeleton لجدول البيانات -->
  <div v-else-if="type === 'table'" class="skeleton-table">
    <div class="skeleton-table-header">
      <div v-for="i in cols" :key="i" class="skeleton-line skeleton-line--sm"></div>
    </div>
    <div v-for="r in rows" :key="r" class="skeleton-table-row">
      <div class="skeleton-avatar"></div>
      <div v-for="c in cols - 1" :key="c" class="skeleton-line skeleton-line--sm"></div>
    </div>
  </div>

  <!-- Skeleton لبطاقة عامة -->
  <div v-else class="card">
    <div class="skeleton-line skeleton-line--sm w-40 mb-4"></div>
    <div class="skeleton-line skeleton-line--xl w-24 mb-2"></div>
    <div class="skeleton-line skeleton-line--sm"></div>
    <div class="skeleton-line skeleton-line--sm w-60 mt-1"></div>
  </div>
</template>

<script setup>
// ============================================================
// Props للتحكم في نوع الـ Skeleton وعدد الصفوف
// ============================================================
defineProps({
  type:  { type: String, default: 'card' },
  rows:  { type: Number, default: 5 },
  cols:  { type: Number, default: 4 },
  count: { type: Number, default: 6 }
});
</script>

<style scoped>
/* ============================================================
   تأثير الـ Shimmer للتحميل الهيكلي
   Shimmer effect for skeleton loading state
   ============================================================ */
.skeleton-line,
.skeleton-avatar {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--border-color) 25%,
    var(--bg-hover)     50%,
    var(--border-color) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

.skeleton-line { height: 12px; width: 100%; margin-bottom: 6px; }
.skeleton-line--xs  { height: 10px; }
.skeleton-line--sm  { height: 13px; }
.skeleton-line--xl  { height: 28px; }
.skeleton-avatar    { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }

.w-24 { width: 96px;  max-width: 100%; }
.w-32 { width: 128px; max-width: 100%; }
.w-40 { width: 160px; max-width: 100%; }
.w-60 { width: 240px; max-width: 100%; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }

/* KPI Grid skeleton */
.skeleton-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.skeleton-kpi-card {
  display: flex;
  flex-direction: column;
}

/* Table skeleton */
.skeleton-table {
  width: 100%;
}

.skeleton-table-header,
.skeleton-table-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.skeleton-table-header .skeleton-line { opacity: 0.5; }
</style>
