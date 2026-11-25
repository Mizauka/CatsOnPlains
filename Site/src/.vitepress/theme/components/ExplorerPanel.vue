<script setup lang="ts">
import { computed } from 'vue'
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
import SlidingSegmentedControl, { type SegmentOption } from './SlidingSegmentedControl.vue'
import ExplorerTree from './ExplorerTree.vue'
import ExplorerTiles from './ExplorerTiles.vue'
import SearchPanel from './SearchPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import { useWorkbenchState, type ExplorerViewMode } from '../composables/useWorkbenchState'

const emit = defineEmits<{
  (e: 'jump-outline', headingId: string): void
}>()

const {
  manifest,
  activeDoc,
  explorerViewMode,
  activitySection,
  activeTileFolderId,
  outlineOpen,
  setExplorerViewMode,
  expandAllChapters,
  collapseAllChapters,
  toggleOutlineOpen,
} = useWorkbenchState()

const viewOptions: SegmentOption<ExplorerViewMode>[] = [
  { value: 'tree', label: '树状', icon: 'tree', title: '树状列表视图' },
  { value: 'tiles', label: '平铺', icon: 'tiles', title: '平铺图标视图' },
]

const currentTileFolder = computed(() => {
  if (!activeTileFolderId.value) return null
  return manifest.chapters.find((c) => c.id === activeTileFolderId.value) ?? null
})

function goTileRoot() {
  activeTileFolderId.value = null
}
</script>

<template>
  <aside class="left-sidebar shape-rect" aria-label="左侧工作面板">
    <Transition name="panel-fade" mode="out-in">
      <!-- SECTION 1: Flattened Explorer -->
      <div v-if="activitySection === 'explorer'" key="explorer" class="explorer-panel shape-rect">
        <!-- Row 1: Panel Header with Sliding Orange Indicator -->
        <div class="panel-header shape-rect">
          <span class="panel-title">资源管理器</span>

          <SlidingSegmentedControl
            :model-value="explorerViewMode"
            :options="viewOptions"
            size="md"
            surface="activity"
            aria-label="切换视图模式"
            @update:model-value="setExplorerViewMode"
          />
        </div>

        <!-- Row 2: Fixed 34px Context / Breadcrumb Bar OUTSIDE Scroll Area -->
        <div class="context-bar shape-rect">
          <template v-if="explorerViewMode === 'tree'">
            <span class="context-label">章节目录</span>
            <div class="context-tools">
              <span class="context-meta">{{ manifest.totalChapters }} 章 · {{ manifest.totalScenes }} 幕</span>
              <button class="tool-icon-btn" title="全部展开" @click="expandAllChapters">
                <IconGlyph name="expand" :size="13" />
              </button>
              <button class="tool-icon-btn" title="全部折叠" @click="collapseAllChapters">
                <IconGlyph name="collapse" :size="13" />
              </button>
            </div>
          </template>

          <template v-else>
            <div class="crumb-row">
              <button class="crumb-root-btn" @click="goTileRoot">书架根目录</button>
              <template v-if="currentTileFolder">
                <span class="crumb-sep">/</span>
                <span class="crumb-active">{{ currentTileFolder.title }}</span>
              </template>
            </div>
            <button
              v-if="currentTileFolder"
              class="back-pill shape-pill"
              @click="goTileRoot"
            >
              <IconGlyph name="arrow-left" :size="11" />
              <span>返回</span>
            </button>
            <span v-else class="context-meta">{{ manifest.totalChapters }} 章</span>
          </template>
        </div>

        <!-- Scrollable List ONLY -->
        <CustomScrollArea class="explorer-scroll">
          <div class="explorer-list-inner">
            <Transition name="panel-fade" mode="out-in">
              <ExplorerTree v-if="explorerViewMode === 'tree'" key="tree" :chapters="manifest.chapters" />
              <ExplorerTiles v-else key="tiles" :chapters="manifest.chapters" />
            </Transition>
          </div>
        </CustomScrollArea>

        <!-- Flattened Outline Section with Smooth Nonlinear Downward Expand Animation! -->
        <div class="outline-section shape-rect">
          <button
            class="outline-header shape-rect"
            :aria-expanded="outlineOpen"
            @click="toggleOutlineOpen"
          >
            <span class="outline-chevron" :class="{ rotated: outlineOpen }">
              <IconGlyph name="chevron-right" :size="13" />
            </span>
            <span class="outline-title">大纲</span>
            <span v-if="activeDoc" class="outline-count shape-pill">
              {{ activeDoc.outline.length }}
            </span>
          </button>

          <div class="outline-collapse" :class="{ open: outlineOpen }">
            <div class="outline-collapse-inner">
              <CustomScrollArea class="outline-scroll">
                <div class="outline-list">
                  <template v-if="activeDoc && activeDoc.outline.length > 0">
                    <button
                      v-for="heading in activeDoc.outline"
                      :key="heading.id"
                      class="outline-item shape-rect"
                      :tabindex="outlineOpen ? 0 : -1"
                      @click="emit('jump-outline', heading.id)"
                    >
                      <span class="outline-dot shape-circle" />
                      <span class="outline-text">{{ heading.title }}</span>
                    </button>
                  </template>
                  <div v-else class="outline-empty">
                    打开任意章节以查看节选大纲
                  </div>
                </div>
              </CustomScrollArea>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Expanded Search -->
      <SearchPanel v-else-if="activitySection === 'search'" key="search" />

      <!-- SECTION 3: Settings -->
      <SettingsPanel v-else key="settings" />
    </Transition>
  </aside>
</template>

<style scoped>
.left-sidebar {
  height: 100%;
  width: 100%;
  background-color: var(--bg-surface);
  overflow: hidden;
  min-width: 0;
}

.explorer-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-surface);
  overflow: hidden;
  min-width: 0;
}

.panel-header {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--pane-pad);
  user-select: none;
  gap: 8px;
}

.panel-title {
  font-size: var(--ui-font-md);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.context-bar {
  height: calc(var(--ui-row-height) + 2px);
  min-height: calc(var(--ui-row-height) + 2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--pane-pad);
  background-color: var(--bg-activity);
  user-select: none;
  gap: 8px;
}

.context-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.context-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.context-meta {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.tool-icon-btn {
  width: 22px;
  height: 22px;
  border-radius: 0%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition:
    border-radius 0.28s var(--ease-nonlinear),
    background-color 0.2s var(--ease-nonlinear),
    color 0.2s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .tool-icon-btn:hover {
    border-radius: 50%;
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.tool-icon-btn:active {
  border-radius: 50%;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.crumb-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.crumb-root-btn {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  line-height: 1;
  transition: color 0.16s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .crumb-root-btn:hover {
    color: var(--accent-primary-text);
  }
}

.crumb-root-btn:active {
  color: var(--accent-primary-text);
}

.crumb-sep {
  font-size: var(--ui-font-md);
  color: var(--text-muted);
  line-height: 1;
}

.crumb-active {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--accent-primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}

.back-pill {
  height: 24px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  font-size: var(--ui-font-sm);
  font-weight: 700;
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.18s var(--ease-nonlinear), color 0.18s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .back-pill:hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.back-pill:active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.explorer-scroll {
  flex: 1;
  min-height: 0;
}

.explorer-list-inner {
  padding: var(--pane-pad);
}

/* Flattened Outline Section with Nonlinear Downward Expand Animation */
.outline-section {
  border-top: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.outline-header {
  height: var(--ui-row-height);
  min-height: var(--ui-row-height);
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--pane-pad);
  background-color: transparent;
  font-size: var(--ui-font-sm);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  transition: background-color 0.18s var(--ease-nonlinear), color 0.18s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .outline-header:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.outline-header:active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.outline-chevron {
  display: inline-flex;
  align-items: center;
  transition: transform 0.3s var(--ease-nonlinear), color 0.2s var(--ease-nonlinear);
}

.outline-chevron.rotated {
  transform: rotate(90deg);
  color: var(--accent-primary-text);
}

.outline-title {
  flex: 1;
  text-align: left;
  white-space: nowrap;
}

.outline-count {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 8px;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.outline-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.34s var(--ease-nonlinear),
    opacity 0.24s var(--ease-nonlinear);
}

.outline-collapse.open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.outline-collapse-inner {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.outline-scroll {
  max-height: 220px;
}

.outline-list {
  display: flex;
  flex-direction: column;
  padding: 2px var(--pane-pad) var(--pane-pad) var(--pane-pad);
  gap: 2px;
  transform: translateY(-6px);
  transition: transform 0.34s var(--ease-nonlinear);
}

.outline-collapse.open .outline-list {
  transform: translateY(0);
}

.outline-item {
  width: 100%;
  height: var(--ui-row-height);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
  text-align: left;
  background-color: transparent;
  transition: background-color 0.16s var(--ease-nonlinear), color 0.16s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .outline-item:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.outline-item:active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.outline-dot {
  width: 6px;
  height: 6px;
  background-color: var(--accent-secondary);
  flex-shrink: 0;
}

.outline-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.outline-empty {
  padding: 8px;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
