<script setup lang="ts">
import IconGlyph from './IconGlyph.vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const {
  manifest,
  activeDoc,
  leftVisible,
  rightVisible,
  toggleLeftPanel,
  toggleRightPanel,
} = useWorkbenchState()
</script>

<template>
  <header class="titlebar shape-rect">
    <!-- Left: Brand Identity -->
    <div class="titlebar-left">
      <div class="brand-mark">
        <span class="brand-dot shape-circle" />
        <span class="brand-name">{{ manifest.bookTitle }}</span>
        <span class="brand-tag shape-pill">READER</span>
      </div>
    </div>

    <!-- Center: Active Document Capsule -->
    <div class="titlebar-center">
      <div class="center-pill shape-pill">
        <span class="center-dot shape-circle" :class="{ active: Boolean(activeDoc) }" />
        <span class="center-text">
          <template v-if="activeDoc">
            {{ activeDoc.chapterTitle }} / {{ activeDoc.shortTitle }}
          </template>
          <template v-else>
            {{ manifest.bookTitle }} · {{ manifest.totalChapters }} 章 {{ manifest.totalScenes }} 幕
          </template>
        </span>
      </div>
    </div>

    <!-- Right: Layout Panel Toggles only (Theme mode lives exclusively in Settings) -->
    <div class="titlebar-right">
      <button
        class="panel-toggle"
        :class="{ active: leftVisible }"
        title="显示/隐藏左侧面板 (Ctrl+B)"
        @click="toggleLeftPanel"
      >
        <IconGlyph name="panel-left" :size="15" />
      </button>

      <button
        class="panel-toggle secondary"
        :class="{ active: rightVisible }"
        title="显示/隐藏右侧评论面板 (Ctrl+Shift+B)"
        @click="toggleRightPanel"
      >
        <IconGlyph name="panel-right" :size="15" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  height: 42px;
  min-height: 42px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 var(--pane-pad);
  background-color: var(--bg-titlebar);
  user-select: none;
  gap: 12px;
}

.titlebar-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.brand-dot {
  width: 10px;
  height: 10px;
  background-color: var(--accent-primary);
  display: inline-block;
  flex-shrink: 0;
}

.brand-name {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  white-space: nowrap;
}

.brand-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 9px;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  white-space: nowrap;
  flex-shrink: 0;
}

.titlebar-center {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.center-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 16px;
  background-color: var(--bg-base);
  max-width: 440px;
}

.center-dot {
  width: 7px;
  height: 7px;
  background-color: var(--text-muted);
  flex-shrink: 0;
  transition: background-color 0.2s var(--ease-standard);
}

.center-dot.active {
  background-color: var(--accent-primary);
}

.center-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titlebar-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* M3 Expressive Morph: Pure square when off -> Pure circle when on */
.panel-toggle {
  width: 28px;
  height: 28px;
  border-radius: 0%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background-color: var(--bg-chip);
  flex-shrink: 0;
  transition:
    border-radius 0.32s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear),
    color 0.22s var(--ease-nonlinear);
}

.panel-toggle:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.panel-toggle.active {
  border-radius: 50%;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.panel-toggle.secondary.active {
  border-radius: 50%;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}
</style>
