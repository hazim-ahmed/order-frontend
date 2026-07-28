<template>
  <div class="app-root">
    <!-- Main App Router View -->
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Global Toast Notifications -->
    <AppToast />
  </div>
</template>

<script setup>
// ============================================================
// المكون الجذري — يربط التوجيهات الأساسية ونظام الإشعارات
// Root component — handles main routing view and toast messages
// ============================================================
import AppToast from './components/ui/AppToast.vue';
</script>

<style>
/* ============================================================
   تأثير انتقال الصفحات — Page Transition
   ============================================================ */
.app-root {
  min-height: 100vh;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to   { opacity: 0; transform: translateY(-6px); }

.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
