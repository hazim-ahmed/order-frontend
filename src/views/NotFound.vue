<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
    <div class="p-4 bg-indigo-500/10 rounded-full text-indigo-400 mb-4">
      <FileQuestion :size="48" />
    </div>
    <h1 class="text-3xl font-extrabold mb-2">404 - الصفحة غير موجودة</h1>
    <p class="text-secondary max-w-md mb-6">
      عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله.
    </p>
    <router-link to="/redirect" class="btn btn-primary px-6 py-2.5">
      الرجوع إلى الصفحة الرئيسية
    </router-link>
  </div>
</template>

<script setup>
import { FileQuestion } from 'lucide-vue-next'
</script>
