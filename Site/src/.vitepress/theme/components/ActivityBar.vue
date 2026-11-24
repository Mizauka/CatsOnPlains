<script setup lang="ts">
import IconGlyph from './IconGlyph.vue'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const {
  activitySection,
  leftVisible,
  rightVisible,
  setActivitySection,
  toggleRightPanel,
} = useWorkbenchState()
</script>

<template>
  <nav class="activity-bar shape-rect" aria-label="工作台活动栏">
    <!-- Top Primary Tabs: Explorer + Expanded Search (No redundant Home) -->
    <div class="activity-group">
      <button
        class="activity-btn"
        :class="{ active: leftVisible && activitySection === 'explorer' }"
        title="章节资源管理器"
        @click="setActivitySection('explorer')"
      >
        <IconGlyph name="files" :size="18" />
      </button>

      <button
        class="activity-btn"
        :class="{ active: leftVisible && activitySection === 'search' }"
        title="展开搜索（文件名 + 全文正则）"
        @click="setActivitySection('search')"
      >
        <IconGlyph name="search" :size="18" />
      </button>
    </div>

    <!-- Bottom Utility Tabs: Comments + Settings (Settings placed directly below Comments) -->
    <div class="activity-group bottom">
      <button
        class="activity-btn secondary-mode"
        :class="{ active: rightVisible }"
        title="切换右侧评论区"
        @click="toggleRightPanel"
      >
        <IconGlyph name="comment" :size="18" />
      </button>

      <button
        class="activity-btn"
        :class="{ active: leftVisible && activitySection === 'settings' }"
        title="阅读与工作台设置"
        @click="setActivitySection('settings')"
      >
        <IconGlyph name="settings" :size="18" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.activity-bar {
  width: 50px;
  min-width: 50px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  background-color: var(--bg-activity);
  user-select: none;
}

.activity-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* M3 Expressive Morph: Pure square when idle -> Pure circle when active */
.activity-btn {
  width: 36px;
  height: 36px;
  border-radius: 0%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background-color: transparent;
  transition:
    border-radius 0.32s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear),
    color 0.22s var(--ease-nonlinear);
}

.activity-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.activity-btn.active {
  border-radius: 50%;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.activity-btn.active:hover {
  background-color: var(--accent-primary-hover);
}

.activity-btn.secondary-mode.active {
  border-radius: 50%;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.activity-btn.secondary-mode.active:hover {
  background-color: var(--accent-secondary-hover);
}
</style>
