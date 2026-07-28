import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import DashboardLayout from '../views/DashboardLayout.vue'

const routes = [
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('../views/Setup.vue'),
    meta: { setupOnly: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/redirect',
    name: 'RoleRedirect',
    component: () => import('../views/RoleRedirect.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'sales-rep/dashboard', name: 'SalesRepDashboard', component: () => import('../views/SalesRep/Dashboard.vue'), meta: { role: 'sales_rep' } },
      { path: 'sales-rep/new-order', name: 'SalesRepNewOrder', component: () => import('../views/SalesRep/NewOrder.vue'), meta: { role: 'sales_rep' } },
      { path: 'sales-rep/orders', name: 'SalesRepOrdersList', component: () => import('../views/SalesRep/OrdersList.vue'), meta: { role: 'sales_rep' } },
      { path: 'sales-rep/delivery-documents', name: 'SalesRepDeliveryDocuments', component: () => import('../views/SalesRep/DeliveryDocuments.vue'), meta: { role: 'sales_rep' } },

      { path: 'order/:id', name: 'SharedOrderDetail', component: () => import('../views/Shared/OrderDetail.vue') },
      { path: 'active-orders', name: 'SharedActiveOrders', component: () => import('../views/Shared/ActiveOrders.vue') },
      { path: 'sales-returns', name: 'SalesReturns', component: () => import('../views/Shared/SalesReturns.vue') },

      { path: 'sales-manager/dashboard', name: 'SalesManagerDashboard', component: () => import('../views/SalesManager/Dashboard.vue'), meta: { role: 'sales_manager' } },
      { path: 'sales-manager/pending', name: 'SalesManagerPendingOrders', component: () => import('../views/SalesManager/PendingOrders.vue'), meta: { role: 'sales_manager' } },
      { path: 'sales-manager/all-orders', name: 'SalesManagerAllOrders', component: () => import('../views/SalesManager/AllOrders.vue'), meta: { role: 'sales_manager' } },

      { path: 'inventory/dashboard', name: 'InventoryDashboard', component: () => import('../views/Inventory/Dashboard.vue'), meta: { role: 'inventory_manager' } },
      { path: 'inventory/incoming', name: 'InventoryIncomingOrders', component: () => import('../views/Inventory/IncomingOrders.vue'), meta: { role: 'inventory_manager' } },
      { path: 'inventory/processing', name: 'InventoryProcessing', component: () => import('../views/Inventory/Processing.vue'), meta: { role: 'inventory_manager' } },
      { path: 'inventory/ready', name: 'InventoryReadyOrders', component: () => import('../views/Inventory/ReadyOrders.vue'), meta: { role: 'inventory_manager' } },
      { path: 'inventory/returns', name: 'InventoryReturns', component: () => import('../views/Inventory/Returns.vue'), meta: { role: 'inventory_manager' } },
      { path: 'inventory/driver-books', name: 'InventoryDriverBooks', component: () => import('../views/Inventory/DriverBookAssignment.vue'), meta: { role: 'inventory_manager' } },

      { path: 'driver/dashboard', name: 'DriverDashboard', component: () => import('../views/Driver/Dashboard.vue'), meta: { role: 'driver' } },
      { path: 'driver/order/:id', name: 'DriverActiveOrder', component: () => import('../views/Driver/ActiveOrder.vue'), meta: { role: 'driver' } },
      { path: 'driver/history', name: 'DriverHistory', component: () => import('../views/Driver/History.vue'), meta: { role: 'driver' } },

      { path: 'admin/dashboard', name: 'AdminDashboard', component: () => import('../views/Admin/Dashboard.vue'), meta: { role: 'admin' } },
      { path: 'admin/delivery-books', name: 'AdminDeliveryBooks', component: () => import('../views/Admin/DeliveryBookBatches.vue'), meta: { role: 'admin' } },
      { path: 'admin/orders', name: 'AdminAllOrders', component: () => import('../views/Admin/AllOrders.vue'), meta: { role: 'admin' } },
      { path: 'admin/users', name: 'AdminUsers', component: () => import('../views/Admin/Users.vue'), meta: { role: 'admin' } },
      { path: 'admin/products', name: 'AdminProducts', component: () => import('../views/Admin/Products.vue'), meta: { role: 'admin' } },
      { path: 'admin/categories', name: 'AdminCategories', component: () => import('../views/Admin/Categories.vue'), meta: { role: 'admin' } },
      { path: 'admin/reports', name: 'AdminReports', component: () => import('../views/Admin/Reports.vue'), meta: { role: 'admin' } },
      { path: 'admin/audit-log', name: 'AdminAuditLog', component: () => import('../views/Admin/AuditLog.vue'), meta: { role: 'admin' } },
      { path: 'admin/logs', name: 'AdminSystemLogs', component: () => import('../views/Admin/SystemLogs.vue'), meta: { role: 'admin' } },
      { path: ':pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

let initializedSetupCache = null
let setupStatusPromise = null

const setupStatusUrl = () => `${import.meta.env.VITE_API_BASE_URL || ''}/api/setup/status`

async function fetchSetupStatus() {
  if (initializedSetupCache?.initialized) return initializedSetupCache
  if (!setupStatusPromise) {
    setupStatusPromise = fetch(setupStatusUrl(), {
      headers: { Accept: 'application/json' }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('setup-status-failed')
        const data = await response.json()
        if (data.initialized) initializedSetupCache = data
        return data
      })
      .finally(() => {
        setupStatusPromise = null
      })
  }

  return setupStatusPromise
}

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (authStore.token && !authStore.user) {
    authStore.initAuth()
  }

  let setupStatus = { initialized: true }
  try {
    setupStatus = await fetchSetupStatus()
  } catch (error) {
    setupStatus = { initialized: true, unavailable: true }
  }

  if (!setupStatus.initialized && to.name !== 'Setup') {
    return next({ name: 'Setup' })
  }

  if (to.name === 'Setup' && setupStatus.initialized) {
    return next({ name: authStore.isAuthenticated ? 'RoleRedirect' : 'Login' })
  }

  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.userRole

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' })
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: 'RoleRedirect' })
  }

  if (to.meta.role && to.meta.role !== userRole && userRole !== 'admin') {
    return next({ name: 'RoleRedirect' })
  }

  return next()
})

export default router