<script setup lang="ts">
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
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

function handleSelect(path: string) {
  emit('before-switch')
  openDoc(path)
}

function handleClose(path: string) {
  closeTab(path)
}
</script>

<template>
  <div class="tabbar-wrap shape-rect" role="tablist" aria-label="已打开章节标签页">
    <!-- WinUI-style Animated Horizontal Scrollbar for Open Tabs -->
    <CustomScrollArea
      class="tabs-scroll-area"
      orientation="horizontal"
      wheel-horizontal
    >
      <div class="tabs-row">
        <div
          v-for="tab in openTabs"
          :key="tab.path"
          class="tab-item shape-rect"
          :class="{
            active: currentRoutePath === tab.path,
            isFull: tab.kind === 'full',
          }"
          role="tab"
          :aria-selected="currentRoutePath === tab.path"
          :title="tab.title"
          @click="handleSelect(tab.path)"
          @auxclick.middle.prevent="handleClose(tab.path)"
        >
          <span class="tab-top-accent shape-rect" />
          <span
            class="tab-icon"
            :class="[tab.kind, { activeCircle: currentRoutePath === tab.path }]"
          >
            <IconGlyph :name="tab.kind === 'full' ? 'book' : 'doc'" :size="12" />
          </span>
          <span class="tab-chapter">{{ tab.chapterTitle }}</span>
          <span class="tab-title">{{ tab.shortTitle }}</span>
          <button
            class="tab-close shape-circle"
            title="关闭标签页"
            @click.stop="handleClose(tab.path)"
          >
            <IconGlyph name="close" :size="10" />
          </button>
        </div>

        <div v-if="openTabs.length === 0" class="tab-placeholder">
          未打开标签页 · 从左侧章节目录选择开始阅读
        </div>
      </div>
    </CustomScrollArea>

    <div v-if="openTabs.length > 0" class="tab-actions">
      <button
        v-if="openTabs.length > 1 && currentRoutePath !== '/'"
        class="tab-action-pill shape-pill"
        title="仅保留当前标签页"
        @click="closeOtherTabs(currentRoutePath)"
      >
        仅保留当前
      </button>
      <button
        class="tab-action-pill shape-pill danger"
        title="关闭全部标签页"
        @click="closeAllTabs"
      >
        全部关闭
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabbar-wrap {
  height: 44px;
  min-height: 44px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  background-color: var(--bg-surface);
  user-select: none;
  overflow: hidden;
}

.tabs-scroll-area {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.tabs-row {
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: 2px;
  padding-bottom: 4px;
}

.tab-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px 0 12px;
  min-width: 132px;
  max-width: 240px;
  flex-shrink: 0;
  cursor: pointer;
  background-color: var(--bg-activity);
  color: var(--text-muted);
  font-size: 12px;
  transition:
    background-color 0.18s var(--ease-standard),
    color 0.18s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .tab-item:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.tab-item:active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.tab-item.active {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-weight: 700;
}

.tab-top-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--accent-primary);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.24s var(--ease-expressive);
}

.tab-item.active .tab-top-accent {
  transform: scaleX(1);
}

.tab-item.active.isFull .tab-top-accent {
  background-color: var(--accent-secondary);
}

.tab-icon {
  width: 20px;
  height: 20px;
  border-radius: 0%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    border-radius 0.3s var(--ease-nonlinear),
    background-color 0.2s var(--ease-nonlinear),
    color 0.2s var(--ease-nonlinear);
}

.tab-icon.scene {
  color: var(--accent-primary-text);
}

.tab-icon.full {
  color: var(--accent-secondary-text);
}

.tab-icon.scene.activeCircle {
  border-radius: 50%;
  background-color: var(--accent-primary-soft);
}

.tab-icon.full.activeCircle {
  border-radius: 50%;
  background-color: var(--accent-secondary-soft);
}

.tab-chapter {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  white-space: nowrap;
}

.tab-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0.65;
  transition:
    background-color 0.14s var(--ease-standard),
    color 0.14s var(--ease-standard),
    opacity 0.14s ease;
}

@media (hover: hover) and (pointer: fine) {
  .tab-item:hover .tab-close {
    opacity: 1;
  }

  .tab-close:hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.tab-item.active .tab-close {
  opacity: 1;
}

.tab-close:active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.tab-placeholder {
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--pane-pad);
  background-color: var(--bg-surface);
  flex-shrink: 0;
}

.tab-action-pill {
  height: 24px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  background-color: var(--bg-chip);
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.16s var(--ease-standard), color 0.16s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .tab-action-pill:hover {
    background-color: var(--accent-primary-soft);
    color: var(--accent-primary-text);
  }

  .tab-action-pill.danger:hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.tab-action-pill:active {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.tab-action-pill.danger:active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}
</style>
