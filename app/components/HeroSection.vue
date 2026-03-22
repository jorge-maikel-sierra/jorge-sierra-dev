<script setup lang="ts">
// HeroSection — primera sección visible del portafolio
// Orientada a conversión: CTA claro, propuesta de valor directa
</script>

<template>
  <section class="relative py-16 md:py-24 lg:py-32 px-6 overflow-hidden">
    <div class="max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <!-- Columna Izquierda: Texto y CTAs -->
        <div class="text-left space-y-8 max-w-2xl">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Transformo ideas complejas en productos digitales de
            <span class="text-primary-500">alto rendimiento.</span>
          </h1>

          <p class="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Hola, soy Jorge Sierra. Desarrollador Full-Stack especializado en el ecosistema Nuxt y
            Vue. Ayudo a startups y empresas modernas a escalar sus soluciones con código sólido y
            una experiencia de usuario impecable.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <UButton to="#projects" size="xl" icon="i-lucide-briefcase" class="px-8 justify-center">
              Ver proyectos
            </UButton>
            <UButton
              to="#contact"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-lucide-mail"
              class="px-8 justify-center"
            >
              Contactar ahora
            </UButton>
          </div>
        </div>

        <!-- Columna Derecha: Imagen Profesional -->
        <div class="relative group mx-auto lg:ml-auto">
          <div
            class="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"
          ></div>
          <div
            class="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
          >
            <img
              src="/jorge-hero.jpg"
              alt="Jorge Sierra - Desarrollador Full-Stack"
              class="w-full h-full object-cover grayscale-0 hover:grayscale-0 transition duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
