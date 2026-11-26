<script setup lang="ts">
import { computed } from 'vue'
import { VlBadge, VlIcon } from '@valance-ui/vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'
import type { NovelChapter, NovelDocItem } from '../../data/novel-manifest'

defineProps<{
  chapters: NovelChapter[]
}>()

const {
  currentRoutePath,
  openTabPaths,
  expandedChapters,
  toggleChapterExpanded,
  openDoc,
} = useWorkbenchState()

const openSet = computed(() => new Set(openTabPaths.value))

function isExpanded(chapterId: string): boolean {
  return expandedChapters.value.includes(chapterId)
}

function handleDocClick(item: NovelDocItem) {
  openDoc(item.path)
}
</script>

<template>
  <div class="explorer-tree" role="tree" aria-label="章节树状列表">
    <div v-for="chapter in chapters" :key="chapter.id" class="tree-folder-group" role="treeitem">
      <button
        class="tree-row folder-row shape-rect"
        :aria-expanded="isExpanded(chapter.id)"
        @click="toggleChapterExpanded(chapter.id)"
      >
        <span class="chevron-wrap" :class="{ rotated: isExpanded(chapter.id) }">
          <VlIcon name="chevron-right" :size="13" />
        </span>
        <span class="folder-icon">
          <VlIcon :name="isExpanded(chapter.id) ? 'folder-open' : 'folder'" :size="15" />
        </span>
        <span class="row-label folder-label">{{ chapter.title }}</span>
        <VlBadge tone="secondary" size="xs">{{ chapter.version }}</VlBadge>
        <span class="count-meta">{{ chapter.sceneCount }}幕</span>
      </button>

      <div class="tree-collapse" :class="{ open: isExpanded(chapter.id) }" role="group">
        <div class="tree-collapse-inner">
          <div class="tree-children">
            <button
              v-for="item in chapter.items"
              :key="item.id"
              class="tree-row file-row shape-rect"
              :class="{
                active: currentRoutePath === item.path,
                isFull: item.kind === 'full',
              }"
              :tabindex="isExpanded(chapter.id) ? 0 : -1"
              :title="`${item.title} (${item.wordCount.toLocaleString()}字)`"
              @click="handleDocClick(item)"
            >
              <span class="active-bar shape-rect" />
              <span class="file-icon" :class="item.kind">
                <VlIcon :name="item.kind === 'full' ? 'book' : 'doc'" :size="14" />
              </span>
              <span class="row-label">{{ item.shortTitle }}</span>
              <span
                v-if="openSet.has(item.path)"
                class="open-dot shape-circle"
                title="已在标签页打开"
              />
              <span class="word-meta">{{ (item.wordCount / 1000).toFixed(1) }}k</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explorer-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
  user-select: none;
}

.tree-folder-group {
  display: flex;
  flex-direction: column;
}

.tree-row {
  position: relative;
  width: 100%;
  height: var(--ui-row-height);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  text-align: left;
  font-size: var(--ui-font-base);
  color: var(--text-secondary);
  background-color: transparent;
  transition:
    background-color 0.18s var(--ease-nonlinear),
    color 0.18s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .tree-row:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.folder-row {
  font-weight: 700;
  color: var(--text-primary);
}

.chevron-wrap {
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.3s var(--ease-nonlinear), color 0.2s var(--ease-nonlinear);
}

.chevron-wrap.rotated {
  transform: rotate(90deg);
  color: var(--accent-primary-text);
}

.folder-icon {
  display: inline-flex;
  align-items: center;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.row-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count-meta {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tree-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.34s var(--ease-nonlinear),
    opacity 0.24s var(--ease-nonlinear);
}

.tree-collapse.open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.tree-collapse-inner {
  min-height: 0;
  overflow: hidden;
}

.tree-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 2px;
  padding-bottom: 6px;
  transform: translateY(-6px);
  transition: transform 0.34s var(--ease-nonlinear);
}

.tree-collapse.open .tree-children {
  transform: translateY(0);
}

.file-row {
  padding-left: 24px;
}

.active-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: transparent;
  transition: background-color 0.2s var(--ease-nonlinear);
}

.file-row.active {
  background-color: var(--accent-primary-soft);
  color: var(--text-primary);
  font-weight: 700;
}

.file-row.active .active-bar {
  background-color: var(--accent-primary);
}

.file-row.active.isFull {
  background-color: var(--accent-secondary-soft);
}

.file-row.active.isFull .active-bar {
  background-color: var(--accent-secondary);
}

.file-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.file-icon.scene {
  color: var(--accent-primary-text);
}

.file-icon.full {
  color: var(--accent-secondary-text);
}

.open-dot {
  width: 6px;
  height: 6px;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.file-row.isFull .open-dot {
  background-color: var(--accent-secondary);
}

.word-meta {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
</style>
