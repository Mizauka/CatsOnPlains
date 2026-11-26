import type { Theme } from 'vitepress'
import '@valance-ui/vue/tokens.css'
import '@valance-ui/vue/base.css'
import '@valance-ui/vue/workbench.css'
import '@valance-ui/vue/prose.css'
import '@valance-ui/vue/style.css'
import './styles/tokens.css'
import Layout from './Layout.vue'

export default {
  Layout,
} satisfies Theme
