<script setup lang="ts">
const stats = [
  { label: 'Años de Experiencia', value: '+5', icon: 'i-lucide-calendar' },
  { label: 'Proyectos Completados', value: '+20', icon: 'i-lucide-check-circle' }
]

const techs = [
  { name: 'JavaScript', icon: 'i-simple-icons-javascript' },
  { name: 'TypeScript', icon: 'i-simple-icons-typescript' },
  { name: 'Vue.js', icon: 'i-simple-icons-vuedotjs' },
  { name: 'Nuxt.js', icon: 'i-simple-icons-nuxtdotjs' },
  { name: 'React', icon: 'i-simple-icons-react' },
  { name: 'NestJS', icon: 'i-simple-icons-nestjs' },
  { name: 'Tailwind CSS', icon: 'i-simple-icons-tailwindcss' },
  { name: 'PostgreSQL', icon: 'i-simple-icons-postgresql' }
]
</script>

<template>
  <div
    class="border-y border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 py-4 overflow-hidden"
  >
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
        <!-- Métricas -->
        <div
          class="flex items-center gap-8 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-4 md:pb-0 md:pr-8"
        >
          <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-2">
            <UIcon :name="stat.icon" class="w-5 h-5 text-primary-500" />
            <span class="text-xl font-bold tracking-tight">{{ stat.value }}</span>
          </div>
        </div>

        <!-- Tecnologías (Scrolling/Flex wrap) -->
        <div
          class="flex flex-wrap justify-center items-center gap-6 lg:gap-10 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition duration-300"
        >
          <div
            v-for="tech in techs"
            :key="tech.name"
            class="group relative flex items-center justify-center"
          >
            <UIcon :name="tech.icon" class="w-6 h-6 lg:w-7 lg:h-7" />
            <!-- Tooltip sutil (opcional) -->
            <span
              class="absolute -bottom-8 scale-0 group-hover:scale-100 transition-all bg-neutral-800 text-white text-[10px] px-2 py-1 rounded"
            >
              {{ tech.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
