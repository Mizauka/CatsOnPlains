<script setup lang="ts">
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const { activeDoc } = useWorkbenchState()
</script>

<template>
  <aside class="right-panel shape-rect" aria-label="右侧预留评论区">
    <!-- Secondary Side Bar Header (Concentric 12px padding) -->
    <div class="panel-header shape-rect">
      <div class="header-tabs">
        <span class="header-tab active shape-rect">
          <IconGlyph name="comment" :size="14" />
          <span>评论区</span>
        </span>
      </div>
      <span class="reserved-pill shape-pill">预留空间</span>
    </div>

    <!-- Flattened Reserved Canvas (No unnecessary nested card wrapper!) -->
    <CustomScrollArea class="panel-scroll">
      <div class="panel-body">
        <div class="reserved-mark" aria-hidden="true">
          <span class="mark-outer shape-circle" />
          <span class="mark-core shape-circle" />
        </div>

        <div class="reserved-title">评论区与扩展面板</div>
        <div class="reserved-subtitle">
          此区域为后续评论、段评及读后感预留，当前暂未填充内容。
        </div>

        <div v-if="activeDoc" class="context-pill shape-pill">
          当前关联：{{ activeDoc.chapterTitle }} · {{ activeDoc.shortTitle }}
        </div>
      </div>
    </CustomScrollArea>
  </aside>
</template>

<style scoped>
.right-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-surface);
  overflow: hidden;
  min-width: 0;
  user-select: none;
}

.panel-header {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--pane-pad);
  gap: 8px;
}

.header-tabs {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.header-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  white-space: nowrap;
}

.header-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background-color: var(--accent-primary);
}

.reserved-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 9px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  white-space: nowrap;
  flex-shrink: 0;
}

.panel-scroll {
  flex: 1;
  min-height: 0;
}

.panel-body {
  min-height: 100%;
  padding: 40px var(--pane-pad);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
}

.reserved-mark {
  position: relative;
  width: 44px;
  height: 44px;
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
  width: 18px;
  height: 18px;
  background-color: var(--accent-secondary);
}

.reserved-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-primary);
}

.reserved-subtitle {
  font-size: 12px;
  line-height: 1.65;
  color: var(--text-muted);
  max-width: 220px;
}

.context-pill {
  margin-top: 6px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
