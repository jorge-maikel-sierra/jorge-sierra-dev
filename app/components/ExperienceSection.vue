<script setup lang="ts">
const experiences = [
  {
    role: 'AI Engineer — Automatización de Procesos',
    company: 'Proyecto Empresarial (Confidencial)',
    period: '2024 - Presente',
    description:
      'Diseño e implementación de flujos de automatización con n8n e IA generativa. Eliminé procesos manuales críticos logrando trazabilidad del 100% en operaciones antes opacas. Integré sistemas heterogéneos que antes operaban en silos, reduciendo errores operativos en un 20% en los primeros 60 días.'
  },
  {
    role: 'Senior Full-Stack Engineer',
    company: 'Empresa de Software / Consultoría',
    period: '2022 - 2024',
    description:
      'Lideré el rediseño de módulos administrativos críticos, migrando de arquitecturas monolíticas frágiles a APIs REST con NestJS y PostgreSQL. Mejoré los tiempos de respuesta del sistema en un 60% y reduje los ciclos de despliegue de días a horas mediante CI/CD con GitHub Actions.'
  },
  {
    role: 'Full-Stack Developer — Backend & Frontend',
    company: 'Agencia Digital / Freelance',
    period: '2020 - 2022',
    description:
      'Desarrollo end-to-end de plataformas de gestión, e-commerce y sistemas internos para clientes de distintos sectores. Implementé automatizaciones clave que redujeron el tiempo de procesamiento de pedidos en un 40%, liberando capacidad operativa para el equipo.'
  },
  {
    role: 'Frontend Developer',
    company: 'Startup Tecnológica',
    period: '2018 - 2020',
    description:
      'Construcción de interfaces administrativas y dashboards de analítica con Vue.js. Optimicé el rendimiento de carga logrando una reducción del 35% en el tiempo de interacción inicial, contribuyendo directamente a mejorar la retención de usuarios activos.'
  }
]
</script>

<template>
  <section
    id="experiencia"
    class="py-12 sm:py-18 px-6 border-t border-zinc-900/50 relative overflow-hidden"
  >
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
