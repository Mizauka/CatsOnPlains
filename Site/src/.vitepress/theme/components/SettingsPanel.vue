<script setup lang="ts">
import {
  VlButton,
  VlPalettePicker,
  VlPanel,
  VlSegmentedControl,
  VlStepper,
  type SegmentOption,
} from '@valance-ui/vue'
import {
  useThemeMode,
  type AccentScheme,
  type ThemePreference,
} from '../composables/useThemeMode'
import {
  useWorkbenchState,
  type ExplorerViewMode,
  type ReaderFontFamily,
  type ReaderWidthPreset,
} from '../composables/useWorkbenchState'

const {
  themePreference,
  resolvedTheme,
  accentScheme,
  activeLightBgHex,
  activeDarkBgHex,
  setThemePreference,
  setAccentScheme,
} = useThemeMode()

const {
  isMobile,
  isDual,
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

const themeOptions: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
]

const accentOptions: SegmentOption<AccentScheme>[] = [
  { value: 'default', label: '默认（橘 / 青）' },
  { value: 'swapped', label: '对调（青 / 橘）' },
]

const fontOptions: SegmentOption<ReaderFontFamily>[] = [
  { value: 'serif', label: '衬线宋体' },
  { value: 'sans', label: '无衬线黑体' },
]

const widthOptions: SegmentOption<ReaderWidthPreset>[] = [
  { value: 'narrow', label: '窄' },
  { value: 'standard', label: '标准' },
  { value: 'wide', label: '宽' },
]

const explorerOptions: SegmentOption<ExplorerViewMode>[] = [
  { value: 'tree', label: '树状列表', icon: 'tree' },
  { value: 'tiles', label: '平铺图标', icon: 'tiles' },
]
</script>

<template>
  <VlPanel title="设置" badge="PREFERENCES">
    <div class="settings-body">
      <section class="setting-item">
        <div class="item-head">
          <span class="item-label">外观模式</span>
          <span class="item-meta">
            {{ resolvedTheme === 'light' ? activeLightBgHex : activeDarkBgHex }}
          </span>
        </div>
        <VlSegmentedControl
          :model-value="themePreference"
          :options="themeOptions"
          variant="morph-grid"
          :columns="3"
          @select="(val, ev) => setThemePreference(val, ev)"
        />
      </section>

      <section class="setting-item">
        <div class="item-head">
          <span class="item-label">主题色对调</span>
          <span class="item-meta">
            {{ accentScheme === 'default' ? '主橘 #F87F04 · 辅青 #20A4A4' : '主青 #20A4A4 · 辅橘 #F87F04' }}
          </span>
        </div>
        <VlSegmentedControl
          :model-value="accentScheme"
          :options="accentOptions"
          variant="morph-grid"
          :columns="2"
          @select="(val, ev) => setAccentScheme(val, ev)"
        />
      </section>

      <section class="setting-item">
        <VlPalettePicker compact />
      </section>

      <section class="setting-item">
        <div class="item-head">
          <span class="item-label">正文字体</span>
        </div>
        <VlSegmentedControl
          :model-value="fontFamily"
          :options="fontOptions"
          variant="morph-grid"
          :columns="2"
          @update:model-value="setFontFamily"
        />
      </section>

      <section class="setting-item">
        <VlStepper
          :model-value="fontSize"
          :min="14"
          :max="26"
          :step="1"
          :precision="0"
          label="正文字号"
          :hint="`${fontSize} px`"
          decrement-label="A-"
          increment-label="A+"
          @update:model-value="adjustFontSize($event - fontSize)"
        />
      </section>

      <section class="setting-item">
        <VlStepper
          :model-value="lineHeight"
          :min="1.5"
          :max="2.4"
          :step="0.1"
          :precision="2"
          label="正文行距"
          :hint="`${lineHeight.toFixed(2)} 倍`"
          @update:model-value="adjustLineHeight($event - lineHeight)"
        />
      </section>

      <section v-if="!isMobile" class="setting-item">
        <div class="item-head">
          <span class="item-label">版心宽度</span>
        </div>
        <VlSegmentedControl
          :model-value="widthPreset"
          :options="widthOptions"
          variant="morph-grid"
          :columns="3"
          @update:model-value="setWidthPreset"
        />
      </section>

      <section class="setting-item">
        <div class="item-head">
          <span class="item-label">资源管理器视图</span>
        </div>
        <VlSegmentedControl
          :model-value="explorerViewMode"
          :options="explorerOptions"
          variant="morph-grid"
          :columns="2"
          @update:model-value="setExplorerViewMode"
        />
      </section>

      <section v-if="!isMobile" class="setting-item">
        <div class="item-head">
          <span class="item-label">{{ isDual ? '平板双栏分屏 [1-2] ↔ [2-3]' : '三栏分屏布局' }}</span>
          <span class="item-meta">双击滑块也可重置</span>
        </div>
        <VlButton variant="secondary" icon="reset" block @click="resetSplitLayout">
          {{ isDual ? '恢复默认双栏比例' : '恢复默认三栏比例' }}
        </VlButton>
      </section>
    </div>
  </VlPanel>
</template>

<style scoped>
.settings-body {
  padding: 0 var(--pane-pad) 20px var(--pane-pad);
  display: flex;
  flex-direction: column;
  user-select: none;
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

.item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.item-meta {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
