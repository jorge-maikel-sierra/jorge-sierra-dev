// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/content', '@nuxtjs/sitemap', '@nuxtjs/robots'],
  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Used by @nuxtjs/sitemap and @nuxtjs/robots
  site: {
    // Nuxt automatically handles NUXT_PUBLIC_SITE_URL
    name: 'Jorge Sierra — Desarrollador Full-Stack'
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://jorge-sierra.dev',
      githubUsername: process.env.NUXT_PUBLIC_GITHUB_USERNAME || 'jorge-maikel-sierra',
      contactEmail: process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'jorgemaikelsierraamaya@gmail.com',
      linkedinUrl:
        process.env.NUXT_PUBLIC_LINKEDIN_URL || 'https://www.linkedin.com/in/jorgemaikelsierra/'
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
      stylistic: false
    }
  },

  sitemap: {}
})
