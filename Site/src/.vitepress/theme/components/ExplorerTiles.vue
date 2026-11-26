<script setup lang="ts">
import { computed } from 'vue'
import { VlButton, VlIcon } from '@valance-ui/vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'
import type { NovelChapter } from '../../data/novel-manifest'

const props = defineProps<{
  chapters: NovelChapter[]
}>()

const {
  currentRoutePath,
  openTabPaths,
  activeTileFolderId,
  openDoc,
} = useWorkbenchState()

const openSet = computed(() => new Set(openTabPaths.value))

const currentFolder = computed<NovelChapter | null>(() => {
  if (!activeTileFolderId.value) return null
  return props.chapters.find((c) => c.id === activeTileFolderId.value) ?? null
})

function enterFolder(chapterId: string) {
  activeTileFolderId.value = chapterId
}
</script>

<template>
  <div class="explorer-tiles">
    <Transition name="panel-fade" mode="out-in">
      <div v-if="!currentFolder" key="folders" class="tiles-grid folders-grid">
        <div
          v-for="chapter in chapters"
          :key="chapter.id"
          class="tile-card folder-tile shape-rect"
          role="button"
          tabindex="0"
          @click="enterFolder(chapter.id)"
          @keydown.enter="enterFolder(chapter.id)"
        >
          <div class="folder-graphic shape-rect">
            <div class="folder-tab shape-rect" />
            <div class="folder-body shape-rect">
              <span class="folder-num">{{ String(chapter.chapterNum).padStart(2, '0') }}</span>
              <span class="folder-ver shape-pill">{{ chapter.version }}</span>
            </div>
          </div>

          <div class="tile-title folder-title">{{ chapter.title }}</div>
          <div class="tile-sub">
            {{ chapter.sceneCount }} 幕 · {{ (chapter.wordCount / 1000).toFixed(1) }}k 字
          </div>

          <VlButton
            size="xs"
            shape="pill"
            style="margin-top: 8px"
            title="直接打开本章全文"
            @click.stop="openDoc(chapter.fullPath)"
          >
            打开全文
          </VlButton>
        </div>
      </div>

      <div v-else :key="currentFolder.id" class="tiles-grid">
        <button
          v-for="item in currentFolder.items"
          :key="item.id"
          class="tile-card doc-tile shape-rect"
          :class="{
            active: currentRoutePath === item.path,
            isFull: item.kind === 'full',
          }"
          :title="`${item.title} (${item.wordCount.toLocaleString()}字)`"
          @click="openDoc(item.path)"
        >
          <span class="tile-top-bar shape-rect" />
          <div
            class="tile-glyph"
            :class="[item.kind, { activeMorph: currentRoutePath === item.path }]"
          >
            <VlIcon :name="item.kind === 'full' ? 'book' : 'doc'" :size="20" />
            <span v-if="openSet.has(item.path)" class="tile-open-dot shape-circle" />
          </div>
          <div class="tile-title">{{ item.shortTitle }}</div>
          <div class="tile-sub">
            {{ item.kind === 'full' ? '全文' : `幕${item.sceneIndex}` }} · {{ (item.wordCount / 1000).toFixed(1) }}k
          </div>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.explorer-tiles {
  user-select: none;
}

.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--pane-gap);
}

.folders-grid {
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
}

.tile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background-color: var(--bg-elevated);
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .tile-card:hover {
    background-color: var(--bg-hover);
  }
}

.tile-card.active {
  background-color: var(--accent-primary-soft);
}

.tile-card.active.isFull {
  background-color: var(--accent-secondary-soft);
}

.tile-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: transparent;
  transition: background-color 0.18s var(--ease-standard);
}

.tile-card.active .tile-top-bar {
  background-color: var(--accent-primary);
}

.tile-card.active.isFull .tile-top-bar {
  background-color: var(--accent-secondary);
}

.folder-graphic {
  width: 64px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.folder-tab {
  width: 26px;
  height: 6px;
  background-color: var(--accent-primary);
}

.folder-body {
  width: 64px;
  height: 42px;
  background-color: var(--accent-primary-soft);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.folder-num {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--accent-primary-text);
  line-height: 1;
}

.folder-ver {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 7px;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
  line-height: 1.25;
}

.tile-glyph {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 0%;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: var(--accent-primary-text);
  transition:
    border-radius 0.32s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear),
    color 0.22s var(--ease-nonlinear);
}

.tile-glyph.full {
  color: var(--accent-secondary-text);
}

.tile-glyph.activeMorph {
  border-radius: 50%;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.tile-glyph.full.activeMorph {
  border-radius: 50%;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.tile-open-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background-color: var(--accent-primary);
}

.tile-glyph.full .tile-open-dot {
  background-color: var(--accent-secondary);
}

.tile-glyph.activeMorph .tile-open-dot {
  background-color: var(--bg-base);
}

.tile-title {
  width: 100%;
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.folder-title {
  font-size: var(--ui-font-base);
}

.tile-sub {
  margin-top: 3px;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
