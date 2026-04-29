<script setup lang="ts">
// ServicesSection — servicios orientados a impacto de negocio
// Orientada a conversión: cada servicio habla del problema que resuelve

interface Service {
  icon: string
  title: string
  description: string
  cta?: string
  ctaUrl?: string
}

const services: Service[] = [
  {
    icon: 'i-lucide-cpu',
    title: 'Automatización con IA & n8n',
    description:
      'Diseño e implementación de flujos de trabajo inteligentes con n8n e IA. Elimino tareas manuales repetitivas y conecto sistemas aislados para que tu operación escale sin fricción.',
    cta: 'Automatizar mi proceso',
    ctaUrl: '#contacto'
  },
  {
    icon: 'i-lucide-layers',
    title: 'APIs & Backend Escalable',
    description:
      'Desarrollo de APIs REST robustas con NestJS y Node.js sobre PostgreSQL. Arquitecturas diseñadas para crecer sin reescribir todo cuando llegue la demanda.',
    cta: 'Cotizar mi API',
    ctaUrl: '#contacto'
  },
  {
    icon: 'i-lucide-network',
    title: 'Arquitectura de Sistemas',
    description:
      'Auditoría y rediseño de sistemas frágiles o desordenados. Defino la estrategia tecnológica adecuada para tu etapa de crecimiento, sin sobreingeniería ni deuda técnica.',
    cta: 'Revisar mi sistema',
    ctaUrl: '#contacto'
  },
  {
    icon: 'i-lucide-gauge',
    title: 'Optimización de Rendimiento',
    description:
      'Diagnóstico y resolución de cuellos de botella en APIs, bases de datos y frontends. Reducción de tiempos de respuesta y costos de infraestructura con cambios medibles.',
    cta: 'Optimizar mi stack',
    ctaUrl: '#contacto'
  }
]
</script>

<template>
  <section id="servicios" class="py-10 sm:py-18 px-6 bg-muted/40">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-8 sm:mb-14 max-w-2xl mx-auto">
        <h2 class="text-sm font-semibold tracking-widest uppercase text-primary mb-3">Servicios</h2>
        <h3 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Soluciones que mueven métricas.
        </h3>
        <p class="text-zinc-400 text-lg leading-relaxed">
          No vendo horas de código. Resuelvo problemas de negocio concretos con tecnología de alta
          precisión.
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ServiceCard v-for="service in services" :key="service.title" v-bind="service" />
      </div>
    </div>
  </section>
</template>
