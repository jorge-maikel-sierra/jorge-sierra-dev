// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/content', '@nuxtjs/sitemap', '@nuxtjs/robots'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Used by @nuxtjs/sitemap and @nuxtjs/robots
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://jorge-sierra.dev',
    name: 'Jorge Sierra — Desarrollador Full-Stack',
    description: 'Ingeniería de software de alto impacto. Transformando problemas complejos en experiencias digitales memorables.',
    defaultLocale: 'es'
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Jorge Sierra — Desarrollador Full-Stack',
      meta: [
        { name: 'author', content: 'Jorge Sierra' },
        { name: 'keywords', content: 'Jorge Sierra, Software Engineer, Full-Stack Developer, Vue.js, Nuxt.js, TypeScript, Desarrollo Web, Colombia' },
        { name: 'theme-color', content: '#09090b' },
        { name: 'robots', content: 'index, follow' }
      ]
    }
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

  sitemap: {
    strictNuxtContentAds: true
  },

  robots: {
    disallow: ['/admin', '/_nuxt']
  }
})
