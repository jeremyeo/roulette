<script setup lang="ts">
withDefaults(defineProps<{
  disabled?: boolean
  loading?: boolean
  openType?: string
  backgroundColor?: string
  borderColor?: string
}>(), {
  disabled: false,
  loading: false,
  openType: '',
  backgroundColor: 'rgba(51,51,51,0.5)',
  borderColor: '',
})

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    :disabled="disabled"
    :loading="loading"
    :open-type="openType"
    hover-class="button-hover"
    text="white/70" bg-back
    after:border-none border="~ 1px solid back"
    :style="{ backgroundColor, borderColor }"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
