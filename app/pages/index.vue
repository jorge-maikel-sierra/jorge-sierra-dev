<script setup lang="ts">
useSeoMeta({
  title: 'Jorge Sierra — Software Engineer & Full-Stack Developer',
  description:
    'Portafolio profesional de Jorge Sierra. Ingeniería de software de alto impacto centrado en resolver problemas complejos de negocio con soluciones tecnológicas escalables.',
  ogTitle: 'Jorge Sierra — Software Engineer & Full-Stack Developer',
  ogDescription: 'Explora mi portafolio y descubre cómo transformo ideas en experiencias digitales de alto impacto.',
  ogType: 'profile',
  keywords: 'Jorge Sierra, Software Engineer, Full-Stack, Vue, Nuxt, TypeScript, Portafolio'
})
</script>

<template>
  <div class="flex flex-col gap-24 sm:gap-32 pb-24">
    <HeroSection />
    <ProjectsSection />
    <AboutMeSection />
    <ExperienceSection />
    <SkillsSection />
    <ContactSection />
  </div>
</template>
