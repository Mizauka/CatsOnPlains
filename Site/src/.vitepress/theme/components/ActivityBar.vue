<script setup lang="ts">
import { computed } from 'vue'
import { VlActivityBar, type ActivityBarItem } from '@valance-ui/vue'
import { useWorkbenchState, type ActivitySection } from '../composables/useWorkbenchState'

const {
  isMobile,
  activitySection,
  leftShown,
  rightShown,
  setActivitySection,
  toggleRightPanel,
} = useWorkbenchState()

const topItems: ActivityBarItem[] = [
  { id: 'explorer', icon: 'files', label: '章节资源管理器' },
  { id: 'search', icon: 'search', label: '展开搜索（文件名 + 全文正则）' },
]

const bottomItems = computed<ActivityBarItem[]>(() => [
  ...(!isMobile.value
    ? [
        {
          id: 'comments',
          icon: 'comment' as const,
          label: '切换 [2-3] 右侧评论区',
          tone: 'secondary' as const,
          active: rightShown.value,
        },
      ]
    : []),
  { id: 'settings', icon: 'settings', label: '阅读与工作台设置' },
])

function handleSelect(item: ActivityBarItem) {
  if (item.id === 'comments') {
    toggleRightPanel()
    return
  }
  setActivitySection(item.id as ActivitySection)
}
</script>

<template>
  <VlActivityBar
    :items="topItems"
    :bottom-items="bottomItems"
    :model-value="activitySection"
    :active-visible="isMobile || leftShown"
    :mobile="isMobile"
    @select="handleSelect"
  />
</template>
