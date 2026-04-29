<script setup lang="ts">
// AboutMeSection — La historia, orientada a transformación
</script>

<template>
  <section id="historia" class="py-12 sm:py-18 px-6 relative overflow-hidden">
    <!-- Copper Glow Accent -->
    <div
      class="absolute left-[-10%] top-[40%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] mix-blend-screen -z-10 pointer-events-none"
    />

    <UContainer>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <!-- Visual Element -->
        <div class="lg:col-span-5 relative order-2 lg:order-1">
          <div
            class="aspect-square rounded-3xl bg-zinc-900 border border-zinc-800/80 p-8 flex flex-col justify-end relative z-10 overflow-hidden group shadow-2xl"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-zinc-900 to-zinc-950 opacity-60 group-hover:opacity-100 transition-opacity duration-700"
            />

            <UIcon
              name="i-lucide-rocket"
              class="w-40 h-40 text-zinc-800/50 absolute -right-6 -top-6 transform group-hover:translate-x-4 group-hover:-translate-y-4 group-hover:text-primary-900/40 transition-all duration-700"
            />

            <div class="relative z-20">
              <p class="text-4xl sm:text-5xl font-extrabold text-white mb-2">
                Impacto <span class="text-primary-500 font-medium tracking-tight">Medible</span>
              </p>
              <p class="text-zinc-400 font-medium text-lg">
                Sistemas más rápidos, procesos más inteligentes.
              </p>
            </div>
          </div>
        </div>

        <!-- Story Container -->
        <div class="lg:col-span-7 flex flex-col justify-center order-1 lg:order-2">
          <h2 class="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
            Sobre mí
          </h2>
          <h3 class="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-8">
            Transformo caos en arquitectura.
          </h3>

          <div class="space-y-6 text-zinc-300 text-lg sm:text-xl leading-relaxed font-light">
            <p>
              Soy un <strong>AI Engineer & Senior Full-Stack</strong> especializado en convertir
              sistemas fragmentados y procesos manuales en soluciones robustas, automatizadas y
              escalables. Mi stack principal gira alrededor de
              <strong>Node.js, NestJS, PostgreSQL y n8n</strong>.
            </p>
            <p>
              Me diferencio por pensar primero en el problema de negocio y después en la
              tecnología. Antes de escribir una línea de código, entiendo el flujo operativo,
              identifico los cuellos de botella reales y diseño la solución más eficiente para el
              contexto —no la más sofisticada.
            </p>
            <p>
              Si tu empresa tiene procesos que aún dependen de hojas de cálculo, tareas manuales
              o sistemas que no se hablan entre sí, ese es exactamente el tipo de problema que
              <strong>disfruto resolver.</strong>
            </p>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
