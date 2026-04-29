<script setup lang="ts">
// HeroSection — Impactante y profesional
</script>

<template>
  <section
    class="relative min-h-[60vh] sm:min-h-[90vh] flex items-start sm:items-center pt-10 sm:pt-16 pb-10 overflow-hidden"
  >
    <!-- Background Gradient & Image -->
    <div class="absolute inset-0 z-0">
      <!-- Gradiente horizontal: menos opaco en mobile para que la imagen sea visible -->

      <!-- Imagen del hero: en mobile se muestra en flujo (arriba), en desktop se usa la absoluta -->
      <img
        src="/hero.png"
        alt="Jorge Sierra"
        class="hidden sm:block absolute right-0 bottom-0 h-[50vh] sm:h-[70vh] md:h-[90vh] object-contain opacity-80 sm:opacity-90 mix-blend-lighten object-bottom"
      />
    </div>

    <!-- Capa decorativa móvil: imagen como fondo arriba (no divide pantalla en columnas) -->
    <div class="block sm:hidden absolute left-0 right-0 top-0 h-[46vh] z-0 overflow-hidden">
      <img
        src="/hero.png"
        alt="Jorge Sierra"
        class="w-full h-full object-cover object-top opacity-95"
      />
    </div>

    <UContainer class="relative z-20 w-full pt-[36vh] sm:pt-0">
      <!-- max-w limita el texto para que no compita con la imagen en desktop -->
      <div class="max-w-[90%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <!-- Badge de disponibilidad -->
        <div
          class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 mb-4 sm:mb-6 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-300 shadow-xl backdrop-blur-md"
        >
          <span class="relative flex h-2 w-2 shrink-0">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"
            />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
          </span>
          Disponible para nuevos retos
        </div>

        <h1
          class="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-5"
        >
          Automatizo procesos.<br />
          <span class="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-primary-600"
            >Escalo negocios.</span
          >
        </h1>

        <p
          class="text-sm sm:text-base md:text-xl text-zinc-400 mb-6 sm:mb-8 max-w-sm sm:max-w-lg md:max-w-2xl leading-relaxed font-light"
        >
          AI Engineer & Senior Full-Stack. Transformo sistemas caóticos en arquitecturas modernas,
          rápidas y resilientes con foco en impacto real sobre el negocio.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <UButton
            to="#contacto"
            size="lg"
            color="primary"
            class="w-full sm:w-auto font-semibold px-6 sm:px-8 shadow-[0_0_30px_rgba(248,96,20,0.25)] hover:shadow-[0_0_40px_rgba(248,96,20,0.4)] transition-shadow duration-300 justify-center"
          >
            Agendar consulta
          </UButton>
          <UButton
            to="#proyectos"
            size="lg"
            color="neutral"
            variant="subtle"
            class="w-full sm:w-auto font-medium px-6 sm:px-8 bg-white/5 hover:bg-white/10 text-white transition-colors justify-center"
          >
            Ver mis proyectos
            <UIcon name="i-lucide-arrow-right" class="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </UButton>
        </div>
      </div>
    </UContainer>
  </section>
</template>
