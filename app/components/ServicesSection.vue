<script setup lang="ts">
// ServicesSection — servicios ofrecidos con CTA por servicio
// Orientada a conversión: cada servicio tiene acción clara

interface Service {
  icon: string
  title: string
  description: string
  cta?: string
  ctaUrl?: string
}

const services: Service[] = [
  {
    icon: 'i-lucide-code-2',
    title: 'Desarrollo Web Full-Stack',
    description:
      'Aplicaciones web completas desde el diseño hasta el despliegue, con Nuxt, Vue y APIs robustas.',
    cta: 'Más info',
    ctaUrl: '#contact'
  },
  {
    icon: 'i-lucide-zap',
    title: 'Performance & Optimización',
    description: 'Auditorías de rendimiento, SSR/SSG, Core Web Vitals y optimización de carga.',
    cta: 'Cotizar',
    ctaUrl: '#contact'
  },
  {
    icon: 'i-lucide-blocks',
    title: 'Consultoría Técnica',
    description: 'Asesoría en arquitectura de proyectos, elección de stack y revisión de código.',
    cta: 'Agendar llamada',
    ctaUrl: '#contact'
  }
]
</script>

<template>
  <section id="services" class="py-10 sm:py-18 px-6 bg-muted/40">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold mb-4">Servicios</h2>
      <p class="text-muted mb-12">Cómo puedo ayudarte a construir y crecer.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ServiceCard v-for="service in services" :key="service.title" v-bind="service" />
      </div>
    </div>
  </section>
</template>
