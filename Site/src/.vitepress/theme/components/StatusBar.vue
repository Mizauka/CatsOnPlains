<script setup lang="ts">
import { computed } from 'vue'
import { VlBadge, VlStatusBar } from '@valance-ui/vue'
import { useThemeMode } from '../composables/useThemeMode'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const { themePreference, resolvedTheme, activeLightBgHex, activeDarkBgHex } = useThemeMode()
const {
  activeDoc,
  openTabs,
  currentRoutePath,
  readingProgress,
  fontSize,
  explorerViewMode,
} = useWorkbenchState()

const themeStatusLabel = computed(() => {
  const hex = resolvedTheme.value === 'light' ? `亮色 ${activeLightBgHex.value}` : `暗色 ${activeDarkBgHex.value}`
  return themePreference.value === 'system' ? `跟随系统 · ${hex}` : hex
})
</script>

<template>
  <VlStatusBar brand="CatsOnPlains">
    <template #left>
      <VlBadge v-if="activeDoc" tone="secondary" size="xs">{{ activeDoc.version }}</VlBadge>
      <span class="status-mono">{{ currentRoutePath }}</span>
      <span class="status-muted">{{ openTabs.length }} 个标签</span>
    </template>

    <template #right>
      <span v-if="activeDoc" class="status-item">
        {{ activeDoc.wordCount.toLocaleString() }} 字 · 约 {{ activeDoc.readingMinutes }} 分钟
      </span>
      <VlBadge v-if="activeDoc" tone="primary" size="xs">
        进度 {{ Math.round(readingProgress) }}%
      </VlBadge>
      <span class="status-item">
        {{ explorerViewMode === 'tree' ? '树状列表' : '平铺图标' }}
      </span>
      <span class="status-item">{{ fontSize }}px</span>
      <span class="status-item">
        <span class="mode-dot shape-circle" />
        {{ themeStatusLabel }}
      </span>
    </template>
  </VlStatusBar>
</template>

<style scoped>
.status-mono {
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.status-muted {
  color: var(--text-muted);
}

.status-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.mode-dot {
  width: 7px;
  height: 7px;
  background-color: var(--accent-primary);
}
</style>
