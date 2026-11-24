<script setup lang="ts">
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
import { useThemeMode } from '../composables/useThemeMode'
import { useWorkbenchState } from '../composables/useWorkbenchState'

const {
  themePreference,
  resolvedTheme,
  accentScheme,
  setThemePreference,
  setAccentScheme,
} = useThemeMode()
const {
  fontSize,
  lineHeight,
  fontFamily,
  widthPreset,
  explorerViewMode,
  adjustFontSize,
  adjustLineHeight,
  setFontFamily,
  setWidthPreset,
  setExplorerViewMode,
  resetSplitLayout,
} = useWorkbenchState()
</script>

<template>
  <div class="settings-panel shape-rect">
    <div class="panel-header shape-rect">
      <span class="panel-title">设置</span>
      <span class="panel-badge shape-pill">PREFERENCES</span>
    </div>

    <CustomScrollArea class="settings-scroll">
      <div class="settings-body">
        <!-- Theme Mode: Follow System / Light / Dark -->
        <section class="setting-item">
          <div class="item-head">
            <span class="item-label">外观模式</span>
            <span class="item-meta">
              {{ resolvedTheme === 'light' ? '#FAF7F2' : '#273033' }}
            </span>
          </div>
          <div class="seg-row three">
            <button
              class="seg-option"
              :class="{ active: themePreference === 'system' }"
              @click="setThemePreference('system', $event)"
            >
              跟随系统
            </button>
            <button
              class="seg-option"
              :class="{ active: themePreference === 'light' }"
              @click="setThemePreference('light', $event)"
            >
              亮色
            </button>
            <button
              class="seg-option"
              :class="{ active: themePreference === 'dark' }"
              @click="setThemePreference('dark', $event)"
            >
              暗色
            </button>
          </div>
        </section>

        <!-- Accent Swap Toggle -->
        <section class="setting-item">
          <div class="item-head">
            <span class="item-label">主题色对调</span>
            <span class="item-meta">
              {{ accentScheme === 'default' ? '主橘 #F87F04 · 辅青 #20A4A4' : '主青 #20A4A4 · 辅橘 #F87F04' }}
            </span>
          </div>
          <div class="seg-row">
            <button
              class="seg-option"
              :class="{ active: accentScheme === 'default' }"
              @click="setAccentScheme('default', $event)"
            >
              默认（橘 / 青）
            </button>
            <button
              class="seg-option"
              :class="{ active: accentScheme === 'swapped' }"
              @click="setAccentScheme('swapped', $event)"
            >
              对调（青 / 橘）
            </button>
          </div>
        </section>

        <!-- Font Family -->
        <section class="setting-item">
          <div class="item-head">
            <span class="item-label">正文字体</span>
          </div>
          <div class="seg-row">
            <button
              class="seg-option"
              :class="{ active: fontFamily === 'serif' }"
              @click="setFontFamily('serif')"
            >
              衬线宋体
            </button>
            <button
              class="seg-option"
              :class="{ active: fontFamily === 'sans' }"
              @click="setFontFamily('sans')"
            >
              无衬线黑体
            </button>
          </div>
        </section>

        <!-- Font Size -->
        <section class="setting-item inline-row">
          <div class="item-stack">
            <span class="item-label">正文字号</span>
            <span class="item-meta">{{ fontSize }} px</span>
          </div>
          <div class="stepper-controls">
            <button class="step-btn" title="减小字号" @click="adjustFontSize(-1)">A-</button>
            <button class="step-btn" title="增大字号" @click="adjustFontSize(1)">A+</button>
          </div>
        </section>

        <!-- Line Height -->
        <section class="setting-item inline-row">
          <div class="item-stack">
            <span class="item-label">正文行距</span>
            <span class="item-meta">{{ lineHeight.toFixed(2) }} 倍</span>
          </div>
          <div class="stepper-controls">
            <button class="step-btn" title="收紧行距" @click="adjustLineHeight(-0.1)">-</button>
            <button class="step-btn" title="放宽行距" @click="adjustLineHeight(0.1)">+</button>
          </div>
        </section>

        <!-- Column Width -->
        <section class="setting-item">
          <div class="item-head">
            <span class="item-label">版心宽度</span>
          </div>
          <div class="seg-row three">
            <button
              class="seg-option"
              :class="{ active: widthPreset === 'narrow' }"
              @click="setWidthPreset('narrow')"
            >
              窄
            </button>
            <button
              class="seg-option"
              :class="{ active: widthPreset === 'standard' }"
              @click="setWidthPreset('standard')"
            >
              标准
            </button>
            <button
              class="seg-option"
              :class="{ active: widthPreset === 'wide' }"
              @click="setWidthPreset('wide')"
            >
              宽
            </button>
          </div>
        </section>

        <!-- Explorer Default View -->
        <section class="setting-item">
          <div class="item-head">
            <span class="item-label">资源管理器视图</span>
          </div>
          <div class="seg-row">
            <button
              class="seg-option"
              :class="{ active: explorerViewMode === 'tree' }"
              @click="setExplorerViewMode('tree')"
            >
              <IconGlyph name="tree" :size="13" />
              <span>树状列表</span>
            </button>
            <button
              class="seg-option"
              :class="{ active: explorerViewMode === 'tiles' }"
              @click="setExplorerViewMode('tiles')"
            >
              <IconGlyph name="tiles" :size="13" />
              <span>平铺图标</span>
            </button>
          </div>
        </section>

        <!-- Reset Split Layout -->
        <section class="setting-item">
          <div class="item-head">
            <span class="item-label">三栏分屏布局</span>
            <span class="item-meta">双击滑块也可重置</span>
          </div>
          <button class="reset-btn" @click="resetSplitLayout">
            <IconGlyph name="reset" :size="13" />
            <span>恢复默认三栏比例</span>
          </button>
        </section>
      </div>
    </CustomScrollArea>
  </div>
</template>

<style scoped>
.settings-panel {
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
}

.panel-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.panel-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 9px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

.settings-scroll {
  flex: 1;
  min-height: 0;
}

.settings-body {
  padding: 0 var(--pane-pad) 20px var(--pane-pad);
  display: flex;
  flex-direction: column;
}

.setting-item {
  padding: 13px 0;
  border-top: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item:first-child {
  border-top: none;
  padding-top: 6px;
}

.setting-item.inline-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.item-meta {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.seg-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.seg-row.three {
  grid-template-columns: 1fr 1fr 1fr;
}

/* Exact 1/2 narrow-side radius (15px for 30px height) so border-radius interpolates smoothly across ALL frames! */
.seg-option {
  height: 30px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    border-radius 0.34s var(--ease-nonlinear),
    background-color 0.24s var(--ease-nonlinear),
    color 0.24s var(--ease-nonlinear);
}

.seg-option:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.seg-option.active {
  border-radius: 15px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Matching % units (0% <-> 50%) for silky square-to-circle morph */
.step-btn {
  width: 30px;
  height: 30px;
  border-radius: 0%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  background-color: var(--bg-chip);
  color: var(--text-primary);
  transition:
    border-radius 0.3s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear),
    color 0.22s var(--ease-nonlinear);
}

.step-btn:hover {
  border-radius: 50%;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

/* Exact 1/2 narrow-side radius (16px for 32px height): square -> full capsule morph on hover */
.reset-btn {
  height: 32px;
  border-radius: 0px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  transition:
    border-radius 0.34s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear),
    color 0.22s var(--ease-nonlinear);
}

.reset-btn:hover {
  border-radius: 16px;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}
</style>
