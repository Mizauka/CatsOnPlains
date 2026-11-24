import { defineConfig } from 'vitepress'

export default defineConfig({
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
  markdown: {
    headers: {
      level: [1, 2, 3],
    },
  },
  vite: {
    server: {
      port: 5173,
      strictPort: false,
    },
  },
})
