<script setup lang="ts">
// HeroSection — primera sección visible del portafolio
// Orientada a conversión: CTA claro, propuesta de valor directa
</script>

<template>
  <section class="py-24 px-6 text-center">
    <h1 class="text-5xl font-bold tracking-tight">
      Hola, soy Jorge Sierra
    </h1>
    <p class="mt-6 text-xl text-muted max-w-2xl mx-auto">
      Desarrollador Full-Stack especializado en aplicaciones web modernas con
      Nuxt, Vue y TypeScript.
    </p>
    <div class="mt-10 flex gap-4 justify-center flex-wrap">
      <UButton
        to="#projects"
        size="xl"
        trailing-icon="i-lucide-arrow-down"
      >
        Ver proyectos
      </UButton>
      <UButton
        to="#contact"
        size="xl"
        color="neutral"
        variant="subtle"
      >
        Contactar
      </UButton>
    </div>
  </section>
</template>
