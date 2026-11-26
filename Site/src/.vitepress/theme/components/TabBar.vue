<script setup lang="ts">
import { computed } from 'vue'
import { VlButton, VlTabBar, type TabBarItem } from '@valance-ui/vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const emit = defineEmits<{
  (e: 'before-switch'): void
}>()

const {
  openTabs,
  currentRoutePath,
  openDoc,
  closeTab,
  closeOtherTabs,
  closeAllTabs,
} = useWorkbenchState()

const tabItems = computed<TabBarItem[]>(() =>
  openTabs.value.map((tab) => ({
    id: tab.path,
    title: tab.shortTitle,
    subtitle: tab.chapterTitle,
    icon: tab.kind === 'full' ? 'book' : 'doc',
    tone: tab.kind === 'full' ? 'secondary' : 'primary',
  })),
)

function handleSelect(path: string) {
  emit('before-switch')
  openDoc(path)
}
</script>

<template>
  <VlTabBar
    :tabs="tabItems"
    :active-id="currentRoutePath"
    empty-text="未打开标签页 · 从左侧章节目录选择开始阅读"
    aria-label="已打开章节标签页"
    @select="handleSelect"
    @close="closeTab"
  >
    <template v-if="openTabs.length > 0" #actions>
      <VlButton
        v-if="openTabs.length > 1 && currentRoutePath !== '/'"
        size="xs"
        shape="pill"
        title="仅保留当前标签页"
        @click="closeOtherTabs(currentRoutePath)"
      >
        仅保留当前
      </VlButton>
      <VlButton
        size="xs"
        shape="pill"
        variant="danger"
        title="关闭全部标签页"
        @click="closeAllTabs"
      >
        全部关闭
      </VlButton>
    </template>
  </VlTabBar>
</template>
