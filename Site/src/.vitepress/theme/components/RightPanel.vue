<script setup lang="ts">
import { VlBadge, VlEmptyState, VlPanel, VlTabs, type TabOption } from '@valance-ui/vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const { activeDoc } = useWorkbenchState()

const tabItems: TabOption<'comments'>[] = [
  { value: 'comments', label: '评论区', icon: 'comment' },
]
</script>

<template>
  <aside class="right-panel-wrap shape-rect" aria-label="右侧预留评论区">
    <VlPanel hide-header>
      <template #toolbar>
        <VlTabs model-value="comments" :items="tabItems" tone="primary">
          <template #extra>
            <VlBadge tone="secondary" size="xs">预留空间</VlBadge>
          </template>
        </VlTabs>
      </template>

      <div class="panel-body">
        <VlEmptyState
          title="评论区与扩展面板"
          description="此区域为后续评论、段评及读后感预留，当前暂未填充内容。"
        >
          <template #action>
            <VlBadge v-if="activeDoc" tone="primary" size="md">
              当前关联：{{ activeDoc.chapterTitle }} · {{ activeDoc.shortTitle }}
            </VlBadge>
          </template>
        </VlEmptyState>
      </div>
    </VlPanel>
  </aside>
</template>

<style scoped>
.right-panel-wrap {
  height: 100%;
  width: 100%;
  min-width: 0;
}

.panel-body {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
