<script setup lang="ts">
// HeroSection — Impactante y profesional
</script>

<template>
  <section
    class="relative min-h-[90vh] flex items-center pt-6 sm:pt-18 overflow-hidden border-b border-zinc-900/50"
  >
    <!-- Background Gradient & Image -->
    <div class="absolute inset-0 z-0">
      <div
        class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 md:via-zinc-950/60 to-transparent z-10"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50 z-10"
      />

      <!-- We use mix-blend-lighten or screen to seamlessly drop the dark background of the image -->
      <img
        src="/hero.png"
        alt="Jorge Sierra"
        class="absolute right-0 bottom-0 h-[70vh] md:h-[90vh] object-contain opacity-90 mix-blend-lighten object-bottom"
      />

      <!-- A subtle copper glow behind the image -->
      <div
        class="absolute right-[5%] top-[20%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary-600/20 rounded-full blur-[100px] mix-blend-screen -z-10"
      />
    </div>

    <UContainer class="relative z-20 w-full">
      <div class="max-w-3xl">
        <div
          class="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm font-medium text-zinc-300 shadow-xl backdrop-blur-md"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"
            />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
          </span>
          Disponible para nuevos retos
        </div>

        <h1
          class="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.1] mb-6"
        >
          Automatizo procesos.<br />
          <span
            class="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600"
            >Escalo negocios.</span
          >
        </h1>

        <p class="text-lg md:text-2xl text-zinc-400 mb-10 max-w-2xl leading-relaxed font-light">
          AI Engineer & Senior Full-Stack. Transformo sistemas caóticos en arquitecturas modernas,
          rápidas y resilientes con foco en impacto real sobre el negocio.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 items-center">
          <UButton
            to="#contacto"
            size="xl"
            color="primary"
            class="w-full sm:w-auto font-semibold px-8 py-3.5 shadow-[0_0_30px_rgba(248,96,20,0.25)] hover:shadow-[0_0_40px_rgba(248,96,20,0.4)] transition-shadow duration-300"
          >
            Agendar consulta
          </UButton>
          <UButton
            to="#proyectos"
            size="xl"
            color="neutral"
            variant="subtle"
            class="w-full sm:w-auto font-medium px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            Ver mis proyectos <UIcon name="i-lucide-arrow-right" class="ml-2 w-5 h-5" />
          </UButton>
        </div>
      </div>
    </UContainer>
  </section>
</template>
