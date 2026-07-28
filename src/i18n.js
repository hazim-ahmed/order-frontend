// ============================================================
// [إعدادات اللغات] — إعداد وتكوين دعم اللغات باستخدام Vue I18n
// [I18n Setup] — Configuration for Vue I18n plugin
// ============================================================
import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      myOrders: 'My Orders',
      newOrder: 'New Order',
      pendingApproval: 'Pending Approval',
      allOrders: 'All Orders',
      incomingOrders: 'Incoming Orders',
      processing: 'Processing',
      readyOrders: 'Ready Orders',
      returns: 'Returns',
      activeOrders: 'Active Orders',
      history: 'History',
      users: 'Users',
      reports: 'Reports',
      auditLog: 'Audit Log',
      erpSync: 'ERP Sync',
      settings: 'Settings'
    },
    order: {
      status: {
        pending_sales_approval: 'Pending Sales Approval',
        pending_inventory_approval: 'Pending Inventory Approval',
        processing_in_warehouse: 'Processing in Warehouse',
        assigned_to_driver: 'Assigned to Driver',
        ready_for_pickup: 'Ready for Pickup',
        picked_up_by_driver: 'Picked up by Driver',
        delivered: 'Delivered',
        failed_delivery: 'Failed Delivery',
        return_requested: 'Return Requested',
        returned_to_warehouse: 'Returned to Warehouse',
        rejected_by_sales: 'Rejected by Sales',
        cancelled: 'Cancelled'
      }
    },
    actions: {
      approve: 'Approve',
      reject: 'Reject',
      assignDriver: 'Assign Driver',
      confirmPickup: 'Confirm Pickup',
      confirmDelivery: 'Confirm Delivery',
      reportFailure: 'Report Failure',
      requestReturn: 'Request Return',
      confirmReturn: 'Confirm Return',
      viewDetails: 'View Details',
      downloadInvoice: 'Download Invoice',
      cancel: 'Cancel'
    },
    system: {
      success: 'Success',
      error: 'Error',
      unauthorized: 'Unauthorized Access',
      loading: 'Loading...'
    }
  },
  ar: {
    nav: {
      dashboard: 'لوحة التحكم',
      myOrders: 'طلباتي',
      newOrder: 'طلب جديد',
      pendingApproval: 'بانتظار الموافقة',
      allOrders: 'كل الطلبات',
      incomingOrders: 'الطلبات الواردة',
      processing: 'قيد التجهيز',
      readyOrders: 'طلبات جاهزة',
      returns: 'المرتجعات',
      activeOrders: 'طلباتي النشطة',
      history: 'السجل',
      users: 'المستخدمون',
      reports: 'التقارير',
      auditLog: 'سجل التدقيق',
      erpSync: 'مزامنة ERP',
      settings: 'الإعدادات'
    },
    order: {
      status: {
        pending_sales_approval: 'بانتظار موافقة المبيعات',
        pending_inventory_approval: 'بانتظار موافقة المخزن',
        processing_in_warehouse: 'قيد التجهيز في المخزن',
        assigned_to_driver: 'تم التعيين لسائق',
        ready_for_pickup: 'جاهز للاستلام',
        picked_up_by_driver: 'في الطريق',
        delivered: 'تم التسليم',
        failed_delivery: 'فشل التسليم',
        return_requested: 'طلب إرجاع',
        returned_to_warehouse: 'مرتجع للمخزن',
        rejected_by_sales: 'مرفوض من المبيعات',
        cancelled: 'ملغي'
      }
    },
    actions: {
      approve: 'موافقة',
      reject: 'رفض',
      assignDriver: 'تعيين سائق',
      confirmPickup: 'تأكيد الاستلام',
      confirmDelivery: 'تأكيد التسليم',
      reportFailure: 'الإبلاغ عن فشل',
      requestReturn: 'طلب إرجاع',
      confirmReturn: 'تأكيد المرتجع',
      viewDetails: 'عرض التفاصيل',
      downloadInvoice: 'تحميل الفاتورة',
      cancel: 'إلغاء'
    },
    system: {
      success: 'نجاح',
      error: 'خطأ',
      unauthorized: 'غير مصرح',
      loading: 'جاري التحميل...'
    }
  }
};

const i18n = createI18n({
  legacy: false, // For Vue 3 Composition API support
  locale: localStorage.getItem('lang') || 'ar',
  fallbackLocale: 'en',
  messages
});

export default i18n;
