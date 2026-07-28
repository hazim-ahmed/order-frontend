import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    socket: null,
    notifications: [],
    unreadCount: 0
  }),
  actions: {
    initSocket() {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated || !authStore.token) return

      if (this.socket) {
        this.socket.disconnect()
      }

      const baseURL = import.meta.env.VITE_API_BASE_URL || ''
      
      this.socket = io(baseURL, {
        auth: {
          token: authStore.token
        }
      })

      this.socket.on('connect', () => {
        console.log('WebSocket connected')
        this.socket.emit('joinRoleRoom', authStore.userRole)
        if (authStore.user) {
          this.socket.emit('joinUserRoom', authStore.user.id)
        }
      })

      const handleOrderStatusChanged = (data) => {
        this.addNotification({
          id: Date.now() + Math.random(),
          type: 'status_update',
          title: 'تحديث حالة الطلب',
          message: `تم تحديث حالة الطلب ${data.order_number || data.order_id} إلى ${data.new_status || data.status}`,
          orderId: data.order_id,
          time: new Date(),
          read: false
        })
      }

      const handleNewOrderPending = (data) => {
        this.addNotification({
          id: Date.now() + Math.random(),
          type: 'new_order',
          title: 'طلب جديد بانتظار الموافقة',
          message: `الطلب ${data.order_number || data.order_id} بانتظار المراجعة.`,
          orderId: data.order_id,
          time: new Date(),
          read: false
        })
      }

      const handleDriverAssigned = (data) => {
        this.addNotification({
          id: Date.now() + Math.random(),
          type: 'driver_assigned',
          title: 'إسناد طلب جديد',
          message: `تم إسناد الطلب ${data.order_number || data.order_id} إليك.`,
          orderId: data.order_id,
          time: new Date(),
          read: false
        })
      }

      // Listen for both camelCase and snake_case backend events
      this.socket.on('orderStatusChanged', handleOrderStatusChanged)
      this.socket.on('order_status_changed', handleOrderStatusChanged)

      this.socket.on('newOrderPending', handleNewOrderPending)
      this.socket.on('new_order_pending', handleNewOrderPending)

      this.socket.on('driverAssigned', handleDriverAssigned)
      this.socket.on('new_delivery_assigned', handleDriverAssigned)

      this.socket.on('order_delivered', (data) => {
        this.addNotification({
          id: Date.now() + Math.random(),
          type: 'order_delivered',
          title: 'تم تسليم الطلب',
          message: `تم تسليم الطلب ${data.order_number || data.order_id} بنجاح.`,
          orderId: data.order_id,
          time: new Date(),
          read: false
        })
      })

      this.socket.on('return_action_required', (data) => {
        this.addNotification({
          id: Date.now() + Math.random(),
          type: 'return_action',
          title: 'طلب إرجاع جديد',
          message: `يتطلب طلب المرتجع للطلب ${data.order_number || data.order_id} اتخاذ إجراء.`,
          orderId: data.order_id,
          time: new Date(),
          read: false
        })
      })

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
      })
    },

    addNotification(notification) {
      this.notifications.unshift(notification)
      this.unreadCount++
    },

    markAsRead(id) {
      const notif = this.notifications.find(n => n.id === id)
      if (notif && !notif.read) {
        notif.read = true
        this.unreadCount--
      }
    },
    
    markAllAsRead() {
      this.notifications.forEach(n => n.read = true)
      this.unreadCount = 0
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      this.notifications = []
      this.unreadCount = 0
    }
  }
})
