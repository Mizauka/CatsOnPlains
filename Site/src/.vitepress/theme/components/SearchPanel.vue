<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  VlBadge,
  VlEmptyState,
  VlIcon,
  VlIconButton,
  VlInput,
  VlPanel,
  VlSegmentedControl,
  type SegmentOption,
} from '@valance-ui/vue'
import { useWorkbenchState, type SearchScope } from '../composables/useWorkbenchState'
import { novelSearchIndex } from '../../data/novel-search-index'
import type { NovelDocItem } from '../../data/novel-manifest'

const scopeOptions: SegmentOption<SearchScope>[] = [
  { value: 'both', label: '全部' },
  { value: 'filename', label: '文件名' },
  { value: 'regex', label: '正则全文' },
]

const {
  manifest,
  searchQuery,
  searchScope,
  searchIgnoreCase,
  currentRoutePath,
  openDoc,
} = useWorkbenchState()

const inputRef = ref<InstanceType<typeof VlInput> | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

const trimmedQuery = computed(() => searchQuery.value.trim())

const allDocs = computed<NovelDocItem[]>(() => {
  return manifest.chapters.flatMap((c) => c.items)
})

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
      if (!para) continue
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
</script>

<template>
  <VlPanel title="展开搜索">
    <template #header-right>
      <VlSegmentedControl
        :model-value="searchScope"
        :options="scopeOptions"
        size="sm"
        surface="activity"
        aria-label="搜索板块筛选"
        @update:model-value="setScope"
      />
    </template>

    <template #toolbar>
      <div class="search-controls shape-rect">
        <VlInput
          ref="inputRef"
          v-model="searchQuery"
          shape="pill"
          prefix-icon="search"
          clearable
          placeholder="输入关键词或正则表达式…"
          style="flex: 1"
        />

        <VlIconButton
          tone="secondary"
          :active="!searchIgnoreCase"
          :title="searchIgnoreCase ? '当前忽略大小写，点击切换为区分大小写' : '当前区分大小写，点击切换为忽略大小写'"
          @click="searchIgnoreCase = !searchIgnoreCase"
        >
          <span style="font-size: var(--ui-font-sm); font-weight: 800">Aa</span>
        </VlIconButton>
      </div>
    </template>

    <div class="search-results-inner">
      <VlEmptyState
        v-if="!trimmedQuery"
        compact
        title="双板块展开搜索"
        description="输入关键词即可同时匹配「文件名」与「正则全文内容」（如 猫耳|尾巴、第\d+）。"
      />

      <template v-else>
        <!-- BLOCK 1: Filename Match -->
        <section
          v-if="searchScope === 'both' || searchScope === 'filename'"
          class="result-block shape-rect"
        >
          <div class="block-header shape-rect">
            <span class="block-accent primary shape-rect" />
            <span class="block-title">文件名匹配</span>
            <span class="block-mode">字面</span>
            <VlBadge tone="primary" size="xs">{{ filenameMatches.length }}</VlBadge>
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
                <VlIcon :name="doc.kind === 'full' ? 'book' : 'doc'" :size="14" />
              </span>
              <span class="hit-meta">
                <strong class="hit-name">{{ doc.shortTitle }}</strong>
                <small class="hit-sub">{{ doc.chapterTitle }} · {{ doc.fileName }}</small>
              </span>
              <VlBadge tone="neutral" size="xs">{{ (doc.wordCount / 1000).toFixed(1) }}k</VlBadge>
            </button>
          </div>
        </section>

        <!-- BLOCK 2: Full-Text Regex Match -->
        <section
          v-if="searchScope === 'both' || searchScope === 'regex'"
          class="result-block shape-rect"
        >
          <div class="block-header shape-rect">
            <span class="block-accent secondary shape-rect" />
            <span class="block-title">全文正则匹配</span>
            <span class="block-mode">RegExp</span>
            <VlBadge tone="secondary" size="xs">{{ regexResult.totalHits }}</VlBadge>
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
                <VlBadge tone="secondary" size="xs">{{ group.totalHits }} 处</VlBadge>
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
  </VlPanel>
</template>

<style scoped>
.search-controls {
  display: flex;
  align-items: center;
  gap: var(--pane-gap);
  padding: 4px var(--pane-pad) 12px var(--pane-pad);
}

.search-results-inner {
  padding: 0 var(--pane-pad) 16px var(--pane-pad);
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.group-doc {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
