<script setup lang="ts">
const skillCategories = [
  {
    name: 'Automatización & IA',
    icon: 'i-lucide-bot',
    skills: ['n8n', 'OpenAI APIs', 'LangChain', 'Make (Integromat)', 'Webhooks & Events']
  },
  {
    name: 'Backend & APIs',
    icon: 'i-lucide-server-cog',
    skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'REST / GraphQL']
  },
  {
    name: 'Frontend',
    icon: 'i-lucide-layout-template',
    skills: ['Vue.js', 'Nuxt 4', 'TypeScript', 'Tailwind CSS', 'Nuxt UI']
  },
  {
    name: 'Infraestructura & DevOps',
    icon: 'i-lucide-cloud',
    skills: ['Docker', 'AWS', 'Vercel', 'CI/CD GitHub Actions', 'Linux / VPS']
  }
]
</script>

<template>
  <section id="habilidades" class="py-12 sm:py-18 px-6 relative">
    <UContainer>
      <div class="text-center mb-16 max-w-2xl mx-auto">
        <h2 class="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
          Dominio Técnico
        </h2>
        <h3 class="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Stack especializado en producción.
        </h3>
        <p class="text-zinc-400 text-lg">
          Tecnologías que uso diariamente para construir sistemas escalables, automatizados y de
          alto rendimiento.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <div
          v-for="category in skillCategories"
          :key="category.name"
          class="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300 group shadow-lg"
        >
          <div
            class="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:bg-primary-900/20 group-hover:border-primary-500/30 transition-all duration-500"
          >
            <UIcon
              :name="category.icon"
              class="w-7 h-7 text-zinc-300 group-hover:text-primary-500 transition-colors duration-300"
            />
          </div>

          <h4 class="text-xl font-bold text-white mb-5 tracking-tight">
            {{ category.name }}
          </h4>

          <div class="flex flex-wrap gap-2 mt-auto">
            <span
              v-for="skill in category.skills"
              :key="skill"
              class="px-3.5 py-1.5 bg-zinc-950/50 text-zinc-300 text-sm font-medium rounded-full border border-zinc-800/80 group-hover:border-zinc-700 transition-colors"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
