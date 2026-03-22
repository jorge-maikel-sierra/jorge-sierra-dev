<script setup lang="ts">
const experiences = [
  {
    role: 'Senior Software Engineer',
    company: 'Empresa Confidencial',
    period: '2022 - Presente',
    description:
      'Liderazgo técnico en el diseño y arquitectura de soluciones escalables. Migración de monolitos a ecosistemas modernos, mejorando los tiempos de respuesta y la experiencia de usuario.'
  },
  {
    role: 'Desarrollador Full-Stack',
    company: 'Agencia Digital / Freelance',
    period: '2019 - 2022',
    description:
      'Desarrollo de proyectos end-to-end, incluyendo plataformas de reservas, e-commerce y sistemas internos. Implementación de APIs robustas y automatización de procesos clave.'
  },
  {
    role: 'Frontend Developer',
    company: 'Startup Tecnológica',
    period: '2018 - 2019',
    description:
      'Construcción de interfaces de usuario interactivas y dinámicas, enfocadas en la retención del cliente y la performance.'
  }
]
</script>

<template>
  <section id="experiencia" class="py-24 px-6 border-t border-zinc-900/50 relative overflow-hidden">
    <UContainer>
      <div class="text-center mb-20 max-w-2xl mx-auto">
        <h2 class="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
          Trayectoria
        </h2>
        <h3 class="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Experiencia Profesional
        </h3>
      </div>

      <div class="max-w-4xl mx-auto relative">
        <div class="space-y-16 lg:space-y-24">
          <div v-for="(exp, index) in experiences" :key="index" class="relative">
            <div class="md:grid md:grid-cols-12 gap-8 items-start group">
              <!-- Period -->
              <div class="md:col-span-3 text-left md:text-right mb-4 md:mb-0 mt-1">
                <span
                  class="text-sm font-bold text-primary-500 tracking-wider inline-block px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors"
                  >{{ exp.period }}</span
                >
              </div>

              <!-- Content -->
              <div
                class="md:col-span-9 relative border-l border-zinc-800 pl-6 md:pl-10 pb-2 group-hover:border-zinc-700 transition-colors"
              >
                <!-- Dot glowing on hover -->
                <div
                  class="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-zinc-900 border-2 border-primary-500 shadow-[0_0_10px_rgba(248,96,20,0)] group-hover:shadow-[0_0_15px_rgba(248,96,20,0.6)] group-hover:bg-primary-500 transition-all duration-300"
                />

                <h4 class="text-2xl font-bold text-white mb-1 tracking-tight">
                  {{ exp.role }}
                </h4>
                <p class="text-zinc-400 font-medium mb-5 text-lg">
                  {{ exp.company }}
                </p>
                <p class="text-zinc-300 font-light leading-relaxed text-lg">
                  {{ exp.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
