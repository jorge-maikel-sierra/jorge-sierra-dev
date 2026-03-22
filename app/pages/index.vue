<script setup lang="ts">
useSeoMeta({
  title: 'Jorge Sierra — Software Engineer',
  description:
    'Portafolio profesional de Jorge Sierra. Transformando ideas en experiencias de alto impacto.'
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
