// ==============================================================================
// تاريخ التعديل: 2026-07-22
// الوظيفة: استخراج بيانات المستخدم من التوكن بشكل آمن وحمايتها ضد الفساد
// السياق: يحل ثغرة انهيار الواجهة (Frontend Audit - Section 3) عند توفر توكن فاسد في localStorage
// ==============================================================================
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import omsApi from '../services/omsApi'

function decodeTokenSafely(rawToken) {
  if (!rawToken) return null
  try {
    const decoded = jwtDecode(rawToken)
    // التحقق من أن التوكن لم تنته صلاحيتها
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return null
    }
    return decoded
  } catch (error) {
    console.error('فشل فك تشفير التوكن، تم التطهير التلقائي:', error)
    localStorage.removeItem('token')
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const savedToken = localStorage.getItem('token') || null
    const initialUser = decodeTokenSafely(savedToken)
    return {
      token: initialUser ? savedToken : null,
      user: initialUser
    }
  },

  getters: {
    // ==============================================================================
    // تاريخ التعديل: 2026-07-22
    // الوظيفة: التحقق من مصادقة المستخدم عبر وجود توكن صالح ومستخدم غير منتهي
    // ==============================================================================
    isAuthenticated: (state) => !!state.token && !!state.user,
    userRole: (state) => state.user?.role || null
  },

  actions: {
    // ==============================================================================
    // تاريخ التعديل: 2026-07-22
    // الوظيفة: تسجيل الدخول وحفظ البيانات بالمتجر والتخزين المحلي
    // ==============================================================================
    async login(username, password) {
      try {
        const response = await omsApi.post('/api/auth/login', {
          username,
          password
        })
        
        const { token } = response.data
        this.setSession(token)
        
        return true
      } catch (error) {
        console.error('خطأ تسجيل الدخول:', error)
        throw error
      }
    },

    // ==============================================================================
    // تاريخ التعديل: 2026-07-22
    // الوظيفة: إنهاء الجلسة وحذف البيانات المحلية
    // ==============================================================================
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },
    
    // ==============================================================================
    // تاريخ التعديل: 2026-07-22
    // الوظيفة: إعادة فك التوكن والتحقق الآمن من الصلاحية والانتهاء
    // ==============================================================================
    initAuth() {
      if (this.token) {
        const decoded = decodeTokenSafely(this.token)
        if (!decoded) {
          this.logout()
        } else {
          this.user = decoded
        }
      }
    },

    setSession(token) {
      this.token = token
      this.user = decodeTokenSafely(token)
      localStorage.setItem('token', token)
    }
  }
})
