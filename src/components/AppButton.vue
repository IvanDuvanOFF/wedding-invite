<script setup lang="ts">
import { computed, ref } from "vue";
import type { CSSProperties } from "vue";

/**
 * Button — the terracotta "blob" call-to-action of the wedding invite.
 * Hand-drawn pill by default; an inky sketch-outline variant for secondary use.
 */
type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    full?: boolean;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }>(),
  {
    variant: "solid",
    size: "md",
    full: false,
    type: "button",
    disabled: false,
  },
);

const emit = defineEmits<{ (e: "click", ev: MouseEvent): void }>();

const sizes: Record<Size, CSSProperties> = {
  sm: { padding: "8px 22px", fontSize: "1.25rem" },
  md: { padding: "12px 34px", fontSize: "1.6rem" },
  lg: { padding: "16px 52px", fontSize: "2rem" },
};

const variants: Record<Variant, CSSProperties> = {
  solid: {
    background: "var(--accent)",
    color: "var(--on-accent)",
    boxShadow: "var(--shadow-cta)",
  },
  outline: {
    background: "transparent",
    color: "var(--accent)",
    boxShadow: "inset 0 0 0 2.5px var(--accent)",
    borderRadius: "var(--radius-lg)",
  },
  ghost: {
    background: "transparent",
    color: "var(--accent)",
    boxShadow: "none",
  },
};

const pressed = ref(false);
const hover = ref(false);

const dynamic = computed<CSSProperties>(() => {
  const dyn: CSSProperties = {};
  if (props.disabled) return dyn;
  if (props.variant === "solid" && hover.value) dyn.background = "var(--accent-hover)";
  if (props.variant === "solid" && pressed.value) dyn.background = "var(--accent-press)";
  if (pressed.value) dyn.transform = "scale(0.97)";
  if (props.variant === "outline" && hover.value) dyn.background = "rgba(178, 58, 34, 0.06)";
  return dyn;
});

const style = computed<CSSProperties>(() => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4em",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: "0.01em",
  border: "none",
  cursor: props.disabled ? "not-allowed" : "pointer",
  opacity: props.disabled ? 0.5 : 1,
  width: props.full ? "100%" : "auto",
  borderRadius: "var(--radius-pill)",
  transition:
    "transform var(--dur-fast) var(--ease-soft), background var(--dur-base) var(--ease-soft), box-shadow var(--dur-base) var(--ease-soft)",
  WebkitTapHighlightColor: "transparent",
  ...sizes[props.size],
  ...variants[props.variant],
  ...dynamic.value,
}));

function onClick(ev: MouseEvent) {
  if (!props.disabled) emit("click", ev);
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :style="style"
    @click="onClick"
    @mouseenter="hover = true"
    @mouseleave="
      hover = false;
      pressed = false;
    "
    @mousedown="pressed = true"
    @mouseup="pressed = false"
  >
    <slot />
  </button>
</template>
