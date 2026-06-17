<script setup lang="ts">
import { computed } from "vue";
import HeartDoodle from "./HeartDoodle.vue";

/**
 * Calendar — a single hand-styled month grid (Monday-first, Russian weekday
 * heads) with one day circled by a doodled heart: the wedding day.
 */
const props = withDefaults(
  defineProps<{
    monthLabel?: string;
    days?: number;
    /** Column index (0 = Monday) the 1st falls on. */
    startOffset?: number;
    /** Day number to circle with a heart. */
    highlight?: number;
  }>(),
  {
    monthLabel: "Сентябрь",
    days: 30,
    startOffset: 1,
    highlight: 19,
  },
);

const heads = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const cells = computed<(number | null)[]>(() => {
  const out: (number | null)[] = [];
  for (let i = 0; i < props.startOffset; i++) out.push(null);
  for (let d = 1; d <= props.days; d++) out.push(d);
  return out;
});
</script>

<template>
  <div
    :style="{
      display: 'inline-block',
      textAlign: 'center',
      color: 'var(--text-romantic)',
    }"
  >
    <div
      :style="{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 'var(--fs-display-md)',
        marginBottom: '10px',
      }"
    >
      {{ monthLabel }}
    </div>
    <div
      :style="{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 34px)',
        rowGap: '8px',
        columnGap: '6px',
        fontFamily: 'var(--font-script)',
        fontSize: '1.15rem',
      }"
    >
      <div
        v-for="h in heads"
        :key="h"
        :style="{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-eyebrow)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          paddingBottom: '2px',
        }"
      >
        {{ h }}
      </div>
      <div
        v-for="(d, i) in cells"
        :key="i"
        :style="{
          position: 'relative',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <HeartDoodle
          v-if="d === highlight"
          :size="32"
          :tilt="-4"
          :style="{
            position: 'absolute',
            inset: 0,
            margin: 'auto',
            pointerEvents: 'none',
          }"
        />
        <span style="position: relative">{{ d || "" }}</span>
      </div>
    </div>
  </div>
</template>
