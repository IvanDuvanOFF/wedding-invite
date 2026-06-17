<script setup lang="ts">
import { ref } from "vue";

/**
 * BottomBar — the sticky forest-green RSVP bar pinned to the bottom of every
 * screen of the invite. Label in the brand hand, centred.
 */
withDefaults(defineProps<{ sticky?: boolean }>(), { sticky: true });
defineEmits<{ (e: "click", ev: MouseEvent): void }>();

const hover = ref(false);
</script>

<template>
  <button
    type="button"
    @click="$emit('click', $event)"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    :style="{
      position: sticky ? 'sticky' : 'relative',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 'var(--footer-h)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      cursor: 'pointer',
      background: hover ? 'var(--forest-800)' : 'var(--footer-bg)',
      color: 'var(--on-footer)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '0.01em',
      lineHeight: 1,
      transition: 'background var(--dur-base) var(--ease-soft)',
      WebkitTapHighlightColor: 'transparent',
    }"
  >
    <slot>Подтвердить присутствие</slot>
  </button>
</template>
