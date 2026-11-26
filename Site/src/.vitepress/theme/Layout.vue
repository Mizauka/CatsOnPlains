<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { VlPushDrawer, VlSplitPane } from '@valance-ui/vue'
import TitleBar from './components/TitleBar.vue'
import ActivityBar from './components/ActivityBar.vue'
import ExplorerPanel from './components/ExplorerPanel.vue'
import ReaderPanel from './components/ReaderPanel.vue'
import RightPanel from './components/RightPanel.vue'
import StatusBar from './components/StatusBar.vue'
import MobileDockSheet from './components/MobileDockSheet.vue'
import { useThemeMode } from './composables/useThemeMode'
import { useWorkbenchState } from './composables/useWorkbenchState'

useThemeMode()

const {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_RIGHT_WIDTH,
  MIN_LEFT_WIDTH,
  MIN_RIGHT_WIDTH,
  DEFAULT_DUAL_SIDE_RATIO,
  isMobile,
  isDual,
  mobileDrawerOpen,
  mobileSheetDetent,
  leftWidth,
  rightWidth,
  leftShown,
  rightShown,
  dualSideRatio,
  ensureHydrated,
  setLeftWidth,
  setRightWidth,
  setDualSideRatio,
  setMobileDrawerOpen,
  toggleLeftPanel,
  toggleRightPanel,
} = useWorkbenchState()

const readerPanelRef = ref<InstanceType<typeof ReaderPanel> | null>(null)

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
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('gesturestart', preventGestureZoom, { passive: false })
  document.addEventListener('gesturechange', preventGestureZoom, { passive: false })
  document.addEventListener('gestureend', preventGestureZoom, { passive: false })
  document.addEventListener('touchstart', preventPinchTouch, { passive: false })
  document.addEventListener('touchmove', preventPinchTouch, { passive: false })
})

onBeforeUnmount(() => {
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
  <VlPushDrawer
    v-if="isMobile"
    :open="mobileDrawerOpen"
    :disabled="mobileSheetDetent !== 'docked'"
    @update:open="setMobileDrawerOpen"
  >
    <template #drawer>
      <ActivityBar />
      <div class="mobile-drawer-content shape-rect">
        <ExplorerPanel @jump-outline="handleJumpOutline" />
      </div>
    </template>

    <TitleBar />

    <div class="mobile-reader-host shape-rect">
      <ReaderPanel ref="readerPanelRef" />
      <MobileDockSheet />
    </div>
  </VlPushDrawer>

  <!-- ==================== DESKTOP 3-PANEL SPLITPANEL WORKBENCH ==================== -->
  <div v-else class="workbench-shell shape-rect">
    <TitleBar />

    <VlSplitPane
      :left-visible="leftShown"
      :right-visible="rightShown"
      :left-width="leftWidth"
      :right-width="rightWidth"
      :min-left-width="MIN_LEFT_WIDTH"
      :min-right-width="MIN_RIGHT_WIDTH"
      :default-left-width="DEFAULT_LEFT_WIDTH"
      :default-right-width="DEFAULT_RIGHT_WIDTH"
      :min-center-width="isDual ? 280 : 320"
      :dual-mode="isDual"
      :dual-side-ratio="dualSideRatio"
      :default-dual-side-ratio="DEFAULT_DUAL_SIDE_RATIO"
      :left-sash-title="isDual ? '拖动调节 [1-2] / [2-3] 镜像分屏比例 · 双击重置' : '拖动调整左侧面板宽度 · 双击重置'"
      :right-sash-title="isDual ? '拖动调节 [2-3] / [1-2] 镜像分屏比例 · 双击重置' : '拖动调整右侧评论面板宽度 · 双击重置'"
      @update:left-width="setLeftWidth"
      @update:right-width="setRightWidth"
      @update:dual-side-ratio="setDualSideRatio"
    >
      <template #activity>
        <ActivityBar />
      </template>

      <template #left>
        <ExplorerPanel @jump-outline="handleJumpOutline" />
      </template>

      <template #center>
        <ReaderPanel ref="readerPanelRef" />
      </template>

      <template #right>
        <RightPanel />
      </template>
    </VlSplitPane>

    <StatusBar />
  </div>
</template>

<style scoped>
.workbench-shell {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-base);
}

.mobile-drawer-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.mobile-reader-host {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
