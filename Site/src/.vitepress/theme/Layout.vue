<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import TitleBar from './components/TitleBar.vue'
import ActivityBar from './components/ActivityBar.vue'
import ExplorerPanel from './components/ExplorerPanel.vue'
import ReaderPanel from './components/ReaderPanel.vue'
import RightPanel from './components/RightPanel.vue'
import StatusBar from './components/StatusBar.vue'
import MobileDockSheet from './components/MobileDockSheet.vue'
import { useThemeMode } from './composables/useThemeMode'
import { useWorkbenchState } from './composables/useWorkbenchState'
import { useSplitResize } from './composables/useSplitResize'

useThemeMode()

const {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_RIGHT_WIDTH,
  MIN_LEFT_WIDTH,
  MIN_RIGHT_WIDTH,
  isMobile,
  mobileDrawerOpen,
  mobileSheetDetent,
  leftWidth,
  rightWidth,
  leftVisible,
  rightVisible,
  ensureHydrated,
  setLeftWidth,
  setRightWidth,
  setMobileDrawerOpen,
  toggleLeftPanel,
  toggleRightPanel,
} = useWorkbenchState()

const workbenchMainRef = ref<HTMLElement | null>(null)
const readerPanelRef = ref<InstanceType<typeof ReaderPanel> | null>(null)

const MIN_CENTER_WIDTH = 320
const ACTIVITY_BAR_WIDTH = 50
const SASH_WIDTH = 10

const leftSash = useSplitResize({
  side: 'left',
  getWidth: () => leftWidth.value,
  setWidth: setLeftWidth,
  minWidth: MIN_LEFT_WIDTH,
  maxWidth: 520,
  defaultWidth: DEFAULT_LEFT_WIDTH,
  getMaxAllowed: () => {
    const total = workbenchMainRef.value?.clientWidth ?? window.innerWidth
    const occupiedRight = rightVisible.value ? rightWidth.value + SASH_WIDTH : 0
    return total - ACTIVITY_BAR_WIDTH - SASH_WIDTH - occupiedRight - MIN_CENTER_WIDTH
  },
})

const rightSash = useSplitResize({
  side: 'right',
  getWidth: () => rightWidth.value,
  setWidth: setRightWidth,
  minWidth: MIN_RIGHT_WIDTH,
  maxWidth: 520,
  defaultWidth: DEFAULT_RIGHT_WIDTH,
  getMaxAllowed: () => {
    const total = workbenchMainRef.value?.clientWidth ?? window.innerWidth
    const occupiedLeft = leftVisible.value ? leftWidth.value + SASH_WIDTH : 0
    return total - ACTIVITY_BAR_WIDTH - SASH_WIDTH - occupiedLeft - MIN_CENTER_WIDTH
  },
})

// ============================================================================
// Mobile Left Push-Drawer Gesture State (1:1 Drag + Velocity Nonlinear Snap)
// ============================================================================
const viewportWidth = ref(390)
const isDraggingDrawer = ref(false)
const dragDrawerProgress = ref<number | null>(null)

let gestureActive = false
let gestureLocked: 'none' | 'horizontal' | 'vertical' = 'none'
let gestureStartX = 0
let gestureStartY = 0
let gestureStartProgress = 0
let gestureLastX = 0
let gestureLastTime = 0
let gestureVelocityX = 0 // px/ms
let suppressNextClick = false
let suppressClickTimer: number | null = null

const mobileDrawerWidth = computed(() => {
  return Math.min(340, Math.max(264, Math.round(viewportWidth.value * 0.84)))
})

const drawerProgress = computed(() => {
  if (isDraggingDrawer.value && dragDrawerProgress.value !== null) {
    return dragDrawerProgress.value
  }
  return mobileDrawerOpen.value ? 1 : 0
})

const drawerTransformStyle = computed(() => {
  const offset = (drawerProgress.value - 1) * mobileDrawerWidth.value
  return {
    width: `${mobileDrawerWidth.value}px`,
    transform: `translateX(${offset}px)`,
  }
})

const pushedMainTransformStyle = computed(() => {
  const offset = drawerProgress.value * mobileDrawerWidth.value
  return {
    transform: `translateX(${offset}px)`,
  }
})

function syncViewportWidth() {
  if (typeof window !== 'undefined') {
    viewportWidth.value = window.innerWidth
  }
}

function onMobilePointerDown(e: PointerEvent) {
  if (!isMobile.value || e.button !== 0) return
  // Do not hijack gestures when bottom sheet is expanded or starting on bottom dock / text input
  if (mobileSheetDetent.value !== 'docked') return
  const target = e.target as HTMLElement | null
  if (target?.closest('.dock-sheet, input, textarea, select')) return

  const isOpen = mobileDrawerOpen.value

  // Full-screen swipe: anywhere on screen can swipe right to open (or swipe left to close),
  // avoiding conflict with OS/browser screen-edge back gestures!
  gestureActive = true
  gestureLocked = 'none'
  gestureStartX = e.clientX
  gestureStartY = e.clientY
  gestureLastX = e.clientX
  gestureLastTime = performance.now()
  gestureVelocityX = 0
  gestureStartProgress = isOpen ? 1 : 0

  window.addEventListener('pointermove', onMobilePointerMove, { passive: false })
  window.addEventListener('pointerup', onMobilePointerUp)
  window.addEventListener('pointercancel', onMobilePointerUp)
}

function onMobilePointerMove(e: PointerEvent) {
  if (!gestureActive) return
  const dx = e.clientX - gestureStartX
  const dy = e.clientY - gestureStartY

  if (gestureLocked === 'none') {
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return
    if (Math.abs(dx) > Math.abs(dy) * 1.35) {
      // Closed opens on rightward swipe; Open closes on leftward swipe
      if ((!mobileDrawerOpen.value && dx > 0) || (mobileDrawerOpen.value && dx < 0)) {
        gestureLocked = 'horizontal'
        isDraggingDrawer.value = true
        window.getSelection?.()?.removeAllRanges()
      } else {
        cleanupDrawerGesture()
        return
      }
    } else {
      gestureLocked = 'vertical'
      cleanupDrawerGesture()
      return
    }
  }

  if (gestureLocked === 'horizontal') {
    e.preventDefault()
    const now = performance.now()
    const dt = Math.max(1, now - gestureLastTime)
    gestureVelocityX = (e.clientX - gestureLastX) / dt
    gestureLastX = e.clientX
    gestureLastTime = now

    const rawProgress = gestureStartProgress + dx / mobileDrawerWidth.value
    dragDrawerProgress.value = Math.max(0, Math.min(1, rawProgress))
  }
}

function cleanupDrawerGesture() {
  gestureActive = false
  gestureLocked = 'none'
  window.removeEventListener('pointermove', onMobilePointerMove)
  window.removeEventListener('pointerup', onMobilePointerUp)
  window.removeEventListener('pointercancel', onMobilePointerUp)
}

function onMobilePointerUp() {
  if (!gestureActive) return
  const wasHorizontal = gestureLocked === 'horizontal'
  const progress = dragDrawerProgress.value ?? gestureStartProgress
  const vx = gestureVelocityX

  cleanupDrawerGesture()
  isDraggingDrawer.value = false
  dragDrawerProgress.value = null

  if (!wasHorizontal) return

  // Suppress synthetic click emitted when pointerup lands on a moved button inside the drawer
  suppressNextClick = true
  if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer)
  suppressClickTimer = window.setTimeout(() => {
    suppressNextClick = false
    suppressClickTimer = null
  }, 80)

  if (vx > 0.35) {
    setMobileDrawerOpen(true)
  } else if (vx < -0.35) {
    setMobileDrawerOpen(false)
  } else {
    setMobileDrawerOpen(progress >= 0.38)
  }
}

function onMobileClickCapture(e: MouseEvent) {
  if (!suppressNextClick) return
  suppressNextClick = false
  if (suppressClickTimer !== null) {
    window.clearTimeout(suppressClickTimer)
    suppressClickTimer = null
  }
  e.preventDefault()
  e.stopPropagation()
}

function handleJumpOutline(headingId: string) {
  if (isMobile.value) {
    setMobileDrawerOpen(false)
  }
  readerPanelRef.value?.scrollToHeading(headingId)
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    if (e.shiftKey) {
      toggleRightPanel()
    } else {
      toggleLeftPanel()
    }
  } else if (e.key === 'Escape' && isMobile.value && mobileDrawerOpen.value) {
    setMobileDrawerOpen(false)
  }
}

function preventGestureZoom(e: Event) {
  e.preventDefault()
}

function preventPinchTouch(e: TouchEvent) {
  if (e.touches.length > 1) {
    e.preventDefault()
  }
}

onMounted(() => {
  ensureHydrated()
  syncViewportWidth()
  window.addEventListener('resize', syncViewportWidth)
  window.addEventListener('keydown', handleKeydown)
  // Block iOS Safari pinch-to-zoom gestures (Safari ignores viewport user-scalable=no since iOS 10)
  document.addEventListener('gesturestart', preventGestureZoom, { passive: false })
  document.addEventListener('gesturechange', preventGestureZoom, { passive: false })
  document.addEventListener('gestureend', preventGestureZoom, { passive: false })
  document.addEventListener('touchstart', preventPinchTouch, { passive: false })
  document.addEventListener('touchmove', preventPinchTouch, { passive: false })
})

onBeforeUnmount(() => {
  cleanupDrawerGesture()
  window.removeEventListener('resize', syncViewportWidth)
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('gesturestart', preventGestureZoom)
  document.removeEventListener('gesturechange', preventGestureZoom)
  document.removeEventListener('gestureend', preventGestureZoom)
  document.removeEventListener('touchstart', preventPinchTouch)
  document.removeEventListener('touchmove', preventPinchTouch)
})
</script>

<template>
  <!-- ==================== MOBILE PUSH-DRAWER + DOCK-TO-SHEET LAYOUT ==================== -->
  <div
    v-if="isMobile"
    class="mobile-shell shape-rect"
    @pointerdown="onMobilePointerDown"
    @click.capture="onMobileClickCapture"
  >
    <!-- Left Push Drawer (ActivityBar + Explorer/Search/Settings) -->
    <aside
      class="mobile-drawer shape-rect"
      :class="{ dragging: isDraggingDrawer }"
      :style="drawerTransformStyle"
      :aria-hidden="!mobileDrawerOpen && !isDraggingDrawer"
    >
      <ActivityBar />
      <div class="mobile-drawer-content shape-rect">
        <ExplorerPanel @jump-outline="handleJumpOutline" />
      </div>
    </aside>

    <!-- Main Pushed Stage (TitleBar + Single-Doc Reader + Bottom Dock-to-Sheet) -->
    <div
      class="mobile-main-stage shape-rect"
      :class="{ dragging: isDraggingDrawer }"
      :style="pushedMainTransformStyle"
    >
      <TitleBar />

      <div class="mobile-reader-host shape-rect">
        <ReaderPanel ref="readerPanelRef" />
        <MobileDockSheet />
      </div>

      <!-- Scrim over pushed main stage when drawer is open (tap to push closed) -->
      <div
        class="drawer-scrim"
        :class="{ active: drawerProgress > 0.02, dragging: isDraggingDrawer }"
        :style="{ opacity: drawerProgress * 0.28 }"
        @click="setMobileDrawerOpen(false)"
      />
    </div>
  </div>

  <!-- ==================== DESKTOP 3-PANEL SPLITPANEL WORKBENCH ==================== -->
  <div v-else class="workbench-shell shape-rect">
    <!-- Top VS Code-like Title Bar -->
    <TitleBar />

    <!-- Main 3-Panel SplitPanel Area -->
    <div ref="workbenchMainRef" class="workbench-main shape-rect">
      <!-- Slim Far-Left Activity Bar -->
      <ActivityBar />

      <!-- SplitPanel 1: Left Explorer / Search / Settings -->
      <div
        class="split-pane left-pane shape-rect"
        :class="{
          collapsed: !leftVisible,
          'no-transition': leftSash.isDragging.value,
        }"
        :style="leftVisible ? { width: `${leftWidth}px`, minWidth: `${MIN_LEFT_WIDTH}px` } : {}"
        :aria-hidden="!leftVisible"
      >
        <div
          class="pane-slide-inner left-inner"
          :style="{ width: `${leftWidth}px`, minWidth: `${MIN_LEFT_WIDTH}px` }"
        >
          <ExplorerPanel @jump-outline="handleJumpOutline" />
        </div>
      </div>

      <!-- Draggable Sash 1 -->
      <div
        class="split-sash shape-rect"
        :class="{
          collapsed: !leftVisible,
          dragging: leftSash.isDragging.value,
        }"
        role="separator"
        aria-orientation="vertical"
        aria-label="拖动调整左侧面板宽度"
        title="拖动调整左侧面板宽度 · 双击重置"
        @pointerdown="leftSash.startDrag"
        @dblclick="leftSash.resetWidth"
      >
        <span class="sash-handle" />
      </div>

      <!-- SplitPanel 2: Center Multi-Tab Reader -->
      <ReaderPanel ref="readerPanelRef" />

      <!-- Draggable Sash 2 -->
      <div
        class="split-sash shape-rect"
        :class="{
          collapsed: !rightVisible,
          dragging: rightSash.isDragging.value,
        }"
        role="separator"
        aria-orientation="vertical"
        aria-label="拖动调整右侧评论面板宽度"
        title="拖动调整右侧面板宽度 · 双击重置"
        @pointerdown="rightSash.startDrag"
        @dblclick="rightSash.resetWidth"
      >
        <span class="sash-handle" />
      </div>

      <!-- SplitPanel 3: Right Reserved Comment Panel -->
      <div
        class="split-pane right-pane shape-rect"
        :class="{
          collapsed: !rightVisible,
          'no-transition': rightSash.isDragging.value,
        }"
        :style="rightVisible ? { width: `${rightWidth}px`, minWidth: `${MIN_RIGHT_WIDTH}px` } : {}"
        :aria-hidden="!rightVisible"
      >
        <div
          class="pane-slide-inner right-inner"
          :style="{ width: `${rightWidth}px`, minWidth: `${MIN_RIGHT_WIDTH}px` }"
        >
          <RightPanel />
        </div>
      </div>
    </div>

    <!-- Bottom VS Code-like Status Bar -->
    <StatusBar />
  </div>
</template>

<style scoped>
/* ==================== DESKTOP STYLES ==================== */
.workbench-shell {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-base);
}

.workbench-main {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.split-pane {
  height: 100%;
  flex: 0 1 auto;
  overflow: hidden;
  opacity: 1;
  transition:
    width 0.36s var(--ease-nonlinear),
    min-width 0.36s var(--ease-nonlinear),
    opacity 0.28s var(--ease-nonlinear);
}

.split-pane.no-transition,
.split-pane.no-transition .pane-slide-inner {
  transition: none !important;
}

.split-pane.collapsed {
  width: 0 !important;
  min-width: 0 !important;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
}

.pane-slide-inner {
  height: 100%;
  max-width: 100%;
  transform: translateX(0);
  transition: transform 0.36s var(--ease-nonlinear);
}

.left-pane.collapsed .left-inner {
  max-width: none;
  transform: translateX(-32px);
}

.right-pane.collapsed .right-inner {
  max-width: none;
  transform: translateX(32px);
}

.split-sash {
  position: relative;
  width: 10px;
  min-width: 10px;
  height: 100%;
  cursor: col-resize;
  background-color: var(--bg-activity);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 10;
  touch-action: none;
  overflow: hidden;
  opacity: 1;
  transition:
    width 0.36s var(--ease-nonlinear),
    min-width 0.36s var(--ease-nonlinear),
    opacity 0.24s var(--ease-nonlinear),
    background-color 0.2s var(--ease-nonlinear);
}

.split-sash.collapsed {
  width: 0;
  min-width: 0;
  opacity: 0;
  pointer-events: none;
}

.sash-handle {
  width: 4px;
  height: 52px;
  border-radius: 2px;
  background-color: var(--sash-handle);
  transition:
    width 0.26s var(--ease-nonlinear),
    height 0.28s var(--ease-nonlinear),
    border-radius 0.26s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear);
}

.split-sash:hover,
.split-sash.dragging {
  background-color: var(--accent-primary-soft);
}

.split-sash:hover .sash-handle,
.split-sash.dragging .sash-handle {
  width: 10px;
  height: 92px;
  border-radius: 0px;
  background-color: var(--accent-primary);
}

/* ==================== MOBILE PUSH-DRAWER STYLES ==================== */
.mobile-shell {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--bg-base);
  touch-action: pan-y;
}

.mobile-drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  background-color: var(--bg-surface);
  border-right: 1px solid var(--divider-hairline);
  transition: transform 0.36s var(--ease-nonlinear);
  will-change: transform;
}

.mobile-drawer.dragging {
  transition: none;
}

.mobile-drawer-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.mobile-main-stage {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  transition: transform 0.36s var(--ease-nonlinear);
  will-change: transform;
}

.mobile-main-stage.dragging {
  transition: none;
}

.mobile-reader-host {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-scrim {
  position: absolute;
  inset: 0;
  background-color: #000000;
  opacity: 0;
  pointer-events: none;
  z-index: 50;
  transition: opacity 0.34s var(--ease-nonlinear);
}

.drawer-scrim.active {
  pointer-events: auto;
}

.drawer-scrim.dragging {
  transition: none;
}
</style>
