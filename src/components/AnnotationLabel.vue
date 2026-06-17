<script setup lang="ts">
import { computed } from "vue";

/**
 * Annotation — a small script label with a curved hand-drawn arrow, the way the
 * invite points things out ("жених", "невеста", "когда", "где", "мы ждём вас").
 */
type Direction = "down-left" | "down-right" | "left" | "right";

const props = withDefaults(
  defineProps<{
    direction?: Direction;
    showArrow?: boolean;
    color?: string;
  }>(),
  {
    direction: "down-left",
    showArrow: true,
    color: "var(--accent)",
  },
);

const arrows: Record<Direction, { d: string; head: string }> = {
  "down-left": { d: "M22 3 C 8 6, 4 16, 8 27", head: "M8 27 l-4 -6 M8 27 l7 -2" },
  "down-right": { d: "M2 3 C 16 6, 20 16, 16 27", head: "M16 27 l4 -6 M16 27 l-7 -2" },
  left: { d: "M24 6 C 12 6, 6 12, 3 16", head: "M3 16 l6 -4 M3 16 l5 5" },
  right: { d: "M0 6 C 12 6, 18 12, 21 16", head: "M21 16 l-6 -4 M21 16 l-5 5" },
};

const a = computed(() => arrows[props.direction] ?? arrows["down-left"]);
const arrowFirst = computed(
  () => props.direction === "left" || props.direction === "down-left",
);
</script>

<template>
  <span
    :style="{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      fontFamily: 'var(--font-script)',
      fontSize: 'var(--fs-script)',
      color,
      lineHeight: 1,
    }"
  >
    <svg
      v-if="showArrow && arrowFirst"
      viewBox="0 0 24 30"
      width="22"
      height="28"
      aria-hidden="true"
      style="flex: none"
    >
      <path :d="a.d" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <path :d="a.head" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" />
    </svg>
    <span><slot /></span>
    <svg
      v-if="showArrow && !arrowFirst"
      viewBox="0 0 24 30"
      width="22"
      height="28"
      aria-hidden="true"
      style="flex: none"
    >
      <path :d="a.d" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <path :d="a.head" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" />
    </svg>
  </span>
</template>
