<template>
  <div class="driver-book-assignment animate-slide-up">
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <BookOpen :size="24" class="text-brand" />
          صرف دفاتر السندات للسائقين
        </h2>
        <p class="text-secondary mt-1">توزيع الدفاتر ومتابعة السندات المستخدمة والمتبقية وربطها بالطلبات والعملاء والمندوبين</p>
      </div>
      <button @click="refreshAll" class="btn btn-ghost p-2" title="تحديث">
        <RefreshCw :size="18" :class="{ 'animate-spin': store.loading }" />
      </button>
    </div>

    <div v-if="store.error" class="mb-6 p-3 rounded-lg bg-red-500/10 text-danger text-sm flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <AlertCircle :size="18" />
        <span>{{ store.error }}</span>
      </div>
      <button @click="store.error = null" class="btn btn-ghost p-1"><X :size="16" /></button>
    </div>

    <div v-if="store.successMessage" class="mb-6 p-3 rounded-lg bg-green-500/10 text-success text-sm flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="18" />
        <span>{{ store.successMessage }}</span>
      </div>
      <button @click="store.successMessage = null" class="btn btn-ghost p-1"><X :size="16" /></button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">دفاتر متاحة للصرف</p>
        <p class="text-2xl font-bold text-success">{{ availableBooks.length }}</p>
      </div>
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">دفاتر مصروفة</p>
        <p class="text-2xl font-bold text-brand">{{ assignedBooks.length }}</p>
      </div>
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">سائقون لديهم دفاتر</p>
        <p class="text-2xl font-bold">{{ driverSummaries.length }}</p>
      </div>
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">متبقي للسائق المحدد</p>
        <p class="text-2xl font-bold text-warning">{{ driverSlipsData?.total_remaining_slips ?? '-' }}</p>
      </div>
    </div>

    <div class="glass-card p-0 overflow-hidden mb-6">
      <div class="p-4 border-b border-[var(--border-color)] flex flex-wrap items-center gap-2">
        <button @click="activeTab = 'available'" :class="['btn', activeTab === 'available' ? 'btn-primary' : 'btn-ghost border border-[var(--border-color)]']">
          الدفاتر المتاحة ({{ availableBooks.length }})
        </button>
        <button @click="activeTab = 'assigned'" :class="['btn', activeTab === 'assigned' ? 'btn-primary' : 'btn-ghost border border-[var(--border-color)]']">
          الدفاتر المصروفة ({{ assignedBooks.length }})
        </button>
        <button @click="openSlipsTab" :class="['btn', activeTab === 'slips' ? 'btn-primary' : 'btn-ghost border border-[var(--border-color)]']">
          متابعة السندات
        </button>
      </div>

      <div v-if="activeTab === 'available'" class="p-4">
        <div v-if="store.loading && store.books.length === 0" class="p-8 text-center text-secondary">جاري تحميل الدفاتر...</div>
        <div v-else-if="availableBooks.length === 0" class="p-8 text-center text-secondary">لا يوجد دفاتر متاحة للصرف حالياً في هذا المستودع.</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="book in availableBooks" :key="book.id" class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <div class="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--border-color)]">
              <span class="font-mono text-sm font-bold text-brand">{{ book.book_number }}</span>
              <span class="badge badge-success">متاح للصرف</span>
            </div>
            <div class="space-y-2 text-sm mb-4">
              <div class="flex justify-between gap-3"><span class="text-secondary">النطاق</span><span class="font-mono text-success">{{ book.start_number }} - {{ book.end_number }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-secondary">إجمالي السندات</span><span class="font-bold">{{ book.total_documents }} سند</span></div>
              <div class="flex justify-between gap-3"><span class="text-secondary">أمر الصرف</span><span class="font-mono text-xs">{{ book.batch?.batch_number || '-' }}</span></div>
            </div>
            <button @click="openAssignModal(book)" class="btn btn-primary w-full flex items-center justify-center gap-2">
              <UserCheck :size="16" />
              صرف الدفتر لسائق
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'assigned'" class="overflow-x-auto">
        <table class="w-full text-start">
          <thead>
            <tr class="text-secondary border-b border-[var(--border-color)]">
              <th class="p-3 text-start">رقم الدفتر</th>
              <th class="p-3 text-start">السائق</th>
              <th class="p-3 text-start">النطاق</th>
              <th class="p-3 text-start">المستخدم</th>
              <th class="p-3 text-start">المتبقي</th>
              <th class="p-3 text-start">الحالة</th>
              <th class="p-3 text-start">تاريخ الصرف</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading && store.books.length === 0"><td colspan="7" class="p-8 text-center text-secondary">جاري تحميل الدفاتر...</td></tr>
            <tr v-else-if="assignedBooks.length === 0"><td colspan="7" class="p-8 text-center text-secondary">لا يوجد دفاتر مصروفة لسائقين حالياً.</td></tr>
            <tr v-for="book in assignedBooks" :key="book.id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
              <td class="p-3 font-mono font-bold text-brand">{{ book.book_number }}</td>
              <td class="p-3 font-semibold">{{ book.driver?.name || '-' }}</td>
              <td class="p-3 font-mono text-success">{{ book.start_number }} - {{ book.end_number }}</td>
              <td class="p-3 font-bold text-danger">{{ book.used_documents_count }}</td>
              <td class="p-3 font-bold text-success">{{ book.remaining_documents_count }}</td>
              <td class="p-3"><span :class="['badge', getStatusBadgeClass(book.status)]">{{ getStatusText(book.status) }}</span></td>
              <td class="p-3 text-xs text-secondary">{{ formatDate(book.assigned_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'slips'" class="p-4 space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
          <h3 class="font-bold flex items-center gap-2">
            <AlertTriangle :size="20" class="text-warning" />
            متابعة السندات حسب السائق
          </h3>
          <select v-model="selectedDriverFilter" @change="fetchDriverSlips" class="form-input w-full lg:w-96">
            <option :value="null">اختر سائقاً لعرض تفاصيل سنداته...</option>
            <option v-for="item in driverFilterOptions" :key="item.driver_id" :value="item.driver_id">
              {{ item.driver?.name }} - متبقي {{ item.remaining_documents_count }} / مستخدم {{ item.used_documents_count }}
            </option>
          </select>
        </div>

        <div class="overflow-x-auto rounded-lg border border-[var(--border-color)]">
          <table class="w-full text-start">
            <thead>
              <tr class="text-secondary border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <th class="p-3 text-start">السائق</th>
                <th class="p-3 text-start">الدفاتر</th>
                <th class="p-3 text-start">نشطة/غير مكتملة</th>
                <th class="p-3 text-start">مكتملة</th>
                <th class="p-3 text-start">المستخدم</th>
                <th class="p-3 text-start">المتبقي</th>
                <th class="p-3 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="driverSummaries.length === 0">
                <td colspan="7" class="p-8 text-center text-secondary">لا يوجد سائقون لديهم دفاتر مصروفة حالياً.</td>
              </tr>
              <tr v-for="summary in driverSummaries" :key="summary.driver_id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                <td class="p-3 font-semibold">{{ summary.driver?.name || '-' }}</td>
                <td class="p-3 font-bold">{{ summary.books_count }}</td>
                <td class="p-3"><span :class="['badge', summary.has_incomplete_books ? 'badge-warning' : 'badge-success']">{{ summary.active_books_count }}</span></td>
                <td class="p-3">{{ summary.completed_books_count }}</td>
                <td class="p-3 font-bold text-danger">{{ summary.used_documents_count }}</td>
                <td class="p-3 font-bold text-success">{{ summary.remaining_documents_count }}</td>
                <td class="p-3 text-center">
                  <button @click="selectDriverForSlips(summary.driver_id)" class="btn btn-ghost p-2 text-brand" title="عرض التفاصيل">
                    <Eye :size="18" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!selectedDriverFilter" class="p-6 text-center text-secondary border border-dashed border-[var(--border-color)] rounded-lg">
          اختر سائقاً من القائمة لعرض السندات المتبقية والمستخدمة وربطها بالطلبات.
        </div>

        <div v-else-if="selectedDriverBooks.length === 0" class="p-8 text-center text-secondary">
          لا توجد دفاتر لهذا السائق ضمن نطاق العرض الحالي.
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h4 class="font-bold">تفاصيل سندات السائق: {{ selectedDriverName }}</h4>
            <span class="badge badge-info">{{ selectedDriverBooks.length }} دفتر</span>
          </div>

          <div v-for="book in selectedDriverBooks" :key="book.id" class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border-color)]">
              <div>
                <span class="font-mono text-sm font-bold text-brand">{{ book.book_number }}</span>
                <span class="text-xs text-secondary font-mono ms-3">النطاق: {{ book.start_number }} - {{ book.end_number }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <span :class="['badge', getStatusBadgeClass(book.status)]">{{ getStatusText(book.status) }}</span>
                <span class="badge badge-warning">متبقي: {{ book.remaining_documents_count }}</span>
                <span class="badge badge-danger">مستخدم: {{ book.used_documents_count }}</span>
              </div>
            </div>

            <div class="mb-4">
              <p class="text-secondary text-sm mb-2">السندات المتبقية أو الجاهزة للاستخدام</p>
              <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2">
                <span v-if="book.unused_numbers.length === 0" class="text-secondary text-sm">لا يوجد سندات متبقية في هذا الدفتر.</span>
                <span v-for="num in book.unused_numbers" :key="num" class="text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 font-mono text-success">{{ num }}</span>
              </div>
            </div>

            <div>
              <p class="text-secondary text-sm mb-2">السندات المستخدمة وربطها بالطلبات</p>
              <div class="overflow-x-auto rounded-lg border border-[var(--border-color)]">
                <table class="w-full text-start text-sm">
                  <thead>
                    <tr class="text-secondary border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                      <th class="p-3 text-start">رقم السند</th>
                      <th class="p-3 text-start">رقم الطلب</th>
                      <th class="p-3 text-start">العميل</th>
                      <th class="p-3 text-start">المندوب</th>
                      <th class="p-3 text-start">حالة الطلب</th>
                      <th class="p-3 text-start">تاريخ الاستخدام</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="book.used_slips.length === 0">
                      <td colspan="6" class="p-6 text-center text-secondary">لم يتم استخدام أي سند من هذا الدفتر حتى الآن.</td>
                    </tr>
                    <tr v-for="slip in book.used_slips" :key="slip.id" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                      <td class="p-3 font-mono font-bold text-brand">{{ slip.document_number }}</td>
                      <td class="p-3 font-mono">{{ slip.order?.order_number || '-' }}</td>
                      <td class="p-3">{{ slip.order?.client?.name || '-' }}</td>
                      <td class="p-3">{{ slip.order?.salesRep?.name || '-' }}</td>
                      <td class="p-3"><span class="badge badge-info">{{ slip.order?.status || '-' }}</span></td>
                      <td class="p-3 text-xs text-secondary">{{ formatDate(slip.used_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedBookToAssign" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-lg bg-[var(--bg-primary)] p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between gap-3 mb-6">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <UserCheck :size="24" class="text-brand" />
            صرف الدفتر {{ selectedBookToAssign.book_number }}
          </h3>
          <button @click="selectedBookToAssign = null" class="btn btn-ghost p-2"><X :size="18" /></button>
        </div>

        <form @submit.prevent="handleAssignBook" class="space-y-4">
          <div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-sm space-y-2">
            <div class="flex justify-between gap-3"><span class="text-secondary">نطاق أرقام السندات</span><span class="font-mono text-success font-bold">{{ selectedBookToAssign.start_number }} - {{ selectedBookToAssign.end_number }}</span></div>
            <div class="flex justify-between gap-3"><span class="text-secondary">إجمالي السندات</span><span class="font-bold">{{ selectedBookToAssign.total_documents }} سند</span></div>
          </div>

          <div class="form-group">
            <label class="text-sm font-bold mb-2 block">اختر السائق المصروف له <span class="text-danger">*</span></label>
            <select v-model="assignForm.driver_id" required @change="onDriverSelected" class="form-input w-full">
              <option :value="null" disabled>اختر السائق...</option>
              <option v-for="driver in driversList" :key="driver.id" :value="driver.id">{{ driver.name }} ({{ driver.phone || driver.username }})</option>
            </select>
          </div>

          <div v-if="driverWarning" class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-warning text-sm space-y-2">
            <div class="font-bold flex items-center gap-2"><AlertTriangle :size="16" />تنبيه قبل الصرف</div>
            <p>{{ driverWarning.details }}</p>
            <p class="text-secondary">يمكنك الاستمرار في الصرف، وسيتم إشعار السائق بالنطاق الجديد إضافة إلى السندات المتبقية.</p>
          </div>

          <div class="form-group">
            <label class="text-sm font-bold mb-2 block">ملاحظات الصرف (اختياري)</label>
            <textarea v-model="assignForm.notes" rows="2" placeholder="ملاحظات تشغيلية عند الصرف..." class="form-input w-full"></textarea>
          </div>

          <div class="flex gap-3 pt-4 border-t border-[var(--border-color)]">
            <button type="submit" class="btn btn-primary flex-1 py-3" :disabled="submittingAssign">{{ submittingAssign ? 'جاري الصرف...' : 'تأكيد وصرف الدفتر' }}</button>
            <button type="button" @click="selectedBookToAssign = null" class="btn btn-ghost flex-1 border border-[var(--border-color)]">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import omsApi from '../../services/omsApi';
import { useDeliveryBooksStore } from '../../store/deliveryBooks';
import { BookOpen, UserCheck, AlertCircle, CheckCircle2, AlertTriangle, X, RefreshCw, Eye } from 'lucide-vue-next';

const store = useDeliveryBooksStore();
const activeTab = ref('available');
const selectedBookToAssign = ref(null);
const submittingAssign = ref(false);
const driversList = ref([]);
const driverWarning = ref(null);
const driverSlipsData = ref(null);
const selectedDriverFilter = ref(null);

const assignForm = ref({ driver_id: null, notes: '' });

const availableBooks = computed(() => store.books.filter(b => b.status === 'available'));
const assignedBooks = computed(() => store.books.filter(b => b.status !== 'available'));
const driverSummaries = computed(() => driverSlipsData.value?.drivers_summary || []);
const selectedDriverBooks = computed(() => driverSlipsData.value?.books || driverSlipsData.value?.active_books || []);
const selectedDriverName = computed(() => {
  const selectedId = String(selectedDriverFilter.value || '');
  const summary = driverSummaries.value.find(item => String(item.driver_id) === selectedId);
  if (summary?.driver?.name) return summary.driver.name;
  const driver = driversList.value.find(item => String(item.id) === selectedId);
  return driver?.name || '-';
});
const driverFilterOptions = computed(() => {
  if (driverSummaries.value.length > 0) return driverSummaries.value;
  return driversList.value.map(driver => ({
    driver_id: driver.id,
    driver,
    used_documents_count: 0,
    remaining_documents_count: 0
  }));
});

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'available': return 'badge-success';
    case 'assigned': return 'badge-info';
    case 'partially_used': return 'badge-warning';
    case 'exhausted': return 'badge-danger';
    case 'closed': return 'badge-danger';
    default: return 'badge-info';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'available': return 'متاح للصرف';
    case 'assigned': return 'مصروف لسائق';
    case 'partially_used': return 'مستخدم جزئياً';
    case 'exhausted': return 'مكتمل/منتهي';
    case 'closed': return 'مغلق';
    case 'cancelled': return 'ملغي';
    default: return status;
  }
}

async function loadData() {
  await store.fetchBooks();
}

async function fetchDrivers() {
  try {
    const res = await omsApi.get('/api/users', { params: { role: 'driver', is_active: true } });
    driversList.value = res.data.users || res.data || [];
  } catch (err) {
    console.error('Failed to fetch drivers list:', err);
  }
}

async function refreshAll() {
  await loadData();
  await fetchDriverSlips();
}

function openSlipsTab() {
  activeTab.value = 'slips';
  fetchDriverSlips();
}

function selectDriverForSlips(driverId) {
  selectedDriverFilter.value = driverId;
  fetchDriverSlips();
}

function openAssignModal(book) {
  selectedBookToAssign.value = book;
  assignForm.value.driver_id = null;
  assignForm.value.notes = '';
  driverWarning.value = null;
}

async function onDriverSelected() {
  if (!assignForm.value.driver_id) {
    driverWarning.value = null;
    return;
  }

  try {
    const data = await store.fetchDriverSlipsSummary(assignForm.value.driver_id);
    if (data.books && data.books.length > 0) {
      const selectedDriverObj = driversList.value.find(d => d.id === assignForm.value.driver_id);
      const driverName = selectedDriverObj ? selectedDriverObj.name : 'السائق';
      const totalRemaining = data.total_remaining_slips;
      const ranges = data.books.filter(b => Number(b.remaining_documents_count || 0) > 0).map(b => `${b.start_number} - ${b.end_number}`).join(', ');

      driverWarning.value = totalRemaining > 0 ? {
        details: `تنبيه: ${driverName} لديه ${totalRemaining} سنداً متبقياً غير مستخدم من دفاتر سابقة بالنطاقات التالية: ${ranges}`
      } : null;
    } else {
      driverWarning.value = null;
    }
  } catch (err) {
    driverWarning.value = null;
  }
}

async function fetchDriverSlips() {
  try {
    driverSlipsData.value = await store.fetchDriverSlipsSummary(selectedDriverFilter.value);
  } catch (err) {
    console.error('Failed to fetch driver slips:', err);
  }
}

async function handleAssignBook() {
  if (!selectedBookToAssign.value || !assignForm.value.driver_id) return;
  submittingAssign.value = true;
  try {
    await store.assignBookToDriver(selectedBookToAssign.value.id, assignForm.value);
    selectedBookToAssign.value = null;
    await loadData();
    await fetchDriverSlips();
  } catch (err) {
    // handled by store
  } finally {
    submittingAssign.value = false;
  }
}

onMounted(() => {
  loadData();
  fetchDrivers();
  fetchDriverSlips();
});
</script>