<script setup lang="ts">
export interface Props {
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})
</script>

<template>
  <button
    :disabled="props.disabled"
    class="py-3 px-6 shadow rounded-xl font-light ease-in-out duration-200 hover:bg-slate-50 focus:bg-slate-50 active:bg-slate-100 disabled:(text-slate-300 bg-slate-50 cursor-not-allowed)"
  >
    <slot></slot>
  </button>
</template>
