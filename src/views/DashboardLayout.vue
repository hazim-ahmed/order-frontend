<template>
  <div class="app-layout">
    <!-- Sidebar Component -->
    <Sidebar :is-open="isSidebarOpen" @close="toggleSidebar(false)" />
    
    <!-- Mobile Sidebar Overlay -->
    <transition name="fade">
      <div 
        v-if="isSidebarOpen" 
        class="mobile-overlay"
        @click="toggleSidebar(false)"
      ></div>
    </transition>

    <div class="app-main">
      <!-- Top Navigation -->
      <TopNav @toggle-sidebar="toggleSidebar(!isSidebarOpen)" />
      
      <!-- Main Page Content -->
      <main class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '../components/layout/Sidebar.vue'
import TopNav from '../components/layout/TopNav.vue'
import { useNotificationStore } from '../store/notifications'

const isSidebarOpen = ref(false)
const notificationStore = useNotificationStore()

function toggleSidebar(val) {
  isSidebarOpen.value = val
}

onMounted(() => {
  notificationStore.initSocket()
})

onUnmounted(() => {
  notificationStore.disconnectSocket()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Mobile overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 30;
}

@media (min-width: 769px) {
  .mobile-overlay { display: none; }
}
</style>
