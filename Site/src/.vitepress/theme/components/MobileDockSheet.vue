<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
import { useWorkbenchState, type MobileSheetDetent } from '../composables/useWorkbenchState'

const {
  activeDoc,
  readingProgress,
  mobileSheetDetent,
  setMobileSheetDetent,
} = useWorkbenchState()

const DOCK_HEIGHT = 56
const DOCK_MARGIN = 14
const DOCK_RADIUS = DOCK_HEIGHT / 2 // Exact 1/2 narrow edge (28px) -> pure capsule pill when docked!

const hostHeight = ref(760)
const sheetRef = ref<HTMLElement | null>(null)

const isDragging = ref(false)
const dragHeight = ref<number | null>(null)

let startY = 0
let startHeight = DOCK_HEIGHT
let lastY = 0
let lastTime = 0
let velocityY = 0 // px/ms (negative = upward)
let movedBeyondTap = false

let resizeObserver: ResizeObserver | null = null

function measureHost() {
  const parent = sheetRef.value?.parentElement
  if (parent && parent.clientHeight > 0) {
    hostHeight.value = parent.clientHeight
  } else if (typeof window !== 'undefined') {
    hostHeight.value = Math.max(360, window.innerHeight - 50)
  }
}

const fullSheetHeight = computed(() => Math.max(DOCK_HEIGHT + 180, Math.round(hostHeight.value * 0.88)))
const halfSheetHeight = computed(() => Math.max(DOCK_HEIGHT + 120, Math.round(hostHeight.value * 0.56)))

function getDetentHeight(detent: MobileSheetDetent): number {
  if (detent === 'docked') return DOCK_HEIGHT
  if (detent === 'half') return halfSheetHeight.value
  return fullSheetHeight.value
}

const currentHeight = computed(() => {
  if (isDragging.value && dragHeight.value !== null) {
    return dragHeight.value
  }
  return getDetentHeight(mobileSheetDetent.value)
})

// 0 when docked -> 1 when fully expanded
const expandRatio = computed(() => {
  const span = Math.max(1, fullSheetHeight.value - DOCK_HEIGHT)
  return Math.max(0, Math.min(1, (currentHeight.value - DOCK_HEIGHT) / span))
})

// Dock-to-Sheet morph factor: completes margin 14px->0px & radius 28px->0px across first 35% of pull
const morphFactor = computed(() => {
  return Math.max(0, Math.min(1, expandRatio.value / 0.35))
})

const isExpanded = computed(() => mobileSheetDetent.value !== 'docked')

const sheetStyle = computed(() => {
  const t = morphFactor.value
  const inset = Math.round((1 - t) * DOCK_MARGIN * 10) / 10
  const radius = Math.round((1 - t) * DOCK_RADIUS * 10) / 10
  return {
    height: `${Math.round(currentHeight.value)}px`,
    left: `${inset}px`,
    right: `${inset}px`,
    bottom: `${inset}px`,
    borderRadius: `${radius}px`,
  }
})

function clampHeightWithRubberBand(val: number): number {
  const maxH = fullSheetHeight.value
  if (val < DOCK_HEIGHT) {
    return DOCK_HEIGHT - (DOCK_HEIGHT - val) * 0.15
  }
  if (val > maxH) {
    return maxH + (val - maxH) * 0.15
  }
  return val
}

function onHandlePointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  measureHost()
  isDragging.value = true
  movedBeyondTap = false
  startY = e.clientY
  lastY = e.clientY
  lastTime = performance.now()
  velocityY = 0
  startHeight = getDetentHeight(mobileSheetDetent.value)
  dragHeight.value = startHeight

  const target = e.currentTarget as HTMLElement | null
  target?.setPointerCapture?.(e.pointerId)

  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dy = e.clientY - startY
  if (Math.abs(dy) > 6) {
    movedBeyondTap = true
  }
  e.preventDefault()

  const now = performance.now()
  const dt = Math.max(1, now - lastTime)
  velocityY = (e.clientY - lastY) / dt
  lastY = e.clientY
  lastTime = now

  // Pulling upward (negative dy) increases height
  dragHeight.value = clampHeightWithRubberBand(startHeight - dy)
}

function onPointerUp() {
  if (!isDragging.value) return
  const finalH = dragHeight.value ?? startHeight
  isDragging.value = false
  dragHeight.value = null

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)

  if (!movedBeyondTap) return

  // Fast fling overrides position
  if (velocityY < -0.45) {
    setMobileSheetDetent(mobileSheetDetent.value === 'docked' ? 'half' : 'full')
    return
  }
  if (velocityY > 0.45) {
    setMobileSheetDetent(mobileSheetDetent.value === 'full' ? 'half' : 'docked')
    return
  }

  // Snap to nearest detent
  const candidates: { detent: MobileSheetDetent; dist: number }[] = [
    { detent: 'full', dist: Math.abs(finalH - fullSheetHeight.value) },
    { detent: 'half', dist: Math.abs(finalH - halfSheetHeight.value) },
    { detent: 'docked', dist: Math.abs(finalH - DOCK_HEIGHT) },
  ]
  candidates.sort((a, b) => a.dist - b.dist)
  setMobileSheetDetent(candidates[0].detent)
}

function handleHeaderClick() {
  if (movedBeyondTap) {
    movedBeyondTap = false
    return
  }
  if (mobileSheetDetent.value === 'docked') {
    setMobileSheetDetent('half')
  } else {
    setMobileSheetDetent('docked')
  }
}

function cycleFullOrHalf(e: MouseEvent) {
  e.stopPropagation()
  if (mobileSheetDetent.value === 'full') {
    setMobileSheetDetent('docked')
  } else if (mobileSheetDetent.value === 'half') {
    setMobileSheetDetent('full')
  } else {
    setMobileSheetDetent('half')
  }
}

onMounted(() => {
  measureHost()
  const parent = sheetRef.value?.parentElement
  if (typeof ResizeObserver !== 'undefined' && parent) {
    resizeObserver = new ResizeObserver(measureHost)
    resizeObserver.observe(parent)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
})
</script>

<template>
  <!-- Scrim behind expanded sheet (tap to dock back into floating capsule) -->
  <div
    class="sheet-scrim"
    :class="{ active: expandRatio > 0.02, dragging: isDragging }"
    :style="{ opacity: expandRatio * 0.36 }"
    @click="setMobileSheetDetent('docked')"
  />

  <!-- Floating Capsule Dock (14px margin, 28px radius) -> Flush Sheet (0px margin, 0px radius) -->
  <section
    ref="sheetRef"
    class="dock-sheet"
    :class="{ dragging: isDragging, expanded: isExpanded }"
    :style="sheetStyle"
    aria-label="底部评论区抽屉"
  >
    <!-- Interactive Drag Handle + Dock Bar (56px) -->
    <div
      class="dock-header"
      @pointerdown="onHandlePointerDown"
      @click="handleHeaderClick"
    >
      <div class="handle-zone" aria-hidden="true">
        <span class="sheet-handle" :class="{ active: isDragging }" />
      </div>

      <div class="dock-bar-row">
        <div class="dock-left">
          <span class="dock-icon" :class="{ active: isExpanded }">
            <IconGlyph name="comment" :size="14" />
          </span>
          <span class="dock-title">评论区</span>
          <span class="dock-badge shape-pill">预留</span>
        </div>

        <div class="dock-right">
          <span v-if="activeDoc" class="dock-progress shape-pill">
            {{ Math.round(readingProgress) }}%
          </span>

          <button
            type="button"
            class="dock-action-pill shape-pill"
            :class="{ expanded: isExpanded }"
            :title="mobileSheetDetent === 'docked' ? '展开评论区' : mobileSheetDetent === 'half' ? '全屏展开' : '收起'"
            @pointerdown.stop
            @click="cycleFullOrHalf"
          >
            {{
              mobileSheetDetent === 'docked'
                ? '展开'
                : mobileSheetDetent === 'half'
                  ? '全屏'
                  : '收起'
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sheet Body (Revealed smoothly as floating dock morphs into margin-0 sheet) -->
    <CustomScrollArea
      class="sheet-scroll"
      :style="{ opacity: morphFactor }"
    >
      <div class="sheet-body">
        <div class="reserved-mark" aria-hidden="true">
          <span class="mark-outer shape-circle" />
          <span class="mark-core shape-circle" />
        </div>

        <div class="reserved-title">评论区与扩展内容</div>
        <div class="reserved-subtitle">
          拉住底部浮动停靠栏把手向上展开即可变为全宽面板。此区域为后续评论、段评及读后感预留，当前暂未填充内容。
        </div>

        <div v-if="activeDoc" class="context-pill shape-pill">
          当前关联：{{ activeDoc.chapterTitle }} · {{ activeDoc.shortTitle }}
        </div>
      </div>
    </CustomScrollArea>
  </section>
</template>

<style scoped>
.sheet-scrim {
  position: absolute;
  inset: 0;
  background-color: #000000;
  opacity: 0;
  pointer-events: none;
  z-index: 30;
  transition: opacity 0.34s var(--ease-nonlinear);
}

.sheet-scrim.active {
  pointer-events: auto;
}

.sheet-scrim.dragging {
  transition: none;
}

/* Floating Capsule Dock -> Full-bleed Margin-0 Rectangular Sheet */
.dock-sheet {
  position: absolute;
  z-index: 40;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-surface);
  transition:
    height 0.38s var(--ease-nonlinear),
    left 0.36s var(--ease-nonlinear),
    right 0.36s var(--ease-nonlinear),
    bottom 0.36s var(--ease-nonlinear),
    border-radius 0.36s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear);
  user-select: none;
}

.dock-sheet.dragging {
  transition: none;
}

.dock-header {
  position: relative;
  height: 56px;
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: var(--bg-activity);
  cursor: grab;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transition: padding 0.34s var(--ease-nonlinear);
}

.dock-sheet.expanded .dock-header {
  padding: 0 var(--pane-pad);
}

.dock-header:active {
  cursor: grabbing;
}

.handle-zone {
  position: absolute;
  top: 5px;
  left: 0;
  right: 0;
  height: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--sash-handle);
  transition:
    width 0.26s var(--ease-nonlinear),
    height 0.26s var(--ease-nonlinear),
    border-radius 0.26s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .dock-header:hover .sheet-handle {
    width: 64px;
    height: 5px;
    border-radius: 0px;
    background-color: var(--accent-primary);
  }
}

.dock-header:active .sheet-handle,
.sheet-handle.active {
  width: 64px;
  height: 5px;
  border-radius: 0px;
  background-color: var(--accent-primary);
}

.dock-bar-row {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dock-left,
.dock-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dock-icon {
  width: 24px;
  height: 24px;
  border-radius: 0%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    border-radius 0.3s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear),
    color 0.22s var(--ease-nonlinear);
}

.dock-icon.active {
  border-radius: 50%;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.dock-title {
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
}

.dock-badge {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 2px 9px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  white-space: nowrap;
}

.dock-progress {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  padding: 2px 10px;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  font-variant-numeric: tabular-nums;
}

.dock-action-pill {
  height: 28px;
  padding: 0 13px;
  font-size: var(--ui-font-sm);
  font-weight: 700;
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  white-space: nowrap;
  transition: background-color 0.2s var(--ease-nonlinear), color 0.2s var(--ease-nonlinear);
}

.dock-action-pill.expanded {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.sheet-scroll {
  flex: 1;
  min-height: 0;
  transition: opacity 0.24s var(--ease-nonlinear);
}

.dock-sheet.dragging .sheet-scroll {
  transition: none;
}

.sheet-body {
  min-height: 100%;
  padding: 36px 24px 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.reserved-mark {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.mark-outer {
  position: absolute;
  inset: 0;
  background-color: var(--accent-primary-soft);
}

.mark-core {
  position: relative;
  width: 20px;
  height: 20px;
  background-color: var(--accent-secondary);
}

.reserved-title {
  font-size: var(--ui-font-lg);
  font-weight: 800;
  color: var(--text-primary);
}

.reserved-subtitle {
  font-size: var(--ui-font-md);
  line-height: 1.7;
  color: var(--text-muted);
  max-width: 320px;
}

.context-pill {
  margin-top: 6px;
  padding: 5px 14px;
  font-size: var(--ui-font-sm);
  font-weight: 700;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
