<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TitleBar from './components/TitleBar.vue'
import ActivityBar from './components/ActivityBar.vue'
import ExplorerPanel from './components/ExplorerPanel.vue'
import ReaderPanel from './components/ReaderPanel.vue'
import RightPanel from './components/RightPanel.vue'
import StatusBar from './components/StatusBar.vue'
import { useThemeMode } from './composables/useThemeMode'
import { useWorkbenchState } from './composables/useWorkbenchState'
import { useSplitResize } from './composables/useSplitResize'

useThemeMode()

const {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_RIGHT_WIDTH,
  MIN_LEFT_WIDTH,
  MIN_RIGHT_WIDTH,
  leftWidth,
  rightWidth,
  leftVisible,
  rightVisible,
  ensureHydrated,
  setLeftWidth,
  setRightWidth,
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

function handleJumpOutline(headingId: string) {
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
  }
}

onMounted(() => {
  ensureHydrated()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="workbench-shell shape-rect">
    <!-- Top VS Code-like Title Bar -->
    <TitleBar />

    <!-- Main 3-Panel SplitPanel Area -->
    <div ref="workbenchMainRef" class="workbench-main shape-rect">
      <!-- Slim Far-Left Activity Bar -->
      <ActivityBar />

      <!-- SplitPanel 1: Left Explorer / Search / Settings (Nonlinear Slide Open/Close!) -->
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

      <!-- SplitPanel 3: Right Reserved Comment Panel (Nonlinear Slide Open/Close!) -->
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

/* Nonlinear Slide Open/Collapse for Left & Right SplitPanels */
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

/* SplitPanel channel width matches expanded scrollbar width (10px) */
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

/* Handle morphs on hover/drag:
   Idle: centered 4px x 52px capsule (2px radius = 1/2 width, 3px left/right margin)
   Hover/Drag: expands to 10px (matching expanded scrollbar width, 0 left/right margin),
   height smoothly grows centered from 52px -> 92px, border-radius -> 0px, color -> #F87F04 */
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
</style>
