<script setup lang="ts">
import { computed } from "vue";

/**
 * CountdownUnit — one numeral + label pair from the "До свадьбы осталось"
 * counter (96 Дней · 03 Часов · 27 Минут · 54 Секунд).
 */
const props = defineProps<{ value: number | string; label: string }>();

const v = computed(() => String(props.value).padStart(2, "0"));
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      color: 'var(--text-romantic)',
    }"
  >
    <span
      :style="{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 'var(--fs-display-md)',
        lineHeight: 1,
      }"
      >{{ v }}</span
    >
    <span
      :style="{
        fontFamily: 'var(--font-script)',
        fontSize: '1.05rem',
        lineHeight: 1,
      }"
      >{{ label }}</span
    >
  </div>
</template>
