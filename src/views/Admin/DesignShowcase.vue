<template>
  <div class="design-showcase animate-slide-up pb-10">
    <!-- Header -->
    <div class="mb-10">
      <div class="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-semibold rounded-full bg-brand/10 text-brand border border-brand/20">
        <Sparkles :size="14" />
        <span>عرض مهارات التصميم</span>
      </div>
      <h1 class="text-4xl font-extrabold text-primary mb-2 tracking-tight">النظام البصري (Design System)</h1>
      <p class="text-secondary max-w-2xl text-lg leading-relaxed">
        هذه الصفحة عبارة عن عرض تجريبي لاختبار تطبيق مهارات التصميم 
        <code class="text-xs bg-black/30 px-2 py-0.5 rounded text-gray-300">design_skills_analysis.md</code> 
        التي تم استخلاصها. نستعرض هنا الألوان، الهرمية النصية، البطاقات، والمدخلات.
      </p>
    </div>

    <div class="split-layout">
      <!-- Main Content Area -->
      <div class="split-layout-main flex flex-col gap-8">
        
        <!-- Typography Section -->
        <section class="glass-card p-6">
          <div class="border-b border-white/10 pb-4 mb-6">
            <h2 class="text-xl font-bold text-primary flex items-center gap-2">
              <Type :size="20" class="text-brand" />
              الهرمية النصية (Typography & Hierarchy)
            </h2>
          </div>
          
          <div class="flex flex-col gap-6">
            <div>
              <p class="text-xs font-mono text-muted mb-1 uppercase tracking-widest">Display / Hero</p>
              <h1 class="text-5xl font-extrabold tracking-tighter text-primary">واجهة استثنائية</h1>
            </div>
            <div>
              <p class="text-xs font-mono text-muted mb-1 uppercase tracking-widest">Page Title</p>
              <h2 class="text-3xl font-bold text-primary">إعدادات النظام المتقدمة</h2>
            </div>
            <div>
              <p class="text-xs font-mono text-muted mb-1 uppercase tracking-widest">Section Title</p>
              <h3 class="text-xl font-semibold text-primary">تفاصيل الحساب والفواتير</h3>
            </div>
            <div>
              <p class="text-xs font-mono text-muted mb-1 uppercase tracking-widest">Body Text (Neutral Secondary)</p>
              <p class="text-base text-secondary leading-relaxed max-w-reading">
                هذا النص يمثل فقرة عادية. التركيز هنا على لون النص (رمادي مزرق) بدلاً من الأبيض الناصع، مما يخفف العبء البصري ويوجه الانتباه للعناوين الرئيسية. لاحظ التباعد بين السطور (Line-height) لدعم سهولة القراءة.
              </p>
            </div>
          </div>
        </section>

        <!-- Components & Inputs Section -->
        <section class="glass-card p-6">
          <div class="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-primary flex items-center gap-2">
              <ToggleLeft :size="20" class="text-brand" />
              الحقول والأزرار (Form & Buttons)
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Inputs -->
            <div class="flex flex-col gap-5">
              <div class="form-group mb-0">
                <label class="form-label text-sm font-semibold text-primary mb-2 block">حقل نصي قياسي</label>
                <div class="relative">
                  <Mail class="absolute inset-y-0 my-auto start-3 text-secondary" :size="16" />
                  <input type="text" class="form-input w-full ps-10 bg-white/5 border border-white/10 rounded-lg p-2.5 text-primary focus:border-brand focus:ring-2 focus:ring-brand/30 transition-all" placeholder="name@company.com" />
                </div>
                <p class="text-xs text-muted mt-1.5">يستخدم لالتقاط مدخلات المستخدم العادية.</p>
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-sm font-semibold text-primary mb-2 block">حقل به خطأ (Error State)</label>
                <div class="relative">
                  <input type="password" class="form-input w-full bg-rose-500/5 border border-rose-500/50 rounded-lg p-2.5 text-rose-200 focus:ring-2 focus:ring-rose-500/30 transition-all" value="wrongpassword" />
                </div>
                <p class="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle :size="12" />
                  كلمة المرور غير صحيحة، يرجى المحاولة مجدداً.
                </p>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex flex-col gap-4 justify-center bg-black/20 p-5 rounded-xl border border-white/5">
              <button class="btn btn-primary w-full py-2.5 shadow-lg shadow-brand/20 flex justify-center items-center gap-2">
                <Check :size="16" /> الزر الأساسي (Primary)
              </button>
              
              <button class="btn btn-outline w-full py-2.5 border-white/20 text-primary hover:bg-white/5 flex justify-center items-center gap-2">
                <Settings2 :size="16" /> زر ثانوي (Outline)
              </button>

              <button class="btn bg-rose-500/10 text-rose-500 border border-rose-500/20 w-full py-2.5 hover:bg-rose-500 hover:text-white transition-colors flex justify-center items-center gap-2">
                <Trash2 :size="16" /> زر الخطر (Danger)
              </button>
            </div>
          </div>
        </section>

      </div>

      <!-- Side / Sticky Panel -->
      <div class="split-layout-side">
        <div class="sticky top-6 flex flex-col gap-5">
          
          <!-- Semantic Status Colors -->
          <div class="glass-card p-5 border-t-4 border-indigo-500">
            <h3 class="font-bold text-primary mb-4 text-sm uppercase tracking-wider">الألوان الدلالية</h3>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 class="text-emerald-400" :size="18" />
                <span class="text-sm font-semibold text-emerald-100">نجاح (Success)</span>
              </div>
              <div class="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle class="text-amber-400" :size="18" />
                <span class="text-sm font-semibold text-amber-100">تحذير (Warning)</span>
              </div>
              <div class="flex items-center gap-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <XCircle class="text-rose-400" :size="18" />
                <span class="text-sm font-semibold text-rose-100">خطأ (Danger)</span>
              </div>
              <div class="flex items-center gap-3 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info class="text-blue-400" :size="18" />
                <span class="text-sm font-semibold text-blue-100">معلومة (Info)</span>
              </div>
            </div>
          </div>

          <!-- Micro Analytics Widget -->
          <div class="glass-card p-5 bg-gradient-to-br from-white/5 to-transparent">
            <h3 class="text-secondary text-sm font-medium mb-1">الرصيد المتاح</h3>
            <div class="text-3xl font-extrabold text-primary mb-4 tracking-tight">SAR 45,200</div>
            <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-brand w-3/4 rounded-full"></div>
            </div>
            <p class="text-xs text-muted mt-2 text-end">تم استهلاك 75% من الحد</p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Sparkles, Type, ToggleLeft, Mail, AlertCircle, 
  Check, Settings2, Trash2, CheckCircle2, AlertTriangle, 
  XCircle, Info
} from 'lucide-vue-next'
</script>

<style scoped>
.split-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.split-layout-main {
  flex: 3 1 20rem;
  min-width: 0;
}

.split-layout-side {
  flex: 1 1 18rem;
  min-width: 0;
}

.max-w-reading {
  max-width: 72ch;
}
</style>
