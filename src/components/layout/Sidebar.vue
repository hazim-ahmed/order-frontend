<!--
  Sidebar Component - المكون الخاص بالشريط الجانبي
  الوظيفة: توفير روابط التنقل بين أقسام النظام الرئيسية
-->
<template>
  <aside
    class="app-sidebar"
    :class="{ 'is-open': isOpen }"
  >
    <div class="sidebar-header flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="logo-box">
          <Factory class="text-brand" :size="24" />
        </div>
        <h1 class="text-lg font-bold">KMT OMS</h1>
      </div>
      <button class="btn-ghost mobile-close" @click="$emit('close')">
        <X :size="20" />
      </button>
    </div>

    <nav class="sidebar-nav" @click="onNavClick">
      <template v-if="userRole === 'sales_rep'">
        <div class="nav-group">
          <h3 class="nav-group-title mono">SALES REP</h3>
          <router-link :to="{ name: 'SalesRepDashboard' }" class="nav-item">
            <LayoutDashboard :size="18" class="nav-icon" />
            <span>{{ $t('nav.dashboard') }}</span>
          </router-link>
          <router-link :to="{ name: 'SharedActiveOrders' }" class="nav-item">
            <Activity :size="18" class="nav-icon" />
            <span>المعالجة الحالية</span>
          </router-link>
          <router-link :to="{ name: 'SalesRepNewOrder' }" class="nav-item">
            <PlusCircle :size="18" class="nav-icon" />
            <span>{{ $t('nav.newOrder') }}</span>
          </router-link>
          <router-link :to="{ name: 'SalesRepOrdersList' }" class="nav-item">
            <ListOrdered :size="18" class="nav-icon" />
            <span>{{ $t('nav.myOrders') }}</span>
          </router-link>
          <router-link :to="{ name: 'SalesRepDeliveryDocuments' }" class="nav-item">
            <FileText :size="18" class="nav-icon" />
            <span>سندات طلباتي</span>
          </router-link>
          <router-link :to="{ name: 'SalesReturns' }" class="nav-item">
            <RotateCcw :size="18" class="nav-icon" />
            <span>مرتجعات المبيعات</span>
          </router-link>
        </div>
      </template>

      <template v-if="userRole === 'sales_manager'">
        <div class="nav-group">
          <h3 class="nav-group-title mono">SALES MANAGER</h3>
          <router-link :to="{ name: 'SalesManagerDashboard' }" class="nav-item">
            <LayoutDashboard :size="18" class="nav-icon" />
            <span>{{ $t('nav.dashboard') }}</span>
          </router-link>
          <router-link :to="{ name: 'SharedActiveOrders' }" class="nav-item">
            <Activity :size="18" class="nav-icon" />
            <span>المعالجة الحالية</span>
          </router-link>
          <router-link :to="{ name: 'SalesManagerPendingOrders' }" class="nav-item">
            <Clock :size="18" class="nav-icon" />
            <span>{{ $t('nav.pendingApproval') }}</span>
          </router-link>
          <router-link :to="{ name: 'SalesManagerAllOrders' }" class="nav-item">
            <Layers :size="18" class="nav-icon" />
            <span>{{ $t('nav.allOrders') }}</span>
          </router-link>
          <router-link :to="{ name: 'SalesReturns' }" class="nav-item">
            <RotateCcw :size="18" class="nav-icon" />
            <span>مرتجعات المبيعات</span>
          </router-link>
        </div>
      </template>

      <template v-if="userRole === 'inventory_manager'">
        <div class="nav-group">
          <h3 class="nav-group-title mono">INVENTORY</h3>
          <router-link :to="{ name: 'InventoryDashboard' }" class="nav-item">
            <LayoutDashboard :size="18" class="nav-icon" />
            <span>{{ $t('nav.dashboard') }}</span>
          </router-link>
          <router-link :to="{ name: 'SharedActiveOrders' }" class="nav-item">
            <Activity :size="18" class="nav-icon" />
            <span>المعالجة الحالية</span>
          </router-link>
          <router-link :to="{ name: 'InventoryIncomingOrders' }" class="nav-item">
            <Inbox :size="18" class="nav-icon" />
            <span>{{ $t('nav.incomingOrders') }}</span>
          </router-link>
          <router-link :to="{ name: 'InventoryProcessing' }" class="nav-item">
            <Settings :size="18" class="nav-icon" />
            <span>{{ $t('nav.processing') }}</span>
          </router-link>
          <router-link :to="{ name: 'InventoryReadyOrders' }" class="nav-item">
            <CheckSquare :size="18" class="nav-icon" />
            <span>{{ $t('nav.readyOrders') }}</span>
          </router-link>
          <router-link :to="{ name: 'InventoryDriverBooks' }" class="nav-item">
            <BookOpen :size="18" class="nav-icon text-emerald-400" />
            <span>صرف دفاتر السائقين</span>
          </router-link>
          <router-link :to="{ name: 'SalesReturns' }" class="nav-item">
            <RotateCcw :size="18" class="nav-icon" />
            <span>مرتجعات المبيعات</span>
          </router-link>
        </div>
      </template>

      <template v-if="userRole === 'driver'">
        <div class="nav-group">
          <h3 class="nav-group-title mono">DRIVER</h3>
          <router-link :to="{ name: 'DriverDashboard' }" class="nav-item">
            <LayoutDashboard :size="18" class="nav-icon" />
            <span>{{ $t('nav.activeOrders') }}</span>
          </router-link>
          <router-link :to="{ name: 'SharedActiveOrders' }" class="nav-item">
            <Activity :size="18" class="nav-icon" />
            <span>المعالجة الحالية</span>
          </router-link>
          <router-link :to="{ name: 'DriverHistory' }" class="nav-item">
            <History :size="18" class="nav-icon" />
            <span>{{ $t('nav.history') }}</span>
          </router-link>
          <router-link :to="{ name: 'SalesReturns' }" class="nav-item">
            <RotateCcw :size="18" class="nav-icon" />
            <span>مرتجعات المبيعات</span>
          </router-link>
        </div>
      </template>

      <template v-if="userRole === 'admin'">
        <div class="nav-group">
          <h3 class="nav-group-title mono">ADMIN</h3>
          <router-link :to="{ name: 'AdminDashboard' }" class="nav-item">
            <LayoutDashboard :size="18" class="nav-icon" />
            <span>{{ $t('nav.dashboard') }}</span>
          </router-link>
          <router-link :to="{ name: 'AdminDeliveryBooks' }" class="nav-item">
            <BookOpen :size="18" class="nav-icon text-indigo-400" />
            <span>دفاتر سندات التسليم</span>
          </router-link>
          <router-link :to="{ name: 'SharedActiveOrders' }" class="nav-item">
            <Activity :size="18" class="nav-icon" />
            <span>المعالجة الحالية</span>
          </router-link>
          <router-link :to="{ name: 'AdminAllOrders' }" class="nav-item">
            <Layers :size="18" class="nav-icon" />
            <span>{{ $t('nav.allOrders') }}</span>
          </router-link>
          <router-link :to="{ name: 'SalesReturns' }" class="nav-item">
            <RotateCcw :size="18" class="nav-icon" />
            <span>مرتجعات المبيعات</span>
          </router-link>
          <router-link :to="{ name: 'AdminUsers' }" class="nav-item">
            <Users :size="18" class="nav-icon" />
            <span>المستخدمون</span>
          </router-link>
          <router-link :to="{ name: 'AdminProducts' }" class="nav-item">
            <Package :size="18" class="nav-icon" />
            <span>المنتجات</span>
          </router-link>
          <router-link :to="{ name: 'AdminCategories' }" class="nav-item">
            <Folders :size="18" class="nav-icon" />
            <span>الأقسام</span>
          </router-link>
          <router-link :to="{ name: 'AdminReports' }" class="nav-item">
            <FileBarChart :size="18" class="nav-icon" />
            <span>{{ $t('nav.reports') }}</span>
          </router-link>
          <router-link :to="{ name: 'AdminSystemLogs' }" class="nav-item">
            <Terminal :size="18" class="nav-icon text-brand" />
            <span>سجل التدقيق والسجلات الحية</span>
          </router-link>
          <router-link :to="{ name: 'AdminBackups' }" class="nav-item">
            <Archive :size="18" class="nav-icon text-emerald-400" />
            <span>النسخ الاحتياطي</span>
          </router-link>
        </div>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../store/auth';
import {
  Factory, LayoutDashboard, PlusCircle, ListOrdered,
  Clock, Layers, Inbox, Settings, CheckSquare, RotateCcw,
  History, Users, FileBarChart, Activity, X, Package, Folders, Terminal, BookOpen, FileText, Archive
} from 'lucide-vue-next';

const authStore = useAuthStore();
const userRole = computed(() => authStore.userRole);

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const onNavClick = (e) => {
  if (e.target.closest('.nav-item')) {
    emit('close');
  }
};
</script>

<style scoped>
.sidebar-header {
  height: 60px;
  padding: 0 var(--space-card);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.logo-box {
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.brand-title {
  font-size: var(--text-lg);
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md) 0;
}

.nav-group {
  margin-bottom: var(--space-card);
}

.nav-group-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-disabled);
  padding: 0 var(--space-card);
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px var(--space-card);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: all var(--transition-fast);
  position: relative;
  margin: 2px var(--space-sm);
  border-radius: var(--radius-md);
}

.nav-icon {
  margin-inline-end: var(--space-compact);
  color: var(--text-disabled);
  transition: color var(--transition-fast);
}

.nav-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item:hover .nav-icon {
  color: var(--brand-primary);
}

.router-link-active {
  background-color: var(--brand-light);
  color: var(--brand-primary);
}

.router-link-active .nav-icon {
  color: var(--brand-primary);
}

.router-link-active::before {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-start: -8px;
  width: 4px;
  height: 20px;
  background-color: var(--brand-primary);
  border-radius: 0 4px 4px 0;
}

html[dir="rtl"] .router-link-active::before {
  border-radius: 4px 0 0 4px;
}

.mobile-close {
  display: none;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .mobile-close {
    display: flex;
  }
}

.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: transparent; }
.sidebar-nav:hover::-webkit-scrollbar-thumb { background: var(--border-hover); }
</style>