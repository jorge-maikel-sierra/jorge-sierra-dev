<script setup lang="ts">
// ContactSection — sección de contacto con CTA directo
// Simple y orientada a acción: email + redes principales
</script>

<template>
  <section id="contact" class="py-24 px-6 text-center">
    <div class="max-w-2xl mx-auto">
      <h2 class="text-3xl font-bold mb-4">
        Hablemos
      </h2>
      <p class="text-muted mb-10">
        ¿Tienes un proyecto en mente o quieres trabajar juntos? Escríbeme.
      </p>
      <div class="flex gap-4 justify-center flex-wrap">
        <UButton
          to="mailto:hola@jorge-sierra.dev"
          size="xl"
          icon="i-lucide-mail"
        >
          hola@jorge-sierra.dev
        </UButton>
        <UButton
          to="https://linkedin.com/in/jorgesierra"
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
