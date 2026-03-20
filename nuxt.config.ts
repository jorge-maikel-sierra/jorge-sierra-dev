// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true
  },

  // Used by @nuxtjs/sitemap and @nuxtjs/robots
  site: {
    url: 'https://jorge-sierra.dev',
    name: 'Jorge Sierra — Desarrollador Full-Stack'
  },

  routeRules: {
    '/': { prerender: true },
    '/projects/**': { prerender: true },
    '/blog/**': { prerender: true }
  },

  content: {
    highlight: {
      theme: 'github-dark'
    }
  },

  sitemap: {},

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
