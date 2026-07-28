<template>
  <div class="animation-showcase pb-10">
    <!-- Header -->
    <div class="mb-10 animate-fade-in-up">
      <div class="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-semibold rounded-full bg-brand/10 text-brand border border-brand/20">
        <MonitorPlay :size="14" />
        Design Engineering
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-primary mb-2">
        معرض الأنيميشن التفاعلي
      </h1>
      <p class="text-secondary max-w-2xl text-sm leading-relaxed">
        تطبيق عملي لمبادئ Apple Design وفلسفة Emil Kowalski في هندسة التصميم. 
        هنا نختبر تأثيرات الاستجابة للضغط (Scale on Press)، الدخول التدريجي للمكونات (Stagger)، والانتقال الناعم باستخدام التمويه (Blur Crossfade).
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- 1. Apple-style Interactions (Zero Latency & Springs) -->
      <section class="glass-card stagger-item stagger-1">
        <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
          <MousePointerClick :size="18" class="text-brand" />
          الاستجابة الفورية (Zero Latency)
        </h2>
        <p class="text-xs text-secondary mb-6">
          الأزرار هنا تستجيب عند الضغط المباشر (Pointer-down) بحجم <code>scale(0.97)</code> دون انتظار الإفلات، لتعطي إحساساً ملموساً.
        </p>

        <div class="flex flex-wrap gap-4">
          <button class="btn btn-primary apple-btn">
            زر أساسي (Primary)
          </button>
          <button class="btn btn-outline apple-btn">
            زر ثانوي (Outline)
          </button>
          
          <button 
            class="interactive-card flex items-center justify-between w-full mt-4 p-4 rounded-xl border border-border"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                <Settings :size="20" />
              </div>
              <div class="text-start">
                <div class="font-semibold text-sm text-primary">إعدادات النظام</div>
                <div class="text-xs text-secondary">اضغط لرؤية تأثير النبض والانكماش</div>
              </div>
            </div>
            <ChevronLeft :size="18" class="text-muted" />
          </button>
        </div>
      </section>

      <!-- 2. Enter Animations & Staggering -->
      <section class="glass-card stagger-item stagger-2">
        <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
          <Layers :size="18" class="text-amber-500" />
          الدخول المتسلسل (Staggered Enter)
        </h2>
        <p class="text-xs text-secondary mb-6">
          العناصر تظهر بتأخير بسيط (50ms) بين بعضها البعض، ومن <code>scale(0.95)</code> مع <code>opacity: 0</code> بدلاً من الظهور من العدم <code>scale(0)</code>.
        </p>

        <div class="flex flex-col gap-3">
          <div class="skeleton-row stagger-child stagger-child-1"></div>
          <div class="skeleton-row stagger-child stagger-child-2"></div>
          <div class="skeleton-row stagger-child stagger-child-3"></div>
          <div class="skeleton-row stagger-child stagger-child-4"></div>
        </div>
      </section>

      <!-- 3. Blur Crossfade State Switch -->
      <section class="glass-card stagger-item stagger-3 lg:col-span-2">
        <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
          <Blend :size="18" class="text-emerald-500" />
          الانتقال الناعم للبيانات (Blur Crossfade)
        </h2>
        <p class="text-xs text-secondary mb-6">
          عند تبديل الحالة، يتم استخدام تمويه <code>blur(2px)</code> لربط المشهد القديم بالجديد، لتجنب القطع الحاد وجعل المشهد يبدو كتحول سحري واحد.
        </p>

        <div class="flex items-center gap-4 mb-6">
          <div class="toggle-switch">
            <input type="checkbox" id="demo-toggle" class="sr-only" v-model="isDemoActive">
            <label for="demo-toggle" class="toggle-label"></label>
          </div>
          <span class="text-sm font-medium text-primary">تبديل وضع العرض</span>
        </div>

        <div class="relative w-full max-w-md mx-auto h-32 rounded-2xl border border-border bg-surface overflow-hidden flex items-center justify-center p-6">
          <!-- State 1 -->
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300 ease-out" 
               :class="isDemoActive ? 'opacity-0 scale-95 blur-[4px]' : 'opacity-100 scale-100 blur-0'">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <CloudOff :size="24" class="text-slate-400" />
            </div>
            <span class="font-semibold text-sm text-secondary">الخدمة غير متصلة</span>
          </div>
          
          <!-- State 2 -->
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300 ease-out" 
               :class="!isDemoActive ? 'opacity-0 scale-105 blur-[4px]' : 'opacity-100 scale-100 blur-0'">
            <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CloudLightning :size="24" class="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span class="font-semibold text-sm text-emerald-600 dark:text-emerald-400">الخدمة متصلة وتعمل</span>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  MonitorPlay, MousePointerClick, Layers, Blend,
  ChevronLeft, Settings, CloudOff, CloudLightning
} from 'lucide-vue-next'

const isDemoActive = ref(false)
</script>

<style scoped>
/* =========================================
   Apple Design & Emil Kowalski Principles
   ========================================= */

/* 2. Zero Latency Click (Scale on Press) */
.apple-btn, .interactive-card {
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1), background-color 200ms ease, box-shadow 200ms ease;
  will-change: transform;
}
.apple-btn:active, .interactive-card:active {
  transform: scale(0.97);
}
.interactive-card:hover {
  background-color: var(--bg-hover);
  border-color: var(--brand-light);
}

/* 3. Staggered Animations (Enter with slight scale, never scale 0) */
@keyframes fadeInUpScale {
  0% {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.stagger-item {
  opacity: 0;
  animation: fadeInUpScale 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

.stagger-1 { animation-delay: 50ms; }
.stagger-2 { animation-delay: 100ms; }
.stagger-3 { animation-delay: 150ms; }

/* Stagger Children inside Cards */
.skeleton-row {
  height: 48px;
  width: 100%;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  opacity: 0;
  animation: fadeInUpScale 350ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
.stagger-child-1 { animation-delay: 200ms; }
.stagger-child-2 { animation-delay: 260ms; }
.stagger-child-3 { animation-delay: 320ms; }
.stagger-child-4 { animation-delay: 380ms; }

/* 4. Beautiful Toggle Switch */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
}
.toggle-label {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--border-color);
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.toggle-label::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.toggle-switch input:checked + .toggle-label {
  background: var(--brand-primary);
}
.toggle-switch input:checked + .toggle-label::after {
  transform: translateX(20px);
}
html[dir="rtl"] .toggle-switch input:checked + .toggle-label::after {
  transform: translateX(-20px);
}

.animate-fade-in-up {
  animation: fadeInUpScale 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
</style>
