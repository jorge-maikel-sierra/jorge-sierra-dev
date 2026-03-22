// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/content', '@nuxtjs/sitemap', '@nuxtjs/robots'],
  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Used by @nuxtjs/sitemap and @nuxtjs/robots
  site: {
    url: 'https://jorge-sierra.dev',
    name: 'Jorge Sierra — Desarrollador Full-Stack'
  },

  content: {
    highlight: {
      theme: 'github-dark'
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/projects/**': { prerender: true },
    '/blog/**': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  vite: {
    optimizeDeps: {
      include: []
    }
  },

  typescript: {
    strict: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  sitemap: {}
})
