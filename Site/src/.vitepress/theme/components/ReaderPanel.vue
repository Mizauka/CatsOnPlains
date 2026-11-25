<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Content } from 'vitepress'
import TabBar from './TabBar.vue'
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
import SlidingSegmentedControl, { type SegmentOption } from './SlidingSegmentedControl.vue'
import {
  useWorkbenchState,
  WIDTH_PRESET_PX,
  type ReaderWidthPreset,
} from '../composables/useWorkbenchState'

const widthOptions: SegmentOption<ReaderWidthPreset>[] = [
  { value: 'narrow', label: '窄', title: '窄版心 (640px)' },
  { value: 'standard', label: '标准', title: '标准版心 (780px)' },
  { value: 'wide', label: '宽', title: '宽版心 (960px)' },
]

const {
  manifest,
  isMobile,
  activeDoc,
  currentRoutePath,
  adjacentDocs,
  fontSize,
  lineHeight,
  fontFamily,
  widthPreset,
  readingProgress,
  pendingParagraphJump,
  openDoc,
  setWidthPreset,
  registerWidthTransition,
  saveScrollPosition,
  getScrollPosition,
  setReadingProgressForPath,
} = useWorkbenchState()

const scrollAreaRef = ref<InstanceType<typeof CustomScrollArea> | null>(null)
const isWidthMorphing = ref(false)

// Lock preventing outgoing chapter's scroll/metrics events from polluting the incoming chapter!
let isSwappingDoc = false
let mountedDocPath: string | null = null

function getScroller(): HTMLElement | null {
  return scrollAreaRef.value?.getViewport() ?? null
}

const firstScenePath = computed(() => {
  return manifest.readingSequence[0] ?? manifest.chapters[0]?.fullPath ?? null
})

const maxWidthStyle = computed(() => `${WIDTH_PRESET_PX[widthPreset.value]}px`)

function computeAndRecordProgress(path: string, vp: HTMLElement) {
  const article = vp.querySelector<HTMLElement>('.reader-article')
  if (!article || article.offsetHeight === 0) {
    setReadingProgressForPath(path, 0)
    return
  }
  const maxScroll = vp.scrollHeight - vp.clientHeight
  if (maxScroll <= 1) {
    const prose = article.querySelector<HTMLElement>('.reader-prose')
    const hasText = Boolean(prose && prose.textContent && prose.textContent.trim().length > 0)
    const pct = hasText && vp.scrollTop === 0 ? 0 : hasText ? 100 : 0
    setReadingProgressForPath(path, pct)
  } else {
    const pct = Math.min(100, Math.max(0, (vp.scrollTop / maxScroll) * 100))
    setReadingProgressForPath(path, pct)
  }
  saveScrollPosition(path, vp.scrollTop)
}

function updateReadingProgress(el?: HTMLElement | null) {
  if (isSwappingDoc) return
  const vp = el ?? getScroller()
  if (!vp || !activeDoc.value) return
  // Strictly ensure the DOM currently mounted belongs to currentRoutePath
  if (mountedDocPath !== currentRoutePath.value) return
  computeAndRecordProgress(currentRoutePath.value, vp)
}

function saveCurrentScroll() {
  if (isSwappingDoc) return
  const vp = getScroller()
  if (vp && activeDoc.value && mountedDocPath === currentRoutePath.value) {
    computeAndRecordProgress(currentRoutePath.value, vp)
  }
}

function performPendingParagraphJump(instant = false): boolean {
  const jump = pendingParagraphJump.value
  if (!jump || jump.path !== currentRoutePath.value) return false
  const vp = getScroller()
  if (!vp) return false

  const paragraphs = vp.querySelectorAll<HTMLElement>('.reader-prose p')
  const target = paragraphs[jump.paragraphIndex]
  pendingParagraphJump.value = null

  if (!target) return false

  target.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'center' })
  target.classList.remove('search-hit-pulse')
  void target.offsetWidth
  target.classList.add('search-hit-pulse')
  window.setTimeout(() => {
    target.classList.remove('search-hit-pulse')
  }, 2200)
  return true
}

function restoreScrollSync(targetPath: string, instantJump = false) {
  if (targetPath !== currentRoutePath.value) return
  const vp = getScroller()
  mountedDocPath = targetPath
  isSwappingDoc = false
  if (!vp) return

  if (performPendingParagraphJump(instantJump)) {
    scrollAreaRef.value?.syncMetrics()
    computeAndRecordProgress(targetPath, vp)
    return
  }

  const saved = getScrollPosition(targetPath)
  vp.scrollTop = saved
  scrollAreaRef.value?.syncMetrics()
  computeAndRecordProgress(targetPath, vp)
}

function onDocEnter() {
  // Runs synchronously right as the new <article> is mounted (at opacity: 0, before first paint!)
  // so vp.scrollTop & scrollbar thumb are already in exact position on frame 0 — zero delayed jump!
  restoreScrollSync(currentRoutePath.value, true)
}

// KDE / Win11-style Snapshot Clip + Crossfade Transition for Column Width (Zero Text Reflow Flicker!)
function handleWidthTransition(nextPreset: ReaderWidthPreset, commit: () => void) {
  const vp = getScroller()
  const canTransition =
    typeof document !== 'undefined' && typeof document.startViewTransition === 'function'
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!vp || !activeDoc.value || !canTransition || reducedMotion) {
    commit()
    nextTick(() => {
      scrollAreaRef.value?.syncMetrics()
      updateReadingProgress(vp)
    })
    return
  }

  // 1. Capture the current reading paragraph anchor so user never loses their reading line
  const vpRect = vp.getBoundingClientRect()
  const paragraphs = Array.from(vp.querySelectorAll<HTMLElement>('.reader-prose p'))
  let anchorIndex = -1
  let anchorDeltaY = 0
  for (let i = 0; i < paragraphs.length; i++) {
    const r = paragraphs[i].getBoundingClientRect()
    if (r.bottom > vpRect.top + 12) {
      anchorIndex = i
      anchorDeltaY = r.top - vpRect.top
      break
    }
  }

  // 2. Compute exact horizontal clip-path insets for old width -> new width inside viewport
  const oldW = Math.min(vpRect.width, WIDTH_PRESET_PX[widthPreset.value])
  const newW = Math.min(vpRect.width, WIDTH_PRESET_PX[nextPreset])
  const fromInset = Math.max(0, Math.round((vpRect.width - oldW) / 2))
  const toInset = Math.max(0, Math.round((vpRect.width - newW) / 2))

  const root = document.documentElement
  root.style.setProperty('--width-inset-from', `${fromInset}px`)
  root.style.setProperty('--width-inset-to', `${toInset}px`)
  root.dataset.vtKind = 'width'
  isWidthMorphing.value = true

  // Wait one micro-tick so view-transition-name: reader-column is active before snapshot capture
  nextTick(() => {
    const transition = document.startViewTransition(async () => {
      commit()
      await nextTick()
      // Restore reading anchor paragraph position in the new layout before new snapshot is captured
      if (anchorIndex >= 0) {
        const nextParas = vp.querySelectorAll<HTMLElement>('.reader-prose p')
        const anchorEl = nextParas[anchorIndex]
        if (anchorEl) {
          const newVpTop = vp.getBoundingClientRect().top
          const newAnchorTop = anchorEl.getBoundingClientRect().top
          vp.scrollTop += newAnchorTop - (newVpTop + anchorDeltaY)
        }
      }
      scrollAreaRef.value?.syncMetrics()
      updateReadingProgress(vp)
    })

    transition.finished.finally(() => {
      isWidthMorphing.value = false
      if (root.dataset.vtKind === 'width') {
        delete root.dataset.vtKind
      }
    })
  })
}

onMounted(() => {
  registerWidthTransition(handleWidthTransition)
  restoreScrollSync(currentRoutePath.value, true)
})

onBeforeUnmount(() => {
  registerWidthTransition(null)
})

watch(currentRoutePath, (nextPath, prevPath) => {
  if (nextPath === prevPath) return
  const prevVp = getScroller()
  if (prevPath && prevVp && mountedDocPath === prevPath) {
    computeAndRecordProgress(prevPath, prevVp)
  }
  // Lock progress writes while out-in transition swaps old & new article DOM
  isSwappingDoc = true
  mountedDocPath = null
})

watch(
  () => pendingParagraphJump.value?.nonce,
  async () => {
    if (!pendingParagraphJump.value) return
    if (pendingParagraphJump.value.path !== currentRoutePath.value) return
    if (isSwappingDoc) return
    await nextTick()
    requestAnimationFrame(() => {
      performPendingParagraphJump()
    })
  }
)

function scrollToHeading(headingId: string) {
  const vp = getScroller()
  if (!vp) return
  if (headingId === 'top') {
    vp.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const target = vp.querySelector<HTMLElement>(`#${CSS.escape(headingId)}`)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function navigatePager(path: string) {
  saveCurrentScroll()
  // Pager ("上一节 / 下一节") always starts cleanly at the top of the target scene
  openDoc(path, undefined, { resetScroll: true })
}

defineExpose({
  scrollToHeading,
})
</script>

<template>
  <main class="reader-panel shape-rect" :class="{ 'is-mobile': isMobile }" aria-label="小说阅读器">
    <!-- Multi-Tab Bar (Desktop Only — removed on mobile!) -->
    <TabBar v-if="!isMobile" @before-switch="saveCurrentScroll" />

    <!-- Breadcrumb & Column Width Bar -->
    <div v-if="activeDoc" class="breadcrumb-bar shape-rect">
      <div class="breadcrumbs">
        <span v-if="!isMobile" class="crumb-root">{{ manifest.bookTitle }}</span>
        <span v-if="!isMobile" class="crumb-sep">/</span>
        <span class="crumb-chapter">{{ activeDoc.chapterTitle }}</span>
        <span class="crumb-sep">/</span>
        <span class="crumb-doc">{{ activeDoc.shortTitle }}</span>
        <span class="crumb-ver shape-pill">{{ activeDoc.version }}</span>
      </div>

      <div class="reader-toolbar">
        <span class="doc-stat">
          {{ activeDoc.wordCount.toLocaleString() }} 字 · 约 {{ activeDoc.readingMinutes }} 分钟
        </span>

        <SlidingSegmentedControl
          v-if="!isMobile"
          :model-value="widthPreset"
          :options="widthOptions"
          size="sm"
          surface="surface"
          aria-label="版心宽度"
          @update:model-value="setWidthPreset"
        />
      </div>
    </div>

    <!-- Sharp 3px Reading Progress Bar (Per-Scene Independent) -->
    <div v-if="activeDoc" class="progress-track shape-rect">
      <div class="progress-fill shape-rect" :style="{ width: `${readingProgress}%` }" />
    </div>

    <!-- Scrollable Reader Canvas with WinUI Animated Scrollbar -->
    <CustomScrollArea
      ref="scrollAreaRef"
      class="reader-scroll"
      :class="{ 'vt-width-target': isWidthMorphing }"
      @scroll="updateReadingProgress"
      @metrics-change="updateReadingProgress"
    >
      <Transition name="doc-fade" mode="out-in" @enter="onDocEnter">
        <article
          v-if="activeDoc"
          :key="activeDoc.path"
          class="reader-article"
          :style="{
            maxWidth: maxWidthStyle,
            '--reader-font-size': `${fontSize}px`,
            '--reader-line-height': `${lineHeight}`,
          }"
        >
          <div class="article-meta-bar shape-rect">
            <span class="meta-badge chapter shape-pill">{{ activeDoc.chapterTitle }}</span>
            <span class="meta-badge kind shape-pill" :class="activeDoc.kind">
              {{ activeDoc.kind === 'full' ? '本章全文' : `第 ${activeDoc.sceneIndex} 幕` }}
            </span>
            <span class="meta-badge version shape-pill">修订 {{ activeDoc.version }}</span>
          </div>

          <div class="reader-prose" :class="`font-${fontFamily}`">
            <Content />
          </div>

          <nav class="chapter-pager shape-rect" aria-label="章节翻页">
            <button
              v-if="adjacentDocs.prev"
              class="pager-btn prev shape-pill"
              @click="navigatePager(adjacentDocs.prev.path)"
            >
              <IconGlyph name="arrow-left" :size="14" />
              <span class="pager-text">
                <small>上一节</small>
                <strong>{{ adjacentDocs.prev.chapterTitle }} · {{ adjacentDocs.prev.shortTitle }}</strong>
              </span>
            </button>
            <div v-else />

            <button
              v-if="adjacentDocs.next"
              class="pager-btn next shape-pill"
              @click="navigatePager(adjacentDocs.next.path)"
            >
              <span class="pager-text align-right">
                <small>下一节</small>
                <strong>{{ adjacentDocs.next.chapterTitle }} · {{ adjacentDocs.next.shortTitle }}</strong>
              </span>
              <IconGlyph name="arrow-right" :size="14" />
            </button>
          </nav>
        </article>

        <!-- Minimal Flat Empty State -->
        <div v-else key="empty-editor" class="empty-editor">
          <div class="empty-mark" aria-hidden="true">
            <span class="mark-lg shape-circle" />
            <span class="mark-sm shape-circle" />
          </div>
          <div class="empty-heading">当前未打开任何章节</div>
          <div class="empty-hint">从左侧资源管理器或展开搜索中选择任意章节即可打开阅读标签页。</div>
          <button
            v-if="firstScenePath"
            class="empty-cta shape-pill"
            @click="openDoc(firstScenePath, undefined, { resetScroll: true })"
          >
            <span>打开第0章 · 幕1 放出</span>
            <IconGlyph name="arrow-right" :size="14" />
          </button>
        </div>
      </Transition>
    </CustomScrollArea>
  </main>
</template>

<style scoped>
.reader-panel {
  flex: 1 1 320px;
  min-width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  overflow: hidden;
}

.reader-panel.is-mobile {
  min-width: 0;
}

.reader-panel.is-mobile .breadcrumb-bar {
  padding: 0 16px;
}

.reader-panel.is-mobile .reader-article {
  max-width: 100% !important;
  padding: 24px 20px 104px 20px;
}

.reader-panel.is-mobile .chapter-pager {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  margin-top: 40px;
}

.reader-panel.is-mobile .pager-btn {
  max-width: 100%;
  justify-content: space-between;
}

.breadcrumb-bar {
  height: calc(var(--ui-row-height) + 2px);
  min-height: calc(var(--ui-row-height) + 2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: var(--bg-base);
  font-size: var(--ui-font-md);
  user-select: none;
  gap: 12px;
  overflow: hidden;
}

.breadcrumbs {
  flex: 1 1 0%;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.crumb-root,
.crumb-chapter,
.crumb-sep {
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.crumb-doc {
  color: var(--text-primary);
  font-weight: 700;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crumb-ver {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 2px 8px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  flex-shrink: 0;
  white-space: nowrap;
}

.reader-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.doc-stat {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.progress-track {
  height: 3px;
  min-height: 3px;
  width: 100%;
  background-color: var(--bg-surface);
}

.progress-fill {
  height: 100%;
  background-color: var(--accent-primary);
  transition: width 0.08s linear;
}

.reader-scroll {
  flex: 1;
  min-height: 0;
}

.reader-scroll.vt-width-target {
  view-transition-name: reader-column;
}

/* No live max-width transition — width changes use KDE/Win11 snapshot clip + crossfade! */
.reader-article {
  width: 100%;
  margin: 0 auto;
  padding: 34px 36px 84px 36px;
}

.article-meta-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.meta-badge {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  padding: 3px 11px;
  white-space: nowrap;
}

.meta-badge.chapter {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.meta-badge.kind.scene {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.meta-badge.kind.full {
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

.meta-badge.version {
  background-color: var(--bg-surface);
  color: var(--text-secondary);
}

.chapter-pager {
  margin-top: 56px;
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pager-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: var(--bg-surface);
  color: var(--text-primary);
  max-width: 48%;
  transition:
    background-color 0.2s var(--ease-nonlinear),
    color 0.2s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .pager-btn:hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }

  .pager-btn:hover small {
    color: var(--accent-primary-ink);
    opacity: 0.85;
  }
}

.pager-btn:active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.pager-btn:active small {
  color: var(--accent-primary-ink);
  opacity: 0.85;
}

.pager-text {
  display: flex;
  flex-direction: column;
  text-align: left;
  min-width: 0;
}

.pager-text.align-right {
  text-align: right;
}

.pager-text small {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  font-weight: 700;
}

.pager-text strong {
  font-size: var(--ui-font-base);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-editor {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
  gap: 12px;
}

.empty-mark {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.mark-lg {
  width: 24px;
  height: 24px;
  background-color: var(--accent-primary);
}

.mark-sm {
  width: 14px;
  height: 14px;
  background-color: var(--accent-secondary);
}

.empty-heading {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}

.empty-hint {
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-secondary);
  max-width: 360px;
}

.empty-cta {
  margin-top: 8px;
  height: 36px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
  transition: background-color 0.2s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .empty-cta:hover {
    background-color: var(--accent-primary-hover);
  }
}

.empty-cta:active {
  background-color: var(--accent-primary-hover);
}
</style>
