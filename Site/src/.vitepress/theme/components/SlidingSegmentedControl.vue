<script setup lang="ts" generic="T extends string">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import IconGlyph, { type IconName } from './IconGlyph.vue'

export interface SegmentOption<V extends string = string> {
  value: V
  label: string
  icon?: IconName
  title?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: SegmentOption<T>[]
    size?: 'sm' | 'md'
    surface?: 'activity' | 'surface'
    ariaLabel?: string
  }>(),
  {
    size: 'md',
    surface: 'activity',
    ariaLabel: '分段选择',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const trackRef = ref<HTMLElement | null>(null)
const btnRefs = ref<(HTMLButtonElement | null)[]>([])

const indicatorX = ref(0)
const indicatorW = ref(0)
const ready = ref(false)
const animate = ref(false)

let resizeObserver: ResizeObserver | null = null

function measureIndicator(enableAnim: boolean) {
  const idx = props.options.findIndex((o) => o.value === props.modelValue)
  const btn = btnRefs.value[idx]
  if (!btn) return
  if (enableAnim && ready.value) {
    animate.value = true
  }
  indicatorX.value = btn.offsetLeft
  indicatorW.value = btn.offsetWidth
  if (!ready.value) {
    ready.value = true
  }
}

function setBtnRef(el: unknown, index: number) {
  btnRefs.value[index] = el as HTMLButtonElement | null
}

function select(value: T) {
  if (value === props.modelValue) return
  emit('update:modelValue', value)
}

watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    measureIndicator(true)
  }
)

watch(
  () => props.options,
  async () => {
    await nextTick()
    measureIndicator(false)
  }
)

onMounted(() => {
  nextTick(() => {
    measureIndicator(false)
    requestAnimationFrame(() => {
      measureIndicator(false)
    })
  })

  if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
    resizeObserver = new ResizeObserver(() => {
      measureIndicator(false)
    })
    resizeObserver.observe(trackRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="trackRef"
    class="seg-track shape-pill"
    :class="[`size-${size}`, `surf-${surface}`]"
    role="group"
    :aria-label="ariaLabel"
  >
    <!-- Sliding & Width-Morphing Orange Indicator Pill -->
    <span
      v-show="ready && indicatorW > 0"
      class="seg-indicator shape-pill"
      :class="{ animated: animate }"
      :style="{
        width: `${indicatorW}px`,
        transform: `translateX(${indicatorX}px)`,
      }"
      aria-hidden="true"
    />

    <button
      v-for="(opt, idx) in options"
      :key="opt.value"
      :ref="(el) => setBtnRef(el, idx)"
      type="button"
      class="seg-item shape-pill"
      :class="{ active: opt.value === modelValue }"
      :title="opt.title ?? opt.label"
      @click="select(opt.value)"
    >
      <IconGlyph v-if="opt.icon" :name="opt.icon" :size="size === 'sm' ? 11 : 12" />
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.seg-track {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
  user-select: none;
}

.seg-track.surf-activity {
  background-color: var(--bg-activity);
}

.seg-track.surf-surface {
  background-color: var(--bg-surface);
}

.seg-indicator {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  background-color: var(--accent-primary);
  pointer-events: none;
  z-index: 1;
}

.seg-indicator.animated {
  transition:
    transform 0.34s var(--ease-nonlinear),
    width 0.34s var(--ease-nonlinear);
}

.seg-item {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  background-color: transparent;
  transition: color 0.24s var(--ease-nonlinear);
}

.seg-track.size-md .seg-item {
  height: 24px;
  padding: 0 10px;
  font-size: 11px;
}

.seg-track.size-sm .seg-item {
  height: 20px;
  padding: 0 9px;
  font-size: 10px;
}

.seg-item:hover {
  color: var(--text-primary);
}

.seg-item.active {
  color: var(--accent-primary-ink);
}
</style>
