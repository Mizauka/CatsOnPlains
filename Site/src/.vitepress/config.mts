import { defineConfig } from 'vitepress'

function resolveBase(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const raw = env?.VITEPRESS_BASE?.trim()
  if (!raw || raw === '/') return '/'
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

export default defineConfig({
  base: resolveBase(),
  title: 'CatsOnPlains',
  description: 'CatsOnPlains 在线小说阅读器',
  lang: 'zh-CN',
  cleanUrls: true,
  appearance: false,
  head: [
    [
      'script',
      {},
      `(() => {
        try {
          const vp = document.querySelector('meta[name="viewport"]');
          const content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
          if (vp) {
            vp.setAttribute('content', content);
          } else {
            const m = document.createElement('meta');
            m.name = 'viewport';
            m.content = content;
            document.head.appendChild(m);
          }
          const pref = localStorage.getItem('cop-theme-preference') || 'system';
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const resolved = pref === 'dark' || pref === 'light' ? pref : (prefersDark ? 'dark' : 'light');
          document.documentElement.dataset.theme = resolved;
          const accent = localStorage.getItem('cop-accent-scheme');
          document.documentElement.dataset.accent = accent === 'swapped' ? 'swapped' : 'default';
        } catch {}
      })();`,
    ],
  ],
  transformHead({ head }) {
    const content =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
    const existing = head.find((item) => item[0] === 'meta' && item[1]?.name === 'viewport')
    if (existing) {
      existing[1].content = content
    } else {
      head.push(['meta', { name: 'viewport', content }])
    }
  },
  markdown: {
    headers: {
      level: [1, 2, 3],
    },
  },
  vite: {
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  },
})
