<script setup lang="ts">
import { VlBadge, VlDockSheet, VlEmptyState } from '@valance-ui/vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const { activeDoc, readingProgress, mobileSheetDetent, setMobileSheetDetent } =
  useWorkbenchState()
</script>

<template>
  <VlDockSheet
    :detent="mobileSheetDetent"
    title="评论区"
    badge="预留"
    icon="comment"
    aria-label="底部评论区抽屉"
    @update:detent="setMobileSheetDetent"
  >
    <template #dock-right>
      <VlBadge v-if="activeDoc" tone="primary" size="xs">
        {{ Math.round(readingProgress) }}%
      </VlBadge>
    </template>

    <div class="sheet-body">
      <VlEmptyState
        title="评论区与扩展内容"
        description="拉住底部浮动停靠栏把手向上展开即可变为全宽面板。此区域为后续评论、段评及读后感预留，当前暂未填充内容。"
      >
        <template #action>
          <VlBadge v-if="activeDoc" tone="primary" size="md">
            当前关联：{{ activeDoc.chapterTitle }} · {{ activeDoc.shortTitle }}
          </VlBadge>
        </template>
      </VlEmptyState>
    </div>
  </VlDockSheet>
</template>

<style scoped>
.sheet-body {
  min-height: 100%;
  padding: 20px 16px 40px 16px;
}
</style>
