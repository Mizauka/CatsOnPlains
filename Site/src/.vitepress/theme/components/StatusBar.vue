<script setup lang="ts">
import { computed } from 'vue'
import { useThemeMode } from '../composables/useThemeMode'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const { themePreference, resolvedTheme } = useThemeMode()
const {
  activeDoc,
  openTabs,
  currentRoutePath,
  readingProgress,
  fontSize,
  explorerViewMode,
} = useWorkbenchState()

const themeStatusLabel = computed(() => {
  const hex = resolvedTheme.value === 'light' ? '亮色 #FAF7F2' : '暗色 #273033'
  return themePreference.value === 'system' ? `跟随系统 · ${hex}` : hex
})
</script>

<template>
  <footer class="statusbar shape-rect">
    <div class="status-left">
      <span class="status-accent-block shape-rect">CatsOnPlains</span>

      <span v-if="activeDoc" class="status-item version-pill shape-pill">
        {{ activeDoc.version }}
      </span>

      <span class="status-item mono">
        {{ currentRoutePath }}
      </span>

      <span class="status-item muted">
        {{ openTabs.length }} 个标签
      </span>
    </div>

    <div class="status-right">
      <span v-if="activeDoc" class="status-item">
        {{ activeDoc.wordCount.toLocaleString() }} 字 · 约 {{ activeDoc.readingMinutes }} 分钟
      </span>

      <span v-if="activeDoc" class="status-item progress-pill shape-pill">
        进度 {{ Math.round(readingProgress) }}%
      </span>

      <span class="status-item">
        {{ explorerViewMode === 'tree' ? '树状列表' : '平铺图标' }}
      </span>

      <span class="status-item">
        {{ fontSize }}px
      </span>

      <span class="status-item mode-item">
        <span class="mode-dot shape-circle" />
        {{ themeStatusLabel }}
      </span>
    </div>
  </footer>
</template>

<style scoped>
.statusbar {
  height: 26px;
  min-height: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: var(--pane-pad);
  background-color: var(--bg-statusbar);
  color: var(--text-statusbar);
  font-size: 11px;
  user-select: none;
  overflow: hidden;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.status-accent-block {
  height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 var(--pane-pad);
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.status-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.status-item.mono {
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
  color: var(--text-secondary);
}

.status-item.muted {
  color: var(--text-muted);
}

.version-pill {
  padding: 1px 8px;
  font-weight: 700;
  font-size: 10px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

.progress-pill {
  padding: 1px 9px;
  font-weight: 700;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.mode-dot {
  width: 7px;
  height: 7px;
  background-color: var(--accent-primary);
}
</style>
