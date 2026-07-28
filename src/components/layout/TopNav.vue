<!--
  TopNav Component — مكون شريط التنقل العلوي
  الوظيفة: يحتوي على البحث العام، الإشعارات، تبديل اللغة، تبديل الوضع، والملف الشخصي
  Events:
    - @toggle-sidebar: عند الضغط على أيقونة القائمة (للموبايل)
-->
<template>
  <header class="app-topbar">
    <div class="flex items-center gap-4">
      <!-- Mobile Menu Toggle -->
      <button class="btn-ghost icon-btn mobile-menu-btn" @click="$emit('toggle-sidebar')">
        <Menu :size="20" />
      </button>

      <!-- Global Search -->
      <div class="search-container hidden-mobile">
        <Search :size="16" class="search-icon" />
        <input 
          type="text" 
          class="form-input search-input" 
          placeholder="ابحث عن طلبات، عملاء... (⌘K)" 
        />
        <div class="search-shortcut">⌘K</div>
      </div>
    </div>

    <div class="flex items-center gap-1 sm:gap-2">
      <!-- Notifications -->
      <div class="relative" v-click-outside="() => showNotifications && (showNotifications = false)">
        <button class="btn-ghost icon-btn relative" title="الإشعارات" @click.stop="toggleNotifications">
          <Bell :size="20" />
          <span v-if="notificationStore.unreadCount > 0" class="notification-badge animate-pulse">
            {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
          </span>
        </button>
        
        <!-- Notifications Dropdown -->
        <transition name="dropdown">
          <div v-if="showNotifications" class="notification-dropdown glass-card p-0" @click.stop>
            <div class="dropdown-header">
              <span class="font-bold">الإشعارات</span>
              <button 
                v-if="notificationStore.unreadCount > 0"
                @click="notificationStore.markAllAsRead" 
                class="text-xs text-brand font-medium hover:underline"
              >
                تحديد كـ مقروء
              </button>
            </div>
            
            <div class="dropdown-body">
              <div v-if="notificationStore.notifications.length === 0" class="empty-notif">
                <Bell :size="32" class="text-disabled mb-2" />
                <p>لا توجد إشعارات حالياً</p>
              </div>
              <div 
                v-else 
                v-for="notif in notificationStore.notifications" 
                :key="notif.id"
                :class="['notif-item', { 'is-read': notif.read }]"
                @click="handleNotificationClick(notif)"
              >
                <div class="notif-indicator" v-if="!notif.read"></div>
                <div class="notif-content">
                  <div class="flex justify-between items-start mb-1">
                    <strong class="notif-title">{{ notif.title }}</strong>
                    <span class="notif-time" dir="ltr">{{ new Date(notif.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                  </div>
                  <p class="notif-message">{{ notif.message }}</p>
                </div>
              </div>
            </div>
            
            <div class="dropdown-footer">
              <button class="text-brand text-sm font-medium hover:underline">عرض كل الإشعارات</button>
            </div>
          </div>
        </transition>
      </div>

      <div class="divider"></div>

      <!-- Language Toggle -->
      <button class="btn-ghost icon-btn" @click="toggleLanguage" title="تغيير اللغة">
        <Globe :size="20" />
      </button>

      <!-- Theme Toggle -->
      <button class="btn-ghost icon-btn" @click="toggleTheme" title="الوضع الليلي/النهاري">
        <Moon v-if="!isDark" :size="20" />
        <Sun v-else :size="20" />
      </button>

      <div class="divider hidden-mobile"></div>

      <!-- User Profile -->
      <div class="relative" v-click-outside="() => showProfileMenu && (showProfileMenu = false)">
        <button class="profile-btn flex items-center gap-3" @click.stop="showProfileMenu = !showProfileMenu">
          <div class="avatar">
            <img src="https://ui-avatars.com/api/?name=KMT&background=4F46E5&color=fff&bold=true" alt="Avatar" />
          </div>
          <div class="profile-info hidden-mobile" v-if="user">
            <span class="profile-name">{{ user.username || user.role }}</span>
            <span class="profile-role">{{ user.role.replace('_', ' ').toUpperCase() }}</span>
          </div>
          <ChevronDown :size="16" class="text-muted hidden-mobile ms-1" />
        </button>

        <transition name="dropdown">
          <div v-if="showProfileMenu" class="profile-dropdown glass-card p-2" @click.stop>
            <button @click="handleLogout" class="dropdown-item text-danger">
              <LogOut :size="16" />
              تسجيل الخروج
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
// ============================================================
// استيراد الأيقونات وتحديد متغيرات الحالة
// Imports icons and defines state variables for theme and language
// ============================================================
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../store/auth';
import { useNotificationStore } from '../../store/notifications';
import { useRouter } from 'vue-router';
import { 
  Menu, Search, Plus, Bell, Globe, Sun, Moon, ChevronDown, LogOut 
} from 'lucide-vue-next';

defineEmits(['toggle-sidebar']);

const { locale } = useI18n();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

const user = computed(() => authStore.user);
const isDark = ref(false);
const showNotifications = ref(false);
const showProfileMenu = ref(false);

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  showProfileMenu.value = false;
};

const handleLogout = () => {
  authStore.logout();
  router.push({ name: 'Login' });
};

const handleNotificationClick = (notif) => {
  notificationStore.markAsRead(notif.id);
  showNotifications.value = false;
  if (!notif.orderId) return;
  
  if (authStore.userRole === 'driver') {
    router.push({ name: 'DriverActiveOrder', params: { id: notif.orderId } });
  } else if (authStore.userRole === 'sales_rep') {
    router.push({ name: 'SharedOrderDetail', params: { id: notif.orderId } });
  } else if (authStore.userRole === 'inventory_manager') {
    router.push({ name: 'InventoryIncomingOrders' });
  } else if (authStore.userRole === 'sales_manager') {
    router.push({ name: 'SalesManagerPendingOrders' });
  } else if (authStore.userRole === 'admin') {
    router.push({ name: 'AdminAllOrders' });
  }
};

// ============================================================
// دالة تبديل الوضع النهاري/الليلي
// Toggles dark and light mode
// ============================================================
const toggleTheme = () => {
  const html = document.documentElement;
  isDark.value = !isDark.value;
  if (isDark.value) {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

// ============================================================
// دالة تبديل اللغة (عربي/إنجليزي)
// Toggles between Arabic and English languages
// ============================================================
const toggleLanguage = () => {
  const newLang = locale.value === 'ar' ? 'en' : 'ar';
  locale.value = newLang;
  localStorage.setItem('lang', newLang);
  
  const html = document.documentElement;
  html.lang = newLang;
  html.dir = newLang === 'ar' ? 'rtl' : 'ltr';
};

// ============================================================
// استرجاع الإعدادات عند تحميل المكون
// Initialize settings on mount
// ============================================================
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark');
});
</script>

<style scoped>
/* ============================================================
   TopNav Styles
   ============================================================ */
.mobile-menu-btn {
  display: none;
}
@media (max-width: 768px) {
  .mobile-menu-btn { display: flex; }
}

/* Search */
.search-container {
  position: relative;
  width: 320px;
}
.search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-start: 12px;
  color: var(--text-disabled);
  pointer-events: none;
}
.search-input {
  padding-inline-start: 36px;
  padding-inline-end: 40px;
  background-color: var(--bg-primary);
  border-color: transparent;
  border-radius: var(--radius-full);
}
.search-input:focus {
  background-color: var(--bg-surface);
  border-color: var(--brand-primary);
}
.search-shortcut {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-end: 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-disabled);
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

/* Icon Buttons */
.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.icon-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
  background: var(--danger);
  color: white;
  font-size: 9px;
  font-weight: 700;
  height: 16px;
  min-width: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--bg-surface);
}

/* Dropdown */
.notification-dropdown {
  position: absolute;
  top: 110%;
  inset-inline-end: 0;
  width: min(340px, calc(100vw - 24px));
  z-index: 100;
  display: flex;
  flex-direction: column;
}
html[dir="rtl"] .notification-dropdown {
  inset-inline-end: 0;
  inset-inline-start: auto;
}

.dropdown-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.dropdown-body {
  max-height: 320px;
  overflow-y: auto;
}

.dropdown-footer {
  padding: 12px;
  text-align: center;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

.empty-notif {
  padding: 2rem;
  text-align: center;
  color: var(--text-disabled);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: var(--text-sm);
}

.notif-item {
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background var(--transition-fast);
  position: relative;
}
.notif-item:hover { background: var(--bg-hover); }
.notif-item.is-read { opacity: 0.7; }
.notif-item.is-read .notif-title { font-weight: 500; }

.notif-indicator {
  position: absolute;
  inset-inline-start: 8px;
  top: 20px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-primary);
}

.notif-content { flex: 1; min-width: 0; }
.notif-title { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.notif-message { font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.4; }
.notif-time { font-size: 10px; color: var(--text-disabled); white-space: nowrap; }

/* Dropdown Animation */
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.2s, transform 0.2s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-10px); }

/* Divider */
.divider {
  width: 1px;
  height: 24px;
  background-color: var(--border-color);
}

/* Profile Button & Dropdown */
.profile-btn {
  padding: 4px;
  padding-inline-end: 8px;
  border-radius: 40px;
  transition: background var(--transition-fast);
}
.profile-btn:hover { background: var(--bg-hover); }

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--brand-light);
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }

.profile-info {
  display: flex;
  flex-direction: column;
  text-align: start;
}
.profile-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); line-height: 1.2; }
.profile-role { font-size: 10px; color: var(--text-disabled); font-weight: 600; letter-spacing: 0.5px; }

.profile-dropdown {
  position: absolute;
  top: 110%;
  inset-inline-end: 0;
  width: 180px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
  width: 100%;
}
.dropdown-item:hover {
  background: rgba(239, 68, 68, 0.1);
}

@media (max-width: 768px) {
  .hidden-mobile { display: none !important; }
}
</style>
