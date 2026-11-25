<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import IconGlyph from './IconGlyph.vue'
import CustomScrollArea from './CustomScrollArea.vue'
import SlidingSegmentedControl, { type SegmentOption } from './SlidingSegmentedControl.vue'
import { useWorkbenchState, type SearchScope } from '../composables/useWorkbenchState'

const scopeOptions: SegmentOption<SearchScope>[] = [
  { value: 'both', label: '全部' },
  { value: 'filename', label: '文件名' },
  { value: 'regex', label: '正则全文' },
]
import { novelSearchIndex } from '../../data/novel-search-index'
import type { NovelDocItem } from '../../data/novel-manifest'

const {
  manifest,
  searchQuery,
  searchScope,
  searchIgnoreCase,
  currentRoutePath,
  openDoc,
} = useWorkbenchState()

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

const trimmedQuery = computed(() => searchQuery.value.trim())

const allDocs = computed<NovelDocItem[]>(() => {
  return manifest.chapters.flatMap((c) => c.items)
})

// Block 1: Literal filename & chapter/scene title matching
const filenameMatches = computed<NovelDocItem[]>(() => {
  const q = trimmedQuery.value
  if (!q) return []
  const needle = searchIgnoreCase.value ? q.toLowerCase() : q
  return allDocs.value.filter((doc) => {
    const hay = `${doc.chapterTitle} ${doc.shortTitle} ${doc.fileName}`
    const target = searchIgnoreCase.value ? hay.toLowerCase() : hay
    return target.includes(needle)
  })
})

interface ContentHit {
  paragraphIndex: number
  before: string
  match: string
  after: string
}

interface ContentDocGroup {
  path: string
  chapterTitle: string
  shortTitle: string
  version: string
  totalHits: number
  hits: ContentHit[]
}

// Block 2: Full-text RegExp matching across all paragraphs
const regexResult = computed<{
  error: string | null
  groups: ContentDocGroup[]
  totalHits: number
}>(() => {
  const q = trimmedQuery.value
  if (!q) return { error: null, groups: [], totalHits: 0 }

  let regex: RegExp
  try {
    regex = new RegExp(q, searchIgnoreCase.value ? 'gi' : 'g')
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : '无效的正则表达式',
      groups: [],
      totalHits: 0,
    }
  }

  const groups: ContentDocGroup[] = []
  let totalHits = 0
  const MAX_HITS_PER_DOC = 12
  const MAX_TOTAL_GROUPS = 40

  for (const doc of novelSearchIndex) {
    const docHits: ContentHit[] = []
    let docHitCount = 0

    for (let pIdx = 0; pIdx < doc.paragraphs.length; pIdx++) {
      const para = doc.paragraphs[pIdx]
      regex.lastIndex = 0
      const m = regex.exec(para)
      if (!m) continue
      if (m[0].length === 0) {
        docHitCount++
        if (docHits.length < MAX_HITS_PER_DOC) {
          docHits.push({
            paragraphIndex: pIdx,
            before: '',
            match: para.slice(0, 12),
            after: para.slice(12, 56) + (para.length > 56 ? '…' : ''),
          })
        }
        continue
      }

      docHitCount++
      if (docHits.length < MAX_HITS_PER_DOC) {
        const start = m.index
        const end = start + m[0].length
        const ctxStart = Math.max(0, start - 18)
        const ctxEnd = Math.min(para.length, end + 30)
        docHits.push({
          paragraphIndex: pIdx,
          before: (ctxStart > 0 ? '…' : '') + para.slice(ctxStart, start),
          match: para.slice(start, end),
          after: para.slice(end, ctxEnd) + (ctxEnd < para.length ? '…' : ''),
        })
      }
    }

    if (docHitCount > 0) {
      totalHits += docHitCount
      if (groups.length < MAX_TOTAL_GROUPS) {
        groups.push({
          path: doc.path,
          chapterTitle: doc.chapterTitle,
          shortTitle: doc.shortTitle,
          version: doc.version,
          totalHits: docHitCount,
          hits: docHits,
        })
      }
    }
  }

  return { error: null, groups, totalHits }
})

function setScope(scope: SearchScope) {
  searchScope.value = scope
}

function clearSearch() {
  searchQuery.value = ''
  inputRef.value?.focus()
}
</script>

<template>
  <div class="search-panel shape-rect">
    <!-- Row 1: Panel Header (Concentric 12px margin) -->
    <div class="panel-header shape-rect">
      <span class="panel-title">展开搜索</span>

      <SlidingSegmentedControl
        :model-value="searchScope"
        :options="scopeOptions"
        size="sm"
        surface="activity"
        aria-label="搜索板块筛选"
        @update:model-value="setScope"
      />
    </div>

    <!-- Row 2: Search Input Bar (Concentric 12px margin — exact same edges as results below!) -->
    <div class="search-controls shape-rect">
      <!-- Accessible focus highlight sits cleanly on the OUTERMOST capsule pill! -->
      <div class="search-input-wrap shape-pill">
        <IconGlyph name="search" :size="14" class="search-lead-icon" />
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="输入关键词或正则表达式…"
        />
        <button
          v-if="searchQuery"
          class="clear-btn shape-circle"
          title="清空搜索"
          @click="clearSearch"
        >
          <IconGlyph name="close" :size="10" />
        </button>
      </div>

      <!-- Ignore Case Toggle (Square -> Pure Circle morph) -->
      <button
        class="flag-toggle"
        :class="{ active: !searchIgnoreCase }"
        :title="searchIgnoreCase ? '当前忽略大小写，点击切换为区分大小写' : '当前区分大小写，点击切换为忽略大小写'"
        @click="searchIgnoreCase = !searchIgnoreCase"
      >
        Aa
      </button>
    </div>

    <!-- Scrollable Results Area (Concentric 12px padding + WinUI Overlay Scrollbar) -->
    <CustomScrollArea class="search-scroll">
      <div class="search-results-inner">
        <div v-if="!trimmedQuery" class="search-empty">
          <div class="empty-dot shape-circle" />
          <div class="empty-title">双板块展开搜索</div>
          <div class="empty-desc">
            输入关键词即可同时匹配「文件名」与「正则全文内容」（如 <code>猫耳|尾巴</code>、<code>第\d+</code>）。
          </div>
        </div>

        <template v-else>
          <!-- BLOCK 1: Filename Match (Flattened, Zero Nested Cards) -->
          <section
            v-if="searchScope === 'both' || searchScope === 'filename'"
            class="result-block shape-rect"
          >
            <div class="block-header shape-rect">
              <span class="block-accent primary shape-rect" />
              <span class="block-title">文件名匹配</span>
              <span class="block-mode">字面</span>
              <span class="block-count primary shape-pill">{{ filenameMatches.length }}</span>
            </div>

            <div v-if="filenameMatches.length === 0" class="block-empty">
              无匹配的文件名或幕名
            </div>

            <div v-else class="filename-list">
              <button
                v-for="doc in filenameMatches"
                :key="doc.id"
                class="file-hit-item shape-rect"
                :class="{ active: currentRoutePath === doc.path }"
                @click="openDoc(doc.path)"
              >
                <span class="hit-icon" :class="doc.kind">
                  <IconGlyph :name="doc.kind === 'full' ? 'book' : 'doc'" :size="14" />
                </span>
                <span class="hit-meta">
                  <strong class="hit-name">{{ doc.shortTitle }}</strong>
                  <small class="hit-sub">{{ doc.chapterTitle }} · {{ doc.fileName }}</small>
                </span>
                <span class="hit-words shape-pill">{{ (doc.wordCount / 1000).toFixed(1) }}k</span>
              </button>
            </div>
          </section>

          <!-- BLOCK 2: Full-Text Regex Match (Flattened) -->
          <section
            v-if="searchScope === 'both' || searchScope === 'regex'"
            class="result-block shape-rect"
          >
            <div class="block-header shape-rect">
              <span class="block-accent secondary shape-rect" />
              <span class="block-title">全文正则匹配</span>
              <span class="block-mode">RegExp</span>
              <span class="block-count secondary shape-pill">{{ regexResult.totalHits }}</span>
            </div>

            <div v-if="regexResult.error" class="regex-error shape-rect">
              正则语法错误：{{ regexResult.error }}
            </div>

            <div v-else-if="regexResult.groups.length === 0" class="block-empty">
              全书正文中无匹配该正则的段落
            </div>

            <div v-else class="regex-groups">
              <div v-for="group in regexResult.groups" :key="group.path" class="regex-group">
                <button class="group-head shape-rect" @click="openDoc(group.path)">
                  <span class="group-doc">{{ group.chapterTitle }} · {{ group.shortTitle }}</span>
                  <span class="group-badge shape-pill">{{ group.totalHits }} 处</span>
                </button>

                <div class="group-hits">
                  <button
                    v-for="(hit, idx) in group.hits"
                    :key="`${group.path}-${hit.paragraphIndex}-${idx}`"
                    class="snippet-btn shape-rect"
                    @click="openDoc(group.path, hit.paragraphIndex)"
                  >
                    <span class="snippet-line">
                      {{ hit.before }}<mark class="snippet-mark shape-rect">{{ hit.match }}</mark>{{ hit.after }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </CustomScrollArea>
  </div>
</template>

<style scoped>
.search-panel {
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

.search-controls {
  display: flex;
  align-items: center;
  gap: var(--pane-gap);
  padding: 4px var(--pane-pad) 12px var(--pane-pad);
}

/* Outer capsule pill carries the accessible focus highlight cleanly! */
.search-input-wrap {
  flex: 1;
  min-width: 0;
  height: var(--ui-row-height);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px 0 12px;
  background-color: var(--bg-elevated);
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition:
    background-color 0.16s var(--ease-standard),
    outline-color 0.18s var(--ease-standard);
}

.search-input-wrap:focus-within {
  background-color: var(--bg-base);
  outline-color: var(--accent-primary);
}

.search-lead-icon {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: var(--ui-font-md);
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
}

@media (hover: hover) and (pointer: fine) {
  .clear-btn:hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.clear-btn:active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

/* M3 Expressive Morph: Pure square -> Pure circle when active */
.flag-toggle {
  width: var(--ui-row-height);
  height: var(--ui-row-height);
  border-radius: 0%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ui-font-sm);
  font-weight: 800;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    border-radius 0.32s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear),
    color 0.22s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .flag-toggle:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.flag-toggle:active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.flag-toggle.active {
  border-radius: 50%;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.search-scroll {
  flex: 1;
  min-height: 0;
}

/* Concentric 12px left/right padding matching search-controls above! */
.search-results-inner {
  padding: 0 var(--pane-pad) 16px var(--pane-pad);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.search-empty {
  padding: 28px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-dot {
  width: 14px;
  height: 14px;
  background-color: var(--accent-primary);
}

.empty-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 12px;
  line-height: 1.65;
  color: var(--text-muted);
}

.empty-desc code {
  padding: 1px 5px;
  background-color: var(--bg-chip);
  color: var(--accent-primary-text);
  font-family: 'Cascadia Code', 'JetBrains Mono', monospace;
}

.result-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: var(--bg-activity);
}

.block-accent {
  width: 4px;
  height: 14px;
}

.block-accent.primary {
  background-color: var(--accent-primary);
}

.block-accent.secondary {
  background-color: var(--accent-secondary);
}

.block-title {
  flex: 1;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.block-mode {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.block-count {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 8px;
  font-variant-numeric: tabular-nums;
}

.block-count.primary {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.block-count.secondary {
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

.block-empty {
  padding: 10px 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.regex-error {
  padding: 10px 10px;
  font-size: 12px;
  color: var(--accent-primary-text);
  background-color: var(--accent-primary-soft);
  word-break: break-all;
}

.filename-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-hit-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  background-color: transparent;
  text-align: left;
  transition: background-color 0.15s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .file-hit-item:hover {
    background-color: var(--bg-hover);
  }
}

.file-hit-item:active {
  background-color: var(--bg-hover);
}

.file-hit-item.active {
  background-color: var(--accent-primary-soft);
}

.hit-icon.scene {
  color: var(--accent-primary-text);
}

.hit-icon.full {
  color: var(--accent-secondary-text);
}

.hit-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hit-name {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hit-sub {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hit-words {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 2px 7px;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.regex-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.regex-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background-color: var(--bg-elevated);
  text-align: left;
  transition: background-color 0.14s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .group-head:hover {
    background-color: var(--bg-hover);
  }
}

.group-head:active {
  background-color: var(--bg-hover);
}

.group-doc {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-badge {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 1px 7px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  flex-shrink: 0;
}

.group-hits {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.snippet-btn {
  width: 100%;
  padding: 6px 8px;
  text-align: left;
  font-size: var(--ui-font-md);
  line-height: 1.55;
  color: var(--text-secondary);
  background-color: transparent;
  transition: background-color 0.14s var(--ease-standard), color 0.14s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .snippet-btn:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.snippet-btn:active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.snippet-line {
  display: block;
  word-break: break-all;
}

.snippet-mark {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
  font-weight: 700;
  padding: 0 2px;
}
</style>
