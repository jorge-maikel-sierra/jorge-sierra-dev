<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'es'
  }
})

const config = useRuntimeConfig()
const title = 'Jorge Sierra — Desarrollador Full-Stack'
const description =
  'Portafolio profesional de Jorge Sierra. Desarrollo de aplicaciones web modernas con Nuxt, Vue, TypeScript y más.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: config.public.siteUrl,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <!-- Configured with glassmorphism for better depth -->
    <UHeader class="border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50">
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <!-- Logo with mix-blend-screen automatically renders the `#000` background transparent against the dark UI -->
          <img
            src="/logo_original.png"
            alt="JS Logo"
            class="h-10 mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <span class="font-bold text-lg tracking-wider text-zinc-100 hidden sm:inline-block"
            >JORGE SIERRA</span
          >
        </NuxtLink>
      </template>

      <template #right>
        <!-- The user prefers dark mode naturally given the images, we hide or keep the color mode button,
             but we will assume dark mode is default for this premium look -->
        <UColorModeButton aria-label="Cambiar tema" class="hidden" />

        <UButton
          :to="`https://github.com/${config.public.githubUsername}`"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain class="bg-zinc-950 text-zinc-50 min-h-screen">
      <NuxtPage />
    </UMain>

    <UFooter class="border-t border-zinc-900 bg-zinc-950 mt-20">
      <template #left>
        <p class="text-sm text-zinc-400">
          © {{ new Date().getFullYear() }} Jorge Sierra. All rights reserved.
        </p>
      </template>

      <template #right>
        <div class="flex gap-4 items-center">
          <UButton
            :to="`https://github.com/${config.public.githubUsername}`"
            target="_blank"
            icon="i-simple-icons-github"
            aria-label="GitHub"
            color="neutral"
            variant="ghost"
          />
          <UButton
            :to="config.public.linkedinUrl"
            target="_blank"
            icon="i-simple-icons-linkedin"
            aria-label="LinkedIn"
            color="neutral"
            variant="ghost"
          />
        </div>
      </template>
    </UFooter>
  </UApp>
</template>
