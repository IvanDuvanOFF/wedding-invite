<script setup lang="ts">
/**
 * Polaroid — a photo print on a warm paper mat, with the brand's characteristic
 * slight tilt and soft drop shadow. Optional handwritten caption on the mat.
 */
withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    caption?: string;
    tilt?: number;
    width?: number | string;
  }>(),
  {
    alt: "",
    tilt: -2,
    width: 220,
  },
);
</script>

<template>
  <figure
    :style="{
      display: 'inline-block',
      margin: 0,
      padding: '12px 12px 14px',
      background: 'var(--mat)',
      borderRadius: 'var(--radius-photo)',
      boxShadow: 'var(--shadow-photo)',
      transform: `rotate(${tilt}deg)`,
      width: typeof width === 'number' ? width + 'px' : width,
    }"
  >
    <img
      :src="src"
      :alt="alt"
      :style="{
        display: 'block',
        width: '100%',
        aspectRatio: '4 / 5',
        objectFit: 'cover',
        borderRadius: '1px',
        background: 'var(--surface-sunken)',
      }"
    />
    <figcaption
      v-if="caption"
      :style="{
        marginTop: '8px',
        textAlign: 'center',
        fontFamily: 'var(--font-script)',
        fontSize: '1.15rem',
        color: 'var(--text-romantic)',
        lineHeight: 1.1,
      }"
    >
      {{ caption }}
    </figcaption>
  </figure>
</template>
