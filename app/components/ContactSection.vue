<script setup lang="ts">
// ContactSection — sección de contacto con CTA directo
// Simple y orientada a acción: email + redes principales
const config = useRuntimeConfig()
</script>

<template>
  <section id="contact" class="py-24 px-6 text-center">
    <div class="max-w-2xl mx-auto">
      <h2 class="text-3xl font-bold mb-4">Hablemos</h2>
      <p class="text-muted mb-10">
        ¿Tienes un proyecto en mente o quieres trabajar juntos? Escríbeme.
      </p>
      <div class="flex gap-4 justify-center flex-wrap">
        <UButton :to="`mailto:${config.public.contactEmail}`" size="xl" icon="i-lucide-mail">
          {{ config.public.contactEmail }}
        </UButton>
        <UButton
          :to="config.public.linkedinUrl"
          target="_blank"
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-simple-icons-linkedin"
        >
          LinkedIn
        </UButton>
      </div>
    </div>
  </section>
</template>
