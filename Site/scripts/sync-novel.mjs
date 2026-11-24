import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE_ROOT = path.resolve(__dirname, '..')
const DOCS_ROOT = path.resolve(SITE_ROOT, '..', 'Docs')
const CHAPTERS_OUT_DIR = path.join(SITE_ROOT, 'src', 'chapters')
const MANIFEST_OUT_FILE = path.join(SITE_ROOT, 'src', '.vitepress', 'data', 'novel-manifest.ts')
const SEARCH_INDEX_OUT_FILE = path.join(SITE_ROOT, 'src', '.vitepress', 'data', 'novel-search-index.ts')

function countWords(text) {
  const cleaned = text
    .replace(/^#+\s.*$/gm, '')
    .replace(/[`*_~>#-]/g, '')
    .replace(/\s+/g, '')
  return cleaned.length
}

function makeExcerpt(text, maxLen = 78) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('>') && l !== '……' && l !== '---')
  const joined = lines.slice(0, 3).join(' ')
  if (joined.length <= maxLen) return joined
  return joined.slice(0, maxLen).trimEnd() + '…'
}

function extractParagraphs(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))
}

function sanitizeForVitePress(md) {
  return md.replace(/\{\{/g, '&#123;&#123;').replace(/\}\}/g, '&#125;&#125;')
}

function escapeYaml(str) {
  return JSON.stringify(str)
}

function parseVersionNum(name) {
  const m = /^v(\d+)$/i.exec(name)
  return m ? Number.parseInt(m[1], 10) : -1
}

function parseChapterNum(name) {
  const m = /^第(\d+)章/.exec(name)
  return m ? Number.parseInt(m[1], 10) : -1
}

function parseSceneOrder(filename) {
  const m = /^幕(\d+)/.exec(filename)
  return m ? Number.parseInt(m[1], 10) : 9999
}

function findFullChapterSource(versionDir, chapterTitle) {
  const files = fs
    .readdirSync(versionDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => d.name)
    .filter((name) => !name.startsWith('_') && !name.includes('old'))

  if (files.includes('全文.md')) {
    return fs.readFileSync(path.join(versionDir, '全文.md'), 'utf-8')
  }

  const combinedFile = files.find((name) => /^no\.\d+\.v\d+\.md$/i.test(name))
  if (combinedFile) {
    return fs.readFileSync(path.join(versionDir, combinedFile), 'utf-8')
  }

  const sceneFiles = files
    .filter((name) => /^幕\d+/.test(name))
    .sort((a, b) => parseSceneOrder(a) - parseSceneOrder(b))

  if (sceneFiles.length > 0) {
    const parts = sceneFiles.map((f) => fs.readFileSync(path.join(versionDir, f), 'utf-8').trim())
    return `# ${chapterTitle}\n\n${parts.join('\n\n')}\n`
  }

  return null
}

function splitSections(rawMarkdown) {
  const normalized = rawMarkdown.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const sections = []
  let currentTitle = null
  let currentLines = []

  for (const line of lines) {
    const h2Match = /^##\s+(.+?)\s*$/.exec(line)
    if (h2Match) {
      if (currentTitle !== null) {
        sections.push({
          title: currentTitle,
          content: currentLines.join('\n').trim(),
        })
      }
      currentTitle = h2Match[1]
      currentLines = []
    } else if (currentTitle !== null) {
      currentLines.push(line)
    }
  }

  if (currentTitle !== null) {
    sections.push({
      title: currentTitle,
      content: currentLines.join('\n').trim(),
    })
  }

  return sections
}

function buildManifest() {
  if (!fs.existsSync(DOCS_ROOT)) {
    throw new Error(`Docs directory not found: ${DOCS_ROOT}`)
  }

  fs.rmSync(CHAPTERS_OUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(CHAPTERS_OUT_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(MANIFEST_OUT_FILE), { recursive: true })

  const chapterDirs = fs
    .readdirSync(DOCS_ROOT, { withFileTypes: true })
    .filter((d) => {
      if (!d.isDirectory()) return false
      if (d.name === '已废弃文件') return false
      if (d.name.startsWith('（读者不可见）') || d.name.startsWith('(读者不可见)')) return false
      return parseChapterNum(d.name) >= 0
    })
    .sort((a, b) => parseChapterNum(a.name) - parseChapterNum(b.name))

  const chapters = []
  const flatItems = []
  const searchDocs = []

  for (const chDir of chapterDirs) {
    const chapterNum = parseChapterNum(chDir.name)
    const chapterId = `ch${chapterNum}`
    const chapterTitle = chDir.name
    const fullChapterDirPath = path.join(DOCS_ROOT, chDir.name)

    const versionDirs = fs
      .readdirSync(fullChapterDirPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && parseVersionNum(d.name) >= 0)
      .sort((a, b) => parseVersionNum(b.name) - parseVersionNum(a.name))

    if (versionDirs.length === 0) continue

    const latestVersion = versionDirs[0].name
    const latestVersionPath = path.join(fullChapterDirPath, latestVersion)
    const rawContent = findFullChapterSource(latestVersionPath, chapterTitle)
    if (!rawContent) continue

    const sections = splitSections(rawContent)
    const outChapterDir = path.join(CHAPTERS_OUT_DIR, chapterId)
    fs.mkdirSync(outChapterDir, { recursive: true })

    const totalWordCount = countWords(rawContent)
    const chapterItems = []

    // 1. Full chapter document
    const fullDocId = `${chapterId}/full`
    const fullDocPath = `/chapters/${chapterId}/full`
    const fullOutline = sections.map((sec, idx) => ({
      id: `scene-${idx + 1}`,
      title: sec.title,
      level: 2,
    }))

    const fullBodyWithAnchors = sections
      .map((sec, idx) => `## ${sec.title} {#scene-${idx + 1}}\n\n${sanitizeForVitePress(sec.content)}`)
      .join('\n\n')

    const fullMd = [
      '---',
      `title: ${escapeYaml(`${chapterTitle} · 全文`)}`,
      `chapterId: ${escapeYaml(chapterId)}`,
      `chapterTitle: ${escapeYaml(chapterTitle)}`,
      `version: ${escapeYaml(latestVersion)}`,
      `kind: "full"`,
      `wordCount: ${totalWordCount}`,
      '---',
      '',
      `# ${chapterTitle}`,
      '',
      fullBodyWithAnchors || sanitizeForVitePress(rawContent),
      '',
    ].join('\n')

    fs.writeFileSync(path.join(outChapterDir, 'full.md'), fullMd, 'utf-8')

    const fullItem = {
      id: fullDocId,
      path: fullDocPath,
      chapterId,
      chapterNum,
      chapterTitle,
      title: `${chapterTitle} · 全文`,
      shortTitle: '全文合集',
      fileName: `${chapterTitle}_全文.md`,
      version: latestVersion,
      kind: 'full',
      sceneIndex: 0,
      wordCount: totalWordCount,
      readingMinutes: Math.max(1, Math.round(totalWordCount / 500)),
      excerpt: makeExcerpt(sections[0]?.content ?? rawContent),
      outline: fullOutline,
    }
    chapterItems.push(fullItem)

    // 2. Individual scene documents
    sections.forEach((sec, idx) => {
      const sceneNum = idx + 1
      const slug = `s${sceneNum}`
      const docId = `${chapterId}/${slug}`
      const docPath = `/chapters/${chapterId}/${slug}`
      const wc = countWords(sec.content)
      const sceneMd = [
        '---',
        `title: ${escapeYaml(sec.title)}`,
        `chapterId: ${escapeYaml(chapterId)}`,
        `chapterTitle: ${escapeYaml(chapterTitle)}`,
        `version: ${escapeYaml(latestVersion)}`,
        `kind: "scene"`,
        `sceneIndex: ${sceneNum}`,
        `wordCount: ${wc}`,
        '---',
        '',
        `# ${sec.title}`,
        '',
        sanitizeForVitePress(sec.content),
        '',
      ].join('\n')

      fs.writeFileSync(path.join(outChapterDir, `${slug}.md`), sceneMd, 'utf-8')

      const sceneItem = {
        id: docId,
        path: docPath,
        chapterId,
        chapterNum,
        chapterTitle,
        title: `${chapterTitle} · ${sec.title}`,
        shortTitle: sec.title,
        fileName: `${sec.title}.md`,
        version: latestVersion,
        kind: 'scene',
        sceneIndex: sceneNum,
        wordCount: wc,
        readingMinutes: Math.max(1, Math.round(wc / 500)),
        excerpt: makeExcerpt(sec.content),
        outline: [{ id: 'top', title: sec.title, level: 1 }],
      }
      chapterItems.push(sceneItem)
      flatItems.push(sceneItem)

      // Add scene paragraphs to full-text regex search index (avoid duplicating full.md hits)
      searchDocs.push({
        id: docId,
        path: docPath,
        chapterId,
        chapterTitle,
        shortTitle: sec.title,
        fileName: `${sec.title}.md`,
        version: latestVersion,
        paragraphs: extractParagraphs(sec.content),
      })
    })

    chapters.push({
      id: chapterId,
      chapterNum,
      title: chapterTitle,
      version: latestVersion,
      wordCount: totalWordCount,
      readingMinutes: Math.max(1, Math.round(totalWordCount / 500)),
      sceneCount: sections.length,
      fullPath: fullDocPath,
      items: chapterItems,
    })
  }

  const totalWords = chapters.reduce((acc, ch) => acc + ch.wordCount, 0)
  const totalScenes = chapters.reduce((acc, ch) => acc + ch.sceneCount, 0)

  const manifestObj = {
    bookTitle: 'CatsOnPlains',
    bookSubtitle: '在线小说阅读器',
    generatedAt: new Date().toISOString(),
    totalWords,
    totalChapters: chapters.length,
    totalScenes,
    chapters,
    readingSequence: flatItems.map((item) => item.path),
  }

  const tsContent = `// AUTO-GENERATED by scripts/sync-novel.mjs — do not edit manually.
export interface OutlineItem {
  id: string
  title: string
  level: number
}

export interface NovelDocItem {
  id: string
  path: string
  chapterId: string
  chapterNum: number
  chapterTitle: string
  title: string
  shortTitle: string
  fileName: string
  version: string
  kind: 'full' | 'scene'
  sceneIndex: number
  wordCount: number
  readingMinutes: number
  excerpt: string
  outline: OutlineItem[]
}

export interface NovelChapter {
  id: string
  chapterNum: number
  title: string
  version: string
  wordCount: number
  readingMinutes: number
  sceneCount: number
  fullPath: string
  items: NovelDocItem[]
}

export interface NovelManifest {
  bookTitle: string
  bookSubtitle: string
  generatedAt: string
  totalWords: number
  totalChapters: number
  totalScenes: number
  chapters: NovelChapter[]
  readingSequence: string[]
}

export const novelManifest: NovelManifest = ${JSON.stringify(manifestObj, null, 2)}

export const allDocsByPath: Record<string, NovelDocItem> = Object.fromEntries(
  novelManifest.chapters.flatMap((ch) => ch.items.map((item) => [item.path, item]))
)
`

  const searchIndexContent = `// AUTO-GENERATED by scripts/sync-novel.mjs — do not edit manually.
export interface SearchableDoc {
  id: string
  path: string
  chapterId: string
  chapterTitle: string
  shortTitle: string
  fileName: string
  version: string
  paragraphs: string[]
}

export const novelSearchIndex: SearchableDoc[] = ${JSON.stringify(searchDocs)}
`

  fs.writeFileSync(MANIFEST_OUT_FILE, tsContent, 'utf-8')
  fs.writeFileSync(SEARCH_INDEX_OUT_FILE, searchIndexContent, 'utf-8')
  console.log(
    `[sync-novel] Synced ${chapters.length} chapters (${totalScenes} scenes, ${totalWords} chars) + full-text index`
  )
}

buildManifest()
