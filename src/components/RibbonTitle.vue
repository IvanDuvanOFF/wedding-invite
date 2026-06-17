<script setup lang="ts">
/**
 * RibbonTitle — a filled terracotta hand-painted ellipse with cream script
 * text inside. Used for date banners ("19 сентября 2026 года").
 */
</script>

<template>
  <div
    :style="{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 46px',
      borderRadius: '48% 52% 50% 50% / 60% 58% 42% 40%',
      background: 'var(--accent)',
      color: 'var(--on-accent)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: '1.9rem',
      lineHeight: 1,
      letterSpacing: '0.01em',
      textAlign: 'center',
      boxShadow: 'var(--shadow-cta)',
    }"
  >
    <slot />
  </div>
</template>
