<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Content } from 'vitepress'
import TabBar from './TabBar.vue'
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
import SlidingSegmentedControl, { type SegmentOption } from './SlidingSegmentedControl.vue'
import { useWorkbenchState, type ReaderWidthPreset } from '../composables/useWorkbenchState'

const widthOptions: SegmentOption<ReaderWidthPreset>[] = [
  { value: 'narrow', label: '窄', title: '窄版心 (640px)' },
  { value: 'standard', label: '标准', title: '标准版心 (780px)' },
  { value: 'wide', label: '宽', title: '宽版心 (960px)' },
]

const {
  manifest,
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
  saveScrollPosition,
  getScrollPosition,
} = useWorkbenchState()

const scrollAreaRef = ref<InstanceType<typeof CustomScrollArea> | null>(null)

function getScroller(): HTMLElement | null {
  return scrollAreaRef.value?.getViewport() ?? null
}

const firstScenePath = computed(() => {
  return manifest.readingSequence[0] ?? manifest.chapters[0]?.fullPath ?? null
})

const maxWidthStyle = computed(() => {
  const map: Record<ReaderWidthPreset, string> = {
    narrow: '640px',
    standard: '780px',
    wide: '960px',
  }
  return map[widthPreset.value]
})

function updateReadingProgress(el?: HTMLElement | null) {
  const vp = el ?? getScroller()
  if (!vp || !activeDoc.value) {
    readingProgress.value = 0
    return
  }
  const article = vp.querySelector<HTMLElement>('.reader-article')
  if (!article || article.offsetHeight === 0) {
    readingProgress.value = 0
    return
  }
  const maxScroll = vp.scrollHeight - vp.clientHeight
  if (maxScroll <= 1) {
    // Only report 100% if a short chapter actually rendered and fits completely in viewport
    const prose = article.querySelector<HTMLElement>('.reader-prose')
    const hasText = Boolean(prose && prose.textContent && prose.textContent.trim().length > 0)
    readingProgress.value = hasText && vp.scrollTop === 0 ? 0 : hasText ? 100 : 0
  } else {
    readingProgress.value = Math.min(100, Math.max(0, (vp.scrollTop / maxScroll) * 100))
  }
  saveScrollPosition(currentRoutePath.value, vp.scrollTop)
}

function restoreAfterDocMounted() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const vp = getScroller()
      if (!vp) return
      if (performPendingParagraphJump()) {
        scrollAreaRef.value?.syncMetrics()
        updateReadingProgress(vp)
        return
      }
      const saved = getScrollPosition(currentRoutePath.value)
      vp.scrollTop = saved
      scrollAreaRef.value?.syncMetrics()
      updateReadingProgress(vp)
    })
  })
}

onMounted(() => {
  restoreAfterDocMounted()
})

function saveCurrentScroll() {
  const vp = getScroller()
  if (vp && activeDoc.value) {
    saveScrollPosition(currentRoutePath.value, vp.scrollTop)
  }
}

function performPendingParagraphJump(): boolean {
  const jump = pendingParagraphJump.value
  if (!jump || jump.path !== currentRoutePath.value) return false
  const vp = getScroller()
  if (!vp) return false

  const paragraphs = vp.querySelectorAll<HTMLElement>('.reader-prose p')
  const target = paragraphs[jump.paragraphIndex]
  pendingParagraphJump.value = null

  if (!target) return false

  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  target.classList.remove('search-hit-pulse')
  void target.offsetWidth
  target.classList.add('search-hit-pulse')
  window.setTimeout(() => {
    target.classList.remove('search-hit-pulse')
  }, 2200)
  return true
}

watch(currentRoutePath, (nextPath, prevPath) => {
  const prevVp = getScroller()
  if (prevPath && prevVp) {
    saveScrollPosition(prevPath, prevVp.scrollTop)
  }
  // Reset immediately while out-in transition swaps DOM, then restore in onDocAfterEnter
  if (nextPath !== prevPath) {
    readingProgress.value = 0
  }
})

watch(
  () => pendingParagraphJump.value?.nonce,
  async () => {
    if (!pendingParagraphJump.value) return
    if (pendingParagraphJump.value.path !== currentRoutePath.value) return
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

function navigateTo(path: string) {
  saveCurrentScroll()
  openDoc(path)
}

defineExpose({
  scrollToHeading,
})
</script>

<template>
  <main class="reader-panel shape-rect" aria-label="小说阅读器">
    <!-- Multi-Tab Bar with Horizontal WinUI Scrollbar -->
    <TabBar @before-switch="saveCurrentScroll" />

    <!-- Breadcrumb & Column Width Bar -->
    <div v-if="activeDoc" class="breadcrumb-bar shape-rect">
      <div class="breadcrumbs">
        <span class="crumb-root">{{ manifest.bookTitle }}</span>
        <span class="crumb-sep">/</span>
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
          :model-value="widthPreset"
          :options="widthOptions"
          size="sm"
          surface="surface"
          aria-label="版心宽度"
          @update:model-value="setWidthPreset"
        />
      </div>
    </div>

    <!-- Sharp 3px Reading Progress Bar -->
    <div v-if="activeDoc" class="progress-track shape-rect">
      <div class="progress-fill shape-rect" :style="{ width: `${readingProgress}%` }" />
    </div>

    <!-- Scrollable Reader Canvas with WinUI Animated Scrollbar (Symmetric Concentric Margins) -->
    <CustomScrollArea
      ref="scrollAreaRef"
      class="reader-scroll"
      @scroll="updateReadingProgress"
      @metrics-change="updateReadingProgress"
    >
      <Transition name="doc-fade" mode="out-in" @after-enter="restoreAfterDocMounted">
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
              @click="navigateTo(adjacentDocs.prev.path)"
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
              @click="navigateTo(adjacentDocs.next.path)"
            >
              <span class="pager-text align-right">
                <small>下一节</small>
                <strong>{{ adjacentDocs.next.chapterTitle }} · {{ adjacentDocs.next.shortTitle }}</strong>
              </span>
              <IconGlyph name="arrow-right" :size="14" />
            </button>
          </nav>
        </article>

        <!-- Minimal Flat Empty State (Only shown if all tabs are closed) -->
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
            @click="openDoc(firstScenePath)"
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

.breadcrumb-bar {
  height: 34px;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: var(--bg-base);
  font-size: 12px;
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
  font-size: 10px;
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
  font-size: 11px;
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

/* Concentric 36px horizontal padding — identical left & right, zero scrollbar jump */
.reader-article {
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
  font-size: 11px;
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

.pager-btn:hover {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.pager-btn:hover small {
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
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 700;
}

.pager-text strong {
  font-size: 13px;
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

.empty-cta:hover {
  background-color: var(--accent-primary-hover);
}
</style>
