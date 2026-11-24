import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, withBase } from 'vitepress'
import { novelManifest, allDocsByPath, type NovelDocItem } from '../../data/novel-manifest'

export type ExplorerViewMode = 'tree' | 'tiles'
export type ReaderFontFamily = 'serif' | 'sans'
export type ReaderWidthPreset = 'narrow' | 'standard' | 'wide'
export type ActivitySection = 'explorer' | 'search' | 'settings'
export type SearchScope = 'both' | 'filename' | 'regex'

const STATE_STORAGE_KEY = 'cop-workbench-state-v2'

interface PersistedState {
  openTabPaths: string[]
  lastActivePath: string | null
  explorerViewMode: ExplorerViewMode
  leftWidth: number
  rightWidth: number
  leftVisible: boolean
  rightVisible: boolean
  expandedChapters: string[]
  fontSize: number
  lineHeight: number
  fontFamily: ReaderFontFamily
  widthPreset: ReaderWidthPreset
  outlineOpen: boolean
}

export const DEFAULT_LEFT_WIDTH = 288
export const DEFAULT_RIGHT_WIDTH = 288
export const MIN_LEFT_WIDTH = 252
export const MIN_RIGHT_WIDTH = 224

export function normalizeRoutePath(raw: string): string {
  let p = raw.split('?')[0].split('#')[0]
  if (p.endsWith('.html')) {
    p = p.slice(0, -5)
  }
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1)
  }
  if (!p.startsWith('/')) {
    p = '/' + p
  }
  return p
}

// Singleton shared reactive state across workbench components
const openTabPaths = ref<string[]>([])
const lastActiveDocPath = ref<string | null>(null)
const explorerViewMode = ref<ExplorerViewMode>('tree')
const activitySection = ref<ActivitySection>('explorer')

const searchQuery = ref('')
const searchScope = ref<SearchScope>('both')
const searchIgnoreCase = ref(true)
const pendingParagraphJump = ref<{ path: string; paragraphIndex: number; nonce: number } | null>(null)

const leftWidth = ref(DEFAULT_LEFT_WIDTH)
const rightWidth = ref(DEFAULT_RIGHT_WIDTH)
const leftVisible = ref(true)
const rightVisible = ref(true)

const expandedChapters = ref<string[]>(novelManifest.chapters.map((c) => c.id))
const activeTileFolderId = ref<string | null>(null)
const outlineOpen = ref(true)

const fontSize = ref(18)
const lineHeight = ref(1.95)
const fontFamily = ref<ReaderFontFamily>('serif')
const widthPreset = ref<ReaderWidthPreset>('standard')

const scrollPositions = new Map<string, number>()
const readingProgress = ref(0)

let hydrated = false
let jumpNonce = 0

function persistState() {
  if (typeof localStorage === 'undefined' || !hydrated) return
  const payload: PersistedState = {
    openTabPaths: openTabPaths.value,
    lastActivePath: lastActiveDocPath.value,
    explorerViewMode: explorerViewMode.value,
    leftWidth: leftWidth.value,
    rightWidth: rightWidth.value,
    leftVisible: leftVisible.value,
    rightVisible: rightVisible.value,
    expandedChapters: expandedChapters.value,
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    fontFamily: fontFamily.value,
    widthPreset: widthPreset.value,
    outlineOpen: outlineOpen.value,
  }
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage quota errors
  }
}

function hydrateState() {
  if (hydrated || typeof localStorage === 'undefined') return
  hydrated = true
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (Array.isArray(parsed.openTabPaths)) {
      openTabPaths.value = parsed.openTabPaths.filter((p) => Boolean(allDocsByPath[p]))
    }
    if (typeof parsed.lastActivePath === 'string' && allDocsByPath[parsed.lastActivePath]) {
      lastActiveDocPath.value = parsed.lastActivePath
    }
    if (parsed.explorerViewMode === 'tree' || parsed.explorerViewMode === 'tiles') {
      explorerViewMode.value = parsed.explorerViewMode
    }
    if (typeof parsed.leftWidth === 'number' && parsed.leftWidth >= MIN_LEFT_WIDTH && parsed.leftWidth <= 520) {
      leftWidth.value = parsed.leftWidth
    }
    if (typeof parsed.rightWidth === 'number' && parsed.rightWidth >= MIN_RIGHT_WIDTH && parsed.rightWidth <= 520) {
      rightWidth.value = parsed.rightWidth
    }
    if (typeof parsed.leftVisible === 'boolean') {
      leftVisible.value = parsed.leftVisible
    }
    if (typeof parsed.rightVisible === 'boolean') {
      rightVisible.value = parsed.rightVisible
    }
    if (Array.isArray(parsed.expandedChapters)) {
      expandedChapters.value = parsed.expandedChapters
    }
    if (typeof parsed.fontSize === 'number' && parsed.fontSize >= 14 && parsed.fontSize <= 26) {
      fontSize.value = parsed.fontSize
    }
    if (typeof parsed.lineHeight === 'number' && parsed.lineHeight >= 1.5 && parsed.lineHeight <= 2.4) {
      lineHeight.value = parsed.lineHeight
    }
    if (parsed.fontFamily === 'serif' || parsed.fontFamily === 'sans') {
      fontFamily.value = parsed.fontFamily
    }
    if (
      parsed.widthPreset === 'narrow' ||
      parsed.widthPreset === 'standard' ||
      parsed.widthPreset === 'wide'
    ) {
      widthPreset.value = parsed.widthPreset
    }
    if (typeof parsed.outlineOpen === 'boolean') {
      outlineOpen.value = parsed.outlineOpen
    }
  } catch {
    // ignore corrupt storage
  }
}

export function useWorkbenchState() {
  const route = useRoute()
  const router = useRouter()

  const currentRoutePath = computed(() => normalizeRoutePath(route.path))

  const activeDoc = computed<NovelDocItem | null>(() => {
    return allDocsByPath[currentRoutePath.value] ?? null
  })

  const openTabs = computed<NovelDocItem[]>(() => {
    return openTabPaths.value
      .map((p) => allDocsByPath[p])
      .filter((item): item is NovelDocItem => Boolean(item))
  })

  const adjacentDocs = computed<{ prev: NovelDocItem | null; next: NovelDocItem | null }>(() => {
    const doc = activeDoc.value
    if (!doc) return { prev: null, next: null }
    if (doc.kind === 'scene') {
      const idx = novelManifest.readingSequence.indexOf(doc.path)
      if (idx === -1) return { prev: null, next: null }
      const prevPath = idx > 0 ? novelManifest.readingSequence[idx - 1] : null
      const nextPath =
        idx < novelManifest.readingSequence.length - 1 ? novelManifest.readingSequence[idx + 1] : null
      return {
        prev: prevPath ? allDocsByPath[prevPath] ?? null : null,
        next: nextPath ? allDocsByPath[nextPath] ?? null : null,
      }
    } else {
      const chIdx = novelManifest.chapters.findIndex((c) => c.id === doc.chapterId)
      const prevCh = chIdx > 0 ? novelManifest.chapters[chIdx - 1] : null
      const nextCh =
        chIdx >= 0 && chIdx < novelManifest.chapters.length - 1 ? novelManifest.chapters[chIdx + 1] : null
      return {
        prev: prevCh ? allDocsByPath[prevCh.fullPath] ?? null : null,
        next: nextCh ? allDocsByPath[nextCh.fullPath] ?? null : null,
      }
    }
  })

  async function ensureHydrated() {
    hydrateState()
    const path = currentRoutePath.value
    if (allDocsByPath[path]) {
      syncRouteToTabs(path)
    } else if (path === '/') {
      // No redundant Home page: auto-open last read doc or first scene on initial entry
      const fallback =
        (lastActiveDocPath.value && allDocsByPath[lastActiveDocPath.value] ? lastActiveDocPath.value : null) ??
        novelManifest.readingSequence[0] ??
        novelManifest.chapters[0]?.fullPath ??
        null
      if (fallback) {
        await openDoc(fallback)
      }
    }
  }

  function syncRouteToTabs(path: string) {
    const doc = allDocsByPath[path]
    if (!doc) return
    if (!openTabPaths.value.includes(path)) {
      openTabPaths.value = [...openTabPaths.value, path]
    }
    lastActiveDocPath.value = path
    if (!expandedChapters.value.includes(doc.chapterId)) {
      expandedChapters.value = [...expandedChapters.value, doc.chapterId]
    }
    persistState()
  }

  async function openDoc(path: string, paragraphIndex?: number) {
    const normalized = normalizeRoutePath(path)
    if (!allDocsByPath[normalized]) return
    if (!openTabPaths.value.includes(normalized)) {
      openTabPaths.value = [...openTabPaths.value, normalized]
    }
    lastActiveDocPath.value = normalized
    persistState()

    if (typeof paragraphIndex === 'number') {
      pendingParagraphJump.value = {
        path: normalized,
        paragraphIndex,
        nonce: ++jumpNonce,
      }
    }

    if (currentRoutePath.value !== normalized) {
      await router.go(withBase(normalized))
    }
  }

  async function closeTab(path: string) {
    const normalized = normalizeRoutePath(path)
    const idx = openTabPaths.value.indexOf(normalized)
    if (idx === -1) return

    const nextTabs = openTabPaths.value.filter((p) => p !== normalized)
    openTabPaths.value = nextTabs
    scrollPositions.delete(normalized)
    persistState()

    if (currentRoutePath.value === normalized) {
      if (nextTabs.length === 0) {
        await router.go(withBase('/'))
      } else {
        const nextIndex = Math.min(idx, nextTabs.length - 1)
        const target = nextTabs[nextIndex]
        lastActiveDocPath.value = target
        persistState()
        await router.go(withBase(target))
      }
    }
  }

  async function closeOtherTabs(keepPath: string) {
    const normalized = normalizeRoutePath(keepPath)
    openTabPaths.value = allDocsByPath[normalized] ? [normalized] : []
    persistState()
    if (currentRoutePath.value !== normalized && openTabPaths.value.length > 0) {
      await router.go(withBase(normalized))
    }
  }

  async function closeAllTabs() {
    openTabPaths.value = []
    scrollPositions.clear()
    persistState()
    if (currentRoutePath.value !== '/') {
      await router.go(withBase('/'))
    }
  }

  function toggleChapterExpanded(chapterId: string) {
    if (expandedChapters.value.includes(chapterId)) {
      expandedChapters.value = expandedChapters.value.filter((id) => id !== chapterId)
    } else {
      expandedChapters.value = [...expandedChapters.value, chapterId]
    }
    persistState()
  }

  function expandAllChapters() {
    expandedChapters.value = novelManifest.chapters.map((c) => c.id)
    persistState()
  }

  function collapseAllChapters() {
    expandedChapters.value = []
    persistState()
  }

  function setExplorerViewMode(mode: ExplorerViewMode) {
    explorerViewMode.value = mode
    persistState()
  }

  function setActivitySection(section: ActivitySection) {
    if (activitySection.value === section && leftVisible.value) {
      leftVisible.value = false
    } else {
      activitySection.value = section
      leftVisible.value = true
    }
    persistState()
  }

  function toggleLeftPanel() {
    leftVisible.value = !leftVisible.value
    persistState()
  }

  function toggleRightPanel() {
    rightVisible.value = !rightVisible.value
    persistState()
  }

  function setLeftWidth(w: number) {
    leftWidth.value = w
    persistState()
  }

  function setRightWidth(w: number) {
    rightWidth.value = w
    persistState()
  }

  function resetSplitLayout() {
    leftWidth.value = DEFAULT_LEFT_WIDTH
    rightWidth.value = DEFAULT_RIGHT_WIDTH
    leftVisible.value = true
    rightVisible.value = true
    persistState()
  }

  function adjustFontSize(delta: number) {
    const next = Math.max(14, Math.min(26, fontSize.value + delta))
    fontSize.value = next
    persistState()
  }

  function adjustLineHeight(delta: number) {
    const next = Math.round(Math.max(1.5, Math.min(2.4, lineHeight.value + delta)) * 100) / 100
    lineHeight.value = next
    persistState()
  }

  function setFontFamily(family: ReaderFontFamily) {
    fontFamily.value = family
    persistState()
  }

  function setWidthPreset(preset: ReaderWidthPreset) {
    widthPreset.value = preset
    persistState()
  }

  function toggleOutlineOpen() {
    outlineOpen.value = !outlineOpen.value
    persistState()
  }

  function saveScrollPosition(path: string, top: number) {
    scrollPositions.set(normalizeRoutePath(path), top)
  }

  function getScrollPosition(path: string): number {
    return scrollPositions.get(normalizeRoutePath(path)) ?? 0
  }

  watch(currentRoutePath, (newPath) => {
    if (hydrated && allDocsByPath[newPath]) {
      syncRouteToTabs(newPath)
    }
  })

  return {
    manifest: novelManifest,
    DEFAULT_LEFT_WIDTH,
    DEFAULT_RIGHT_WIDTH,
    MIN_LEFT_WIDTH,
    MIN_RIGHT_WIDTH,
    currentRoutePath,
    activeDoc,
    openTabs,
    openTabPaths,
    lastActiveDocPath,
    adjacentDocs,
    explorerViewMode,
    activitySection,
    searchQuery,
    searchScope,
    searchIgnoreCase,
    pendingParagraphJump,
    leftWidth,
    rightWidth,
    leftVisible,
    rightVisible,
    expandedChapters,
    activeTileFolderId,
    outlineOpen,
    fontSize,
    lineHeight,
    fontFamily,
    widthPreset,
    readingProgress,
    ensureHydrated,
    openDoc,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    toggleChapterExpanded,
    expandAllChapters,
    collapseAllChapters,
    setExplorerViewMode,
    setActivitySection,
    toggleLeftPanel,
    toggleRightPanel,
    setLeftWidth,
    setRightWidth,
    resetSplitLayout,
    adjustFontSize,
    adjustLineHeight,
    setFontFamily,
    setWidthPreset,
    toggleOutlineOpen,
    saveScrollPosition,
    getScrollPosition,
  }
}
