<script setup lang="ts">
/**
 * SketchFrame — a hand-drawn rectangular outline box used to set apart key
 * blocks (the countdown, the guest form). Rough double-stroke terracotta edge.
 */
withDefaults(defineProps<{ padding?: number | string }>(), { padding: 28 });
</script>

<template>
  <div
    :style="{
      position: 'relative',
      padding: typeof padding === 'number' ? padding + 'px' : padding,
      boxShadow:
        'inset 0 0 0 2px var(--accent), inset 0 0 0 5px rgba(178,58,34,0.18)',
      borderRadius: '10px 12px 9px 13px',
      background: 'transparent',
    }"
  >
    <slot />
  </div>
</template>
