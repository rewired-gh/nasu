<script setup lang="ts">
defineProps({
  label: String,
})
</script>

<template>
  <div class="flex flex-col p-5 shadow rounded-xl">
    <label class="text-sm text-slate-400 font-light">{{ label }}</label>
    <slot></slot>
  </div>
</template>
