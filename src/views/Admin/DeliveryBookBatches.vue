<template>
  <div class="delivery-batches animate-slide-up">
    <div class="header-section mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <BookOpen :size="24" class="text-brand" />
          إدارة دفاتر سندات التسليم
        </h2>
        <p class="text-secondary mt-1">إنشاء ومتابعة أوامر صرف دفاتر السندات الورقية لأمناء المخازن</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary flex items-center gap-2">
        <PlusCircle :size="18" />
        إصدار أمر صرف جديد
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

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">إجمالي أوامر الصرف</p>
        <p class="text-2xl font-bold">{{ store.batches.length }}</p>
      </div>
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">إجمالي الدفاتر الصادرة</p>
        <p class="text-2xl font-bold text-brand">{{ totalBooksCount }}</p>
      </div>
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">إجمالي أوراق السندات</p>
        <p class="text-2xl font-bold text-success">{{ totalDocumentsCount }}</p>
      </div>
      <div class="glass-card">
        <p class="text-secondary text-sm mb-2">أعلى رقم سند</p>
        <p class="text-2xl font-bold text-warning">{{ maxEndNumber || '-' }}</p>
      </div>
    </div>

    <div class="glass-card overflow-hidden p-0">
      <div class="p-4 border-b border-[var(--border-color)] flex items-center justify-between gap-3">
        <h3 class="font-bold flex items-center gap-2">
          <Layers :size="20" class="text-brand" />
          سجل أوامر صرف الدفاتر
        </h3>
        <button @click="loadData" class="btn btn-ghost p-2" title="تحديث">
          <RefreshCw :size="18" :class="{ 'animate-spin': store.loading }" />
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-start">
          <thead>
            <tr class="text-secondary border-b border-[var(--border-color)]">
              <th class="p-3 text-start">رقم أمر الصرف</th>
              <th class="p-3 text-start">أمين المخزن</th>
              <th class="p-3 text-start">بداية السند</th>
              <th class="p-3 text-start">آخر سند</th>
              <th class="p-3 text-start">مدى الدفتر</th>
              <th class="p-3 text-start">عدد الدفاتر</th>
              <th class="p-3 text-start">إجمالي السندات</th>
              <th class="p-3 text-start">بواسطة</th>
              <th class="p-3 text-start">التاريخ</th>
              <th class="p-3 text-center">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading && store.batches.length === 0">
              <td colspan="10" class="p-8 text-center text-secondary">جاري تحميل البيانات...</td>
            </tr>
            <tr v-else-if="store.batches.length === 0">
              <td colspan="10" class="p-8 text-center text-secondary">لا توجد أوامر صرف دفاتر مسجلة حاليا.</td>
            </tr>
            <template v-for="batch in store.batches" :key="batch.id">
              <tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                <td class="p-3 font-mono font-bold text-brand">{{ batch.batch_number }}</td>
                <td class="p-3 font-semibold">{{ batch.inventoryManager?.name || '-' }}</td>
                <td class="p-3 font-mono text-success">{{ batch.start_number }}</td>
                <td class="p-3 font-mono text-warning">{{ batch.end_number }}</td>
                <td class="p-3">{{ batch.book_size }} سند</td>
                <td class="p-3">{{ batch.books_count }} دفتر</td>
                <td class="p-3 font-bold">{{ batch.total_documents }}</td>
                <td class="p-3 text-xs text-secondary">{{ batch.createdBy?.name || '-' }}</td>
                <td class="p-3 text-xs text-secondary">{{ formatDate(batch.createdAt) }}</td>
                <td class="p-3 text-center">
                  <button @click="toggleBatchExpand(batch.id)" class="btn btn-ghost p-2 text-brand" title="عرض الدفاتر">
                    <ChevronDown :size="18" class="transition-transform" :class="{ 'rotate-180': expandedBatches.includes(batch.id) }" />
                  </button>
                </td>
              </tr>

              <tr v-if="expandedBatches.includes(batch.id)">
                <td colspan="10" class="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                  <div class="mb-3 flex items-center gap-2 text-sm font-bold">
                    <BookOpen :size="18" class="text-brand" />
                    الدفاتر التابعة لأمر الصرف {{ batch.batch_number }}
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div v-for="book in batch.books" :key="book.id" class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
                      <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[var(--border-color)]">
                        <span class="font-mono text-sm font-bold text-brand">{{ book.book_number }}</span>
                        <span :class="['badge', getStatusBadgeClass(book.status)]">{{ getStatusText(book.status) }}</span>
                      </div>
                      <div class="space-y-2 text-sm">
                        <div class="flex justify-between gap-3">
                          <span class="text-secondary">النطاق</span>
                          <span class="font-mono text-success">{{ book.start_number }} - {{ book.end_number }}</span>
                        </div>
                        <div class="flex justify-between gap-3">
                          <span class="text-secondary">السائق</span>
                          <span class="font-semibold">{{ book.driver?.name || 'غير مصروف' }}</span>
                        </div>
                        <div class="flex justify-between gap-3">
                          <span class="text-secondary">المستخدم / المتبقي</span>
                          <span><strong class="text-danger">{{ book.used_documents_count }}</strong> / <strong class="text-success">{{ book.remaining_documents_count }}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showCreateModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card w-full max-w-2xl bg-[var(--bg-primary)] p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between gap-3 mb-6">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <PlusCircle :size="24" class="text-brand" />
            إصدار أمر صرف دفاتر سندات تسليم
          </h3>
          <button @click="showCreateModal = false" class="btn btn-ghost p-2"><X :size="18" /></button>
        </div>

        <form @submit.prevent="handleCreateBatch">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group md:col-span-2">
              <label class="text-sm font-bold mb-2 block">أمين المخزن المستلم <span class="text-danger">*</span></label>
              <select v-model="form.inventory_manager_id" required class="form-input w-full">
                <option :value="null" disabled>اختر أمين المخزن...</option>
                <option v-for="user in inventoryManagers" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.username }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">بداية رقم السند <span class="text-danger">*</span></label>
              <input v-model.number="form.start_number" type="number" min="1" required :disabled="hasExistingBatches" placeholder="مثال: 1000" class="form-input w-full font-mono" />
              <p v-if="hasExistingBatches" class="text-xs text-secondary mt-2">يتم تحديد البداية تلقائياً من آخر سند مسجل: {{ nextStartNumber }}</p>
            </div>

            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">مدى الدفتر الواحد <span class="text-danger">*</span></label>
              <input v-model.number="form.book_size" type="number" min="1" required placeholder="مثال: 50" class="form-input w-full font-mono" />
            </div>

            <div class="form-group">
              <label class="text-sm font-bold mb-2 block">عدد الدفاتر المطلوبة <span class="text-danger">*</span></label>
              <input v-model.number="form.books_count" type="number" min="1" required placeholder="مثال: 3" class="form-input w-full font-mono" />
            </div>

            <div class="form-group md:col-span-2">
              <label class="text-sm font-bold mb-2 block">ملاحظات (اختياري)</label>
              <textarea v-model="form.notes" rows="2" placeholder="أي ملاحظات تشغيلية..." class="form-input w-full"></textarea>
            </div>
          </div>

          <div v-if="calculatedDetails" class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 mb-6">
            <div class="flex items-center justify-between gap-3 mb-3">
              <span class="font-bold text-sm">معاينة الحسابات اللحظية</span>
              <span class="badge badge-info">{{ calculatedDetails.total_documents }} سند إجمالي</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
              <div>أول سند: <strong class="font-mono text-success">{{ calculatedDetails.start_number }}</strong></div>
              <div>آخر سند: <strong class="font-mono text-warning">{{ calculatedDetails.end_number }}</strong></div>
              <div>إجمالي الدفاتر: <strong>{{ form.books_count }}</strong></div>
            </div>
            <div class="pt-3 border-t border-[var(--border-color)]">
              <p class="text-secondary text-sm mb-2">تقسيم الدفاتر المتوقع</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="sub in calculatedDetails.subBooks" :key="sub.index" class="text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 font-mono">
                  دفتر {{ sub.index }}: [{{ sub.start_number }} - {{ sub.end_number }}]
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t border-[var(--border-color)]">
            <button type="submit" class="btn btn-primary flex-1 py-3" :disabled="submitting">
              {{ submitting ? 'جاري الحفظ...' : 'حفظ وإصدار أمر الصرف' }}
            </button>
            <button type="button" @click="showCreateModal = false" class="btn btn-ghost flex-1 border border-[var(--border-color)]">إلغاء</button>
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
import { BookOpen, PlusCircle, AlertCircle, CheckCircle2, Layers, RefreshCw, ChevronDown, X } from 'lucide-vue-next';

const store = useDeliveryBooksStore();
const showCreateModal = ref(false);
const submitting = ref(false);
const expandedBatches = ref([]);
const inventoryManagers = ref([]);

const form = ref({
  inventory_manager_id: null,
  start_number: 1000,
  book_size: 50,
  books_count: 3,
  notes: ''
});

const totalBooksCount = computed(() => {
  return store.batches.reduce((sum, b) => sum + (b.books_count || 0), 0);
});

const totalDocumentsCount = computed(() => {
  return store.batches.reduce((sum, b) => sum + (b.total_documents || 0), 0);
});

const maxEndNumber = computed(() => {
  if (store.batches.length === 0) return 0;
  return Math.max(...store.batches.map(b => b.end_number || 0));
});

const hasExistingBatches = computed(() => store.batches.length > 0);

const nextStartNumber = computed(() => {
  if (store.nextStartNumber) return store.nextStartNumber;
  if (maxEndNumber.value) return maxEndNumber.value + 1;
  return Number(form.value.start_number) || 1000;
});

const effectiveStartNumber = computed(() => {
  return hasExistingBatches.value ? nextStartNumber.value : Number(form.value.start_number);
});

const calculatedDetails = computed(() => {
  const start = Number(effectiveStartNumber.value);
  const size = Number(form.value.book_size);
  const count = Number(form.value.books_count);

  if (isNaN(start) || start < 1 || isNaN(size) || size < 1 || isNaN(count) || count < 1) {
    return null;
  }

  const total = size * count;
  const end = start + total - 1;
  const subBooks = [];
  let currentStart = start;

  for (let i = 1; i <= count; i++) {
    const currentEnd = currentStart + size - 1;
    subBooks.push({ index: i, start_number: currentStart, end_number: currentEnd });
    currentStart = currentEnd + 1;
  }

  return { start_number: start, end_number: end, total_documents: total, subBooks };
});

function toggleBatchExpand(batchId) {
  if (expandedBatches.value.includes(batchId)) {
    expandedBatches.value = expandedBatches.value.filter(id => id !== batchId);
  } else {
    expandedBatches.value.push(batchId);
  }
}

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
    default: return 'badge-info';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'available': return 'متاح للصرف';
    case 'assigned': return 'مصروف لسائق';
    case 'partially_used': return 'مستخدم جزئيا';
    case 'exhausted': return 'مكتمل/منتهي';
    default: return status;
  }
}

function syncFormStartNumber() {
  if (hasExistingBatches.value || !form.value.start_number) {
    form.value.start_number = nextStartNumber.value;
  }
}

function openCreateModal() {
  syncFormStartNumber();
  showCreateModal.value = true;
}

async function loadData() {
  await store.fetchBatches();
  syncFormStartNumber();
}

async function fetchInventoryManagers() {
  try {
    const res = await omsApi.get('/api/users', { params: { role: 'inventory_manager', is_active: true } });
    inventoryManagers.value = res.data.users || res.data || [];
  } catch (err) {
    console.error('Failed to fetch inventory managers:', err);
  }
}

async function handleCreateBatch() {
  submitting.value = true;
  try {
    await store.createBatch({
      ...form.value,
      start_number: effectiveStartNumber.value
    });
    syncFormStartNumber();
    showCreateModal.value = false;
    form.value.notes = '';
  } catch (err) {
    // handled by store
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadData();
  fetchInventoryManagers();
});
</script>