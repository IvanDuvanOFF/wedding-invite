<script setup lang="ts">
import { computed } from "vue";

/**
 * Heart — the little hand-doodled heart that floats around the margins of the
 * invite. Outline by default, like a quick pen sketch.
 */
const props = withDefaults(
  defineProps<{
    size?: number;
    filled?: boolean;
    color?: string;
    tilt?: number;
  }>(),
  {
    size: 28,
    filled: false,
    color: "var(--accent)",
    tilt: 0,
  },
);

const height = computed(() => (props.size * 30) / 32);
const transform = computed(() => (props.tilt ? `rotate(${props.tilt}deg)` : undefined));
</script>

<template>
  <svg
    viewBox="0 0 32 30"
    :width="size"
    :height="height"
    role="img"
    aria-label="heart"
    :style="{ transform, display: 'inline-block' }"
  >
    <!-- a loose, slightly lopsided hand-drawn heart -->
    <path
      d="M16 27C9 22 2 17 2 10.2 2 6 5.2 3 9 3c2.8 0 5 1.7 7 4.4C18 4.7 20.2 3 23 3c3.8 0 7 3 7 7.2C30 17 23 22 16 27Z"
      :fill="filled ? color : 'none'"
      :stroke="color"
      :stroke-width="filled ? 0 : 2.2"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>
