<script setup lang="ts">
import { computed } from 'vue'
import { VlTitleBar } from '@valance-ui/vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const {
  manifest,
  activeDoc,
  isMobile,
  isDual,
  mobileDrawerOpen,
  mobileSheetDetent,
  leftShown,
  rightShown,
  toggleLeftPanel,
  toggleRightPanel,
} = useWorkbenchState()

const centerText = computed(() => {
  if (activeDoc.value) {
    return isMobile.value
      ? `${activeDoc.value.chapterTitle} · ${activeDoc.value.shortTitle}`
      : `${activeDoc.value.chapterTitle} / ${activeDoc.value.shortTitle}`
  }
  return isMobile.value
    ? manifest.bookTitle
    : `${manifest.bookTitle} · ${manifest.totalChapters} 章 ${manifest.totalScenes} 幕`
})
</script>

<template>
  <VlTitleBar
    :mode="isMobile ? 'mobile' : isDual ? 'tablet' : 'desktop'"
    :brand-name="manifest.bookTitle"
    brand-tag="READER"
    :center-text="centerText"
    :center-active="Boolean(activeDoc)"
    :left-active="isMobile ? mobileDrawerOpen : leftShown"
    :right-active="isMobile ? mobileSheetDetent !== 'docked' : rightShown"
    :left-title="isMobile ? '呼出左侧章节抽屉' : isDual ? '切换 [1-2] 左侧导航视图 (Ctrl+B)' : '显示/隐藏左侧面板 (Ctrl+B)'"
    :right-title="isMobile ? '展开/收起底部评论区' : isDual ? '切换 [2-3] 右侧评论视图 (Ctrl+Shift+B)' : '显示/隐藏右侧评论面板 (Ctrl+Shift+B)'"
    @toggle-left="toggleLeftPanel"
    @toggle-right="toggleRightPanel"
  />
</template>
